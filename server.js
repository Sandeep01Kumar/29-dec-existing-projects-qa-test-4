/**
 * Express Server Entry Point
 * 
 * Production-ready Node.js HTTP server using Express.js framework.
 * Handles server startup, graceful shutdown, and global error handling.
 * 
 * Features:
 * - Express.js application with modular architecture
 * - Environment-based configuration via dotenv
 * - Comprehensive logging via Winston
 * - Graceful shutdown on SIGTERM/SIGINT signals
 * - Global exception and rejection handlers
 * 
 * Usage:
 * - Development: npm run dev
 * - Production: npm run start:prod
 * - PM2 managed: npm run pm2:start
 * 
 * @module server
 */

'use strict';

// Import Express application instance
const app = require('./src/app');

// Import configuration (includes dotenv initialization)
const config = require('./src/config');

// Import Winston logger
const logger = require('./src/config/logger');

/**
 * Server instance reference
 * Used for graceful shutdown
 * @type {http.Server|null}
 */
let server = null;

/**
 * Start the HTTP server
 * 
 * Binds the Express app to the configured port and logs startup message.
 * The server listens on all network interfaces (0.0.0.0) to accept
 * connections from any source, suitable for container deployments.
 */
const startServer = () => {
  server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.env} mode on port ${config.port}`);
    logger.info(`Health check: http://localhost:${config.port}/health`);
    
    if (config.isDevelopment) {
      logger.debug(`Debug logging enabled`);
      logger.debug(`API info: http://localhost:${config.port}/info`);
    }
  });

  // Handle server errors (e.g., port already in use)
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${config.port} is already in use`);
      process.exit(1);
    } else {
      logger.error(`Server error: ${error.message}`, { error });
      throw error;
    }
  });
};

/**
 * Graceful shutdown handler
 * 
 * Closes the HTTP server gracefully, allowing existing connections
 * to complete before shutting down. Essential for zero-downtime
 * deployments and container orchestration.
 * 
 * @param {string} signal - The signal that triggered shutdown
 */
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Set a timeout for forceful shutdown if graceful fails
  const forceShutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 30000); // 30 second timeout

  if (server) {
    server.close((err) => {
      clearTimeout(forceShutdownTimeout);
      
      if (err) {
        logger.error('Error during server close:', { error: err.message });
        process.exit(1);
      }

      logger.info('HTTP server closed');
      logger.info('Graceful shutdown completed');
      process.exit(0);
    });
  } else {
    clearTimeout(forceShutdownTimeout);
    logger.info('Server was not running');
    process.exit(0);
  }
};

// ============================================================================
// SIGNAL HANDLERS
// ============================================================================

/**
 * SIGTERM handler - Container/process manager termination signal
 * Used by PM2, Docker, Kubernetes for graceful stop
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

/**
 * SIGINT handler - Interrupt signal (Ctrl+C)
 * Used for manual shutdown during development
 */
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

/**
 * Uncaught exception handler
 * 
 * Catches synchronous exceptions that weren't handled anywhere.
 * Logs the error and exits the process, as the application state
 * may be corrupted after an uncaught exception.
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  
  // Exit with failure code - PM2 will restart the process
  process.exit(1);
});

/**
 * Unhandled promise rejection handler
 * 
 * Catches promise rejections that weren't handled with .catch().
 * Logs the error for debugging. In Node.js 15+, unhandled rejections
 * cause the process to exit by default; this handler ensures proper logging.
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined
  });
  
  // Exit with failure code - PM2 will restart the process
  process.exit(1);
});

// ============================================================================
// START SERVER
// ============================================================================

// Start the server
startServer();

/**
 * Export the server instance for testing purposes
 * Allows test frameworks to access the server for integration tests
 */
module.exports = server;
