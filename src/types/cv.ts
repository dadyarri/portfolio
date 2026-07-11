export type Locale = "ru" | "en";
type ContactType = 'email' | 'phone' | 'location' | 'website' | 'github' | 'telegram';
export type LocalizedString = Record<Locale, string>;

export interface Contact {
  type: ContactType;
  value: string;
  label?: string | undefined;
}

interface TimelineDateRange {
  start: string;
  end?: string | null;
  showAmountOfTime: boolean;
}

export interface TimelineItem {
  id?: string;
  title: string;
  subtitle?: string;
  link?: string;
  date: TimelineDateRange;
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

export interface RawContact {
  type: ContactType;
  value: string | LocalizedString;
  label?: string | LocalizedString | undefined;
}

interface RawTimelineDescriptionItem {
  id: string;
  text: LocalizedString;
}

export interface RawTimelineItem {
  id?: string;
  title: LocalizedString;
  subtitle?: LocalizedString;
  link?: string;
  date: TimelineDateRange;
  description?: RawTimelineDescriptionItem[];
  stack?: string[];
}

export interface RawSkillCategory {
  id?: string;
  name: LocalizedString;
  skills: Array<{
    name: string | LocalizedString;
  }>;
}

export interface RawProject {
  id?: string;
  title: LocalizedString;
  description: LocalizedString;
  links?: string[];
  stack?: string[];
}

interface RawPersonalInfo {
  name: LocalizedString;
  title: LocalizedString;
  photo?: string;
  summary?: LocalizedString;
}

export interface RawCvData {
  personalInfo: RawPersonalInfo;
  contactInfo: RawContact[];
  workExperience: RawTimelineItem[];
  education: RawTimelineItem[];
  skills: RawSkillCategory[];
  projects: RawProject[];
}

export interface CvSource {
  cv: RawCvData;
  targeting: CvMasterMetadata;
}
