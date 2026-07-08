import cvSource from "../data/cv.json" with { type: "json" };

const { cv, targeting } = cvSource;

function localizeValue(value, locale) {
  if (typeof value === "string" || value === undefined || value === null) {
    return value;
  }

  if (typeof value === "object" && value !== null && "ru" in value && "en" in value) {
    return value[locale];
  }

  return value;
}

function localizeContact(contact, locale) {
  const value = localizeValue(contact.value, locale);
  const label = localizeValue(contact.label, locale);

  return {
    type: contact.type,
    value,
    ...(label ? { label } : {}),
  };
}

function localizeTimelineItem(item, locale) {
  const descriptionItems = item.description?.map((entry) => ({
    id: entry.id,
    text: localizeValue(entry.text, locale),
  })) ?? [];

  return {
    ...(item.id ? { id: item.id } : {}),
    title: localizeValue(item.title, locale),
    ...(item.subtitle ? { subtitle: localizeValue(item.subtitle, locale) } : {}),
    ...(item.link ? { link: item.link } : {}),
    date: item.date,
    ...(descriptionItems.length > 0
      ? {
          description: descriptionItems.map((entry) => entry.text),
          descriptionIds: descriptionItems.map((entry) => entry.id),
        }
      : {}),
    ...(item.stack ? { stack: item.stack } : {}),
  };
}

function localizeProject(project, locale) {
  return {
    ...(project.id ? { id: project.id } : {}),
    title: localizeValue(project.title, locale),
    description: localizeValue(project.description, locale),
    ...(project.links ? { links: project.links } : {}),
    ...(project.stack ? { stack: project.stack } : {}),
  };
}

function localizeSkillCategory(category, locale) {
  return {
    ...(category.id ? { id: category.id } : {}),
    name: localizeValue(category.name, locale),
    skills: (category.skills ?? []).map((skill) => ({
      name: localizeValue(skill.name, locale),
    })),
  };
}

export function getCanonicalCvSource() {
  return cv;
}

export function getCvTargetingMetadata() {
  return targeting;
}

export function localizeCv(locale) {
  return {
    personalInfo: {
      name: localizeValue(cv.personalInfo.name, locale),
      title: localizeValue(cv.personalInfo.title, locale),
      ...(cv.personalInfo.photo ? { photo: cv.personalInfo.photo } : {}),
      ...(cv.personalInfo.summary ? { summary: localizeValue(cv.personalInfo.summary, locale) } : {}),
    },
    contactInfo: cv.contactInfo.map((contact) => localizeContact(contact, locale)),
    workExperience: cv.workExperience.map((item) => localizeTimelineItem(item, locale)),
    education: cv.education.map((item) => localizeTimelineItem(item, locale)),
    skills: cv.skills.map((category) => localizeSkillCategory(category, locale)),
    projects: cv.projects.map((project) => localizeProject(project, locale)),
  };
}
