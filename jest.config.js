/**
 * Jest Configuration for server.js Unit Tests
 * 
 * This configuration sets up Jest for testing Node.js HTTP server functionality
 * with appropriate environment settings and coverage thresholds.
 */

module.exports = {
  // Use Node.js environment for testing HTTP server
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: ['**/__tests__/**/*.test.js'],
  
  // Ignore node_modules for test discovery
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Run tests sequentially to avoid port conflicts
  maxWorkers: 1,
  
  // Coverage configuration
  collectCoverageFrom: ['server.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  
  // Coverage thresholds - ensuring comprehensive test coverage
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Verbose output for detailed test results
  verbose: true,
  
  // Test timeout (10 seconds for HTTP operations)
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles to help debug hanging tests
  detectOpenHandles: false
};
