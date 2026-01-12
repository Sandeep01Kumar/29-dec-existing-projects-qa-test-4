/**
 * Express.js Server Entry Point
 * 
 * This module serves as the application entry point responsible for:
 * - Importing the configured Express application from src/app.js
 * - Starting the HTTP server on the configured port
 * - Implementing graceful shutdown handlers for SIGTERM and SIGINT signals
 * - Setting up global error handlers for uncaught exceptions and unhandled rejections
 * 
 * The separation between app configuration (src/app.js) and server startup (server.js)
 * follows Express.js best practices, enabling better testability and modularity.
 * 
 * Backward Compatibility:
 * - Default port remains 3000 (configurable via PORT environment variable)
 * - "Hello, World!" response is handled by routes (see src/routes/index.js)
 * 
 * Production Deployment:
 * - Use PM2 with ecosystem.config.js for process management
 * - PM2 commands: npm run pm2:start, npm run pm2:stop, npm run pm2:restart
 * 
 * @module server
 */

'use strict';

// =============================================================================
// INTERNAL DEPENDENCIES
// =============================================================================

/**
 * Express application instance
 * Fully configured with middleware chain, routes, and error handlers
 * @see src/app.js
 */
const app = require('./src/app');

/**
 * Centralized configuration object
 * Contains environment-specific settings (port, env, logLevel)
 * @see src/config/index.js
 */
const config = require('./src/config');

/**
 * Winston logger instance
 * Provides structured logging with multiple transports
 * @see src/config/logger.js
 */
const logger = require('./src/config/logger');

// =============================================================================
// SERVER INSTANCE
// =============================================================================

/**
 * HTTP server instance
 * Created by Express app.listen(), stored for graceful shutdown
 * @type {http.Server}
 */
let server;

// =============================================================================
// SERVER STARTUP
// =============================================================================

/**
 * Start the HTTP server
 * 
 * Creates an HTTP server using Express app.listen() method.
 * Logs startup message with port and environment information.
 * The server listens on all network interfaces (0.0.0.0) by default.
 * 
 * @returns {http.Server} The created HTTP server instance
 */
const startServer = () => {
  server = app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    logger.info(`Health check available at http://localhost:${config.port}/health`);
    
    // Log validation warnings if any configuration issues were detected
    if (config.validation && !config.validation.isValid) {
      config.validation.warnings.forEach((warning) => {
        logger.warn(`Configuration warning: ${warning}`);
      });
    }
  });

  // Handle server errors (e.g., port already in use)
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${config.port} is already in use. Please use a different port.`);
    } else if (error.code === 'EACCES') {
      logger.error(`Port ${config.port} requires elevated privileges. Try a port above 1024.`);
    } else {
      logger.error('Server error occurred', { error: error.message, code: error.code });
    }
    process.exit(1);
  });

  return server;
};

// =============================================================================
// GRACEFUL SHUTDOWN HANDLERS
// =============================================================================

/**
 * Graceful shutdown function
 * 
 * Handles server shutdown by:
 * 1. Logging the shutdown signal received
 * 2. Stopping the server from accepting new connections
 * 3. Waiting for existing connections to complete
 * 4. Exiting the process with appropriate exit code
 * 
 * This ensures in-flight requests are completed before termination,
 * preventing data loss and maintaining service reliability.
 * 
 * @param {string} signal - The signal that triggered shutdown (SIGTERM or SIGINT)
 */
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server gracefully`);
  
  if (server) {
    server.close((err) => {
      if (err) {
        logger.error('Error during server shutdown', { error: err.message });
        process.exit(1);
      }
      
      logger.info('HTTP server closed successfully');
      logger.info('Process exiting gracefully');
      process.exit(0);
    });

    // Force shutdown after timeout if graceful shutdown takes too long
    // This prevents hanging on stuck connections
    const shutdownTimeout = setTimeout(() => {
      logger.warn('Forcing shutdown after timeout - connections may have been dropped');
      process.exit(1);
    }, 10000); // 10 second timeout

    // Clear the timeout if shutdown completes normally
    shutdownTimeout.unref();
  } else {
    // Server not started, exit immediately
    logger.info('Server not running, exiting immediately');
    process.exit(0);
  }
};

/**
 * SIGTERM Handler
 * 
 * Triggered by PM2, Docker, Kubernetes, and most process managers
 * when requesting graceful termination. This is the standard signal
 * for production deployments to initiate shutdown.
 */
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

/**
 * SIGINT Handler
 * 
 * Triggered by Ctrl+C in the terminal during development.
 * Provides the same graceful shutdown behavior as SIGTERM
 * for a consistent developer experience.
 */
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

// =============================================================================
// GLOBAL ERROR HANDLERS
// =============================================================================

/**
 * Uncaught Exception Handler
 * 
 * Catches synchronous errors that weren't handled anywhere in the application.
 * These are typically programming errors that should be investigated.
 * 
 * In production, the application logs the error and exits to allow the
 * process manager (PM2) to restart a fresh instance, preventing potential
 * inconsistent state from affecting subsequent requests.
 * 
 * @param {Error} error - The uncaught exception
 */
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception detected', {
    error: error.message,
    stack: error.stack,
    name: error.name
  });
  
  // In production, exit to allow PM2 to restart the process
  // This prevents the application from running in an inconsistent state
  logger.error('Application will exit due to uncaught exception');
  
  // Attempt graceful shutdown before exit
  if (server) {
    server.close(() => {
      process.exit(1);
    });
    
    // Force exit after brief timeout
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  } else {
    process.exit(1);
  }
});

/**
 * Unhandled Promise Rejection Handler
 * 
 * Catches promise rejections that weren't handled with .catch() or try/catch.
 * Starting with Node.js 15+, unhandled rejections cause the process to exit
 * by default. This handler provides consistent logging before exit.
 * 
 * In production, rejections are logged and the application continues running
 * unless the error is critical. PM2 will handle any resulting crashes.
 * 
 * @param {Error|any} reason - The rejection reason (typically an Error)
 * @param {Promise} promise - The promise that was rejected
 */
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection detected', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise)
  });
  
  // Log warning about unhandled rejection
  // Note: In Node.js 15+, unhandled rejections cause process exit by default
  // The application will continue running, but this should be investigated
  logger.warn('Unhandled rejection logged - please add proper error handling');
});

// =============================================================================
// APPLICATION STARTUP
// =============================================================================

/**
 * Initialize and start the server
 * 
 * This is the main entry point that starts the Express application.
 * The server will listen on the configured port and begin accepting requests.
 */
startServer();
