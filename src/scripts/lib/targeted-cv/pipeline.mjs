import path from "node:path";
import { renderPdfRoute } from "../pdf-renderer.mjs";
import { runAstroBuild } from "./build.mjs";
import { createCacheKey, ensureVariantCacheDir, writeArtifact, writeArtifactIf } from "./cache.mjs";
import { artifactNames } from "./constants.mjs";
import { loadBaseCv, loadCvTargetingMetadata } from "./cv-data.mjs";
import { StageError } from "./errors.mjs";
import { extractVacancyContent } from "./extractor.mjs";
import { deriveCvDocument } from "./matcher.mjs";
import { parseVacancyWithOllama } from "./ollama-client.mjs";
import { startManagedOllamaServer } from "./ollama-server.mjs";
import { fetchVacancyHtml } from "./vacancy-fetcher.mjs";

export async function generateTargetedCv(options) {
  const cacheKey = createCacheKey(options.vacancyUrl, options.locale, options.cacheKey);
  const cacheDir = await ensureVariantCacheDir(cacheKey);

  const stage = (message) => {
    console.log(message);
  };
  const log = (...args) => {
    if (options.verbose) {
      console.log("[cv:target]", ...args);
    }
  };

  let managedOllamaServer;

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
      throw new StageError(
        "extract",
        "Extracted vacancy text is too short to be reliable. Inspect the cached HTML/text and consider a different vacancy URL.",
        { cacheDir },
      );
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
    if (error instanceof StageError) {
      throw error;
    }

    throw new StageError("unknown", error instanceof Error ? error.message : String(error), { cacheDir, cause: error });
  } finally {
    await managedOllamaServer?.stop();
  }
}
