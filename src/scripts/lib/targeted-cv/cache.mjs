import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { artifactNames, variantsDir } from "./constants.mjs";

function sanitizeCacheKey(value) {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!sanitized) {
    throw new Error("Cache key resolved to an empty value.");
  }

  return sanitized;
}

export function createCacheKey(vacancyUrl, locale, manualKey) {
  if (manualKey) {
    return sanitizeCacheKey(manualKey);
  }

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ vacancyUrl, locale }))
    .digest("hex");

  return sanitizeCacheKey(`${locale}-${hash.slice(0, 16)}`);
}

export function getVariantCacheDir(cacheKey) {
  return path.join(variantsDir, cacheKey);
}

export async function ensureVariantCacheDir(cacheKey) {
  const cacheDir = getVariantCacheDir(cacheKey);
  await mkdir(cacheDir, { recursive: true });
  return cacheDir;
}

export async function writeArtifact(cacheDir, fileName, content) {
  const filePath = path.join(cacheDir, fileName);
  const payload = typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`;
  await writeFile(filePath, payload, "utf8");
  return filePath;
}

export async function writeArtifactIf(enabled, cacheDir, fileName, content) {
  if (!enabled) {
    return undefined;
  }

  return writeArtifact(cacheDir, fileName, content);
}

export async function readDerivedCv(cacheKey) {
  const cacheDir = getVariantCacheDir(cacheKey);
  const filePath = path.join(cacheDir, artifactNames.derivedCv);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}
