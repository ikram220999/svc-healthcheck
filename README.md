# Health Check Service

A Node.js-based health check service that monitors API endpoints and logs their status and response times.

## Features

- Real-time health monitoring of API endpoints
- Configurable check intervals
- JSON-based logging system
- Historical log viewing through API
- Response time tracking
- Environment variable configuration
- Docker support for easy deployment

## Prerequisites

- Node.js (v12 or higher) for local development
- npm (Node Package Manager) for local development
- Docker and Docker Compose (for containerized deployment)

## Installation

### Local Installation

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

### Docker Installation

1. Build the Docker image:
```bash
docker build -t healthcheck .
```

2. Run the container:
```bash
docker run -p 3000:3000 \
  -e HEALTHCHECK_HOST=http://example.com \
  -e HEALTHCHECK_URL=/health \
  -e CHECK_INTERVAL_MS=60000 \
  -v $(pwd)/logs:/app/logs \
  healthcheck
```

## Usage

### Local Usage

Start the server:
```bash
npm start
```

The server will start on port 3000 by default (or the port specified in your .env file).

### Docker Usage

#### Using Docker Run

```bash
docker run -p 3000:3000 \
  -e HEALTHCHECK_HOST=http://example.com \
  -e HEALTHCHECK_URL=/health \
  -e CHECK_INTERVAL_MS=60000 \
  -v $(pwd)/logs:/app/logs \
  healthcheck
```

#### Using Docker Compose

1. Update environment variables in `docker-compose.yml` if needed
2. Start the service:
```bash
docker-compose up -d
```
3. View logs:
```bash
docker-compose logs -f
```
4. Stop the service:
```bash
docker-compose down
```

## Environment Variables

The service can be configured using environment variables:

- `PORT` - Server port (default: 3000)
- `HEALTHCHECK_HOST` - Base URL for health checks (default: http://localhost:3000)
- `HEALTHCHECK_URL` - Health check endpoint path (default: /api/status)
- `CHECK_INTERVAL_MS` - Interval between health checks in milliseconds (default: 5000)

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

When running with Docker, logs are persisted via a volume mount to the host's filesystem.

## Dependencies

- express: Web framework
- dotenv: Environment variable management
- node-fetch: HTTP client for making requests

