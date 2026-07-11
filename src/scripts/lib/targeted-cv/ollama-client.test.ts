import test from "node:test";
import assert from "node:assert/strict";
import { parseVacancyProfileJson } from "./ollama-client.ts";

test("parseVacancyProfileJson accepts valid strict json", () => {
  const raw = JSON.stringify({
    schemaVersion: 1,
    sourceUrl: "hallucinated-url",
    title: "C# Разработчик",
    roleKeywords: ["backend"],
    mustHaveSkills: ["C#"],
    niceToHaveSkills: [],
    focusAreas: [],
    domainKeywords: [],
    responsibilities: [],
    constraints: [],
    parsedAt: "2026-01-01T00:00:00.000Z",
  });

  const parsed = parseVacancyProfileJson(raw, "https://example.com");
  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.sourceUrl, "https://example.com");
  assert.equal(parsed.title, "C# Разработчик");
  assert.deepEqual(parsed.mustHaveSkills, ["C#"]);
});

test("parseVacancyProfileJson rejects malformed output", () => {
  assert.throws(() => parseVacancyProfileJson('{"schemaVersion":1}', "https://example.com"));
});
