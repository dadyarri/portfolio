import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Locale } from "../../../types/cv";
import { variantsDir, type ArtifactName } from "./constants.ts";

function sanitizeCacheKey(value: string): string {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!sanitized) {
    throw new Error("Cache key resolved to an empty value.");
  }

  return sanitized;
}

export function createCacheKey(vacancyUrl: string, locale: Locale, manualKey?: string): string {
  if (manualKey) {
    return sanitizeCacheKey(manualKey);
  }

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ vacancyUrl, locale }))
    .digest("hex");

  return sanitizeCacheKey(`${locale}-${hash.slice(0, 16)}`);
}

function getVariantCacheDir(cacheKey: string): string {
  return path.join(variantsDir, cacheKey);
}

export async function ensureVariantCacheDir(cacheKey: string): Promise<string> {
  const cacheDir = getVariantCacheDir(cacheKey);
  await mkdir(cacheDir, { recursive: true });
  return cacheDir;
}

export async function writeArtifact(
  cacheDir: string,
  fileName: ArtifactName,
  content: unknown,
): Promise<string> {
  const filePath = path.join(cacheDir, fileName);
  const payload = typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`;
  await writeFile(filePath, payload, "utf8");
  return filePath;
}

export async function writeArtifactIf(
  enabled: boolean,
  cacheDir: string,
  fileName: ArtifactName,
  content: unknown,
): Promise<string | undefined> {
  if (!enabled) {
    return undefined;
  }

  return writeArtifact(cacheDir, fileName, content);
}
