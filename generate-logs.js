const fs = require('fs');
const path = require('path');

function generateLogs() {
    const logs = [];
    const date = new Date('2025-05-19');
    const timezone = 'Asia/Kuala_Lumpur';
    
    // Generate logs for every 30 seconds for 24 hours
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute++) {
            for (let second = 0; second < 60; second += 30) {
                const timestamp = new Date(date);
                timestamp.setHours(hour, minute, second, 0);
                
                // Generate a random response time between 4ms and 70ms
                const responseTimeMs = Math.floor(Math.random() * 66) + 4;
                
                const logEntry = {
                    timestamp: timestamp.toISOString(),
                    timezone: timezone,
                    data: {
                        status: true,
                        timestamp: timestamp.toISOString(),
                        responseTimeMs: responseTimeMs
                    }
                };
                
                logs.push(logEntry);
            }
        }
    }
    
    // Write to file
    const outputPath = path.join(__dirname, 'logs', '2025-05-19.json');
    fs.writeFileSync(outputPath, JSON.stringify(logs, null, 2));
    console.log(`Generated ${logs.length} log entries for 2025-05-19`);
}

generateLogs(); 