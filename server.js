const express = require('express');
const path = require('path');
const app = express();
let PORT = 3000; // Changed from const to let

// Import the scanner module
const { checkStatus } = require('./scanner');
// Load environment variables from .env file
require('dotenv').config();

// Make sure we have the required environment variables
if (!process.env.PORT) {
  console.log('No PORT specified in environment, using default port 3000');
} else {
  PORT = parseInt(process.env.PORT, 10);
}

// Set the timezone from environment or default to UTC
const TIMEZONE = process.env.TIMEZONE || 'UTC';
console.log(`Using timezone: ${TIMEZONE}`);

// Function to convert a date to the configured timezone
function getDateInTimezone(date) {
    try {
        // Get the date parts in the target timezone
        const options = { timeZone: TIMEZONE };
        const tzString = date.toLocaleString('en-US', options);
        console.log(`Original date: ${date.toISOString()}, TZ string: ${tzString}`);
        
        // Parse the date back to get the correct time in the local timezone
        const [datePart, timePart] = tzString.split(', ');
        const [month, day, year] = datePart.split('/');
        
        // Handle 12-hour format with AM/PM
        let [time, period] = timePart.split(' ');
        let [hours, minutes, seconds] = time.split(':');
        
        // Convert to 24-hour format if PM
        if (period === 'PM' && hours !== '12') {
            hours = parseInt(hours) + 12;
        } else if (period === 'AM' && hours === '12') {
            hours = '00';
        }
        
        // Create a new date object with timezone-adjusted components
        const tzDate = new Date(Date.UTC(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            parseInt(hours),
            parseInt(minutes),
            parseInt(seconds)
        ));
        
        console.log(`Timezone adjusted date: ${tzDate.toISOString()}`);
        return tzDate;
    } catch (e) {
        console.error("Error in timezone conversion:", e);
        return date; // Return the original date as fallback
    }
}

// Function to get date string (YYYY-MM-DD) in configured timezone
function getDateStringInTimezone(date) {
    // This is more direct and reliable for getting just the date string
    try {
        const options = { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' };
        const parts = date.toLocaleDateString('en-US', options).split('/');
        // Convert MM/DD/YYYY to YYYY-MM-DD
        return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    } catch (e) {
        console.error("Error formatting date string with timezone:", e);
        return date.toISOString().split('T')[0]; // Fallback to UTC
    }
}

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Optional: Handle other routes
app.get('/api/greet', (req, res) => {
    res.json({ message: "Hello from Express backend!" });
});

// Add a timezone endpoint so the frontend knows what timezone the server is using
app.get('/api/timezone', (req, res) => {
    const now = new Date();
    
    // Get date string in configured timezone - this is today's date according to the server
    const dateStr = getDateStringInTimezone(now);
    
    // Get full date object in timezone
    const tzDate = getDateInTimezone(now);
    
    res.json({ 
        timezone: TIMEZONE,
        serverTime: now.toISOString(),
        timezoneTime: tzDate.toISOString(),
        formattedDate: dateStr,  // The date string the frontend should use as "today"
        humanReadable: {
            utc: now.toString(),
            timezone: tzDate.toString()
        }
    });
});

// Add a debug endpoint to test timezone conversion
app.get('/api/debug/timezone', (req, res) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const debug = {
        timezone: TIMEZONE,
        current: {
            jsDate: now.toString(),
            isoString: now.toISOString(),
            utcString: now.toUTCString(),
            tzConverted: getDateInTimezone(now).toISOString(),
            dateString: getDateStringInTimezone(now)
        },
        yesterday: {
            jsDate: yesterday.toString(),
            isoString: yesterday.toISOString(),
            utcString: yesterday.toUTCString(),
            tzConverted: getDateInTimezone(yesterday).toISOString(),
            dateString: getDateStringInTimezone(yesterday)
        },
        tomorrow: {
            jsDate: tomorrow.toString(),
            isoString: tomorrow.toISOString(),
            utcString: tomorrow.toUTCString(),
            tzConverted: getDateInTimezone(tomorrow).toISOString(),
            dateString: getDateStringInTimezone(tomorrow)
        },
        manualCheck: {
            malaysiaDate: new Date().toLocaleString('en-US', {timeZone: 'Asia/Kuala_Lumpur'}),
            utcDate: new Date().toLocaleString('en-US', {timeZone: 'UTC'})
        }
    };
    
    res.json(debug);
});

