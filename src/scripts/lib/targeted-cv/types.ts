import type {
  CVData,
  CvMasterMetadata,
  Locale,
  VacancyProfile,
} from "../../../types/cv";

export type StageName =
  | "cli"
  | "fetch"
  | "extract"
  | "parse"
  | "build"
  | "render"
  | "unknown";

export interface StageErrorOptions {
  cacheDir?: string;
  cause?: unknown;
}

export interface TargetedCvCliOptions {
  vacancyUrl: string;
  locale: Locale;
  output: string;
  model: string;
  ollamaUrl: string;
  cacheKey?: string;
  keepHtml: boolean;
  verbose: boolean;
}

export interface GeneratedTargetedCvResult {
  cacheDir: string;
  cacheKey: string;
  output: string;
}

export interface VacancyExtraction {
  sourceUrl: string;
  title?: string;
  canonicalUrl?: string;
  company?: string;
  location?: string;
  normalizedText: string;
}

export interface ManagedOllamaServer {
  stop(): Promise<void>;
}

export interface ManagedOllamaServerOptions {
  ollamaUrl: string;
  cacheDir: string;
  verbose?: boolean;
  log?: (...args: string[]) => void;
}

export interface ParseVacancyWithOllamaOptions {
  extraction: VacancyExtraction;
  locale: Locale;
  model: string;
  ollamaUrl: string;
  cacheDir: string;
  debugArtifacts?: boolean;
}

export interface OllamaGenerateResponse {
  response?: string;
  done?: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface RankedExperienceEntry {
  id: string;
  entry: CVData["workExperience"][number];
  index: number;
  entryScore: number;
  selectedBullets: number[];
}

export interface RankedProjectEntry {
  id: string;
  index: number;
  project: CVData["projects"][number];
  score: number;
}

export interface RankedSkillEntry {
  index: number;
  category: CVData["skills"][number];
  score: number;
}
export type BaseCv = CVData;
export type TargetingMetadata = CvMasterMetadata;
export type ParsedVacancyProfile = VacancyProfile;
