/**
 * Global Error Handler Middleware
 * 
 * Centralized error handling middleware for Express.js applications.
 * Catches all errors passed through next(err) in the middleware chain
 * and provides environment-aware error responses.
 * 
 * Behavior:
 * - Development: Returns full error details including stack trace for debugging
 * - Production: Returns sanitized error messages to protect sensitive information
 * 
 * All errors are logged through Winston logger for monitoring and debugging.
 * 
 * IMPORTANT: This middleware MUST be attached LAST in the middleware chain
 * to properly catch errors from all routes and preceding middleware.
 * 
 * @module middleware/errorHandler
 */

'use strict';

const logger = require('../config/logger');

/**
 * Global error handling middleware function
 * 
 * Express error-handling middleware requires exactly 4 parameters:
 * (err, req, res, next) to be recognized as an error handler.
 * 
 * @param {Error} err - Error object passed via next(err)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * // Attach error handler as last middleware
 * const errorHandler = require('./middleware/errorHandler');
 * app.use(errorHandler);
 * 
 * @example
 * // Trigger error in route handler
 * app.get('/error', (req, res, next) => {
 *   const error = new Error('Something went wrong');
 *   error.status = 500;
 *   next(error);
 * });
 */
const errorHandler = (err, req, res, next) => {
  // Extract status code from error object or default to 500
  const statusCode = err.status || err.statusCode || 500;

  // Determine if we're running in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log the error with relevant request information
  // Include status code, message, URL, method, and client IP
  logger.error(
    `${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
    {
      error: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      statusCode: statusCode
    }
  );

  // If headers have already been sent, delegate to Express default handler
  // This prevents "Cannot set headers after they are sent" errors
  if (res.headersSent) {
    return next(err);
  }

  // Build the error response based on environment
  if (isDevelopment) {
    // Development: Include full error details for debugging
    return res.status(statusCode).json({
      status: 'error',
      statusCode: statusCode,
      message: err.message,
      stack: err.stack,
      error: {
        name: err.name,
        message: err.message,
        ...(err.code && { code: err.code }),
        ...(err.details && { details: err.details })
      }
    });
  }

  // Production: Sanitized response without sensitive information
  // Generic message for 500 errors to avoid exposing internal details
  return res.status(statusCode).json({
    status: 'error',
    statusCode: statusCode,
    message: statusCode === 500 ? 'Internal Server Error' : err.message
  });
};

/**
 * Not Found (404) handler middleware
 * 
 * Creates a 404 error for unmatched routes and forwards to error handler.
 * This middleware should be placed after all route definitions but before
 * the main error handler.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 * 
 * @example
 * // Place after routes, before error handler
 * app.use('/', routes);
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Export the error handling middleware
 * 
 * Primary export: errorHandler - Global error handler (4-param middleware)
 * Named export: notFoundHandler - 404 handler for unmatched routes
 * 
 * Usage:
 * ```javascript
 * const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
 * // Or for default export only:
 * const errorHandler = require('./middleware/errorHandler');
 * ```
 */
module.exports = errorHandler;
module.exports.notFoundHandler = notFoundHandler;
