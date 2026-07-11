const tokenPattern = /[\p{L}\p{N}.+#/-]+/gu;

export function normalizeWhitespace(value: string): string {
  return value.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}+.#/-]+$/gu, "");
}

export function collectNormalizedTerms(...sources: Array<string | string[] | undefined>): Set<string> {
  const terms = new Set<string>();

  for (const source of sources.flat()) {
    if (typeof source !== "string") {
      continue;
    }

    for (const rawToken of source.match(tokenPattern) ?? []) {
      const token = normalizeToken(rawToken);
      if (token.length >= 2) {
        terms.add(token);
      }
    }
  }

  return terms;
}
