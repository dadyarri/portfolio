import type { VacancyProfile } from "../../../types/cv";
import { StageError } from "./errors.ts";
import { writeArtifact, writeArtifactIf } from "./cache.ts";
import { artifactNames } from "./constants.ts";
import type {
  OllamaGenerateResponse,
  ParseVacancyWithOllamaOptions,
} from "./types.ts";

function buildPrompt({ locale, text }: { locale: string; text: string }): string {
  return [
    "Extract a structured vacancy profile from the provided job posting.",
    "Return strict JSON only. No markdown. No prose. No code fences.",
    "Keep arrays concise and factual. Do not invent information.",
    "Use at most 5 items per array.",
    "Keep each array item short, usually under 8 words.",
    "Prefer keywords over full sentences unless the schema clearly requires a sentence.",
    'Use schemaVersion = 1. Use localeGuess as "ru", "en", or "unknown".',
    'Use seniority as "junior", "middle", "senior", "lead", or "unknown".',
    "If a field is unknown, omit it except required arrays, which must be present and may be empty.",
    "Do not browse, infer, or rely on any external source. Use only the vacancy text below.",
    "For title, return only the role title. Do not include salary, city, company, vacancy prefix, or employment format.",
    "Preserve the title exactly in the original vacancy language. Never translate the title to match the requested CV locale.",
    "If the title is in Russian, normalize it to nominative case. Return the role name as it should appear as a standalone headline.",
    'Examples for Russian titles: "C# разработчик", "Backend-разработчик (.NET)", "Старший системный аналитик". Avoid forms like "разработчика", "аналитика" when they come from vacancy phrasing.',
    "For location, return only the city name when present. Do not include street, metro station, office address, or full company address.",
    "",
    `Requested CV locale: ${locale}`,
    "",
    "Schema:",
    JSON.stringify(
      {
        schemaVersion: 1,
        sourceUrl: "string",
        title: "string",
        company: "string",
        location: "string",
        localeGuess: "ru | en | unknown",
        seniority: "junior | middle | senior | lead | unknown",
        roleKeywords: ["string"],
        mustHaveSkills: ["string"],
        niceToHaveSkills: ["string"],
        focusAreas: ["string"],
        domainKeywords: ["string"],
        responsibilities: ["string"],
        constraints: ["string"],
        parsedAt: "ISO-8601 string",
      },
      null,
      2,
    ),
    "",
    "Vacancy text:",
    text,
  ].join("\n");
}

function buildCorrectionPrompt(rawResponse: string): string {
  return [
    "Your previous answer was rejected because it was not valid JSON for the required schema.",
    "Return corrected strict JSON only. No markdown. No commentary.",
    "Do not repeat long phrases. Keep arrays short and compact.",
    "If title is Russian, it must be in nominative case.",
    "Previous response:",
    rawResponse,
  ].join("\n");
}

function buildTitleNormalizationPrompt(title: string): string {
  return [
    "Normalize the following vacancy title.",
    'Return strict JSON only in the shape {"title":"..."}. No markdown. No commentary.',
    "If the title is Russian, rewrite it to nominative case so it reads naturally as a standalone job title.",
    "If it is already in nominative case, return it unchanged.",
    "Do not translate the title. Do not add company, location, salary, or employment format.",
    "",
    `Title: ${title}`,
  ].join("\n");
}

function parseTitleNormalizationJson(rawResponse: string, fallbackTitle: string): string {
  const parsed = JSON.parse(rawResponse) as { title?: string };
  if (typeof parsed?.title !== "string" || !parsed.title.trim()) {
    throw new Error("normalized title must be a non-empty string");
  }
  return parsed.title.trim() || fallbackTitle;
}

export function parseVacancyProfileJson(rawResponse: string, sourceUrl: string): VacancyProfile {
  const parsed = JSON.parse(rawResponse) as VacancyProfile & Record<string, unknown>;
  const arrays: Array<keyof VacancyProfile> = [
    "roleKeywords",
    "mustHaveSkills",
    "niceToHaveSkills",
    "focusAreas",
    "domainKeywords",
    "responsibilities",
    "constraints",
  ];

  if (parsed.schemaVersion !== 1) {
    throw new Error("schemaVersion must be 1");
  }

  parsed.sourceUrl = sourceUrl;

  for (const key of arrays) {
    if (!Array.isArray(parsed[key])) {
      throw new Error(`${key} must be an array`);
    }
  }

  if (typeof parsed.parsedAt !== "string" || Number.isNaN(Date.parse(parsed.parsedAt))) {
    parsed.parsedAt = new Date().toISOString();
  }

  return parsed;
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function generateOnce({
  ollamaUrl,
  model,
  prompt,
}: {
  ollamaUrl: string;
  model: string;
  prompt: string;
}): Promise<OllamaGenerateResponse> {
  const response = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: 1200 },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `HTTP ${response.status}`);
  }

  return (await response.json()) as OllamaGenerateResponse;
}

async function normalizeTitleWithOllama({
  title,
  model,
  ollamaUrl,
}: {
  title: string;
  model: string;
  ollamaUrl: string;
}): Promise<string> {
  const prompt = buildTitleNormalizationPrompt(title);
  const payload = await generateOnce({ ollamaUrl, model, prompt });
  const rawResponse = typeof payload?.response === "string" ? payload.response : "";

  if (!rawResponse.trim()) {
    throw new Error("Title normalization response was empty");
  }

  return parseTitleNormalizationJson(rawResponse, title);
}

