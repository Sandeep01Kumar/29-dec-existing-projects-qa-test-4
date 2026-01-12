/**
 * Morgan HTTP Request Logging Middleware
 * 
 * Configures Morgan to log all HTTP requests through the Winston logger,
 * ensuring unified logging across the application. Morgan intercepts incoming
 * requests and logs method, URL, status code, response time, and content length.
 * 
 * Log Formats:
 * - Production: 'combined' - Apache-style detailed logs for comprehensive auditing
 *   Format: :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" 
 *           :status :res[content-length] ":referrer" ":user-agent"
 * 
 * - Development: 'dev' - Colorized, concise output for development visibility
 *   Format: :method :url :status :response-time ms - :res[content-length]
 * 
 * Integration with Winston:
 * Morgan output is piped through the Winston logger's stream property,
 * which writes logs at the 'http' level. This ensures all HTTP request
 * logs flow through the centralized logging system.
 * 
 * @module middleware/morgan
 */

'use strict';

const morgan = require('morgan');
const logger = require('../config/logger');

/**
 * Determine the appropriate Morgan format based on environment
 * 
 * - Production environments use 'combined' format for detailed Apache-style logs
 *   suitable for log aggregation and security auditing
 * - Development environments use 'dev' format for colorized, concise output
 *   that's easier to read during development
 * 
 * @type {string}
 */
const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

/**
 * Stream configuration for Winston integration
 * 
 * The stream object wraps Winston's write method to pipe Morgan's
 * log output through the centralized logging system at the 'http' level.
 * This ensures consistent log formatting and destination across all
 * application logs.
 * 
 * @type {Object}
 */
const stream = logger.stream;

/**
 * Skip function to optionally filter which requests to log
 * 
 * Currently logs all requests. Can be customized to skip:
 * - Health check endpoints in production
 * - Successful responses when debugging failures
 * - Static asset requests to reduce log noise
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} True to skip logging, false to log
 */
const skip = (req, res) => {
  // Optionally skip health check logging in production to reduce noise
  // Uncomment the following to enable:
  // if (process.env.NODE_ENV === 'production' && req.url === '/health') {
  //   return true;
  // }
  return false;
};

/**
 * Configure and create the Morgan middleware instance
 * 
 * Configuration options:
 * - format: Environment-specific log format ('combined' or 'dev')
 * - stream: Winston stream for unified logging
 * - skip: Optional function to filter which requests to log
 * 
 * Usage in Express app:
 * ```javascript
 * const morganMiddleware = require('./middleware/morgan');
 * app.use(morganMiddleware);
 * ```
 * 
 * @type {Function}
 */
const morganMiddleware = morgan(format, {
  stream: stream,
  skip: skip
});

/**
 * Export the configured Morgan middleware
 * 
 * This middleware should be applied early in the Express middleware chain
 * (after security middleware, before route handlers) to log all incoming
 * HTTP requests.
 * 
 * Middleware ordering recommendation:
 * 1. helmet (security headers)
 * 2. cors (cross-origin)
 * 3. body-parser (JSON, URL-encoded)
 * 4. morgan (HTTP logging) <-- This middleware
 * 5. routes
 * 6. error handler
 */
module.exports = morganMiddleware;
