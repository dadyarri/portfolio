import test from "node:test";
import assert from "node:assert/strict";
import { deriveCvDocument } from "./matcher.ts";
import type { BaseCv, ParsedVacancyProfile, TargetingMetadata } from "./types.ts";

const baseCv: BaseCv = {
  personalInfo: { name: "Name", title: "Title" },
  contactInfo: [{ type: "location", value: "Vladimir, Russia" }],
  education: [],
  workExperience: [
    {
      id: "rostelecom-fullstack",
      title: "Full-stack Developer",
      date: { start: "2025-01-01", showAmountOfTime: false },
      description: ["Modernized legacy system", "Deployed to Kubernetes"],
      descriptionIds: ["rewrite-vb6", "kubernetes-deployment"],
    },
    {
      id: "astek-microservices",
      title: "C#/.NET Developer",
      date: { start: "2024-01-01", showAmountOfTime: false },
      description: ["Added Oracle support", "Built CLI tooling", "Built queue"],
      descriptionIds: ["upsert-oracle", "build-cli", "sqlite-queue"],
    },
  ],
  projects: [
    { id: "flexlabs-upsert", title: "FlexLabs.Upsert", description: "", stack: ["Oracle"] },
    { id: "melodytrack", title: "MelodyTrack", description: "", stack: ["React"] },
    { id: "portfolio", title: "Portfolio", description: "", stack: ["Astro"] },
  ],
  skills: [
    { id: "programming-languages", name: "Programming Languages", skills: [{ name: "C#" }] },
    { id: "frameworks-and-libraries", name: "Frameworks and Libraries", skills: [{ name: ".NET" }] },
    { id: "devops-and-infrastructure", name: "DevOps and Infrastructure", skills: [{ name: "Docker" }] },
    { id: "testing", name: "Testing", skills: [{ name: "xUnit" }] },
    { id: "databases", name: "Databases", skills: [{ name: "PostgreSQL" }] },
  ],
};

const metadata: TargetingMetadata = {
  schemaVersion: 1,
  experience: [
    {
      id: "rostelecom-fullstack",
      baseWeight: 1.5,
      tags: ["c#", ".net", "asp.net core", "react", "docker", "kubernetes", "linux"],
      bullets: [
        { id: "rewrite-vb6", weight: 2.5, tags: ["c#", ".net", "legacy modernization", "performance"] },
        { id: "kubernetes-deployment", weight: 2.5, tags: ["kubernetes", "docker", "scalability", "devops"] },
      ],
    },
    {
      id: "astek-microservices",
      baseWeight: 2,
      tags: ["c#", ".net", "grpc", "sqlite", "docker", "linux", "cli", "ci/cd", "microservices", "packaging", "tooling"],
      bullets: [
        { id: "upsert-oracle", weight: 1.5, tags: ["oracle", ".net", "c#"] },
        { id: "build-cli", weight: 3, tags: ["cli", "tooling", "ci/cd", "automation", "packaging", "build"] },
        { id: "sqlite-queue", weight: 2.5, tags: ["sqlite", "queue", "reliability", "microservices"] },
      ],
    },
  ],
  projects: [
    { id: "flexlabs-upsert", baseWeight: 1.5, tags: ["c#", ".net", "oracle", "database"] },
    { id: "melodytrack", baseWeight: 1.5, tags: ["c#", "asp.net core", "react", "github actions"] },
    { id: "portfolio", baseWeight: 0.5, tags: ["typescript", "astro"] },
  ],
  skills: [
    { id: "programming-languages", baseWeight: 1, tags: ["c#", "programming language"] },
    { id: "frameworks-and-libraries", baseWeight: 1.5, tags: [".net", "asp.net core"] },
    { id: "devops-and-infrastructure", baseWeight: 1.5, tags: ["ci/cd", "linux", "docker"] },
    { id: "testing", baseWeight: 0.5, tags: ["xunit", "testing"] },
    { id: "databases", baseWeight: 1.25, tags: ["postgresql", "database", "sql"] },
  ],
};

test("deriveCvDocument prioritizes matching tooling and microservices content", () => {
  const profile: ParsedVacancyProfile = {
    schemaVersion: 1 as const,
    sourceUrl: "https://example.com",
    title: "Backend Developer (.NET)",
    location: "Moscow, Russia",
    roleKeywords: ["microservices"],
    mustHaveSkills: ["C#", ".NET", "CLI", "Docker"],
    niceToHaveSkills: ["Oracle"],
    focusAreas: ["tooling", "CI/CD"],
    domainKeywords: ["packaging"],
    responsibilities: [],
    constraints: [],
    parsedAt: new Date().toISOString(),
  };

  const derived = deriveCvDocument(baseCv, profile, "en", metadata);

  assert.equal(derived.personalInfo.title, "Backend Developer (.NET)");
  assert.equal(derived.contactInfo.find((contact) => contact.type === "location")?.value, "Moscow, Russia");
  assert.equal(derived.workExperience[0].title, "Full-stack Developer");
  assert.deepEqual(derived.variantMeta.selectedExperienceIds, ["rostelecom-fullstack", "astek-microservices"]);
  assert.ok(derived.variantMeta.selectedProjectIds.includes("flexlabs-upsert"));
  assert.ok(derived.skills.some((category) => category.name === "DevOps and Infrastructure"));
});
