const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
// Load environment variables from .env file
require('dotenv').config();

// Make sure we have the required environment variables
if (!process.env.PORT) {
  console.log('No PORT specified in environment, using default port 3000');
} else {
  PORT = parseInt(process.env.PORT, 10);
}


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Optional: Handle other routes
app.get('/api/greet', (req, res) => {
    res.json({ message: "Hello from Express backend!" });
});

// Import the scanner module
const { checkStatus } = require('./scanner');

// Define the base URL for the health check
const BASE_URL = process.env.HEALTHCHECK_HOST || 'http://localhost:3000';
const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL || '/api/status';

// Define the status endpoint
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        responseTimeMs: 0
    });
});

app.get('/api/logs', (req, res) => {
    const fs = require('fs');
    const logDir = path.join(__dirname, 'logs');
    const logFiles = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)) // Sort in descending order (newest first)
        .slice(0, 7); // Get only the 7 most recent days
    
    const logs = logFiles.map(file => {
        const fileContent = fs.readFileSync(path.join(logDir, file), 'utf8');
        return JSON.parse(fileContent);
    });
    // Group logs by date
    const groupedLogs = {};
    
    logs.forEach(dailyLog => {
        if (dailyLog && dailyLog.length > 0) {
            // Extract date from the first entry's timestamp
            const firstEntry = dailyLog[0];
            const date = new Date(firstEntry.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
            
            groupedLogs[date] = dailyLog;
        }
    });
    
    res.json(groupedLogs);
});

// Set up interval for health checks
const INTERVAL_MS = process.env.CHECK_INTERVAL_MS || 5000; // Default: 1 minute
console.log(`Setting up health check interval every ${INTERVAL_MS}ms`);

// Start periodic health checks
setInterval(async () => {
    try {
        const result = await checkStatus(BASE_URL, HEALTHCHECK_URL);
        console.log(`Health check at ${new Date().toISOString()}:`, result);
        // Store health check data in logs folder as JSON
        const fs = require('fs');
        const logDir = path.join(__dirname, 'logs');
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }
        
        // Create filename based on current date (YYYY-MM-DD.json)
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        const logFile = path.join(logDir, `${dateStr}.json`);
        
        // Create log entry with timestamp
        const logEntry = {
            timestamp: today.toISOString(),
            data: result
        };
        
        // Read existing file if it exists
        fs.readFile(logFile, 'utf8', (err, data) => {
            let logs = [];
            
            if (!err && data) {
                try {
                    logs = JSON.parse(data);
                } catch (parseErr) {
                    console.error('Error parsing JSON log file:', parseErr);
                }
            }
            
            // Add new entry
            logs.push(logEntry);
            
            // Write back to file
            fs.writeFile(logFile, JSON.stringify(logs, null, 2), (writeErr) => {
                if (writeErr) {
                    console.error('Error writing to JSON log file:', writeErr);
                }
            });
        });

    } catch (error) {
        console.error(`Health check failed at ${new Date().toISOString()}:`, error.message);
    }
}, INTERVAL_MS);


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
