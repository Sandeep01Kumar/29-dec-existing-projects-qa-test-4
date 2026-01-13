/**
 * Comprehensive HTTP Server Test Suite
 * 
 * Tests for the production-ready HTTP server implementation.
 * Uses Node.js built-in test runner (node:test) with 12 test cases.
 * 
 * @module test/server.test
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const http = require('node:http');

// ============================================================================
// Configuration
// ============================================================================

const hostname = '127.0.0.1';
const port = 3000;
const serverStartupTimeout = 5000;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Make an HTTP request to the test server
 * 
 * @param {Object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, etc.)
 * @param {string} options.path - Request path
 * @returns {Promise<{statusCode: number, headers: Object, body: string}>}
 */
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname,
      port,
      path: options.path || '/',
      method: options.method || 'GET',
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body.trim()
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Wait for server to be ready by polling
 * 
 * @param {number} maxAttempts - Maximum number of attempts
 * @param {number} interval - Interval between attempts in ms
 * @returns {Promise<void>}
 */
async function waitForServerReady(maxAttempts = 50, interval = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeRequest({ method: 'GET', path: '/' });
      return; // Server is ready
    } catch (error) {
      if (i === maxAttempts - 1) {
        throw new Error('Server did not start within timeout period');
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}

// ============================================================================
// Test Variables
// ============================================================================

let serverProcess = null;

// ============================================================================
// Test Suites
// ============================================================================

describe('Server Test Suite', () => {
  // Setup: Start server before all tests
  before(async () => {
    serverProcess = spawn('node', ['server.js'], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Wait for server to be ready
    await waitForServerReady();
  });

  // Teardown: Stop server after all tests
  after(async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      // Give the server time to shut down gracefully
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  });

  describe('HTTP Server Tests', () => {
    // Test 1: GET / returns 200 OK with Hello World
    it('GET / returns 200 OK with Hello World', async () => {
      const response = await makeRequest({ method: 'GET', path: '/' });
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.body, 'Hello, World!');
    });

    // Test 2: GET /health returns 200 with health status
    it('GET /health returns 200 with health status', async () => {
      const response = await makeRequest({ method: 'GET', path: '/health' });
      assert.strictEqual(response.statusCode, 200);
      const healthData = JSON.parse(response.body);
      assert.strictEqual(healthData.status, 'healthy');
      assert.ok(healthData.timestamp, 'Health response should include timestamp');
    });

    // Test 3: GET /nonexistent returns 404 Not Found
    it('GET /nonexistent returns 404 Not Found', async () => {
      const response = await makeRequest({ method: 'GET', path: '/nonexistent' });
      assert.strictEqual(response.statusCode, 404);
      assert.strictEqual(response.body, 'Not Found');
    });

    // Test 4: POST / returns 405 Method Not Allowed
    it('POST / returns 405 Method Not Allowed', async () => {
      const response = await makeRequest({ method: 'POST', path: '/' });
      assert.strictEqual(response.statusCode, 405);
      assert.strictEqual(response.body, 'Method Not Allowed');
    });

    // Test 5: PUT / returns 405 Method Not Allowed
    it('PUT / returns 405 Method Not Allowed', async () => {
      const response = await makeRequest({ method: 'PUT', path: '/' });
      assert.strictEqual(response.statusCode, 405);
      assert.strictEqual(response.body, 'Method Not Allowed');
    });

    // Test 6: DELETE / returns 405 Method Not Allowed
    it('DELETE / returns 405 Method Not Allowed', async () => {
      const response = await makeRequest({ method: 'DELETE', path: '/' });
      assert.strictEqual(response.statusCode, 405);
      assert.strictEqual(response.body, 'Method Not Allowed');
    });

    // Test 7: OPTIONS / returns 204 No Content
    it('OPTIONS / returns 204 No Content', async () => {
      const response = await makeRequest({ method: 'OPTIONS', path: '/' });
      assert.strictEqual(response.statusCode, 204);
      assert.ok(response.headers['allow'], 'OPTIONS should include Allow header');
      assert.ok(response.headers['allow'].includes('GET'), 'Allow header should include GET');
    });

    // Test 8: HEAD / returns 200 OK without body
    it('HEAD / returns 200 OK without body', async () => {
      const response = await makeRequest({ method: 'HEAD', path: '/' });
      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.body, '');
    });

    // Test 9: Response includes proper content-type header
    it('Response includes proper content-type header', async () => {
      const response = await makeRequest({ method: 'GET', path: '/' });
      assert.strictEqual(response.statusCode, 200);
      assert.ok(response.headers['content-type'].includes('text/plain'), 
        'Content-Type should be text/plain');
    });

    // Test 10: Health endpoint includes timestamp
    it('Health endpoint includes timestamp', async () => {
      const response = await makeRequest({ method: 'GET', path: '/health' });
      const healthData = JSON.parse(response.body);
      assert.ok(healthData.timestamp, 'Health response should include timestamp');
      // Verify timestamp is a valid ISO date
      const timestamp = new Date(healthData.timestamp);
      assert.ok(!isNaN(timestamp.getTime()), 'Timestamp should be a valid date');
    });
  });

  describe('Input Validation Tests', () => {
    // Test 11: Various invalid paths return 404
    it('Various invalid paths return 404', async () => {
      const invalidPaths = ['/test', '/api', '/admin', '/../etc/passwd'];
      
      for (const path of invalidPaths) {
        const response = await makeRequest({ method: 'GET', path });
        assert.strictEqual(response.statusCode, 404, 
          `Path ${path} should return 404`);
      }
    });

    // Test 12: PATCH method returns 405
    it('PATCH method returns 405 Method Not Allowed', async () => {
      const response = await makeRequest({ method: 'PATCH', path: '/' });
      assert.strictEqual(response.statusCode, 405);
      assert.strictEqual(response.body, 'Method Not Allowed');
    });
  });
});
