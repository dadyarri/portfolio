import { z } from "astro/zod";
import cvSource from "../data/cv.json" with { type: "json" };
import type {
  CVData,
  CvMasterMetadata,
  CvSource,
  Locale,
  LocalizedString,
  RawContact,
  RawCvData,
  RawProject,
  RawSkillCategory,
  RawTimelineItem,
} from "../types/cv";

const localizedStringSchema = z.object({
  ru: z.string(),
  en: z.string(),
});

const localizedOrPlainStringSchema = z.union([z.string(), localizedStringSchema]);

const timelineDateRangeSchema = z.object({
  start: z.string(),
  end: z.string().nullable().optional(),
  showAmountOfTime: z.boolean(),
});

const rawTimelineDescriptionItemSchema = z.object({
  id: z.string(),
  text: localizedStringSchema,
});

const rawTimelineItemSchema = z.object({
  id: z.string().optional(),
  title: localizedStringSchema,
  subtitle: localizedStringSchema.optional(),
  link: z.string().optional(),
  date: timelineDateRangeSchema,
  description: z.array(rawTimelineDescriptionItemSchema).optional(),
  stack: z.array(z.string()).optional(),
});

const rawProjectSchema = z.object({
  id: z.string().optional(),
  title: localizedStringSchema,
  description: localizedStringSchema,
  aiUsage: z.enum(["none", "partial", "full"]),
  links: z.array(z.string()).optional(),
  stack: z.array(z.string()).optional(),
});

const rawSkillCategorySchema = z.object({
  id: z.string().optional(),
  name: localizedStringSchema,
  skills: z.array(
    z.object({
      name: localizedOrPlainStringSchema,
    }),
  ),
});

const rawContactSchema = z.object({
  type: z.enum(["email", "phone", "location", "website", "github", "telegram"]),
  value: localizedOrPlainStringSchema,
  label: localizedOrPlainStringSchema.optional(),
});

const rawCvDataSchema = z.object({
  personalInfo: z.object({
    name: localizedStringSchema,
    title: localizedStringSchema,
    photo: z.string().optional(),
    summary: localizedStringSchema.optional(),
  }),
  contactInfo: z.array(rawContactSchema),
  workExperience: z.array(rawTimelineItemSchema),
  education: z.array(rawTimelineItemSchema),
  skills: z.array(rawSkillCategorySchema),
  projects: z.array(rawProjectSchema),
});

const targetingSchema = z.object({
  schemaVersion: z.literal(1),
  experience: z.array(
    z.object({
      id: z.string(),
      baseWeight: z.number().optional(),
      tags: z.array(z.string()),
      bullets: z.array(
        z.object({
          id: z.string(),
          tags: z.array(z.string()),
          weight: z.number().optional(),
        }),
      ),
    }),
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      baseWeight: z.number().optional(),
      tags: z.array(z.string()),
    }),
  ),
  skills: z.array(
    z.object({
      id: z.string(),
      baseWeight: z.number().optional(),
      tags: z.array(z.string()),
    }),
  ),
});

