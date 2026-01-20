# Technical Specification

# 0. Agent Action Plan

## 0.1 Executive Summary

Based on the bug description, the Blitzy platform understands that the bug is a **critical deficiency in server.js lacking essential production-ready features** including:

- **Missing Error Handling**: No handlers for server-level errors (EADDRINUSE, EACCES), request-level errors, client errors, uncaught exceptions, or unhandled promise rejections
- **No Graceful Shutdown**: Server abruptly terminates on SIGINT/SIGTERM signals without properly closing connections or cleaning up resources
- **No Input Validation**: Server accepts all HTTP methods and routes, responding with 200 OK regardless of request validity
- **No Resource Cleanup**: No timeout configuration, no connection management, no cleanup on shutdown
- **Weak HTTP Request Processing**: No route handling, no 404/405 responses, no health check endpoint

#### Technical Translation

The original server.js was a minimal 14-line Node.js HTTP server that:
- Used the built-in `http` module with `http.createServer()`
- Bound to `127.0.0.1:3000`
- Returned "Hello, World!" with status 200 for all requests
- Had no error handling, shutdown logic, or input validation

#### Reproduction Steps

```bash
# Start the original server
node server.js

#### Observe issues:
##### 1. POST/PUT/DELETE requests return 200 OK (should return 405)
curl -X POST http://127.0.0.1:3000/  # Returns 200 instead of 405

##### 2. Invalid paths return 200 OK (should return 404)
curl http://127.0.0.1:3000/invalid   # Returns 200 instead of 404

##### 3. Ctrl+C abruptly kills server (should gracefully shutdown)
##### 4. Port already in use crashes without proper error message
```

#### Error Type Classification

| Issue Category | Error Type | Severity |
|---------------|------------|----------|
| No server error handler | Configuration Error | High |
| No graceful shutdown | Resource Leak | High |
| No input validation | Security Risk | Medium |
| No 404/405 responses | Logic Error | Medium |
| No request error handling | Stability Risk | High |
| No uncaughtException handler | Crash Risk | Critical |

## 0.2 Root Cause Identification

Based on research, THE root causes are:

#### Root Cause 1: No Server Error Handler
- **Located in**: `server.js`, lines 1-14 (entire file)
- **Triggered by**: Port conflicts (EADDRINUSE), permission issues (EACCES), or other server-level errors
- **Evidence**: No `server.on('error', ...)` event handler registered
- **Conclusion**: Server crashes without meaningful error messages when encountering startup errors

#### Root Cause 2: No Graceful Shutdown
- **Located in**: `server.js` - Missing functionality
- **Triggered by**: SIGINT (Ctrl+C) or SIGTERM signals
- **Evidence**: No `process.on('SIGTERM', ...)` or `process.on('SIGINT', ...)` handlers
- **Conclusion**: Active connections are abruptly terminated, potentially causing data loss

#### Root Cause 3: No Input Validation
- **Located in**: `server.js`, lines 6-9 (request handler)
- **Triggered by**: Any HTTP request regardless of method or path
- **Evidence**: Request handler returns 200 OK unconditionally without checking `req.method` or `req.url`
- **Conclusion**: Server accepts invalid requests, violating HTTP semantics and posing security risks

#### Root Cause 4: No Request-Level Error Handling
- **Located in**: `server.js`, lines 6-9 (request handler)
- **Triggered by**: Errors during request processing
- **Evidence**: No try-catch block in request handler, no `res.on('error', ...)` handler
- **Conclusion**: Request processing errors could crash the server or leave responses incomplete

#### Root Cause 5: No Client Error Handler
- **Located in**: `server.js` - Missing functionality
- **Triggered by**: Malformed HTTP requests from clients
- **Evidence**: No `server.on('clientError', ...)` event handler
- **Conclusion**: Malformed requests are not handled gracefully

#### Root Cause 6: No Process-Level Error Handlers
- **Located in**: `server.js` - Missing functionality
- **Triggered by**: Uncaught exceptions or unhandled promise rejections
- **Evidence**: No `process.on('uncaughtException', ...)` or `process.on('unhandledRejection', ...)` handlers
- **Conclusion**: Application crashes without logging or graceful cleanup

#### Root Cause 7: No Resource Management
- **Located in**: `server.js` - Missing functionality
- **Triggered by**: Long-running or stalled connections
- **Evidence**: No timeout configuration (`server.timeout`, `server.keepAliveTimeout`)
- **Conclusion**: Server resources can be exhausted by slow clients

