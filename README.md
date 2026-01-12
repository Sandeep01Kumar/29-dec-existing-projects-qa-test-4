# hao-backprop-test

test project for backprop integration. Do not touch!

## Overview

This is a simple Node.js web server built with the Express.js framework. The server provides HTTP endpoints that return greeting messages.

## Express.js Framework

This project uses [Express.js](https://expressjs.com/) as the web application framework. Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.

## Available Endpoints

The server exposes the following HTTP endpoints:

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| GET | `/` | `Hello World` | Returns a friendly "Hello World" greeting |
| GET | `/evening` | `Good evening` | Returns an evening greeting message |

## Prerequisites

- Node.js v18.0.0 or higher
- npm (Node Package Manager)

## Installation

1. Clone the repository (if not already done)
2. Install the dependencies:

```bash
npm install
```

This will install Express.js and all required dependencies.

## Starting the Server

To start the server, run:

```bash
node server.js
```

The server will start and listen on `http://127.0.0.1:3000/`.

You should see the following output:

```
Server running at http://127.0.0.1:3000/
```

## Testing the Endpoints

You can test the endpoints using `curl` commands or any HTTP client:

### Test the Hello World endpoint

```bash
curl http://127.0.0.1:3000/
```

Expected response: `Hello World`

### Test the Good Evening endpoint

```bash
curl http://127.0.0.1:3000/evening
```

Expected response: `Good evening`

## License

MIT
