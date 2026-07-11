import path from "node:path";

const rootDir = process.cwd();
const cacheRootDir = path.join(rootDir, ".cache", "targeted-cv");
export const variantsDir = path.join(cacheRootDir, "variants");

export const artifactNames = {
  fetchedHtml: "vacancy.html",
  extractedText: "vacancy.txt",
  extractedMeta: "vacancy.extracted.json",
  ollamaServerLog: "ollama.server.log",
  ollamaPrompt: "ollama.prompt.txt",
  ollamaCorrectionPrompt: "ollama.correction-prompt.txt",
  ollamaPayloadInitial: "ollama.payload.initial.json",
  ollamaPayloadCorrection: "ollama.payload.correction.json",
  ollamaResponseInitial: "ollama.response.initial.txt",
  ollamaResponseCorrection: "ollama.response.correction.txt",
  ollamaParseDebug: "ollama.parse-debug.json",
  parsedVacancy: "vacancy.profile.json",
  derivedCv: "derived-cv.json",
  renderedHtml: "rendered.html",
} as const;

export type ArtifactName = (typeof artifactNames)[keyof typeof artifactNames];