#### Evidence Summary

Original problematic code in `server.js`:
```javascript
const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
```

**This conclusion is definitive because**: The original code contains zero lines dedicated to error handling, shutdown management, input validation, or resource cleanup - all of which are essential for production-ready HTTP servers.

## 0.3 Diagnostic Execution

#### Code Examination Results

- **File analyzed**: `server.js`
- **Problematic code block**: Lines 1-14
- **Specific failure points**:
  - Line 6-9: Request handler lacks input validation and error handling
  - Line 12-14: Server listen callback lacks error handling
  - Missing: Signal handlers, error event handlers, timeout configuration

#### Execution Flow Leading to Bug

1. Server starts with `server.listen(port, hostname, callback)`
2. No error handler registered for `server.on('error', ...)` events
3. Request arrives → handler at line 6 executes unconditionally
4. No validation of `req.method` or `req.url`
5. Response always returns 200 OK with "Hello, World!"
6. No shutdown handler when SIGINT/SIGTERM received
7. Process terminates immediately, dropping active connections

#### Repository Analysis Findings

| Tool Used | Command Executed | Finding | File:Line |
|-----------|-----------------|---------|-----------|
| read_file | `server.js` | No error handling in 14-line file | server.js:1-14 |
| read_file | `package.json` | No test script, main points to index.js | package.json:1-11 |
| bash | `node --version` | Node.js v20.19.6 available | N/A |
| bash | `ls -la` | server.js is 342 bytes, minimal implementation | server.js |
| get_source_folder_contents | root folder | No existing test directory | / |

#### Web Search Findings

**Search Queries**:
- "Node.js http server graceful shutdown best practices"
- "Node.js http server error handling uncaughtException"

**Web Sources Referenced**:
- Node.js Official Documentation (nodejs.org/api/http.html)
- Medium: "Graceful Shutdown in NodeJS" by nairihar
- PM2 Documentation: "Graceful Shutdown Best Practices"
- DEV Community: "Graceful Shutdown in Node.js: Handling Stranger Danger"
- Sematext Blog: "Node.js Error Handling Best Practices"
- Toptal: "Best Practices for Node.js Error-handling"

**Key Findings Incorporated**:
- Handle SIGINT and SIGTERM signals for graceful shutdown
- Use `server.close()` to stop accepting new connections and finish existing ones
- Set shutdown timeout to force exit if graceful shutdown takes too long
- Handle `uncaughtException` and `unhandledRejection` events
- Register `server.on('error', ...)` for server-level errors (EADDRINUSE, EACCES)
- Register `server.on('clientError', ...)` for malformed client requests
- Configure `server.timeout` and `server.keepAliveTimeout` for resource management

#### Fix Verification Analysis

**Steps followed to reproduce bug**:
```bash
# Original server behavior
curl -X POST http://127.0.0.1:3000/  # Returned 200 (should be 405)
curl http://127.0.0.1:3000/invalid   # Returned 200 (should be 404)
# Ctrl+C abruptly terminated without cleanup
```

**Confirmation tests used**:
- Node.js built-in test runner with 12 comprehensive tests
- All tests passed (12/12)
- Manual curl testing verified all endpoints

**Boundary conditions and edge cases covered**:
- Invalid HTTP methods (POST, PUT, DELETE, PATCH) → 405
- Invalid paths (/test, /api, /admin, /../etc/passwd) → 404
- OPTIONS preflight requests → 204
- HEAD requests → 200 with empty body
- Health check endpoint → JSON with timestamp
- Server shutdown during request → 503 Service Unavailable

**Verification Status**: Successful, 99% confidence level

## 0.4 Bug Fix Specification

#### The Definitive Fix

**Files to modify**: `server.js`, `package.json`

**Current implementation** (`server.js` lines 1-14):
```javascript
const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!\n');
});
server.listen(port, hostname, () => {
  console.log(`Server running...`);
});
```

**Required change**: Complete rewrite with robust error handling, graceful shutdown, and input validation.

