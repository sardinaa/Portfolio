#!/usr/bin/env node

/**
 * Configuration validation script
 * Run with: npm run validate-config
 */

import { validateConfig, printValidationResults } from '../src/config/validator.js';

async function main() {
  try {
    const result = validateConfig();
    printValidationResults(result);
    
    if (!result.isValid) {
      process.exit(1);
    }
    
    console.log('🎉 All configuration validation checks passed!');
  } catch (error) {
    console.error('❌ Failed to validate configuration:', error);
    process.exit(1);
  }
}

main();
