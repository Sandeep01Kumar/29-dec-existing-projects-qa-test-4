/**
 * Production-ready HTTP Server
 * 
 * A robust Node.js HTTP server with comprehensive error handling,
 * graceful shutdown capabilities, input validation, and resource management.
 * 
 * @module server
 * @version 1.0.0
 * @author hxu
 */

const http = require('http');

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Server configuration constants
 * @constant {string} hostname - The hostname to bind the server to
 * @constant {number} port - The port number to listen on
 * @constant {number} SHUTDOWN_TIMEOUT - Maximum time (ms) to wait for graceful shutdown
 * @constant {number} REQUEST_TIMEOUT - Maximum time (ms) for a request to complete
 */
const hostname = '127.0.0.1';
const port = 3000;
const SHUTDOWN_TIMEOUT = 5000;
const REQUEST_TIMEOUT = 30000;

/**
 * Server state flag indicating if shutdown is in progress
 * When true, server rejects new requests with 503 Service Unavailable
 * @type {boolean}
 */
let isShuttingDown = false;

// ============================================================================
// Request Handler
// ============================================================================

/**
 * Main HTTP request handler with input validation and error handling
 * 
 * Supported routes:
 * - GET /        : Returns "Hello, World!" greeting
 * - GET /health  : Returns JSON health status with timestamp
 * - HEAD /       : Returns headers only (no body)
 * - HEAD /health : Returns headers only for health endpoint
 * - OPTIONS /    : Returns allowed methods
 * - OPTIONS /health : Returns allowed methods for health endpoint
 * 
 * Error responses:
 * - 404 Not Found: Invalid route
 * - 405 Method Not Allowed: Invalid HTTP method (POST, PUT, DELETE, PATCH)
 * - 500 Internal Server Error: Unexpected server error
 * - 503 Service Unavailable: Server is shutting down
 * 
 * @param {http.IncomingMessage} req - The incoming HTTP request
 * @param {http.ServerResponse} res - The HTTP response object
 */
const requestHandler = (req, res) => {
  try {
    // Check if server is shutting down - reject new requests
    if (isShuttingDown) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Connection', 'close');
      res.end('Service Unavailable\n');
      return;
    }

    const { method, url } = req;

    // Validate HTTP method - only allow GET, HEAD, OPTIONS
    const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (!allowedMethods.includes(method)) {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Allow', 'GET, HEAD, OPTIONS');
      res.end('Method Not Allowed\n');
      return;
    }

    // Handle OPTIONS preflight requests
    if (method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Allow', 'GET, HEAD, OPTIONS');
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }

    // Validate route - only allow / and /health
    const validRoutes = ['/', '/health'];
    if (!validRoutes.includes(url)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Not Found\n');
      return;
    }

    // Handle health check endpoint
    if (url === '/health') {
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      if (method === 'HEAD') {
        res.end();
      } else {
        res.end(JSON.stringify(healthStatus) + '\n');
      }
      return;
    }

    // Handle main route (/)
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    if (method === 'HEAD') {
      res.end();
    } else {
      res.end('Hello, World!\n');
    }

  } catch (error) {
    // Handle unexpected errors in request processing
    console.error(`Request processing error: ${error.message}`);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Internal Server Error\n');
  }
};

// ============================================================================
// Server Creation and Configuration
// ============================================================================

/**
 * HTTP server instance
 * @type {http.Server}
 */
const server = http.createServer(requestHandler);

/**
 * Configure server timeouts for resource management
 * - timeout: Maximum time for a request to complete (prevents slow loris attacks)
 * - keepAliveTimeout: Time to keep connection alive for potential reuse
 */
server.timeout = REQUEST_TIMEOUT;
server.keepAliveTimeout = 65000;

// ============================================================================
// Server Error Handler
// ============================================================================

/**
 * Handle server-level errors during startup and operation
 * 
 * Handles:
 * - EADDRINUSE: Port is already in use by another process
 * - EACCES: Insufficient permissions to bind to port
 * - Other errors: Logs and exits with error code
 * 
 * @param {Error} error - The error object
 */
server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    console.error(`Server error: ${error.message}`);
    process.exit(1);
  }

  switch (error.code) {
    case 'EADDRINUSE':
      console.error(`Port ${port} is already in use. Please use a different port or stop the existing process.`);
      process.exit(1);
      break;
    case 'EACCES':
      console.error(`Permission denied. Port ${port} requires elevated privileges.`);
      process.exit(1);
      break;
    default:
      console.error(`Server error: ${error.message}`);
      process.exit(1);
  }
});

// ============================================================================
// Client Error Handler
// ============================================================================

/**
 * Handle client-level errors from malformed HTTP requests
 * 
 * This handler catches parsing errors, invalid headers, and other
 * client-side protocol violations before they reach the request handler.
 * 
 * @param {Error} error - The error object
 * @param {net.Socket} socket - The socket that caused the error
 */
server.on('clientError', (error, socket) => {
  console.error(`Client error: ${error.message}`);
  
  // Only send response if socket is still writable
  if (socket.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\nConnection: close\r\n\r\nBad Request\n');
  }
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

/**
 * Perform graceful server shutdown
 * 
 * Shutdown process:
 * 1. Set isShuttingDown flag to reject new requests with 503
 * 2. Set a force exit timeout as a safety net
 * 3. Call server.close() to stop accepting new connections
 * 4. Wait for existing connections to complete
 * 5. Exit with appropriate code
 * 
 * @param {number} [exitCode=0] - The exit code to use (0 = clean, 1 = error)
 */
const gracefulShutdown = (exitCode = 0) => {
  // Prevent duplicate shutdown attempts
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log('\nInitiating graceful shutdown...');

  // Set force exit timeout as safety net
  const forceExitTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing exit...');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  // Prevent the timer from keeping the process alive if shutdown completes
  forceExitTimer.unref();

  // Stop accepting new connections and finish existing ones
  server.close((error) => {
    if (error) {
      console.error(`Error during shutdown: ${error.message}`);
      clearTimeout(forceExitTimer);
      process.exit(1);
    }

    console.log('All connections closed. Server shut down gracefully.');
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  });
};

// ============================================================================
// Signal Handlers
// ============================================================================

/**
 * Handle SIGTERM signal (sent by process managers like PM2, Docker, Kubernetes)
 */
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal');
  gracefulShutdown(0);
});

/**
 * Handle SIGINT signal (sent by Ctrl+C in terminal)
 */
process.on('SIGINT', () => {
  console.log('Received SIGINT signal');
  gracefulShutdown(0);
});

// ============================================================================
// Global Error Handlers
// ============================================================================

/**
 * Handle uncaught exceptions
 * 
 * When an exception bubbles up without being caught, the application state
 * is undefined. Best practice is to log the error and shut down gracefully.
 * 
 * @param {Error} error - The uncaught exception
 */
process.on('uncaughtException', (error) => {
  console.error(`Uncaught Exception: ${error.message}`);
  console.error(error.stack);
  gracefulShutdown(1);
});

/**
 * Handle unhandled promise rejections
 * 
 * Unhandled promise rejections indicate a programming error where a promise
 * was rejected but no .catch() handler was attached. Log and shutdown.
 * 
 * @param {*} reason - The rejection reason
 * @param {Promise} promise - The rejected promise
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:');
  console.error('Reason:', reason);
  gracefulShutdown(1);
});

// ============================================================================
// Server Startup
// ============================================================================

/**
 * Start the HTTP server
 * 
 * Binds to the configured hostname and port. On successful startup,
 * logs the server URL. Errors are handled by the server 'error' event.
 */
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log('Press Ctrl+C to stop the server');
});
