import test from "node:test";
import assert from "node:assert/strict";
import { createCacheKey } from "./cache.ts";

test("createCacheKey is stable for same url and locale", () => {
  const left = createCacheKey("https://example.com/job/1", "en");
  const right = createCacheKey("https://example.com/job/1", "en");
  const otherLocale = createCacheKey("https://example.com/job/1", "ru");

  assert.equal(left, right);
  assert.notEqual(left, otherLocale);
});
