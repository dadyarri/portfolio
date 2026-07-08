import { collectNormalizedTerms } from "./text.mjs";

function resolveTargetRoleTitle(baseCv, profile) {
  const candidate = profile.title?.trim() || profile.roleKeywords?.[0]?.trim();
  return candidate || baseCv.personalInfo.title;
}

function resolveTargetContactInfo(baseCv, profile) {
  const location = profile.location?.trim();
  if (!location) {
    return baseCv.contactInfo;
  }

  let replaced = false;
  const updated = baseCv.contactInfo.map((contact) => {
    if (contact.type !== "location") {
      return contact;
    }

    replaced = true;
    return {
      ...contact,
      value: location,
    };
  });

  if (replaced) {
    return updated;
  }

  return [...baseCv.contactInfo, { type: "location", value: location }];
}

function toSortableTimestamp(value, fallback) {
  if (!value) {
    return fallback;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? fallback : timestamp;
}

function compareExperienceByRecency(left, right) {
  const leftEnd = toSortableTimestamp(left.entry.date?.end, Number.POSITIVE_INFINITY);
  const rightEnd = toSortableTimestamp(right.entry.date?.end, Number.POSITIVE_INFINITY);

  if (leftEnd !== rightEnd) {
    return rightEnd - leftEnd;
  }

  const leftStart = toSortableTimestamp(left.entry.date?.start, Number.NEGATIVE_INFINITY);
  const rightStart = toSortableTimestamp(right.entry.date?.start, Number.NEGATIVE_INFINITY);

  return rightStart - leftStart;
}

function scoreTags(tags, vacancyTerms, baseWeight = 0) {
  let score = baseWeight;

  for (const tag of tags) {
    if (vacancyTerms.has(tag.toLowerCase())) {
      score += 3;
    }
  }

  return score;
}

function scoreTermsBySource(tags, profile) {
  const must = collectNormalizedTerms(profile.mustHaveSkills);
  const nice = collectNormalizedTerms(profile.niceToHaveSkills);
  const focus = collectNormalizedTerms(profile.focusAreas);
  const domain = collectNormalizedTerms(profile.domainKeywords, profile.roleKeywords);

  let score = 0;

  for (const tag of tags) {
    const normalized = tag.toLowerCase();
    if (must.has(normalized)) score += 6;
    if (nice.has(normalized)) score += 3;
    if (focus.has(normalized)) score += 4;
    if (domain.has(normalized)) score += 2;
  }

  return score;
}

function rankExperience(baseCv, profile, metadata) {
  return baseCv.workExperience
    .map((entry, index) => {
      const meta = metadata.experience.find((item) => item.id === entry.id);
      if (!meta) {
        return null;
      }

      const bulletScores = (entry.descriptionIds ?? []).map((bulletId, bulletIndex) => {
        const bulletMeta = meta.bullets.find((item) => item.id === bulletId);
        if (!bulletMeta) {
          return null;
        }

        return {
          bulletIndex,
          id: bulletMeta.id,
          score:
            scoreTermsBySource(bulletMeta.tags, profile) +
            scoreTags(bulletMeta.tags, collectNormalizedTerms(profile.focusAreas), bulletMeta.weight ?? 0),
        };
      }).filter(Boolean);

      const selectedBullets = bulletScores
        .filter((bullet) => bullet.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 4)
        .map((bullet) => bullet.bulletIndex)
        .sort((left, right) => left - right);

      const entryScore =
        scoreTermsBySource(meta.tags, profile) +
        scoreTags(meta.tags, collectNormalizedTerms(profile.roleKeywords, profile.domainKeywords), meta.baseWeight ?? 0) +
        bulletScores.reduce((sum, bullet) => sum + bullet.score, 0);

      return {
        id: meta.id,
        entry,
        index,
        entryScore,
        selectedBullets,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.entryScore - left.entryScore || left.index - right.index);
}

function rankProjects(baseCv, profile, metadata) {
  return baseCv.projects
    .map((project, index) => {
      const meta = metadata.projects.find((item) => item.id === project.id);
      if (!meta) {
        return null;
      }

      return {
        id: meta.id,
        index,
        project,
        score: scoreTermsBySource(meta.tags, profile) + (meta.baseWeight ?? 0),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.index - right.index);
}

function rankSkills(baseCv, profile, metadata) {
  return baseCv.skills
    .map((category, index) => {
      const meta = metadata.skills.find((item) => item.id === category.id);
      if (!meta) {
        return null;
      }

      return {
        index,
        category,
        score: scoreTermsBySource(meta.tags, profile) + (meta.baseWeight ?? 0),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.index - right.index);
}

export function deriveCvDocument(baseCv, profile, locale, metadata) {
  const rankedExperience = rankExperience(baseCv, profile, metadata);
  const rankedProjects = rankProjects(baseCv, profile, metadata);
  const rankedSkills = rankSkills(baseCv, profile, metadata);

  const selectedExperienceEntries = rankedExperience
    .filter((item) => item.entryScore > 0)
    .slice(0, 2)
    .sort(compareExperienceByRecency);

  const selectedExperience = selectedExperienceEntries
    .map((item) => ({
      ...item.entry,
      description:
        item.selectedBullets.length > 0
          ? item.selectedBullets.map((bulletIndex) => item.entry.description?.[bulletIndex]).filter(Boolean)
          : item.entry.description?.slice(0, 4),
    }));

  const selectedProjects = rankedProjects
    .filter((item) => item.score > 1)
    .slice(0, 2)
    .map((item) => item.project);

  const selectedSkills = rankedSkills
    .filter((item) => item.score > 0)
    .slice(0, 4)
    .map((item) => item.category);

  return {
    ...baseCv,
    personalInfo: {
      ...baseCv.personalInfo,
      title: resolveTargetRoleTitle(baseCv, profile),
    },
    contactInfo: resolveTargetContactInfo(baseCv, profile),
    workExperience: selectedExperience.length > 0 ? selectedExperience : baseCv.workExperience.slice(0, 2),
    projects: selectedProjects.length > 0 ? selectedProjects : baseCv.projects.slice(0, 2),
    skills: selectedSkills.length > 0 ? selectedSkills : baseCv.skills,
    variantMeta: {
      vacancyUrl: profile.sourceUrl,
      locale,
      generatedAt: new Date().toISOString(),
      selectedExperienceIds: selectedExperienceEntries.map((item) => item.id),
      selectedProjectIds: rankedProjects
        .filter((item) => item.score > 1)
        .slice(0, 2)
        .map((item) => item.id),
    },
  };
}