app.get('/api/logs', (req, res) => {
    const fs = require('fs');
    const logDir = path.join(__dirname, 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
        return res.json({}); // Return empty data if no logs yet
    }
    
    try {
        const logFiles = fs.readdirSync(logDir)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => b.localeCompare(a)) // Sort in descending order (newest first)
            .slice(0, 7); // Get only the 7 most recent days
        
        const logs = logFiles.map(file => {
            const fileContent = fs.readFileSync(path.join(logDir, file), 'utf8');
            return JSON.parse(fileContent);
        });
        
        // Group logs by date in configured timezone
        const groupedLogs = {};
        
        logs.forEach(dailyLog => {
            if (dailyLog && dailyLog.length > 0) {
                dailyLog.forEach(entry => {
                    const entryDate = new Date(entry.timestamp);
                    // Get date string in configured timezone
                    const dateStr = getDateStringInTimezone(entryDate);
                    
                    if (!groupedLogs[dateStr]) {
                        groupedLogs[dateStr] = [];
                    }
                    
                    groupedLogs[dateStr].push(entry);
                });
            }
        });
        
        // Add timezone info to response
        const response = {
            timezone: TIMEZONE,
            logs: groupedLogs
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error reading logs:', error);
        res.status(500).json({ error: 'Failed to read logs' });
    }
});

// Add an endpoint to manually create today's log file
app.get('/api/debug/create-today-file', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const logDir = path.join(__dirname, 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }
    
    // Get today's date string in Malaysia timezone
    const now = new Date();
    
    // Direct calculation for Malaysia (UTC+8)
    const malaysiaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const directDateStr = malaysiaTime.toISOString().split('T')[0];
    
    // Using our timezone function
    const dateStr = getDateStringInTimezone(now);
    
    // Create both files to be safe
    const logFile1 = path.join(logDir, `${dateStr}.json`);
    const logFile2 = path.join(logDir, `${directDateStr}.json`);
    
    // Create dummy log entry
    const logEntry = {
        timestamp: now.toISOString(),
        timezone: TIMEZONE,
        data: {
            status: true,
            responseTimeMs: 100,
            statusCode: 200,
            message: "Manual test entry"
        }
    };
    
    const results = {
        timezone: TIMEZONE,
        nowUtc: now.toISOString(),
        calculatedMalaysiaTime: malaysiaTime.toISOString(),
        dateString: dateStr,
        directDateString: directDateStr,
        files: {}
    };
    
    // Create/update the first file
    try {
        let logs = [];
        if (fs.existsSync(logFile1)) {
            const data = fs.readFileSync(logFile1, 'utf8');
            logs = JSON.parse(data);
            results.files[logFile1] = "Updated existing file";
        } else {
            results.files[logFile1] = "Created new file";
        }
        logs.push(logEntry);
        fs.writeFileSync(logFile1, JSON.stringify(logs, null, 2));
    } catch (err) {
        results.files[logFile1] = `Error: ${err.message}`;
    }
    
    // Create/update the second file if different
    if (dateStr !== directDateStr) {
        try {
            let logs = [];
            if (fs.existsSync(logFile2)) {
                const data = fs.readFileSync(logFile2, 'utf8');
                logs = JSON.parse(data);
                results.files[logFile2] = "Updated existing file";
            } else {
                results.files[logFile2] = "Created new file";
            }
            logs.push(logEntry);
            fs.writeFileSync(logFile2, JSON.stringify(logs, null, 2));
        } catch (err) {
            results.files[logFile2] = `Error: ${err.message}`;
        }
    } else {
        results.files[logFile2] = "Same as previous file, skipped";
    }
    
    res.json(results);
});



// Define the base URL for the health check
const BASE_URL = process.env.HEALTHCHECK_HOST || 'http://localhost:3000';
const HEALTHCHECK_URL = process.env.HEALTHCHECK_URL;

// Set up interval for health checks
const INTERVAL_MS = process.env.CHECK_INTERVAL_MS || 5000; // Default: 5 seconds
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
        
        // Create filename based on current date in configured timezone
        const today = new Date();
        const dateStr = getDateStringInTimezone(today);
        const logFile = path.join(logDir, `${dateStr}.json`);
        
        // Create log entry with timestamp
        const logEntry = {
            timestamp: today.toISOString(),
            timezone: TIMEZONE,
            data: result
        };
        
        // Initialize logs array
        let logs = [];
        
        // Try to read existing file if it exists
        if (fs.existsSync(logFile)) {
            try {
                const data = fs.readFileSync(logFile, 'utf8');
                logs = JSON.parse(data);
                console.log(`Successfully read existing log file: ${logFile}`);
            } catch (parseErr) {
                console.error('Error parsing JSON log file:', parseErr);
                // Continue with empty logs array if file exists but can't be parsed
            }
        } else {
            // Create new log file with empty array
            logs = [];
            fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
            console.log(`Created new log file for date: ${dateStr}`);
        }
        
        // Add new entry
        logs.push(logEntry);
        
        // Write back to file (synchronously to ensure it completes)
        try {
            fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
            console.log(`Successfully wrote to log file: ${logFile}`);
        } catch (writeErr) {
            console.error('Error writing to JSON log file:', writeErr);
        }

    } catch (error) {
        console.error(`Health check failed at ${new Date().toISOString()}:`, error.message);
    }
}, INTERVAL_MS);


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
