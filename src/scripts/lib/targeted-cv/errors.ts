import type { StageErrorOptions, StageName } from "./types.ts";

export class StageError extends Error {
  stage: StageName;
  cacheDir?: string;
  override cause?: unknown;

  constructor(stage: StageName, message: string, options: StageErrorOptions = {}) {
    super(message);
    this.name = "StageError";
    this.stage = stage;
    this.cacheDir = options.cacheDir;
    this.cause = options.cause;
  }
}
