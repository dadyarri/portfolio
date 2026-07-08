export type ContactType = 'email' | 'phone' | 'location' | 'website' | 'github' | 'telegram';

export interface Contact {
  type: ContactType;
  value: string;
  label?: string | undefined;
}

interface Date {
  start: string;
  end?: string | 'н. в.';
  showAmountOfTime: boolean;
}

export interface TimelineItem {
  id?: string;
  title: string;
  subtitle?: string;
  link?: string;
  date: Date;
  description?: string[];
  descriptionIds?: string[];
  stack?: string[];
}

interface Skill {
  name: string;
}

export interface SkillCategory {
  id?: string;
  name: string;
  skills: Skill[];
}

interface PersonalInfo {
  name: string;
  title: string;
  photo?: string;
  summary?: string;
}

export interface Project {
  id?: string;
  title: string;
  description: string;
  links?: string[];
  stack?: string[];
}

export interface CVData {
  personalInfo: PersonalInfo;
  contactInfo: Contact[];
  workExperience: TimelineItem[];
  education: TimelineItem[];
  skills: SkillCategory[];
  projects: Project[];
}

export interface VacancyProfile {
  schemaVersion: 1;
  sourceUrl: string;
  title?: string;
  company?: string;
  location?: string;
  localeGuess?: "ru" | "en" | "unknown";
  seniority?: "junior" | "middle" | "senior" | "lead" | "unknown";
  roleKeywords: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  focusAreas: string[];
  domainKeywords: string[];
  responsibilities: string[];
  constraints: string[];
  parsedAt: string;
}

export interface CvMasterMetadata {
  schemaVersion: 1;
  experience: Array<{
    id: string;
    baseWeight?: number;
    tags: string[];
    bullets: Array<{
      id: string;
      tags: string[];
      weight?: number;
    }>;
  }>;
  projects: Array<{
    id: string;
    baseWeight?: number;
    tags: string[];
  }>;
  skills: Array<{
    id: string;
    baseWeight?: number;
    tags: string[];
  }>;
}

export interface DerivedCvDocument extends CVData {
  variantMeta: {
    vacancyUrl: string;
    locale: "ru" | "en";
    generatedAt: string;
    selectedExperienceIds: string[];
    selectedProjectIds: string[];
  };
}
