/**
 * Unit Tests for server.js HTTP Server
 * 
 * This test suite covers the core HTTP server functionality including:
 * - HTTP response content verification
 * - Status code assertions
 * - HTTP header validation
 * - Request handling for various HTTP methods
 * 
 * Note: This is the main test file that handles server cleanup in afterAll.
 */

const request = require('supertest');
const http = require('http');

// Expected response constants
const EXPECTED_BODY = 'Hello, World!\n';
const EXPECTED_STATUS = 200;
const EXPECTED_CONTENT_TYPE = 'text/plain';

describe('HTTP Server - Response Tests', () => {
  let server;

  beforeAll((done) => {
    // Clear require cache to get a fresh server instance
    delete require.cache[require.resolve('../server')];
    server = require('../server');
    
    // Wait for server to be ready
    if (server.listening) {
      done();
    } else {
      server.once('listening', done);
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          // Port in use - server may already be running from another test
          // Try to close and re-create
          server.close(() => {
            server.listen(3000, '127.0.0.1', done);
          });
        } else {
          done(err);
        }
      });
    }
  });

  afterAll((done) => {
    // Close server after all tests to clean up
    if (server && server.listening) {
      server.close(done);
    } else {
      done();
    }
  });

  describe('GET Request Handling', () => {
    test('should return 200 status code for GET request to root path', async () => {
      const response = await request(server).get('/');
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should return "Hello, World!\\n" response body', async () => {
      const response = await request(server).get('/');
      expect(response.text).toBe(EXPECTED_BODY);
    });

    test('should set Content-Type header to text/plain', async () => {
      const response = await request(server).get('/');
      expect(response.headers['content-type']).toMatch(/text\/plain/);
    });

    test('should set correct Content-Length header', async () => {
      const response = await request(server).get('/');
      const expectedLength = Buffer.byteLength(EXPECTED_BODY, 'utf8').toString();
      expect(response.headers['content-length']).toBe(expectedLength);
    });

    test('should respond to GET requests to any path with same response', async () => {
      const paths = ['/', '/test', '/api/endpoint', '/some/deep/path'];
      
      for (const path of paths) {
        const response = await request(server).get(path);
        expect(response.status).toBe(EXPECTED_STATUS);
        expect(response.text).toBe(EXPECTED_BODY);
      }
    });

    test('should handle GET requests with query parameters', async () => {
      const response = await request(server).get('/?name=test&value=123');
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });
  });

  describe('POST Request Handling', () => {
    test('should return 200 status code for POST request', async () => {
      const response = await request(server).post('/');
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should return same response body for POST request', async () => {
      const response = await request(server).post('/');
      expect(response.text).toBe(EXPECTED_BODY);
    });

    test('should handle POST requests with body payload', async () => {
      const response = await request(server)
        .post('/')
        .send({ key: 'value' })
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });
  });

  describe('PUT Request Handling', () => {
    test('should return 200 status code for PUT request', async () => {
      const response = await request(server).put('/');
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should return same response body for PUT request', async () => {
      const response = await request(server).put('/');
      expect(response.text).toBe(EXPECTED_BODY);
    });
  });

  describe('DELETE Request Handling', () => {
    test('should return 200 status code for DELETE request', async () => {
      const response = await request(server).delete('/');
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should return same response body for DELETE request', async () => {
      const response = await request(server).delete('/');
      expect(response.text).toBe(EXPECTED_BODY);
    });
  });

  describe('PATCH Request Handling', () => {
    test('should return 200 status code for PATCH request', async () => {
      const response = await request(server).patch('/');
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should return same response body for PATCH request', async () => {
      const response = await request(server).patch('/');
      expect(response.text).toBe(EXPECTED_BODY);
    });
  });

  describe('HEAD Request Handling', () => {
    test('should return 200 status code for HEAD request', async () => {
      const response = await request(server).head('/');
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should return headers without body for HEAD request', async () => {
      const response = await request(server).head('/');
      expect(response.headers['content-type']).toMatch(/text\/plain/);
      // HEAD requests should not have body
      expect(response.text).toBeFalsy();
    });
  });

  describe('OPTIONS Request Handling', () => {
    test('should return 200 status code for OPTIONS request', async () => {
      const response = await request(server).options('/');
      expect(response.status).toBe(EXPECTED_STATUS);
    });
  });

  describe('Response Header Verification', () => {
    test('should have proper content-type header', async () => {
      const response = await request(server).get('/');
      // The server sets text/plain
      expect(response.headers['content-type']).toContain('text/plain');
    });

    test('should return date header', async () => {
      const response = await request(server).get('/');
      expect(response.headers['date']).toBeDefined();
    });

    test('should return connection header', async () => {
      const response = await request(server).get('/');
      expect(response.headers['connection']).toBeDefined();
    });
  });

  describe('Request with Custom Headers', () => {
    test('should handle requests with Accept header', async () => {
      const response = await request(server)
        .get('/')
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });

    test('should handle requests with custom headers', async () => {
      const response = await request(server)
        .get('/')
        .set('X-Custom-Header', 'custom-value')
        .set('Authorization', 'Bearer token123');
      
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });

    test('should handle requests with User-Agent header', async () => {
      const response = await request(server)
        .get('/')
        .set('User-Agent', 'TestAgent/1.0');
      
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });
  });
});

describe('HTTP Server - Instance Verification', () => {
  let server;

  beforeAll(() => {
    server = require('../server');
  });

  test('should export an http.Server instance', () => {
    expect(server).toBeInstanceOf(http.Server);
  });

  test('should have proper server methods', () => {
    expect(typeof server.listen).toBe('function');
    expect(typeof server.close).toBe('function');
    expect(typeof server.address).toBe('function');
  });
});
