/**
 * Server.js Bug Fix Verification Test Suite
 * 
 * Comprehensive test suite for verifying the robust HTTP server implementation.
 * Tests cover: basic HTTP functionality, HTTP method validation, header verification,
 * graceful shutdown, error handlers, and timeout configurations.
 * 
 * Usage: node server.test.js (requires server to be running on port 3000)
 */

const http = require('http');
const fs = require('fs');

// Test configuration
const hostname = '127.0.0.1';
const port = 3000;

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Helper function to make HTTP requests
 * @param {Object} options - HTTP request options
 * @param {Function} callback - Callback function(error, response, body)
 */
function makeRequest(options, callback) {
  const defaultOptions = {
    hostname: hostname,
    port: port,
    timeout: 5000
  };
  
  const reqOptions = { ...defaultOptions, ...options };
  
  const req = http.request(reqOptions, (res) => {
    let body = '';
    
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      callback(null, res, body);
    });
  });
  
  req.on('error', (err) => {
    callback(err, null, null);
  });
  
  req.on('timeout', () => {
    req.destroy();
    callback(new Error('Request timeout'), null, null);
  });
  
  req.end();
}

/**
 * Test assertion helper
 * @param {string} testName - Name of the test
 * @param {boolean} condition - Condition to test
 * @param {string} failMessage - Message to display on failure
 */
