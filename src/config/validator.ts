import { portfolioConfig, PortfolioConfigManager } from './index';
import type { PortfolioConfig } from './types';

/**
 * Configuration validation utility
 * Helps ensure the portfolio configuration is complete and valid
 */
export class ConfigValidator {
  private config: PortfolioConfig;

  constructor() {
    this.config = portfolioConfig.getFullConfig();
  }

  /**
   * Validate the entire configuration
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate profile section
    this.validateProfile(errors, warnings);
    
    // Validate contact section
    this.validateContact(errors, warnings);
    
    // Validate hobbies section
    this.validateHobbies(errors, warnings);
    
    // Validate terminal sections
    this.validateTerminal(errors, warnings);
    
    // Validate UI configuration
    this.validateUI(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: this.generateSummary()
    };
  }

  private validateProfile(errors: string[], warnings: string[]): void {
    const profile = this.config.profile;
    
    if (!profile.name?.trim()) {
      errors.push('Profile name is required');
    }
    
    if (!profile.title?.trim()) {
      errors.push('Profile title is required');
    }
    
    if (!profile.profileImage?.trim()) {
      warnings.push('Profile image path is not set');
    }
    
    if (!profile.cvPath?.trim()) {
      warnings.push('CV path is not set');
    }
    
    if (!profile.cvDownloadName?.trim()) {
      warnings.push('CV download name is not set');
    }
  }

  private validateContact(errors: string[], warnings: string[]): void {
    const contact = this.config.contact;
    
    if (!contact.email?.trim()) {
      errors.push('Contact email is required');
    } else if (!this.isValidEmail(contact.email)) {
      errors.push('Contact email format is invalid');
    }
    
    if (!contact.github?.trim()) {
      warnings.push('GitHub profile is not set');
    }
    
    if (!contact.linkedin?.trim()) {
      warnings.push('LinkedIn profile is not set');
    }
  }

  private validateHobbies(errors: string[], warnings: string[]): void {
    const requiredHobbies = ['plant', 'camera', 'shoes'];
    const hobbies = this.config.hobbies;
    
    requiredHobbies.forEach(hobbyKey => {
      const hobby = hobbies[hobbyKey];
      if (!hobby) {
        errors.push(`Hobby '${hobbyKey}' is missing`);
        return;
      }
      
      if (!hobby.title?.trim()) {
        errors.push(`Hobby '${hobbyKey}' title is required`);
      }
      
      if (!hobby.description?.trim()) {
        errors.push(`Hobby '${hobbyKey}' description is required`);
      }
      
      if (!hobby.details || hobby.details.length === 0) {
        warnings.push(`Hobby '${hobbyKey}' has no details`);
      }
    });
  }

  private validateTerminal(errors: string[], warnings: string[]): void {
    const requiredSections = [
      'help', 'about', 'projects', 'skills', 'experience', 
      'contact', 'education', 'certifications', 'leadership', 'sudo'
    ];
    
    const terminal = this.config.terminal;
    
    // Validate welcome section
    if (!terminal.welcome?.title?.trim()) {
      errors.push('Terminal welcome title is required');
    }
    
    if (!terminal.prompt?.trim()) {
      errors.push('Terminal prompt is required');
    }
    
    // Validate sections
    requiredSections.forEach(sectionKey => {
      const section = terminal.sections[sectionKey as keyof typeof terminal.sections];
      if (!section) {
        errors.push(`Terminal section '${sectionKey}' is missing`);
        return;
      }
      
      if (!section.title?.trim()) {
        errors.push(`Terminal section '${sectionKey}' title is required`);
      }
    });
    
    // Validate specific section requirements
    const aboutSection = terminal.sections.about as any;
    if (aboutSection && (!aboutSection.content?.trim() || !aboutSection.specialties?.length)) {
      warnings.push('About section content or specialties are incomplete');
    }
    
    const projectsSection = terminal.sections.projects as any;
    if (projectsSection && (!projectsSection.projects?.length)) {
      warnings.push('Projects section has no projects');
    }
  }

  private validateUI(errors: string[], warnings: string[]): void {
    const ui = this.config.ui;
    
    if (!ui.topLeftInfo?.title?.trim()) {
      warnings.push('Top left info title is not set');
    }
    
    if (!ui.helperText?.defaultMessage?.trim()) {
      warnings.push('Helper text default message is not set');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateSummary(): ConfigSummary {
    const profile = this.config.profile;
    const terminal = this.config.terminal;
    
    return {
      profileName: profile.name,
      sectionsCount: Object.keys(terminal.sections).length,
      hobbiesCount: Object.keys(this.config.hobbies).length,
      projectsCount: (terminal.sections.projects as any)?.projects?.length || 0,
      skillCategoriesCount: (terminal.sections.skills as any)?.categories?.length || 0,
      experienceCount: (terminal.sections.experience as any)?.positions?.length || 0,
      certificationsCount: (terminal.sections.certifications as any)?.certifications?.length || 0
    };
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: ConfigSummary;
}

export interface ConfigSummary {
  profileName: string;
  sectionsCount: number;
  hobbiesCount: number;
  projectsCount: number;
  skillCategoriesCount: number;
  experienceCount: number;
  certificationsCount: number;
}

/**
 * Quick validation function
 */
export function validateConfig(): ValidationResult {
  const validator = new ConfigValidator();
  return validator.validate();
}

/**
 * Print validation results to console
 */
export function printValidationResults(result: ValidationResult): void {
  console.log('\n🔍 Portfolio Configuration Validation');
  console.log('=====================================');
  
  if (result.isValid) {
    console.log('✅ Configuration is valid!');
  } else {
    console.log('❌ Configuration has errors:');
    result.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  console.log('\n📊 Configuration Summary:');
  console.log(`   Profile: ${result.summary.profileName}`);
  console.log(`   Terminal Sections: ${result.summary.sectionsCount}`);
  console.log(`   Hobbies: ${result.summary.hobbiesCount}`);
  console.log(`   Projects: ${result.summary.projectsCount}`);
  console.log(`   Skill Categories: ${result.summary.skillCategoriesCount}`);
  console.log(`   Work Experiences: ${result.summary.experienceCount}`);
  console.log(`   Certifications: ${result.summary.certificationsCount}`);
  console.log('');
}