const cvSourceSchema = z
  .object({
    cv: rawCvDataSchema,
    targeting: targetingSchema,
  })
  .superRefine((source, ctx) => {
    const experienceMap = new Map(
      source.cv.workExperience
        .filter((item) => item.id)
        .map((item) => [item.id, item]),
    );
    const projectIds = new Set(
      source.cv.projects
        .filter((project) => project.id)
        .map((project) => project.id),
    );
    const skillIds = new Set(
      source.cv.skills.filter((skill) => skill.id).map((skill) => skill.id),
    );

    source.targeting.experience.forEach((entry, entryIndex) => {
      const experience = experienceMap.get(entry.id);

      if (!experience) {
        ctx.addIssue({
          code: "custom",
          message: `Unknown targeting.experience id "${entry.id}"`,
          path: ["targeting", "experience", entryIndex, "id"],
        });
        return;
      }

      const descriptionIds = new Set(
        (experience.description ?? []).map((description) => description.id),
      );

      entry.bullets.forEach((bullet, bulletIndex) => {
        if (!descriptionIds.has(bullet.id)) {
          ctx.addIssue({
            code: "custom",
            message: `Unknown bullet id "${bullet.id}" for experience "${entry.id}"`,
            path: [
              "targeting",
              "experience",
              entryIndex,
              "bullets",
              bulletIndex,
              "id",
            ],
          });
        }
      });
    });

    source.targeting.projects.forEach((project, projectIndex) => {
      if (!projectIds.has(project.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Unknown targeting.projects id "${project.id}"`,
          path: ["targeting", "projects", projectIndex, "id"],
        });
      }
    });

    source.targeting.skills.forEach((skill, skillIndex) => {
      if (!skillIds.has(skill.id)) {
        ctx.addIssue({
          code: "custom",
          message: `Unknown targeting.skills id "${skill.id}"`,
          path: ["targeting", "skills", skillIndex, "id"],
        });
      }
    });
  });

export function validateCvSource(source: unknown): CvSource {
  return cvSourceSchema.parse(source);
}

const parsedCvSource = validateCvSource(cvSource);
const { cv, targeting } = parsedCvSource;

function localizeOptionalValue(
  value: string | LocalizedString | null | undefined,
  locale: Locale,
) {
  if (typeof value === "string" || value === undefined || value === null) {
    return value;
  }

  return value[locale];
}

function localizeRequiredValue(
  value: string | LocalizedString,
  locale: Locale,
): string {
  return typeof value === "string" ? value : value[locale];
}

function localizeContact(
  contact: RawContact,
  locale: Locale,
): CVData["contactInfo"][number] {
  const value = localizeRequiredValue(contact.value, locale);
  const label = localizeOptionalValue(contact.label, locale);

  return {
    type: contact.type,
    value,
    ...(label ? { label } : {}),
  };
}

function localizeTimelineItem(
  item: RawTimelineItem,
  locale: Locale,
): CVData["workExperience"][number] {
  const descriptionItems =
    item.description?.map((entry) => ({
      id: entry.id,
      text: localizeRequiredValue(entry.text, locale),
    })) ?? [];

  return {
    ...(item.id ? { id: item.id } : {}),
    title: localizeRequiredValue(item.title, locale),
    ...(item.subtitle
      ? { subtitle: localizeRequiredValue(item.subtitle, locale) }
      : {}),
    ...(item.link ? { link: item.link } : {}),
    date: item.date,
    ...(descriptionItems.length > 0
      ? {
          description: descriptionItems.map((entry) =>
            localizeRequiredValue(entry.text, locale),
          ),
          descriptionIds: descriptionItems.map((entry) => entry.id),
        }
      : {}),
    ...(item.stack ? { stack: item.stack } : {}),
  };
}

function localizeProject(
  project: RawProject,
  locale: Locale,
): CVData["projects"][number] {
  return {
    ...(project.id ? { id: project.id } : {}),
    title: localizeRequiredValue(project.title, locale),
    description: localizeRequiredValue(project.description, locale),
    aiUsage: project.aiUsage,
    ...(project.links ? { links: project.links } : {}),
    ...(project.stack ? { stack: project.stack } : {}),
  };
}

function localizeSkillCategory(
  category: RawSkillCategory,
  locale: Locale,
): CVData["skills"][number] {
  return {
    ...(category.id ? { id: category.id } : {}),
    name: localizeRequiredValue(category.name, locale),
    skills: (category.skills ?? []).map((skill) => ({
      name: localizeRequiredValue(skill.name, locale),
    })),
  };
}

export function getCanonicalCvSource(): RawCvData {
  return cv;
}

export function getCvTargetingMetadata(): CvMasterMetadata {
  return targeting;
}

export function localizeCv(locale: Locale): CVData {
  return {
    personalInfo: {
      name: localizeRequiredValue(cv.personalInfo.name, locale),
      title: localizeRequiredValue(cv.personalInfo.title, locale),
      ...(cv.personalInfo.photo ? { photo: cv.personalInfo.photo } : {}),
      ...(cv.personalInfo.summary
        ? { summary: localizeRequiredValue(cv.personalInfo.summary, locale) }
        : {}),
    },
    contactInfo: cv.contactInfo.map((contact) => localizeContact(contact, locale)),
    workExperience: cv.workExperience.map((item) =>
      localizeTimelineItem(item, locale),
    ),
    education: cv.education.map((item) => localizeTimelineItem(item, locale)),
    skills: cv.skills.map((category) => localizeSkillCategory(category, locale)),
    projects: cv.projects.map((project) => localizeProject(project, locale)),
  };
}
