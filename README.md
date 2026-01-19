# Hello World Express Server

A simple Node.js HTTP server built with Express.js that serves greeting messages.

## Prerequisites

- Node.js v18 or higher (v20.20.0 recommended)
- npm v11.1.0 or higher

## Installation

```bash
npm install
```

## Running the Server

```bash
node server.js
```

Or using npm:

```bash
npm start
```

The server will start at http://127.0.0.1:3000/

## Available Endpoints

### GET /
Returns a "Hello, World!" greeting.

**Response:**
```
Hello, World!
```

### GET /evening
Returns a "Good evening" greeting.

**Response:**
```
Good evening
```

## Testing the Endpoints

Using curl:

```bash
# Test root endpoint
curl http://127.0.0.1:3000/

# Test evening endpoint
curl http://127.0.0.1:3000/evening
```

## Dependencies

- [Express.js](https://expressjs.com/) v5.2.1 - Web framework for Node.js

## License

MIT
