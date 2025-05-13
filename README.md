# Health Check Service

A Node.js-based health check service that monitors API endpoints and logs their status and response times.

## Features

- Real-time health monitoring of API endpoints
- Configurable check intervals
- JSON-based logging system
- Historical log viewing through API
- Response time tracking
- Environment variable configuration

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd healthcheck
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables (optional):
```env
PORT=3000
HEALTHCHECK_HOST=http://localhost:3000
HEALTHCHECK_URL=/api/status
CHECK_INTERVAL_MS=5000
```

## Usage

Start the server:
```bash
npm start
```

The server will start on port 3000 by default (or the port specified in your .env file).

## API Endpoints

- `GET /api/status` - Returns the current status of the service
- `GET /api/logs` - Returns the last 7 days of health check logs
- `GET /api/greet` - Test endpoint that returns a greeting message

## Logging

The service automatically logs health check results to JSON files in the `logs` directory. Logs are organized by date (YYYY-MM-DD.json) and include:
- Timestamp
- Status
- Response time
- Additional response data

## Configuration

The service can be configured using environment variables:

- `PORT` - Server port (default: 3000)
- `HEALTHCHECK_HOST` - Base URL for health checks (default: http://localhost:3000)
- `HEALTHCHECK_URL` - Health check endpoint path (default: /api/status)
- `CHECK_INTERVAL_MS` - Interval between health checks in milliseconds (default: 5000)

## Dependencies

- express: Web framework
- dotenv: Environment variable management
- node-fetch: HTTP client for making requests

