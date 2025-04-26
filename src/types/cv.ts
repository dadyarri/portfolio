export type ContactType = 'email' | 'phone' | 'location' | 'website' | 'github';

export interface Contact {
  type: ContactType;
  value: string;
  label?: string | undefined;
}

export interface TimelineItem {
  title: string;
  subtitle?: string;
  date: string;
  description?: string[];
}

export interface Skill {
  name: string;
}

export interface SkillCategory {
  name: string;
  skills: Skill[];
}

export interface PersonalInfo {
  name: string;
  title: string;
  photo?: string;
  summary?: string;
}

export interface CVData {
  personalInfo: PersonalInfo;
  contactInfo: Contact[];
  workExperience: TimelineItem[];
  education: TimelineItem[];
  skills: SkillCategory[];
} 