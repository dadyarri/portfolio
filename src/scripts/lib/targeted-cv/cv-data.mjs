export async function loadBaseCv(locale) {
  const { localizeCv } = await import("../../../utils/cv.mjs");
  return localizeCv(locale);
}

export async function loadCvTargetingMetadata() {
  const { getCvTargetingMetadata } = await import("../../../utils/cv.mjs");
  return getCvTargetingMetadata();
}