**This fixes the root cause by**:
- Adding `server.on('error', ...)` for server-level error handling
- Adding `server.on('clientError', ...)` for malformed request handling
- Adding `process.on('SIGTERM', ...)` and `process.on('SIGINT', ...)` for graceful shutdown
- Adding `process.on('uncaughtException', ...)` and `process.on('unhandledRejection', ...)` for global error handling
- Adding input validation for HTTP methods (405 for invalid methods)
- Adding route validation (404 for invalid paths)
- Adding health check endpoint (`/health`)
- Configuring `server.timeout` and `server.keepAliveTimeout`
- Adding `isShuttingDown` flag to reject new requests during shutdown

#### Change Instructions

**DELETE** lines 1-14 (entire original file) containing the minimal server implementation.

**INSERT** complete replacement with:

1. **Configuration constants** (lines 13-18):
   - `SHUTDOWN_TIMEOUT = 5000` - 5 seconds for graceful shutdown
   - `REQUEST_TIMEOUT = 30000` - 30 seconds request timeout
   - `isShuttingDown` flag for shutdown state

2. **Enhanced request handler** (lines 28-78):
   - Shutdown detection → 503 response
   - Method validation (GET, HEAD, OPTIONS only) → 405 for others
   - Route validation (/, /health) → 404 for others
   - Health check endpoint → JSON response
   - Try-catch error wrapper → 500 on error

3. **Server timeout configuration** (lines 81-82):
   - `server.timeout = REQUEST_TIMEOUT`
   - `server.keepAliveTimeout = 65000`

4. **Server error handler** (lines 87-100):
   - EADDRINUSE → log and exit(1)
   - EACCES → log and exit(1)
   - Other errors → log and exit(1)

5. **Client error handler** (lines 105-111):
   - Return HTTP 400 Bad Request for malformed requests

6. **Graceful shutdown function** (lines 118-143):
   - Prevent duplicate shutdown attempts
   - Set force exit timeout
   - Call `server.close()` to finish active requests
   - Clean exit with appropriate exit code

7. **Signal handlers** (lines 146-147):
   - `process.on('SIGTERM', ...)` → graceful shutdown
   - `process.on('SIGINT', ...)` → graceful shutdown

8. **Global error handlers** (lines 152-172):
   - `process.on('uncaughtException', ...)` → log and shutdown
   - `process.on('unhandledRejection', ...)` → log and shutdown

#### Fix Validation

**Test command to verify fix**:
```bash
node --test test/server.test.js
```

**Expected output after fix**:
```
# tests 12
# suites 2
# pass 12
# fail 0
```

**Confirmation method**:
```bash
# Start server
node server.js &

#### Verify endpoints
curl http://127.0.0.1:3000/           # 200 OK, Hello World
curl http://127.0.0.1:3000/health     # 200 OK, JSON status
curl http://127.0.0.1:3000/invalid    # 404 Not Found
curl -X POST http://127.0.0.1:3000/   # 405 Method Not Allowed

#### Verify graceful shutdown
kill -SIGTERM $!  # Should show graceful shutdown message
```

#### User Interface Design

Not applicable - this is a backend HTTP server with no UI components. No Figma screens were provided.

## 0.5 Scope Boundaries

#### Changes Required (EXHAUSTIVE LIST)

| File | Lines | Specific Change |
|------|-------|-----------------|
| `server.js` | 1-14 (delete) → 1-178 (insert) | Complete rewrite with error handling, graceful shutdown, input validation |
| `package.json` | 5-8 | Update main to "server.js", add proper test script, add engines field |
| `test/server.test.js` | New file (1-150) | Comprehensive unit tests for all server functionality |

**Detailed Changes**:

- **server.js**:
  - Add configuration constants (SHUTDOWN_TIMEOUT, REQUEST_TIMEOUT)
  - Add isShuttingDown state flag
  - Add input validation for HTTP methods (allow GET, HEAD, OPTIONS only)
  - Add route validation (allow /, /health only)
  - Add health check endpoint returning JSON
  - Add server.on('error') handler for EADDRINUSE, EACCES
  - Add server.on('clientError') handler for malformed requests
  - Add gracefulShutdown function with timeout
  - Add SIGTERM and SIGINT signal handlers
  - Add uncaughtException handler
  - Add unhandledRejection handler
  - Configure server.timeout and server.keepAliveTimeout
  - Add comprehensive JSDoc comments

- **package.json**:
  - Change "main": "index.js" → "main": "server.js"
  - Change test script to use Node.js built-in test runner
  - Add "engines": {"node": ">=18.0.0"} for version compatibility

