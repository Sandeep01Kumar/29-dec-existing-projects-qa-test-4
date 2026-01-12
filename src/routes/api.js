/**
 * API Routes Module
 * 
 * Demonstrates Express.js routing structure with sample endpoints.
 * Includes the backward-compatible root endpoint that maintains
 * the original server.js "Hello, World!" response.
 * 
 * Endpoints:
 * - GET / - Hello World response (backward compatibility)
 * - GET /info - API information and version
 * 
 * This module serves as a template for additional API route
 * implementations following RESTful patterns.
 * 
 * @module routes/api
 */

'use strict';

const express = require('express');

/**
 * Create Express Router instance for API routes
 * @type {express.Router}
 */
const router = express.Router();

/**
 * GET / - Root Endpoint (Hello World)
 * 
 * Maintains backward compatibility with the original server.js
 * by returning "Hello, World!\n" as plain text response.
 * 
 * This ensures existing clients or integrations continue to work
 * after the Express.js migration.
 * 
 * Response:
 * - 200 OK
 * - Content-Type: text/plain
 * - Body: "Hello, World!\n"
 * 
 * @route GET /
 * @returns {string} Hello World greeting
 * 
 * @example
 * // Request
 * GET / HTTP/1.1
 * Host: localhost:3000
 * 
 * // Response
 * HTTP/1.1 200 OK
 * Content-Type: text/plain; charset=utf-8
 * 
 * Hello, World!
 */
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('Hello, World!\n');
});

/**
 * GET /info - API Information Endpoint
 * 
 * Returns information about the API including name, version,
 * and current environment. Useful for debugging and version checks.
 * 
 * Response:
 * - 200 OK
 * - Content-Type: application/json
 * - JSON body with API metadata
 * 
 * @route GET /info
 * @returns {Object} API information
 * 
 * @example
 * // Response
 * {
 *   "name": "blitzy-basic-app",
 *   "version": "1.0.0",
 *   "environment": "development",
 *   "timestamp": 1704758400000
 * }
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    name: 'blitzy-basic-app',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: Date.now()
  });
});

/**
 * Export the API router
 * 
 * Mount in main application at root path:
 * ```javascript
 * const apiRoutes = require('./routes/api');
 * router.use('/', apiRoutes);
 * ```
 * 
 * Note: When mounting at root path, ensure more specific routes
 * (like /health) are mounted before this router to avoid conflicts.
 */
module.exports = router;
