/**
 * Express Application Factory Module
 * 
 * Assembles and configures the complete Express.js application with:
 * - Security middleware (Helmet, rate limiting, CORS)
 * - Body parsing middleware (JSON, URL-encoded)
 * - HTTP request logging (Morgan via Winston)
 * - Modular route mounting
 * - 404 handler for unmatched routes
 * - Global error handling middleware
 * 
 * This separation of app configuration from server startup enables
 * better testability and follows Express.js best practices for
 * modular architecture.
 * 
 * Middleware Chain Order:
 * 1. Security (helmet, rate limit) - First to set headers and protect
 * 2. CORS - Before body parsing for preflight requests
 * 3. Body parsers - Parse request bodies before logging
 * 4. Morgan logging - Log incoming requests
 * 5. Routes - Handle requests
 * 6. 404 handler - Catch unmatched routes
 * 7. Error handler - Catch all errors (MUST be last)
 * 
 * @module app
 */

'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

// Import middleware from barrel export
const {
  morganMiddleware,
  securityMiddleware,
  rateLimitMiddleware,
  errorHandler,
  notFoundHandler
} = require('./middleware');

// Import routes
const routes = require('./routes');

// Import configuration
const config = require('./config');

/**
 * Create Express application instance
 * @type {express.Application}
 */
const app = express();

/**
 * Configure trust proxy for production deployments
 * 
 * When running behind a reverse proxy (nginx, load balancer),
 * this setting ensures Express correctly identifies client IPs
 * from X-Forwarded-For header for rate limiting and logging.
 * 
 * Set to 1 to trust the first proxy, or 'loopback' for local proxy
 */
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// ============================================================================
// MIDDLEWARE CHAIN
// ============================================================================

/**
 * 1. Security Middleware (First)
 * 
 * Apply security headers and rate limiting before any processing.
 * This protects all subsequent middleware and routes.
 */

// Helmet sets various HTTP security headers
app.use(securityMiddleware);

// Rate limiting to prevent DOS and brute-force attacks
app.use(rateLimitMiddleware);

/**
 * 2. CORS Middleware
 * 
 * Enable Cross-Origin Resource Sharing with default settings.
 * Configure options for specific origins in production.
 */
app.use(cors());

/**
 * 3. Body Parsing Middleware
 * 
 * Parse incoming request bodies before route handlers.
 */

// Parse JSON request bodies
// limit: Maximum body size (default: 100kb)
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies (form submissions)
// extended: true allows for nested objects
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

/**
 * 4. HTTP Request Logging Middleware
 * 
 * Morgan logs all HTTP requests through Winston.
 * Uses 'combined' format in production, 'dev' in development.
 */
app.use(morganMiddleware);

// ============================================================================
// ROUTES
// ============================================================================

/**
 * 5. Route Mounting
 * 
 * Mount all application routes at root path.
 * The routes module handles internal path prefix organization.
 */
app.use('/', routes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 6. 404 Handler
 * 
 * Catch requests that didn't match any route.
 * Creates a 404 error and forwards to error handler.
 */
app.use(notFoundHandler);

/**
 * 7. Global Error Handler (Last)
 * 
 * Catches all errors passed via next(err).
 * MUST be the last middleware in the chain.
 */
app.use(errorHandler);

/**
 * Export the configured Express application
 * 
 * Used by server.js to start the HTTP server:
 * ```javascript
 * const app = require('./src/app');
 * const server = app.listen(port, () => {
 *   console.log(`Server running on port ${port}`);
 * });
 * ```
 */
module.exports = app;
