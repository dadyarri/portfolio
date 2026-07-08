export class StageError extends Error {
  constructor(stage, message, options = {}) {
    super(message);
    this.name = "StageError";
    this.stage = stage;
    this.cacheDir = options.cacheDir;
    this.cause = options.cause;
  }
}
