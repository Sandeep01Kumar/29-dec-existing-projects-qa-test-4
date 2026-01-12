/**
 * Robust HTTP Server Implementation
 * 
 * This server includes comprehensive error handling, graceful shutdown,
 * input validation, timeout configuration, and resource cleanup mechanisms.
 */

const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

// Flag to prevent duplicate shutdown attempts and reject new requests during shutdown
let isShuttingDown = false;

/**
 * HTTP Server with enhanced request handling
 * - Validates HTTP methods against whitelist
 * - Handles request and response stream errors
 * - Rejects requests during graceful shutdown
 */
const server = http.createServer((req, res) => {
  // Handle request stream errors (e.g., aborted connections, network issues)
  req.on('error', (err) => {
    console.error('Request error:', err.message);
    if (!res.headersSent) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Bad Request\n');
    }
  });

  // Handle response stream errors (e.g., client disconnects mid-response)
  res.on('error', (err) => {
    console.error('Response error:', err.message);
  });

  // Reject new requests during graceful shutdown
  if (isShuttingDown) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Connection', 'close');
    res.end('Service Unavailable - Server is shutting down\n');
    return;
  }

  // HTTP method validation - reject non-standard/dangerous methods
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  if (!allowedMethods.includes(req.method)) {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Allow', allowedMethods.join(', '));
    res.end('Method Not Allowed\n');
    return;
  }

  // Core response logic - preserved from original implementation
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5');
  res.end('Hello, World!\n');
});

/**
 * Timeout Configuration
 * Prevents resource exhaustion from idle connections and slow clients
 */

// Socket inactivity timeout (30 seconds) - closes inactive sockets
server.timeout = 30000;

// Request completion timeout (30 seconds) - time allowed for entire request
server.requestTimeout = 30000;

// Headers receive timeout (10 seconds) - time allowed to receive headers
server.headersTimeout = 10000;

// Keep-alive connection timeout (5 seconds) - idle time before closing keep-alive connection
server.keepAliveTimeout = 5000;

/**
 * Server Error Handler
 * Handles server-level errors such as port conflicts and permission issues
 */
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: Port ${port} is already in use`);
    process.exit(1);
  } else if (err.code === 'EACCES') {
    console.error(`Error: Permission denied for port ${port}`);
    process.exit(1);
  } else {
    console.error('Server error:', err.message);
    process.exit(1);
  }
});

/**
 * Client Error Handler
 * Handles malformed requests, aborted connections, and TLS errors
 */
server.on('clientError', (err, socket) => {
  console.error('Client error:', err.message);
  
  // Only respond if socket is still writable
  if (socket.writable) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
});

/**
 * Graceful Shutdown Function
 * Stops accepting new connections, drains existing connections, then exits
 * 
 * @param {string} signal - The signal that triggered the shutdown (SIGTERM or SIGINT)
 */
function gracefulShutdown(signal) {
  // Prevent duplicate shutdown attempts
  if (isShuttingDown) {
    console.log('Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      console.error('Error during server close:', err.message);
      process.exit(1);
    }
    console.log('Server closed successfully. All connections drained.');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds if connections don't drain
  // Using .unref() to prevent this timer from keeping the process alive
  const forceShutdownTimeout = setTimeout(() => {
    console.error('Force shutdown: Could not drain connections within 10 seconds');
    process.exit(1);
  }, 10000);
  forceShutdownTimeout.unref();
}

/**
 * Signal Handlers
 * Catch SIGTERM and SIGINT signals for graceful shutdown
 */
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Global Exception Handlers
 * Catch uncaught exceptions and unhandled promise rejections
 * Log the error and exit gracefully
 */
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  // Give time for logs to be written before exiting
  setTimeout(() => {
    process.exit(1);
  }, 100);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Give time for logs to be written before exiting
  setTimeout(() => {
    process.exit(1);
  }, 100);
});

/**
 * Server Startup
 * Start listening and log server information including PID
 */
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log(`Process ID: ${process.pid}`);
  console.log('Server is ready to accept connections');
});
