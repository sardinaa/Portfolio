import type { PortfolioConfig } from './types';
import portfolioData from './portfolio.json';

/**
 * Portfolio configuration manager
 * Provides centralized access to all portfolio content and settings
 */
export class PortfolioConfigManager {
  private static instance: PortfolioConfigManager;
  private config: PortfolioConfig;

  private constructor() {
    this.config = portfolioData as PortfolioConfig;
  }

  public static getInstance(): PortfolioConfigManager {
    if (!PortfolioConfigManager.instance) {
      PortfolioConfigManager.instance = new PortfolioConfigManager();
    }
    return PortfolioConfigManager.instance;
  }

  // Profile information
  getProfile() {
    return this.config.profile;
  }

  getProfileName(): string {
    return this.config.profile.name;
  }

  getProfileTitle(): string {
    return this.config.profile.title;
  }

  getProfileImage(): string {
    return this.config.profile.profileImage;
  }

  getCVPath(): string {
    return this.config.profile.cvPath;
  }

  getCVDownloadName(): string {
    return this.config.profile.cvDownloadName;
  }

  // Contact information
  getContact() {
    return this.config.contact;
  }

  getContactEmail(): string {
    return this.config.contact.email;
  }

  getContactPhone(): string {
    return this.config.contact.phone;
  }

  getContactWebsite(): string {
    return this.config.contact.website;
  }

  getContactLinkedIn(): string {
    return this.config.contact.linkedin;
  }

  getContactGitHub(): string {
    return this.config.contact.github;
  }

  // Hobbies information
  getHobbies() {
    return this.config.hobbies;
  }

  getHobby(key: string) {
    return this.config.hobbies[key];
  }

  // Terminal configuration
  getTerminalConfig() {
    return this.config.terminal;
  }

  getTerminalWelcome() {
    return this.config.terminal.welcome;
  }

  getTerminalPrompt(): string {
    return this.config.terminal.prompt;
  }

  getTerminalPlaceholder(): string {
    return this.config.terminal.placeholder;
  }

  getTerminalSection(section: string) {
    return this.config.terminal.sections[section as keyof typeof this.config.terminal.sections];
  }

  // UI configuration
  getUIConfig() {
    return this.config.ui;
  }

  getTopLeftInfo() {
    return this.config.ui.topLeftInfo;
  }

  getHelperText() {
    return this.config.ui.helperText;
  }

  // Update methods for dynamic configuration
  updateProfile(updates: Partial<typeof this.config.profile>) {
    this.config.profile = { ...this.config.profile, ...updates };
  }

  updateContact(updates: Partial<typeof this.config.contact>) {
    this.config.contact = { ...this.config.contact, ...updates };
  }

  updateHobby(key: string, updates: Partial<typeof this.config.hobbies[keyof typeof this.config.hobbies]>) {
    if (this.config.hobbies[key]) {
      this.config.hobbies[key] = { ...this.config.hobbies[key], ...updates };
    }
  }

  // Get the full configuration for advanced use cases
  getFullConfig(): PortfolioConfig {
    return this.config;
  }

  // Load configuration from external source (for future extensibility)
  async loadConfig(configData: Partial<PortfolioConfig>) {
    this.config = { ...this.config, ...configData };
  }
}

// Export singleton instance
export const portfolioConfig = PortfolioConfigManager.getInstance();
