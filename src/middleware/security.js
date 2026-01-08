/**
 * Security Middleware Configuration
 * 
 * Provides HTTP security headers via Helmet and DOS/brute-force protection
 * via express-rate-limit for enterprise-grade application security.
 * 
 * Helmet sets secure HTTP headers including:
 * - X-Content-Type-Options: nosniff (prevents MIME type sniffing)
 * - X-Frame-Options: SAMEORIGIN (clickjacking protection)
 * - X-XSS-Protection (cross-site scripting protection)
 * - Strict-Transport-Security (HSTS for HTTPS enforcement)
 * - X-DNS-Prefetch-Control (controls DNS prefetching)
 * - X-Download-Options (prevents IE from executing downloads)
 * - X-Permitted-Cross-Domain-Policies (Adobe products cross-domain policy)
 * - Referrer-Policy (controls referrer information)
 * 
 * Rate limiter restricts requests per IP to prevent abuse with:
 * - Configurable time window (default: 15 minutes)
 * - Maximum requests limit (default: 100 requests per window)
 * - Standard RateLimit-* headers for client awareness
 * - Custom 429 response message when limit exceeded
 * 
 * @module middleware/security
 */

'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Helmet security middleware instance
 * 
 * Applies various HTTP security headers to protect against common
 * web vulnerabilities like XSS attacks, clickjacking, MIME type sniffing,
 * and other client-side attacks.
 * 
 * Default Helmet configuration includes:
 * - contentSecurityPolicy: Basic CSP headers
 * - crossOriginEmbedderPolicy: Prevents cross-origin embedding
 * - crossOriginOpenerPolicy: Isolates browsing context
 * - crossOriginResourcePolicy: Controls resource loading
 * - dnsPrefetchControl: Disables DNS prefetching by default
 * - frameguard: Sets X-Frame-Options to SAMEORIGIN
 * - hidePoweredBy: Removes X-Powered-By header
 * - hsts: Sets Strict-Transport-Security for HTTPS
 * - ieNoOpen: Sets X-Download-Options for IE8+
 * - noSniff: Sets X-Content-Type-Options to nosniff
 * - originAgentCluster: Sets Origin-Agent-Cluster header
 * - permittedCrossDomainPolicies: Restricts Adobe cross-domain policies
 * - referrerPolicy: Sets safe Referrer-Policy
 * - xssFilter: Legacy X-XSS-Protection header (disabled in modern browsers)
 * 
 * @type {Function}
 * @returns {void}
 * 
 * @example
 * // Apply security middleware to Express app
 * const { securityMiddleware } = require('./middleware/security');
 * app.use(securityMiddleware);
 */
const securityMiddleware = helmet();

/**
 * Rate limiting middleware instance
 * 
 * Protects against DOS (Denial of Service) and brute-force attacks by
 * limiting the number of requests from a single IP address within a
 * specified time window.
 * 
 * Configuration:
 * - windowMs: 15 minutes (900,000 milliseconds)
 * - max: 100 requests per windowMs per IP
 * - standardHeaders: true (sends RateLimit-* headers)
 * - legacyHeaders: false (disables X-RateLimit-* headers)
 * - message: Custom JSON response when limit exceeded
 * 
 * Response headers when rate limit is active:
 * - RateLimit-Limit: Maximum requests allowed
 * - RateLimit-Remaining: Requests remaining in current window
 * - RateLimit-Reset: Unix timestamp when window resets
 * 
 * When limit is exceeded:
 * - Status Code: 429 Too Many Requests
 * - Body: JSON with status and message
 * 
 * Note: For production deployments behind a reverse proxy (nginx, load balancer),
 * set `app.set('trust proxy', 1)` in your Express app configuration to ensure
 * correct client IP detection via X-Forwarded-For header.
 * 
 * @type {Function}
 * @returns {void}
 * 
 * @example
 * // Apply rate limiting to all routes
 * const { rateLimitMiddleware } = require('./middleware/security');
 * app.use(rateLimitMiddleware);
 * 
 * @example
 * // For production behind reverse proxy, add to app.js:
 * app.set('trust proxy', 1);
 */
const rateLimitMiddleware = rateLimit({
  // Time window for rate limiting: 15 minutes in milliseconds
  windowMs: 15 * 60 * 1000,

  // Maximum number of requests allowed per IP within the time window
  // Adjust based on expected legitimate traffic patterns
  max: 100,

  // Enable standard RateLimit-* headers for client awareness
  // Allows clients to implement proper retry logic
  standardHeaders: true,

  // Disable deprecated X-RateLimit-* headers
  // standardHeaders is the modern replacement
  legacyHeaders: false,

  // Custom response when rate limit is exceeded
  // Returns JSON with status code and descriptive message
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  },

  // Skip rate limiting for successful requests (optional enhancement)
  // Uncomment to only count failed requests toward the limit
  // skipSuccessfulRequests: false,

  // Key generator function (default uses req.ip)
  // For apps behind proxies, ensure trust proxy is set correctly
  // keyGenerator: (req) => req.ip,

  // Handler function for when rate limit is exceeded (uses default)
  // Custom handlers can add logging or different response formats
  // handler: (req, res, next, options) => { ... }
});

/**
 * Export security middleware functions for use in Express middleware chain
 * 
 * Usage in src/app.js:
 * ```javascript
 * const { securityMiddleware, rateLimitMiddleware } = require('./middleware/security');
 * 
 * // Apply security middleware before route handlers
 * app.use(securityMiddleware);
 * app.use(rateLimitMiddleware);
 * ```
 * 
 * Middleware ordering recommendation:
 * 1. securityMiddleware (helmet) - Sets security headers
 * 2. rateLimitMiddleware - Limits request rate
 * 3. Other middleware (cors, body-parser, logging)
 * 4. Route handlers
 * 5. Error handler (must be last)
 */
module.exports = {
  securityMiddleware,
  rateLimitMiddleware
};