function assertTest(testName, condition, failMessage) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ ${testName}`);
  } else {
    failedTests++;
    console.log(`✗ ${testName}`);
    console.log(`  Failure: ${failMessage}`);
  }
}

/**
 * Run all HTTP request tests sequentially
 * @param {Function} callback - Callback when all tests complete
 */
function runHttpTests(callback) {
  // Test Case 1: Basic GET request returns 200 with "Hello, World!"
  makeRequest({ method: 'GET', path: '/' }, (err, res, body) => {
    if (err) {
      assertTest('Basic GET request returns 200 with "Hello, World!"', false, err.message);
    } else {
      const statusOk = res.statusCode === 200;
      const bodyOk = body === 'Hello, World!\n';
      assertTest(
        'Basic GET request returns 200 with "Hello, World!"',
        statusOk && bodyOk,
        `Status: ${res.statusCode}, Body: "${body.trim()}"`
      );
    }
    
    // Test Case 2: POST request is allowed (200)
    makeRequest({ method: 'POST', path: '/' }, (err, res, body) => {
      if (err) {
        assertTest('POST request is allowed (200)', false, err.message);
      } else {
        assertTest(
          'POST request is allowed (200)',
          res.statusCode === 200,
          `Expected 200, got ${res.statusCode}`
        );
      }
      
      // Test Case 3: PUT request is allowed (200)
      makeRequest({ method: 'PUT', path: '/' }, (err, res, body) => {
        if (err) {
          assertTest('PUT request is allowed (200)', false, err.message);
        } else {
          assertTest(
            'PUT request is allowed (200)',
            res.statusCode === 200,
            `Expected 200, got ${res.statusCode}`
          );
        }
        
        // Test Case 4: DELETE request is allowed (200)
        makeRequest({ method: 'DELETE', path: '/' }, (err, res, body) => {
          if (err) {
            assertTest('DELETE request is allowed (200)', false, err.message);
          } else {
            assertTest(
              'DELETE request is allowed (200)',
              res.statusCode === 200,
              `Expected 200, got ${res.statusCode}`
            );
          }
          
          // Test Case 5: HEAD request is allowed (200)
          makeRequest({ method: 'HEAD', path: '/' }, (err, res, body) => {
            if (err) {
              assertTest('HEAD request is allowed (200)', false, err.message);
            } else {
              assertTest(
                'HEAD request is allowed (200)',
                res.statusCode === 200,
                `Expected 200, got ${res.statusCode}`
              );
            }
            
            // Test Case 6: OPTIONS request is allowed (200)
            makeRequest({ method: 'OPTIONS', path: '/' }, (err, res, body) => {
              if (err) {
                assertTest('OPTIONS request is allowed (200)', false, err.message);
              } else {
                assertTest(
                  'OPTIONS request is allowed (200)',
                  res.statusCode === 200,
                  `Expected 200, got ${res.statusCode}`
                );
              }
              
              // Test Case 7: TRACE method returns 405 Method Not Allowed
              makeRequest({ method: 'TRACE', path: '/' }, (err, res, body) => {
                if (err) {
                  assertTest('TRACE method returns 405 Method Not Allowed', false, err.message);
                } else {
                  const statusOk = res.statusCode === 405;
                  const bodyOk = body.includes('Method Not Allowed');
                  assertTest(
                    'TRACE method returns 405 Method Not Allowed',
                    statusOk && bodyOk,
                    `Status: ${res.statusCode}, Body: "${body.trim()}"`
                  );
                }
                
                // Test Case 8: Response includes Content-Type header
                makeRequest({ method: 'GET', path: '/' }, (err, res, body) => {
                  if (err) {
                    assertTest('Response includes Content-Type header', false, err.message);
                  } else {
                    const hasContentType = res.headers['content-type'] !== undefined;
                    assertTest(
                      'Response includes Content-Type header',
                      hasContentType,
                      'Content-Type header is missing'
                    );
                  }
                  
                  // Test Case 9: Response includes Keep-Alive header
                  makeRequest({ method: 'GET', path: '/' }, (err, res, body) => {
                    if (err) {
                      assertTest('Response includes Keep-Alive header', false, err.message);
                    } else {
                      const hasKeepAlive = res.headers['keep-alive'] !== undefined || 
                                           res.headers['connection'] === 'keep-alive';
                      assertTest(
                        'Response includes Keep-Alive header',
                        hasKeepAlive,
                        'Keep-Alive header is missing'
                      );
                    }
                    
                    // All HTTP tests complete
                    callback();
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

/**
 * Run code review verification tests
 * These tests read the server.js source code to verify implementation
 */
function runCodeReviewTests() {
  let serverCode;
  
  try {
    serverCode = fs.readFileSync('server.js', 'utf8');
  } catch (err) {
    console.log('✗ Could not read server.js for code review verification');
    console.log(`  Failure: ${err.message}`);
    failedTests += 3;
    totalTests += 3;
    return;
  }
  
  // Test Case 10: Graceful shutdown implementation verified via code review
  const hasGracefulShutdown = 
    serverCode.includes("process.on('SIGTERM'") && 
    serverCode.includes("process.on('SIGINT'") &&
    serverCode.includes('gracefulShutdown') &&
    serverCode.includes('server.close');
  
  assertTest(
    'Graceful shutdown implementation verified via code review',
    hasGracefulShutdown,
    'Missing SIGTERM/SIGINT handlers or gracefulShutdown function'
  );
  
  // Test Case 11: Error handlers verified via code review
  const hasErrorHandlers = 
    serverCode.includes("server.on('error'") &&
    serverCode.includes("server.on('clientError'") &&
    serverCode.includes("process.on('uncaughtException'") &&
    serverCode.includes("process.on('unhandledRejection'");
  
  assertTest(
    'Error handlers verified via code review',
    hasErrorHandlers,
    'Missing server error, clientError, uncaughtException, or unhandledRejection handlers'
  );
  
  // Test Case 12: Timeout configurations verified via code review
  const hasTimeoutConfig = 
    serverCode.includes('server.timeout') &&
    serverCode.includes('server.requestTimeout') &&
    serverCode.includes('server.headersTimeout') &&
    serverCode.includes('server.keepAliveTimeout');
  
  assertTest(
    'Timeout configurations verified via code review',
    hasTimeoutConfig,
    'Missing timeout configurations (timeout, requestTimeout, headersTimeout, or keepAliveTimeout)'
  );
}

/**
 * Print test results summary
 */
function printSummary() {
  console.log('');
  console.log('========================================');
  console.log('Test Results Summary');
  console.log('========================================');
  console.log(`Total: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log('========================================');
}

/**
 * Main test runner
 */
function runTests() {
  console.log('========================================');
  console.log('Running server.js Bug Fix Verification Tests');
  console.log('========================================');
  console.log('');
  
  // First run code review tests (don't need server running)
  runCodeReviewTests();
  
  // Then run HTTP tests (need server running)
  runHttpTests(() => {
    printSummary();
    
    // Exit with appropriate code
    if (failedTests === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}

// Run tests
runTests();
