/**
 * Winston Logger Configuration Module
 * 
 * Provides a centralized logging instance with environment-aware log levels
 * and multiple transports for comprehensive application logging.
 * 
 * Log Levels (npm standard):
 * - error: 0 - Critical errors requiring immediate attention
 * - warn: 1 - Warning conditions that may need investigation
 * - info: 2 - Informational messages about normal operation
 * - http: 3 - HTTP request logging (Morgan integration)
 * - debug: 4 - Detailed debug information for development
 * 
 * Transports:
 * - Console: Colorized output for development visibility
 * - File (error.log): Error-level logs only for production debugging
 * - File (combined.log): All logs for comprehensive audit trail
 * 
 * Morgan Integration:
 * The logger.stream property provides a write function that pipes
 * Morgan HTTP request logs through Winston at the 'http' level.
 * 
 * @module src/config/logger
 */

'use strict';

const winston = require('winston');
const config = require('./index');
const path = require('path');

/**
 * Custom log levels following npm conventions
 * Lower number = higher severity
 * 
 * @constant {Object}
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

/**
 * Colors for each log level when colorize is enabled
 * Used for console output readability in development
 * 
 * @constant {Object}
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Register custom colors with Winston
winston.addColors(colors);

/**
 * Determine the appropriate log level based on environment
 * - Development: 'debug' for verbose output during development
 * - Production: 'info' to reduce log volume in production
 * 
 * Uses config.logLevel if explicitly set, otherwise determines
 * based on config.isDevelopment and config.isProduction flags.
 * 
 * @returns {string} The log level to use
 */
const getLogLevel = () => {
  // Use explicitly configured log level if available
  if (config.logLevel) {
    return config.logLevel;
  }
  
  // Environment-based defaults
  if (config.isDevelopment) {
    return 'debug';
  }
  
  if (config.isProduction) {
    return 'info';
  }
  
  // Default fallback for other environments (e.g., test)
  return 'info';
};

/**
 * Custom printf format for human-readable console output
 * Format: "YYYY-MM-DD HH:mm:ss LEVEL: message"
 * 
 * @type {winston.Logform.Format}
 */
const consoleFormat = winston.format.combine(
  // Add timestamp to each log entry
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  
  // Colorize the output for console readability
  winston.format.colorize({ all: true }),
  
  // Custom printf format for clean output
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} ${level}: ${message}`;
    
    // Append metadata if present (excluding empty objects)
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

/**
 * JSON format for file output (structured logging)
 * Enables easy parsing and log aggregation in production
 * 
 * @type {winston.Logform.Format}
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Log file paths configuration
 * Logs are stored in the logs/ directory at project root
 * 
 * @constant {Object}
 */
const logPaths = {
  error: path.join(process.cwd(), 'logs', 'error.log'),
  combined: path.join(process.cwd(), 'logs', 'combined.log')
};

/**
 * Configure transport array based on environment
 * - Always includes console transport
 * - Adds file transports for all environments (useful for debugging)
 * 
 * @returns {Array<winston.transport>} Array of Winston transports
 */
const getTransports = () => {
  const transports = [
    // Console transport with colorized output
    new winston.transports.Console({
      format: consoleFormat
    })
  ];

  // Add file transports for error logs and combined logs
  // Using JSON format for easy parsing and log aggregation
  transports.push(
    // Error log - captures only error-level logs
    new winston.transports.File({
      filename: logPaths.error,
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB max file size
      maxFiles: 5, // Keep up to 5 rotated files
      tailable: true
    }),
    
    // Combined log - captures all log levels
    new winston.transports.File({
      filename: logPaths.combined,
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB max file size
      maxFiles: 5, // Keep up to 5 rotated files
      tailable: true
    })
  );

  return transports;
};

/**
 * Create the Winston logger instance
 * 
 * Configuration:
 * - level: Environment-aware log level (debug in dev, info in prod)
 * - levels: Custom npm-style levels
 * - transports: Console + file transports
 * 
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
  level: getLogLevel(),
  levels: levels,
  transports: getTransports(),
  
  // Don't exit on handled exceptions
  exitOnError: false,
  
  // Silent mode for testing (optional)
  silent: process.env.NODE_ENV === 'test' && process.env.LOG_SILENT === 'true'
});

/**
 * Stream interface for Morgan HTTP logging integration
 * 
 * This property allows Morgan to pipe its logs through Winston
 * at the 'http' log level, ensuring unified logging across the application.
 * 
 * Usage in Morgan middleware:
 * morgan(format, { stream: logger.stream })
 * 
 * @type {Object}
 * @property {Function} write - Write function that logs to Winston http level
 */
logger.stream = {
  write: (message) => {
    // Remove trailing newline from Morgan output
    logger.http(message.trim());
  }
};

/**
 * Export the configured Winston logger instance
 * 
 * Usage examples:
 * - logger.info('Server started on port 3000');
 * - logger.error('Database connection failed', { error: err.message });
 * - logger.debug('Processing request', { requestId: req.id });
 * - logger.http('GET /api/users 200 45ms');
 */
module.exports = logger;