export async function parseVacancyWithOllama({
  extraction,
  locale,
  model,
  ollamaUrl,
  cacheDir,
  debugArtifacts = false,
}: ParseVacancyWithOllamaOptions): Promise<VacancyProfile> {
  const prompt = buildPrompt({ locale, text: extraction.normalizedText });
  await writeArtifactIf(debugArtifacts, cacheDir, artifactNames.ollamaPrompt, prompt);

  let initialPayload: OllamaGenerateResponse;
  try {
    initialPayload = await generateOnce({ ollamaUrl, model, prompt });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const remediation = /model/i.test(message)
      ? ` Ensure the model "${model}" is available in Ollama.`
      : " Ensure Ollama is running and reachable.";
    throw new StageError("parse", `Ollama request failed.${remediation}`, { cacheDir, cause: error });
  }

  await writeArtifactIf(debugArtifacts, cacheDir, artifactNames.ollamaPayloadInitial, initialPayload);
  const rawResponse = typeof initialPayload?.response === "string" ? initialPayload.response : "";
  await writeArtifactIf(debugArtifacts, cacheDir, artifactNames.ollamaResponseInitial, rawResponse);

  try {
    if (!rawResponse.trim()) {
      throw new Error(`Initial Ollama response was empty. done_reason=${initialPayload?.done_reason ?? "unknown"}, eval_count=${initialPayload?.eval_count ?? "unknown"}`);
    }

    const parsed = parseVacancyProfileJson(rawResponse, extraction.sourceUrl);
    if (parsed.title?.trim()) {
      try {
        parsed.title = await normalizeTitleWithOllama({ title: parsed.title.trim(), model, ollamaUrl });
      } catch {
        // Keep parsed title.
      }
    }
    return parsed;
  } catch (initialParseError) {
    const correctionPrompt = `${prompt}\n\n${buildCorrectionPrompt(rawResponse)}`;
    await writeArtifactIf(debugArtifacts, cacheDir, artifactNames.ollamaCorrectionPrompt, correctionPrompt);
    await writeArtifactIf(debugArtifacts, cacheDir, artifactNames.ollamaParseDebug, {
      initialParseError: formatErrorMessage(initialParseError),
      initialPayloadMeta: {
        done: initialPayload?.done,
        doneReason: initialPayload?.done_reason,
        totalDuration: initialPayload?.total_duration,
        loadDuration: initialPayload?.load_duration,
        promptEvalCount: initialPayload?.prompt_eval_count,
        evalCount: initialPayload?.eval_count,
      },
    });

    let correctedPayload: OllamaGenerateResponse | undefined;
    try {
      correctedPayload = await generateOnce({ ollamaUrl, model, prompt: correctionPrompt });
      await writeArtifactIf(debugArtifacts, cacheDir, artifactNames.ollamaPayloadCorrection, correctedPayload);
      const corrected = typeof correctedPayload?.response === "string" ? correctedPayload.response : "";
      await writeArtifactIf(debugArtifacts, cacheDir, artifactNames.ollamaResponseCorrection, corrected);
      if (!corrected.trim()) {
        throw new Error(`Correction Ollama response was empty. done_reason=${correctedPayload?.done_reason ?? "unknown"}, eval_count=${correctedPayload?.eval_count ?? "unknown"}`);
      }
      const parsed = parseVacancyProfileJson(corrected, extraction.sourceUrl);
      if (parsed.title?.trim()) {
        try {
          parsed.title = await normalizeTitleWithOllama({ title: parsed.title.trim(), model, ollamaUrl });
        } catch {}
      }
      return parsed;
    } catch (error) {
      await writeArtifact(cacheDir, artifactNames.ollamaPayloadInitial, initialPayload);
      await writeArtifact(cacheDir, artifactNames.ollamaPrompt, prompt);
      await writeArtifact(cacheDir, artifactNames.ollamaResponseInitial, rawResponse);
      await writeArtifact(cacheDir, artifactNames.ollamaCorrectionPrompt, correctionPrompt);
      const debugPayload = {
        initialParseError: formatErrorMessage(initialParseError),
        correctionParseError: formatErrorMessage(error),
        initialPayloadMeta: {
          done: initialPayload?.done,
          doneReason: initialPayload?.done_reason,
          totalDuration: initialPayload?.total_duration,
          loadDuration: initialPayload?.load_duration,
          promptEvalCount: initialPayload?.prompt_eval_count,
          evalCount: initialPayload?.eval_count,
        },
        initialResponseArtifact: artifactNames.ollamaResponseInitial,
        initialPayloadArtifact: artifactNames.ollamaPayloadInitial,
        correctionPromptArtifact: artifactNames.ollamaCorrectionPrompt,
        correctionResponseArtifact: artifactNames.ollamaResponseCorrection,
        correctionPayloadArtifact: artifactNames.ollamaPayloadCorrection,
        promptArtifact: artifactNames.ollamaPrompt,
      };
      if (typeof correctedPayload !== "undefined") {
        await writeArtifact(cacheDir, artifactNames.ollamaPayloadCorrection, correctedPayload);
        await writeArtifact(cacheDir, artifactNames.ollamaResponseCorrection, typeof correctedPayload?.response === "string" ? correctedPayload.response : "");
      }
      await writeArtifact(cacheDir, artifactNames.ollamaParseDebug, debugPayload);

      throw new StageError(
        "parse",
        `Ollama returned invalid JSON twice. See ${artifactNames.ollamaParseDebug}, ${artifactNames.ollamaResponseInitial}, and ${artifactNames.ollamaResponseCorrection} in the cache directory.`,
        { cacheDir, cause: error },
      );
    }
  }
}
