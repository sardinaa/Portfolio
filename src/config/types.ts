// Portfolio configuration types
export interface ProfileConfig {
  name: string;
  title: string;
  profileImage: string;
  cvPath: string;
  cvDownloadName: string;
}

export interface ContactConfig {
  email: string;
  phone: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface HobbyConfig {
  title: string;
  description: string;
  details: string[];
}

export interface HobbiesConfig {
  [key: string]: HobbyConfig;
}

export interface CommandConfig {
  cmd: string;
  desc: string;
}

export interface ProjectConfig {
  name: string;
  icon: string;
  description: string;
  technologies: string;
}

export interface SkillCategoryConfig {
  name: string;
  skills: string[];
}

export interface ExperienceConfig {
  title: string;
  company: string;
  period: string;
  highlights: string[];
}

export interface CertificationConfig {
  name: string;
  year: string;
  issuer: string;
}

export interface LeadershipExperienceConfig {
  role: string;
  period?: string;
  highlights: string[];
}

export interface EducationConfig {
  title: string;
  school: string;
  period: string;
  details: string[];
}

export interface TerminalSectionConfig {
  help: {
    title: string;
    commands: CommandConfig[];
    footer: string;
  };
  about: {
    title: string;
    content: string;
    specialties: string[];
  };
  projects: {
    title: string;
    projects: ProjectConfig[];
    footer: string;
  };
  skills: {
    title: string;
    categories: SkillCategoryConfig[];
  };
  experience: {
    title: string;
    positions: ExperienceConfig[];
  };
  education: {
    title: string;
    degree: EducationConfig;
    coursework: string[];
    projects: string[];
  };
  certifications: {
    title: string;
    certifications: CertificationConfig[];
    footer: string;
  };
  leadership: {
    title: string;
    experience: LeadershipExperienceConfig[];
    achievements: string[];
    community: string[];
  };
  sudo: {
    title: string;
    message: string;
    secret: string;
    funFacts: string[];
  };
}

export interface TerminalConfig {
  welcome: {
    title: string;
    subtitle: string;
    divider: string;
  };
  prompt: string;
  placeholder: string;
  sections: TerminalSectionConfig;
}

export interface UIConfig {
  topLeftInfo: {
    title: string;
    instructions: string[];
  };
  helperText: {
    defaultMessage: string;
  };
}

export interface PortfolioConfig {
  profile: ProfileConfig;
  contact: ContactConfig;
  hobbies: HobbiesConfig;
  terminal: TerminalConfig;
  ui: UIConfig;
}
