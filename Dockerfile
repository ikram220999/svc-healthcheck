FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy app source
COPY . .

# Create volume for logs
VOLUME /app/logs

# Expose the port the app runs on
EXPOSE 3000

# Environment variables with defaults
ENV PORT=3000
ENV HEALTHCHECK_HOST="http://localhost:3000"
ENV HEALTHCHECK_URL="/api/status"
ENV CHECK_INTERVAL_MS=60000

# Command to run the application
CMD ["node", "server.js"] 