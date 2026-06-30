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
  title: string;
  subtitle?: string;
  link?: string;
  date: Date;
  description?: string[];
  stack?: string[];
}

interface Skill {
  name: string;
}

export interface SkillCategory {
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
