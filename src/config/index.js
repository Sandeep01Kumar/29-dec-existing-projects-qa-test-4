/**
 * Centralized Configuration Module
 * 
 * This module implements environment management following 12-factor app methodology.
 * It is responsible for:
 * - Loading environment variables from .env file via dotenv
 * - Providing sensible defaults for all configuration values
 * - Validating configuration completeness
 * - Exporting a unified config object for use throughout the application
 * 
 * @module src/config/index
 */

// IMPORTANT: dotenv must be initialized at the very top before any other code
// This ensures environment variables are loaded before any access
require('dotenv').config();

/**
 * Valid environment values for NODE_ENV
 * @constant {string[]}
 */
const VALID_ENVIRONMENTS = ['development', 'production', 'test'];

/**
 * Extract and validate NODE_ENV with default fallback
 * @type {string}
 */
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Extract and parse PORT with default fallback to 3000
 * Maintains backward compatibility with original server.js
 * @type {number}
 */
const PORT = parseInt(process.env.PORT, 10) || 3000;

/**
 * Extract LOG_LEVEL with environment-aware default
 * Development defaults to 'debug' for verbose logging
 * Production defaults to 'info' for reduced log volume
 * @type {string}
 */
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'development' ? 'debug' : 'info');

/**
 * Validates the configuration values and logs warnings for invalid configurations
 * This function does not throw errors to prevent application startup failures
 * from configuration issues that may have sensible fallbacks
 * 
 * @returns {Object} Validation result with isValid boolean and array of warnings
 */
const validateConfiguration = () => {
  const warnings = [];

  // Validate PORT is a valid positive number
  if (isNaN(PORT) || PORT < 0 || PORT > 65535) {
    warnings.push(`Invalid PORT value: ${process.env.PORT}. Using default: 3000. PORT must be a number between 0 and 65535.`);
  }

  // Validate NODE_ENV is one of expected values
  if (!VALID_ENVIRONMENTS.includes(NODE_ENV)) {
    warnings.push(`Invalid NODE_ENV value: ${NODE_ENV}. Expected one of: ${VALID_ENVIRONMENTS.join(', ')}. Proceeding with current value.`);
  }

  // Validate LOG_LEVEL is a recognized level
  const validLogLevels = ['error', 'warn', 'info', 'http', 'debug'];
  if (!validLogLevels.includes(LOG_LEVEL)) {
    warnings.push(`Unrecognized LOG_LEVEL value: ${LOG_LEVEL}. Expected one of: ${validLogLevels.join(', ')}. Proceeding with current value.`);
  }

  // Log warnings if any validation issues were found
  // Using console.warn here since logger may not be initialized yet
  if (warnings.length > 0) {
    warnings.forEach((warning) => {
      console.warn(`[Config Warning] ${warning}`);
    });
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
};

// Perform validation on module load
const validationResult = validateConfiguration();

/**
 * Centralized configuration object
 * Contains all environment-specific settings for the application
 * 
 * @typedef {Object} Config
 * @property {string} env - Current environment (development, production, test)
 * @property {number} port - HTTP server port (default: 3000)
 * @property {string} logLevel - Winston logging level (debug in dev, info in prod)
 * @property {boolean} isDevelopment - True if running in development environment
 * @property {boolean} isProduction - True if running in production environment
 * @property {boolean} isTest - True if running in test environment
 * @property {Object} validation - Configuration validation result
 */
const config = {
  /**
   * Current environment (development, production, test)
   * @type {string}
   */
  env: NODE_ENV,

  /**
   * HTTP server port
   * Default: 3000 (maintains backward compatibility with original server.js)
   * @type {number}
   */
  port: isNaN(PORT) || PORT < 0 || PORT > 65535 ? 3000 : PORT,

  /**
   * Winston logging level
   * Defaults to 'debug' in development for verbose output
   * Defaults to 'info' in production for reduced log volume
   * @type {string}
   */
  logLevel: LOG_LEVEL,

  /**
   * Boolean flag indicating development environment
   * Useful for conditional logic like detailed error responses
   * @type {boolean}
   */
  isDevelopment: NODE_ENV === 'development',

  /**
   * Boolean flag indicating production environment
   * Useful for enabling production-specific optimizations and security
   * @type {boolean}
   */
  isProduction: NODE_ENV === 'production',

  /**
   * Boolean flag indicating test environment
   * Useful for test-specific configurations
   * @type {boolean}
   */
  isTest: NODE_ENV === 'test',

  /**
   * Validation result object containing status and any warnings
   * @type {Object}
   */
  validation: validationResult
};

// Freeze the config object to prevent runtime modifications
// This ensures configuration immutability throughout the application lifecycle
Object.freeze(config);

module.exports = config;
