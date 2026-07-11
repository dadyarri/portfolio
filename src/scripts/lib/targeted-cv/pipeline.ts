import path from "node:path";
import { renderPdfRoute } from "../pdf-renderer.ts";
import { runAstroBuild } from "./build.ts";
import { createCacheKey, ensureVariantCacheDir, writeArtifact, writeArtifactIf } from "./cache.ts";
import { artifactNames } from "./constants.ts";
import { loadBaseCv, loadCvTargetingMetadata } from "./cv-data.ts";
import { StageError } from "./errors.ts";
import { extractVacancyContent } from "./extractor.ts";
import { deriveCvDocument } from "./matcher.ts";
import { parseVacancyWithOllama } from "./ollama-client.ts";
import { startManagedOllamaServer } from "./ollama-server.ts";
import { fetchVacancyHtml } from "./vacancy-fetcher.ts";
import type { GeneratedTargetedCvResult, ManagedOllamaServer, TargetedCvCliOptions } from "./types.ts";

export async function generateTargetedCv(options: TargetedCvCliOptions): Promise<GeneratedTargetedCvResult> {
  const cacheKey = createCacheKey(options.vacancyUrl, options.locale, options.cacheKey);
  const cacheDir = await ensureVariantCacheDir(cacheKey);

  const stage = (message: string) => console.log(message);
  const log = (...args: string[]) => {
    if (options.verbose) console.log("[cv:target]", ...args);
  };

  let managedOllamaServer: ManagedOllamaServer | undefined;

  try {
    stage("Starting Ollama server");
    managedOllamaServer = await startManagedOllamaServer({
      ollamaUrl: options.ollamaUrl,
      cacheDir,
      verbose: options.verbose,
      log: (...args) => log(...args),
    });

    stage("Fetching vacancy HTML");
    const html = await fetchVacancyHtml(options.vacancyUrl, cacheDir);
    await writeArtifact(cacheDir, artifactNames.fetchedHtml, html);

    stage("Extracting vacancy content");
    const extraction = extractVacancyContent(html, options.vacancyUrl);
    await writeArtifactIf(options.verbose, cacheDir, artifactNames.extractedMeta, extraction);
    await writeArtifact(cacheDir, artifactNames.extractedText, extraction.normalizedText);

    if (extraction.normalizedText.trim().length < 200) {
      throw new StageError("extract", "Extracted vacancy text is too short to be reliable. Inspect the cached HTML/text and consider a different vacancy URL.", { cacheDir });
    }

    stage("Parsing vacancy with Ollama");
    const vacancyProfile = await parseVacancyWithOllama({
      extraction,
      locale: options.locale,
      model: options.model,
      ollamaUrl: options.ollamaUrl,
      cacheDir,
      debugArtifacts: options.verbose,
    });
    vacancyProfile.location = vacancyProfile.location?.trim() || undefined;
    await writeArtifact(cacheDir, artifactNames.parsedVacancy, vacancyProfile);

    stage("Deriving targeted CV payload");
    const baseCv = await loadBaseCv(options.locale);
    const metadata = await loadCvTargetingMetadata();
    const derivedCv = deriveCvDocument(baseCv, vacancyProfile, options.locale, metadata);
    await writeArtifact(cacheDir, artifactNames.derivedCv, derivedCv);

    stage("Building Astro site");
    await runAstroBuild(cacheDir, options.verbose);

    stage("Rendering PDF");
    const htmlOutputPath = options.keepHtml ? path.join(cacheDir, artifactNames.renderedHtml) : undefined;
    try {
      await renderPdfRoute({
        route: `/targeted-cv/${encodeURIComponent(cacheKey)}/print`,
        outputPath: options.output,
        htmlOutputPath,
      });
    } catch (error) {
      throw new StageError("render", "PDF rendering failed. Verify Playwright Chromium is installed and the transient route was built.", {
        cacheDir,
        cause: error,
      });
    }

    stage(`Done: ${options.output}`);
    return { cacheDir, cacheKey, output: options.output };
  } catch (error) {
    if (error instanceof StageError) throw error;
    throw new StageError("unknown", error instanceof Error ? error.message : String(error), { cacheDir, cause: error });
  } finally {
    await managedOllamaServer?.stop();
  }
}
