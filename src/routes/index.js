/**
 * Central Route Aggregator Module
 * 
 * Imports and mounts all route modules at their appropriate path prefixes.
 * Acts as the single entry point for all routes, providing clean separation
 * of routing concerns following Express.js modular architecture patterns.
 * 
 * Route Mounting:
 * - /health/* -> Health check routes (health.js)
 * - /* -> API routes including Hello World (api.js)
 * 
 * Mounting Order:
 * More specific paths (/health) are mounted before catch-all paths (/)
 * to ensure proper route matching without conflicts.
 * 
 * @module routes
 */

'use strict';

const express = require('express');

// Import route modules
const healthRoutes = require('./health');
const apiRoutes = require('./api');

/**
 * Create main Express Router instance
 * This router aggregates all route modules
 * @type {express.Router}
 */
const router = express.Router();

/**
 * Mount health check routes at /health path
 * 
 * Endpoints provided:
 * - GET /health - Basic health status with timestamp
 * - GET /health/ready - Readiness probe for load balancers
 * - GET /health/live - Liveness probe for orchestrators
 * 
 * Mounting health routes first (more specific path) ensures
 * they are matched before the root API routes.
 */
router.use('/health', healthRoutes);

/**
 * Mount API routes at root path
 * 
 * Endpoints provided:
 * - GET / - Hello World response (backward compatibility)
 * - GET /info - API information and version
 * 
 * Mounted at root path to maintain backward compatibility
 * with the original server.js implementation.
 */
router.use('/', apiRoutes);

/**
 * Export the aggregated router
 * 
 * Usage in src/app.js:
 * ```javascript
 * const routes = require('./routes');
 * app.use('/', routes);
 * ```
 * 
 * This provides a single import for all application routes,
 * keeping the main app.js clean and focused on middleware configuration.
 */
module.exports = router;