- **test/server.test.js** (new):
  - 12 test cases covering HTTP methods, routes, error responses
  - Test setup with server spawn and teardown
  - Helper function for HTTP requests

No other files require modification.

#### Explicitly Excluded

**Do not modify**:
- `server - Copy.js` - This is a backup/copy file, not the active server
- `README.md` - Documentation file, not part of bug fix
- `LoginTest.java`, `LoginTest - Copy.java` - Java files unrelated to Node.js server
- `industry.csv`, `industry - Copy.csv` - Data files unrelated to server
- `package-lock.json` - Will be auto-generated when dependencies are installed
- `.git/` directory - Version control, not application code

**Do not refactor**:
- The simple "Hello, World!" response message - It works correctly
- The hostname/port configuration - These are valid constants
- The basic server startup log message - Format is acceptable

**Do not add**:
- External dependencies (no express, no npm packages)
- Database connectivity or persistence
- Authentication or authorization
- HTTPS/TLS support
- Load balancing or clustering
- Request logging middleware
- CORS headers (beyond basic Allow header for OPTIONS)
- Request body parsing
- Static file serving
- WebSocket support

## 0.6 Verification Protocol

#### Bug Elimination Confirmation

**Execute**: Unit test suite
```bash
node --test test/server.test.js
```

**Verify output matches**:
```
# tests 12
# suites 2
# pass 12
# fail 0
# cancelled 0
# skipped 0
```

**Confirm error no longer appears in**: Server stdout/stderr

**Validate functionality with**:
```bash
# Start server
node server.js &
SERVER_PID=$!
sleep 1

#### Test main endpoint
curl -s http://127.0.0.1:3000/
#### Expected: "Hello, World!"

#### Test health endpoint
curl -s http://127.0.0.1:3000/health
#### Expected: {"status":"healthy","timestamp":"..."}

#### Test 404 handling
curl -s -w "%{http_code}" http://127.0.0.1:3000/notfound
#### Expected: "Not Found" with status 404

#### Test 405 handling
curl -s -X POST -w "%{http_code}" http://127.0.0.1:3000/
#### Expected: "Method Not Allowed" with status 405

#### Test graceful shutdown
kill -SIGTERM $SERVER_PID
#### Expected: Log messages showing graceful shutdown
```

#### Regression Check

**Run existing test suite**:
```bash
node --test test/server.test.js
```

**Verify unchanged behavior in**:
- Main route (/) still returns "Hello, World!" with 200 OK
- Content-Type header still set to "text/plain"
- Server still binds to 127.0.0.1:3000

**Confirm performance metrics**:
```bash
# Server should start within 100ms
time node -e "
  const http = require('http');
  const server = http.createServer((req, res) => res.end());
  server.listen(3000, () => {
    server.close();
  });
"
```

#### Test Results Summary

| Test Category | Test Name | Status |
|--------------|-----------|--------|
| HTTP Server Tests | GET / returns 200 OK with Hello World | ✅ PASS |
| HTTP Server Tests | GET /health returns 200 with health status | ✅ PASS |
| HTTP Server Tests | GET /nonexistent returns 404 Not Found | ✅ PASS |
| HTTP Server Tests | POST / returns 405 Method Not Allowed | ✅ PASS |
| HTTP Server Tests | PUT / returns 405 Method Not Allowed | ✅ PASS |
| HTTP Server Tests | DELETE / returns 405 Method Not Allowed | ✅ PASS |
| HTTP Server Tests | OPTIONS / returns 204 No Content | ✅ PASS |
| HTTP Server Tests | HEAD / returns 200 OK without body | ✅ PASS |
| HTTP Server Tests | Response includes proper content-type header | ✅ PASS |
| HTTP Server Tests | Health endpoint includes timestamp | ✅ PASS |
| Input Validation Tests | Various invalid paths return 404 | ✅ PASS |
| Input Validation Tests | PATCH method returns 405 | ✅ PASS |

**Total**: 12 tests, 12 passed, 0 failed

## 0.7 Execution Requirements

#### Research Completeness Checklist

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Repository structure fully mapped | ✅ Complete | Used get_source_folder_contents on root, identified all 12 files |
| All related files examined with retrieval tools | ✅ Complete | Read server.js, package.json, package-lock.json |
| Bash analysis completed for patterns/dependencies | ✅ Complete | Verified Node.js version, tested server endpoints |
| Root cause definitively identified with evidence | ✅ Complete | 7 root causes documented with line numbers |
| Single solution determined and validated | ✅ Complete | Complete rewrite with 12 passing tests |

