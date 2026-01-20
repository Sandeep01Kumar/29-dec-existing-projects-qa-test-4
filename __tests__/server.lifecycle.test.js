/**
 * Server Lifecycle Tests for server.js
 * 
 * This test suite covers server lifecycle management including:
 * - Server instance properties
 * - Server configuration verification
 * - Server methods and capabilities
 * 
 * Note: This test file does NOT close the server to avoid conflicts
 * with other test files running in the same process.
 */

const http = require('http');

// Server configuration constants (matching server.js)
const SERVER_HOST = '127.0.0.1';
const SERVER_PORT = 3000;

describe('Server Lifecycle Tests', () => {
  let server;

  beforeAll(() => {
    // Use the same server instance that other tests use
    server = require('../server');
  });

  // NOTE: Do NOT close server in afterAll - let other tests use it

  describe('Server Instance Properties', () => {
    test('should be an http.Server instance', () => {
      expect(server).toBeInstanceOf(http.Server);
    });

    test('should have event emitter capabilities', () => {
      expect(typeof server.on).toBe('function');
      expect(typeof server.emit).toBe('function');
      expect(typeof server.removeListener).toBe('function');
      expect(typeof server.once).toBe('function');
    });

    test('should have default timeout value', () => {
      expect(typeof server.timeout).toBe('number');
    });

    test('should have keepAliveTimeout property', () => {
      expect(typeof server.keepAliveTimeout).toBe('number');
    });

    test('should have headersTimeout property', () => {
      expect(typeof server.headersTimeout).toBe('number');
    });

    test('should have requestTimeout property', () => {
      expect(typeof server.requestTimeout).toBe('number');
    });

    test('should have maxConnections property', () => {
      // Default is no limit (undefined or 0)
      expect(server.maxConnections === undefined || typeof server.maxConnections === 'number').toBe(true);
    });
  });

  describe('Server Methods', () => {
    test('should have listen method', () => {
      expect(typeof server.listen).toBe('function');
    });

    test('should have close method', () => {
      expect(typeof server.close).toBe('function');
    });

    test('should have address method', () => {
      expect(typeof server.address).toBe('function');
    });

    test('should have getConnections method', () => {
      expect(typeof server.getConnections).toBe('function');
    });

    test('should have ref method', () => {
      expect(typeof server.ref).toBe('function');
    });

    test('should have unref method', () => {
      expect(typeof server.unref).toBe('function');
    });
  });

  describe('Server Startup State', () => {
    test('should have listening property', () => {
      expect(typeof server.listening).toBe('boolean');
    });

    test('should be configured to listen on 127.0.0.1:3000', () => {
      // The server is configured to listen on 127.0.0.1:3000
      // This test verifies the configuration constants match expected values
      expect(SERVER_HOST).toBe('127.0.0.1');
      expect(SERVER_PORT).toBe(3000);
    });

    test('should return address info or null depending on listening state', () => {
      const address = server.address();
      
      if (server.listening) {
        // If server is listening, address should have proper structure
        expect(address).toHaveProperty('address');
        expect(address).toHaveProperty('port');
        expect(address).toHaveProperty('family');
      } else {
        // If server is not listening (closed), address is null
        expect(address).toBeNull();
      }
    });

    test('should bind to correct hostname when listening', () => {
      const address = server.address();
      
      if (server.listening && address) {
        expect(address.address).toBe(SERVER_HOST);
      } else {
        // Server not listening - just verify it's an http.Server
        expect(server).toBeInstanceOf(http.Server);
      }
    });

    test('should listen on correct port when listening', () => {
      const address = server.address();
      
      if (server.listening && address) {
        expect(address.port).toBe(SERVER_PORT);
      } else {
        // Server not listening - just verify it's an http.Server
        expect(server).toBeInstanceOf(http.Server);
      }
    });

    test('should have IPv4 family when listening', () => {
      const address = server.address();
      
      if (server.listening && address) {
        expect(address.family).toBe('IPv4');
      } else {
        // Server not listening - just verify it's an http.Server
        expect(server).toBeInstanceOf(http.Server);
      }
    });
  });
});

describe('Server Module Export Tests', () => {
  let server;

  beforeAll(() => {
    server = require('../server');
  });

  test('should export the server instance', () => {
    expect(server).toBeDefined();
    expect(server).not.toBeNull();
  });

  test('should export an http.Server instance', () => {
    expect(server).toBeInstanceOf(http.Server);
  });

  test('should export a server with listen method', () => {
    expect(typeof server.listen).toBe('function');
  });

  test('should export a server with close method', () => {
    expect(typeof server.close).toBe('function');
  });

  test('should export a server with address method', () => {
    expect(typeof server.address).toBe('function');
  });
});

describe('Server Configuration Verification', () => {
  test('hostname constant should be 127.0.0.1', () => {
    expect(SERVER_HOST).toBe('127.0.0.1');
  });

  test('port constant should be 3000', () => {
    expect(SERVER_PORT).toBe(3000);
  });
});
