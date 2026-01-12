/**
 * Express.js Server Implementation
 * 
 * A simple Express.js web server with two endpoints:
 * - GET / : Returns "Hello World"
 * - GET /evening : Returns "Good evening"
 * 
 * @requires express - Express.js web application framework
 */

const express = require('express');

// Server configuration - preserved from original implementation
const hostname = '127.0.0.1';
const port = 3000;

// Create Express application instance
const app = express();

/**
 * Root endpoint handler
 * GET / - Returns a greeting message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get('/', (req, res) => {
  res.send('Hello World');
});

/**
 * Evening endpoint handler
 * GET /evening - Returns an evening greeting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get('/evening', (req, res) => {
  res.send('Good evening');
});

// Start the Express server on the configured hostname and port
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