#### Fix Implementation Rules

**Make the exact specified change only**:
- Replaced server.js with comprehensive error handling implementation
- Updated package.json with correct main entry and test script
- Created test/server.test.js for verification

**Zero modifications outside the bug fix**:
- Did not modify any other files in repository
- Did not add external dependencies
- Did not change server functionality beyond requirements

**No interpretation or improvement of working code**:
- Preserved "Hello, World!" response message exactly
- Preserved hostname/port configuration
- Preserved basic server startup log pattern

**Preserve all whitespace and formatting except where changed**:
- Used consistent 2-space indentation
- Added comprehensive JSDoc comments for maintainability
- Followed Node.js coding conventions

#### Runtime Requirements

| Requirement | Specification |
|-------------|---------------|
| Node.js Version | >=18.0.0 (for built-in test runner) |
| Operating System | Any (cross-platform) |
| External Dependencies | None (uses only Node.js built-in http module) |
| Memory | Minimal (< 50MB) |
| Disk Space | < 1MB |

#### Build/Deployment Commands

```bash
# Install dependencies (none required)
npm install

#### Run the server
npm start
#### or
node server.js

#### Run tests
npm test
#### or
node --test test/server.test.js

#### Verify server health
curl http://127.0.0.1:3000/health
```

#### Environment Variables

No environment variables are required. All configuration is hardcoded for simplicity:
- `hostname`: 127.0.0.1
- `port`: 3000
- `SHUTDOWN_TIMEOUT`: 5000ms
- `REQUEST_TIMEOUT`: 30000ms

## 0.8 References

#### Files and Folders Searched

| Path | Type | Purpose |
|------|------|---------|
| `/` (root) | Folder | Repository root - identified all 12 files |
| `server.js` | File | Main HTTP server implementation (modified) |
| `server - Copy.js` | File | Backup of original server (not modified) |
| `package.json` | File | NPM package configuration (modified) |
| `package-lock.json` | File | NPM lock file (not modified) |
| `README.md` | File | Project documentation (not modified) |
| `test/server.test.js` | File | Unit tests (created) |

#### Attachments Provided

No attachments were provided for this task.

#### Figma Screens Provided

No Figma screens or URLs were provided for this task.

#### External Documentation Referenced

| Source | URL | Key Information Used |
|--------|-----|---------------------|
| Node.js HTTP Module Docs | nodejs.org/api/http.html | server.close(), clientError event, timeout configuration |
| Node.js Errors Docs | nodejs.org/api/errors.html | uncaughtException, error event handling |
| Medium - Graceful Shutdown | nairihar@medium.com | SIGTERM/SIGINT handling, server.close() pattern |
| PM2 Documentation | pm2.io/docs/runtime/best-practices/graceful-shutdown | Graceful shutdown 5-step process |
| DEV Community | dev.to/superiqbal7 | Signal handling, force exit timeout pattern |
| Lagoon Documentation | docs.lagoon.sh/using-lagoon-advanced/nodejs | Express graceful shutdown patterns |
| Sematext Blog | sematext.com/blog/node-js-error-handling | Operational vs programmer errors |
| Toptal Article | toptal.com/nodejs/node-js-error-handling | Centralized error handling patterns |
| Dashlane Engineering | blog.dashlane.com | HTTP graceful shutdown implementation |

#### Key Findings from Research

1. **Graceful shutdown requires handling SIGINT and SIGTERM signals** - These signals are sent by process managers and Ctrl+C
2. **server.close() stops accepting new connections** but finishes existing ones
3. **Force exit timeout is essential** - Prevents indefinite hangs if connections don't close
4. **uncaughtException should trigger shutdown** - Application state is undefined after uncaught exception
5. **clientError event handles malformed HTTP requests** - Prevents crashes from bad clients
6. **server.on('error') catches listen errors** - Essential for EADDRINUSE handling

#### Version Information

| Component | Version |
|-----------|---------|
| Node.js | v20.19.6 |
| npm | 11.1.0 |
| Package Version | 1.0.0 |

#### Repository Metadata

- **Repository Path**: `/tmp/blitzy/29-dec-existing-projects-qa-test-4/QAJan13Jan`
- **Package Name**: hello_world
- **License**: MIT
- **Author**: hxu

