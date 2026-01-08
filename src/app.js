/**
 * Express Application Factory Module
 * 
 * Assembles and configures the complete Express.js application with:
 * - Security middleware (Helmet for HTTP headers, CORS for cross-origin)
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
 * Middleware Chain Order (as per Express.js best practices):
 * 1. Security (helmet) - Sets HTTP security headers first
 * 2. CORS - Handle cross-origin requests before body parsing
 * 3. Body parsers - Parse request bodies before logging
 * 4. Morgan logging - Log incoming HTTP requests
 * 5. Routes - Handle application routes
 * 6. 404 handler - Catch unmatched routes
 * 7. Error handler - Global error catching (MUST be last)
 * 
 * @module src/app
 */

'use strict';

// =============================================================================
// EXTERNAL DEPENDENCIES
// =============================================================================

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================

// Morgan HTTP request logging middleware configured with Winston stream
const morganMiddleware = require('./middleware/morgan');

// Route aggregator containing all application routes
const routes = require('./routes');

// Error handling middleware - includes both errorHandler and notFoundHandler
const errorHandler = require('./middleware/errorHandler');
const { notFoundHandler } = require('./middleware/errorHandler');

// =============================================================================
// EXPRESS APPLICATION INITIALIZATION
// =============================================================================

/**
 * Create Express application instance
 * 
 * This is the main application object that will be configured with
 * middleware and routes, then exported for use by server.js
 * 
 * @type {express.Application}
 */
const app = express();

// =============================================================================
// APPLICATION SETTINGS
// =============================================================================

/**
 * Configure trust proxy for production deployments
 * 
 * When running behind a reverse proxy (nginx, AWS ELB, load balancer),
 * this setting ensures Express correctly identifies client IPs from
 * X-Forwarded-For header for rate limiting, logging, and security.
 * 
 * Set to 1 to trust the first proxy in the chain.
 * Only enabled in production to avoid trusting proxy headers in development.
 */
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// =============================================================================
// MIDDLEWARE CHAIN
// =============================================================================

/**
 * STEP 1: Security Middleware (First in chain)
 * 
 * Helmet sets various HTTP security headers to protect against common
 * web vulnerabilities including:
 * - X-Content-Type-Options: nosniff (prevents MIME type sniffing)
 * - X-Frame-Options: SAMEORIGIN (clickjacking protection)
 * - X-XSS-Protection (cross-site scripting protection)
 * - Strict-Transport-Security (HSTS for HTTPS enforcement)
 * - X-DNS-Prefetch-Control (controls DNS prefetching)
 * - X-Download-Options (prevents IE from executing downloads)
 * - Referrer-Policy (controls referrer information)
 * 
 * Applied first to ensure all responses have security headers.
 */
app.use(helmet());

/**
 * STEP 2: CORS Middleware (Cross-Origin Resource Sharing)
 * 
 * Enables controlled access to the API from different origins.
 * Default configuration allows all origins - customize options object
 * for production deployments to restrict allowed origins.
 * 
 * Applied early to handle preflight OPTIONS requests before body parsing.
 * 
 * @example
 * // Restricted CORS configuration for production:
 * app.use(cors({
 *   origin: ['https://example.com', 'https://api.example.com'],
 *   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
 *   allowedHeaders: ['Content-Type', 'Authorization'],
 *   credentials: true
 * }));
 */
app.use(cors());

/**
 * STEP 3: Body Parsing Middleware
 * 
 * Parse incoming request bodies before route handlers.
 * These middleware must be applied before routes to ensure
 * req.body is populated with parsed data.
 */

/**
 * Parse JSON request bodies
 * 
 * Handles Content-Type: application/json
 * Sets a reasonable limit to prevent large payload attacks.
 * Parsed data available in req.body
 */
app.use(express.json());

/**
 * Parse URL-encoded request bodies
 * 
 * Handles Content-Type: application/x-www-form-urlencoded
 * Used for HTML form submissions.
 * - extended: true allows for nested objects using qs library
 * 
 * Parsed data available in req.body
 */
app.use(express.urlencoded({ extended: true }));

/**
 * STEP 4: HTTP Request Logging Middleware
 * 
 * Morgan logs all incoming HTTP requests through the Winston logger.
 * Log format depends on environment:
 * - Production: 'combined' format for comprehensive Apache-style logs
 * - Development: 'dev' format for colorized, concise output
 * 
 * Applied after body parsing to ensure all request metadata is available.
 */
app.use(morganMiddleware);

// =============================================================================
// ROUTES
// =============================================================================

/**
 * STEP 5: Route Mounting
 * 
 * Mount all application routes at the root path.
 * The routes module (src/routes/index.js) aggregates:
 * - GET / - Hello World response (backward compatibility)
 * - GET /health - Health check endpoints
 * - Additional API routes
 * 
 * Routes are organized modularly within the routes directory.
 */
app.use('/', routes);

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * STEP 6: 404 Not Found Handler
 * 
 * Catches all requests that didn't match any defined route.
 * Creates a 404 error and forwards it to the global error handler.
 * 
 * Must be placed after all routes but before the error handler.
 */
app.use(notFoundHandler);

/**
 * STEP 7: Global Error Handler (MUST be last)
 * 
 * Catches all errors passed via next(err) throughout the application.
 * Provides environment-aware error responses:
 * - Development: Full error details including stack trace
 * - Production: Sanitized messages without sensitive information
 * 
 * All errors are logged through Winston for monitoring and debugging.
 * 
 * Express error handlers MUST have exactly 4 parameters (err, req, res, next)
 * and MUST be the last middleware in the chain.
 */
app.use(errorHandler);

// =============================================================================
// EXPORT
// =============================================================================

/**
 * Export the configured Express application
 * 
 * The app is fully configured with middleware and routes.
 * Used by server.js to create the HTTP server:
 * 
 * @example
 * const app = require('./src/app');
 * const server = app.listen(port, () => {
 *   console.log(`Server running on port ${port}`);
 * });
 * 
 * The exported app provides all Express methods:
 * - app.listen() - Start HTTP server
 * - app.use() - Mount middleware
 * - app.get(), app.post(), app.put(), app.delete(), app.patch() - Route methods
 * 
 * @type {express.Application}
 */
module.exports = app;
