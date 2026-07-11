import { getCvTargetingMetadata, localizeCv } from "../../../utils/cv.ts";
import type { BaseCv, TargetingMetadata } from "./types.ts";
import type { Locale } from "../../../types/cv";

export async function loadBaseCv(locale: Locale): Promise<BaseCv> {
  return localizeCv(locale);
}

export async function loadCvTargetingMetadata(): Promise<TargetingMetadata> {
  return getCvTargetingMetadata();
}
