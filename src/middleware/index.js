/**
 * Middleware Barrel Export Module
 * 
 * Provides a single entry point to import all middleware functions,
 * following the barrel export pattern for clean module organization.
 * 
 * This module aggregates and re-exports:
 * - morganMiddleware: HTTP request logging via Winston
 * - securityMiddleware: Helmet security headers
 * - rateLimitMiddleware: DOS/brute-force protection
 * - errorHandler: Global error handling
 * - notFoundHandler: 404 handler for unmatched routes
 * 
 * Usage:
 * ```javascript
 * const { 
 *   morganMiddleware, 
 *   securityMiddleware, 
 *   rateLimitMiddleware, 
 *   errorHandler,
 *   notFoundHandler 
 * } = require('./middleware');
 * ```
 * 
 * @module middleware
 */

'use strict';

// Import Morgan HTTP request logging middleware
const morganMiddleware = require('./morgan');

// Import security middleware (Helmet and rate limiting)
const { securityMiddleware, rateLimitMiddleware } = require('./security');

// Import error handling middleware
const errorHandler = require('./errorHandler');
const { notFoundHandler } = require('./errorHandler');

/**
 * Export all middleware as named exports
 * 
 * Middleware ordering recommendation when applying:
 * 1. securityMiddleware (helmet) - Sets security headers first
 * 2. rateLimitMiddleware - Rate limiting before processing
 * 3. cors - Cross-Origin Resource Sharing
 * 4. body-parser - Parse request bodies
 * 5. morganMiddleware - Log incoming requests
 * 6. routes - Handle requests
 * 7. notFoundHandler - Handle unmatched routes
 * 8. errorHandler - Catch all errors (MUST be last)
 */
module.exports = {
  /**
   * Morgan HTTP request logging middleware
   * Logs all HTTP requests through Winston at 'http' level
   * Uses 'combined' format in production, 'dev' in development
   * @type {Function}
   */
  morganMiddleware,

  /**
   * Helmet security middleware
   * Sets various HTTP security headers for protection against
   * common web vulnerabilities (XSS, clickjacking, MIME sniffing)
   * @type {Function}
   */
  securityMiddleware,

  /**
   * Express rate limiting middleware
   * Limits requests per IP within a time window (default: 100 req/15min)
   * Returns 429 status when limit exceeded
   * @type {Function}
   */
  rateLimitMiddleware,

  /**
   * Global error handling middleware
   * Catches all errors via next(err) and provides environment-aware responses
   * Must be attached LAST in the middleware chain
   * @type {Function}
   */
  errorHandler,

  /**
   * Not Found (404) handler middleware
   * Creates 404 error for unmatched routes and forwards to error handler
   * Place after routes but before errorHandler
   * @type {Function}
   */
  notFoundHandler
};
