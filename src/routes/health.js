/**
 * Health Check Routes Module
 * 
 * Provides monitoring and readiness endpoints for PM2 process manager
 * and external monitoring systems (load balancers, Kubernetes probes).
 * 
 * Endpoints:
 * - GET /health - Basic health check with timestamp
 * - GET /health/ready - Readiness probe (application ready to serve traffic)
 * - GET /health/live - Liveness probe (application is running)
 * 
 * These endpoints are critical for:
 * - PM2 clustering and auto-restart decisions
 * - Load balancer health verification
 * - Container orchestration readiness/liveness probes
 * - External monitoring system integration
 * 
 * @module routes/health
 */

'use strict';

const express = require('express');

/**
 * Create Express Router instance for health check routes
 * @type {express.Router}
 */
const router = express.Router();

/**
 * GET /health - Basic Health Check
 * 
 * Returns the current health status with timestamp.
 * Use this endpoint for basic monitoring and uptime checks.
 * 
 * Response:
 * - 200 OK: Application is healthy
 * - JSON body: { status: 'ok', timestamp: <unix_timestamp> }
 * 
 * @route GET /health
 * @returns {Object} Health status with timestamp
 * 
 * @example
 * // Response
 * {
 *   "status": "ok",
 *   "timestamp": 1704758400000
 * }
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: Date.now()
  });
});

/**
 * GET /health/ready - Readiness Probe
 * 
 * Indicates whether the application is ready to receive traffic.
 * Used by load balancers and orchestrators to determine if the
 * instance should be included in the request routing pool.
 * 
 * In a more complex application, this would check:
 * - Database connectivity
 * - Cache availability
 * - External service dependencies
 * 
 * Response:
 * - 200 OK: Application is ready
 * - JSON body: { status: 'ready' }
 * 
 * @route GET /health/ready
 * @returns {Object} Readiness status
 * 
 * @example
 * // Response
 * {
 *   "status": "ready"
 * }
 */
router.get('/ready', (req, res) => {
  res.status(200).json({
    status: 'ready'
  });
});

/**
 * GET /health/live - Liveness Probe
 * 
 * Indicates whether the application process is alive and running.
 * Used by orchestrators to detect deadlocked or unresponsive processes
 * that need to be restarted.
 * 
 * This endpoint should be lightweight and always respond quickly
 * as long as the process is running.
 * 
 * Response:
 * - 200 OK: Application is alive
 * - JSON body: { status: 'alive' }
 * 
 * @route GET /health/live
 * @returns {Object} Liveness status
 * 
 * @example
 * // Response
 * {
 *   "status": "alive"
 * }
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive'
  });
});

/**
 * Export the health check router
 * 
 * Mount in main application at /health path:
 * ```javascript
 * const healthRoutes = require('./routes/health');
 * router.use('/health', healthRoutes);
 * ```
 */
module.exports = router;
