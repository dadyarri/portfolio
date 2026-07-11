import { parseCliArgs } from "./lib/targeted-cv/cli.ts";
import { generateTargetedCv } from "./lib/targeted-cv/pipeline.ts";
import { artifactNames } from "./lib/targeted-cv/constants.ts";
import { StageError } from "./lib/targeted-cv/errors.ts";

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const result = await generateTargetedCv(options);

  console.log(`Generated targeted CV PDF: ${result.output}`);
  if (options.verbose || options.keepHtml) {
    console.log(`Cache artifacts: ${result.cacheDir}`);
  }
}

main().catch((error: unknown) => {
  const fallback = error instanceof Error ? error.message : String(error);

  if (error instanceof StageError) {
    console.error(`Targeted CV generation failed at stage "${error.stage}": ${error.message}`);
    if (error.cacheDir) {
      console.error(`Cached artifacts: ${error.cacheDir}`);
    }
    if (error.stage === "parse") {
      console.error(`Ollama debug files: ${artifactNames.ollamaParseDebug}, ${artifactNames.ollamaResponseInitial}, ${artifactNames.ollamaResponseCorrection}`);
    }
    if (error.stage === "render") {
      console.error("Install Playwright Chromium with: npx playwright install chromium");
    }
    process.exitCode = 1;
    return;
  }

  console.error(`Targeted CV generation failed: ${fallback}`);
  process.exitCode = 1;
});
