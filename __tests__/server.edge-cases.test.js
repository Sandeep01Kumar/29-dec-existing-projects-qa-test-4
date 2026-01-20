/**
 * Edge Case Tests for server.js HTTP Server
 * 
 * This test suite covers edge cases and boundary conditions including:
 * - Various path patterns
 * - Query string variations
 * - Request body edge cases
 * - Sequential requests
 * - Special characters and encoding
 * - Header edge cases
 */

const request = require('supertest');
const server = require('../server');

// Expected response constants
const EXPECTED_BODY = 'Hello, World!\n';
const EXPECTED_STATUS = 200;

describe('Server Edge Cases', () => {
  // NOTE: Do NOT close server - let server.test.js handle cleanup

  describe('Path Variation Edge Cases', () => {
    test('should handle root path', async () => {
      const response = await request(server).get('/');
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should handle deeply nested paths', async () => {
      const response = await request(server).get('/a/b/c/d/e/f/g/h/i/j');
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });

    test('should handle paths with special characters', async () => {
      const specialPaths = [
        '/path-with-dashes',
        '/path_with_underscores',
        '/path.with.dots',
        '/path%20with%20encoded%20spaces'
      ];
      
      for (const path of specialPaths) {
        const response = await request(server).get(path);
        expect(response.status).toBe(EXPECTED_STATUS);
      }
    });

    test('should handle paths with numbers', async () => {
      const response = await request(server).get('/path/123/456');
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });

    test('should handle paths with file extensions', async () => {
      const paths = ['/file.html', '/file.json', '/file.txt', '/style.css'];
      
      for (const path of paths) {
        const response = await request(server).get(path);
        expect(response.status).toBe(EXPECTED_STATUS);
      }
    });

    test('should handle paths with trailing slash', async () => {
      const response = await request(server).get('/path/');
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });

    test('should handle double slashes in path', async () => {
      const response = await request(server).get('//double//slash');
      expect(response.status).toBe(EXPECTED_STATUS);
    });
  });

  describe('Query String Edge Cases', () => {
    test('should handle empty query string', async () => {
      const response = await request(server).get('/?');
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should handle complex query strings', async () => {
      const response = await request(server).get('/?foo=bar&baz=qux&num=123');
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });

    test('should handle query strings with special characters', async () => {
      const response = await request(server).get('/?key=value%20with%20spaces&other=test%26test');
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should handle query strings with arrays', async () => {
      const response = await request(server).get('/?arr[]=1&arr[]=2&arr[]=3');
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should handle query strings without values', async () => {
      const response = await request(server).get('/?key1&key2&key3');
      expect(response.status).toBe(EXPECTED_STATUS);
    });
  });

  describe('Request Body Edge Cases', () => {
    test('should handle empty POST body', async () => {
      const response = await request(server)
        .post('/')
        .send('');
      
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });

    test('should handle JSON body', async () => {
      const response = await request(server)
        .post('/')
        .send({ key: 'value', nested: { data: 123 } })
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(EXPECTED_STATUS);
      expect(response.text).toBe(EXPECTED_BODY);
    });

    test('should handle form data body', async () => {
      const response = await request(server)
        .post('/')
        .type('form')
        .send({ field1: 'value1', field2: 'value2' });
      
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should handle plain text body', async () => {
      const response = await request(server)
        .post('/')
        .type('text')
        .send('This is plain text content');
      
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should handle body with special characters', async () => {
      const response = await request(server)
        .post('/')
        .send({ data: '<script>alert("test")</script>' })
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(EXPECTED_STATUS);
    });
  });

  describe('Sequential Requests', () => {
    test('should handle rapid sequential requests', async () => {
      const numberOfRequests = 10;
      
      for (let i = 0; i < numberOfRequests; i++) {
        const response = await request(server).get('/');
        expect(response.status).toBe(EXPECTED_STATUS);
        expect(response.text).toBe(EXPECTED_BODY);
      }
    });

    test('should maintain consistent response across sequential requests', async () => {
      const responses = [];
      
      for (let i = 0; i < 5; i++) {
        const response = await request(server).get('/');
        responses.push(response.text);
      }
      
      // All responses should be identical
      expect(new Set(responses).size).toBe(1);
      expect(responses[0]).toBe(EXPECTED_BODY);
    });

    test('should handle request after previous request completed', async () => {
      // First request
      const response1 = await request(server).get('/');
      expect(response1.status).toBe(EXPECTED_STATUS);
      
      // Second request immediately after
      const response2 = await request(server).get('/');
      expect(response2.status).toBe(EXPECTED_STATUS);
      
      // Both should have same response
      expect(response1.text).toBe(response2.text);
    });
  });

  describe('HTTP Method Variations', () => {
    test('should handle all standard HTTP methods', async () => {
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
      
      for (const method of methods) {
        const response = await request(server)[method]('/');
        expect(response.status).toBe(EXPECTED_STATUS);
      }
    });

    test('should return same response for GET to different paths', async () => {
      const response1 = await request(server).get('/path1');
      const response2 = await request(server).get('/different/path');
      
      expect(response1.status).toBe(response2.status);
      expect(response1.text).toBe(response2.text);
    });
  });

  describe('Header Edge Cases', () => {
    test('should handle request with multiple custom headers', async () => {
      const response = await request(server)
        .get('/')
        .set('X-Custom-Header-1', 'value1')
        .set('X-Custom-Header-2', 'value2')
        .set('X-Custom-Header-3', 'value3');
      
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should handle request with long header value', async () => {
      const longValue = 'x'.repeat(500);
      
      const response = await request(server)
        .get('/')
        .set('X-Long-Header', longValue);
      
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should handle request with case-insensitive headers', async () => {
      const response = await request(server)
        .get('/')
        .set('content-type', 'text/plain')
        .set('ACCEPT', 'text/plain');
      
      expect(response.status).toBe(EXPECTED_STATUS);
    });
  });

  describe('Response Consistency', () => {
    test('should always return same content-length', async () => {
      const response1 = await request(server).get('/');
      const response2 = await request(server).get('/different-path');
      
      expect(response1.headers['content-length']).toBe(response2.headers['content-length']);
    });

    test('should return valid HTTP response structure', async () => {
      const response = await request(server).get('/');
      
      // Verify response has valid HTTP structure
      expect(response.status).toBeGreaterThanOrEqual(100);
      expect(response.status).toBeLessThan(600);
      expect(response.headers).toBeDefined();
      expect(typeof response.text).toBe('string');
    });
  });

  describe('Unicode and Encoding Edge Cases', () => {
    test('should handle path with unicode characters', async () => {
      const response = await request(server).get(encodeURI('/path/汉字'));
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should handle query with unicode characters', async () => {
      const response = await request(server).get(encodeURI('/?name=测试'));
      expect(response.status).toBe(EXPECTED_STATUS);
    });

    test('should handle body with unicode characters', async () => {
      const response = await request(server)
        .post('/')
        .send({ message: '你好世界!' })
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(EXPECTED_STATUS);
    });
  });
});
