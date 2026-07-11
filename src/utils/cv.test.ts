import assert from "node:assert/strict";
import test from "node:test";
import cvSource from "../data/cv.json" with { type: "json" };
import {
  getCanonicalCvSource,
  getCvTargetingMetadata,
  localizeCv,
  validateCvSource,
} from "./cv.ts";

function collectValidationMessages(source: unknown): string[] {
  try {
    validateCvSource(source);
    return [];
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.ok("issues" in error);
    return (error.issues as Array<{ message: string }>).map((issue) => issue.message);
  }
}

test("localizeCv returns localized English content without casts", () => {
  const cv = localizeCv("en");

  assert.equal(cv.personalInfo.name, "Daniil Golubev");
  assert.equal(cv.personalInfo.title, "C#/.NET Developer");
  assert.equal(cv.contactInfo.find((contact) => contact.type === "location")?.value, "Vladimir, Russia");
  assert.ok(cv.workExperience.every((item) => Array.isArray(item.description ?? [])));
  assert.ok(cv.skills.every((category) => category.skills.every((skill) => typeof skill.name === "string")));
});

test("getCanonicalCvSource and targeting metadata stay aligned", () => {
  const cv = getCanonicalCvSource();
  const targeting = getCvTargetingMetadata();

  const workExperienceIds = new Set(cv.workExperience.flatMap((item) => (item.id ? [item.id] : [])));
  const projectIds = new Set(cv.projects.flatMap((project) => (project.id ? [project.id] : [])));
  const skillIds = new Set(cv.skills.flatMap((skill) => (skill.id ? [skill.id] : [])));

  for (const item of targeting.experience) {
    assert.ok(workExperienceIds.has(item.id), `Missing experience id ${item.id}`);
  }

  for (const item of targeting.projects) {
    assert.ok(projectIds.has(item.id), `Missing project id ${item.id}`);
  }

  for (const item of targeting.skills) {
    assert.ok(skillIds.has(item.id), `Missing skill id ${item.id}`);
  }
});

test("validateCvSource rejects targeting references to unknown experience", () => {
  const invalidSource = structuredClone(cvSource);
  invalidSource.targeting.experience[0].id = "missing-experience";

  assert.deepEqual(
    collectValidationMessages(invalidSource),
    ['Unknown targeting.experience id "missing-experience"'],
  );
});

test("validateCvSource rejects targeting references to unknown bullets", () => {
  const invalidSource = structuredClone(cvSource);
  invalidSource.targeting.experience[0].bullets[0].id = "missing-bullet";

  assert.deepEqual(
    collectValidationMessages(invalidSource),
    ['Unknown bullet id "missing-bullet" for experience "rostelecom-fullstack"'],
  );
});
