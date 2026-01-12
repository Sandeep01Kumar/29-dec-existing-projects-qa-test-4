# Hello World Express Server

A simple Express.js web server demonstrating basic HTTP endpoint handling.

## Description

This project implements a basic Node.js server using the Express.js framework with two HTTP endpoints.

## Prerequisites

- Node.js v18.0.0 or higher
- npm v8.0.0 or higher

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
# or
node server.js
```

The server will start at `http://127.0.0.1:3000/`

## Available Endpoints

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| GET | `/` | `Hello World` | Returns a greeting message |
| GET | `/evening` | `Good evening` | Returns an evening greeting |

## Testing the Endpoints

Using curl:

```bash
# Test root endpoint
curl http://127.0.0.1:3000/

# Test evening endpoint
curl http://127.0.0.1:3000/evening
```

## Dependencies

- **express** (^5.2.1) - Express.js web application framework

## License

MIT
