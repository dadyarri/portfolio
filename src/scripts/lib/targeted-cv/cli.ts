import path from "node:path";
import type { Locale } from "../../../types/cv";
import { StageError } from "./errors.ts";
import type { TargetedCvCliOptions } from "./types.ts";

function consumeValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new StageError("cli", `Missing value for ${flag}.`);
  }

  return value;
}

export function parseCliArgs(argv: string[]): TargetedCvCliOptions {
  const options: Partial<TargetedCvCliOptions> & Pick<TargetedCvCliOptions, "model" | "ollamaUrl" | "keepHtml" | "verbose"> = {
    model: "qwen3:8b",
    ollamaUrl: "http://127.0.0.1:11434",
    keepHtml: false,
    verbose: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--vacancy-url":
        options.vacancyUrl = consumeValue(argv, index, arg);
        index += 1;
        break;
      case "--locale":
        options.locale = consumeValue(argv, index, arg) as Locale;
        index += 1;
        break;
      case "--output":
        options.output = consumeValue(argv, index, arg);
        index += 1;
        break;
      case "--model":
        options.model = consumeValue(argv, index, arg);
        index += 1;
        break;
      case "--ollama-url":
        options.ollamaUrl = consumeValue(argv, index, arg);
        index += 1;
        break;
      case "--cache-key":
        options.cacheKey = consumeValue(argv, index, arg);
        index += 1;
        break;
      case "--keep-html":
        options.keepHtml = true;
        break;
      case "--verbose":
        options.verbose = true;
        break;
      default:
        throw new StageError("cli", `Unknown argument: ${arg}`);
    }
  }

  if (!options.vacancyUrl) {
    throw new StageError("cli", "Missing required flag --vacancy-url <url>.");
  }

  if (!options.locale || !["ru", "en"].includes(options.locale)) {
    throw new StageError("cli", "Flag --locale must be either ru or en.");
  }

  if (!options.output) {
    throw new StageError("cli", "Missing required flag --output <path>.");
  }

  try {
    new URL(options.vacancyUrl);
  } catch {
    throw new StageError("cli", `Invalid vacancy URL: ${options.vacancyUrl}`);
  }

  return {
    ...options,
    vacancyUrl: options.vacancyUrl,
    locale: options.locale,
    output: path.resolve(options.output),
  };
}
