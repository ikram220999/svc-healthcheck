// Global timezone configuration
let serverTimezone = 'UTC';
let serverDate = null;  // Store the server's current date for consistency

// Function to fetch timezone configuration from server
async function fetchTimezoneConfig() {
    try {
        const response = await fetch('/api/timezone');
        if (!response.ok) {
            console.error(`Timezone API error: ${response.status}`);
            return 'UTC'; // Default to UTC on error
        }
        const data = await response.json();
        console.log('Server timezone config:', data);
        
        // Store the server's current date string for consistency
        serverDate = data.formattedDate;
        console.log(`Server says today is: ${serverDate}`);
        
        return data.timezone;
    } catch (error) {
        console.error('Error fetching timezone config:', error);
        return 'UTC'; // Default to UTC on error
    }
}

// Function to load and parse the status data
async function loadStatusData() {
    try {
        // First, get the timezone configuration
        serverTimezone = await fetchTimezoneConfig();
        console.log(`Using timezone: ${serverTimezone}`);
        
        // Then fetch the logs data
        const response = await fetch('/api/logs');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log("Data received from API:", data);
        
        // The API now returns { timezone, logs } structure
        // Extract the logs from the response
        const logs = data.logs || {};
        
        // If we don't have today's data, create mock data
        if (serverDate && !logs[serverDate]) {
            console.log(`No data for today (${serverDate}), creating mock data`);
            logs[serverDate] = createMockDataForDate(serverDate);
        }
        
        return logs;
    } catch (error) {
        console.error('Error loading status data:', error);
        
        // Return mock data in case of error
        const mockData = createMockData();
        return mockData;
    }
}

// Function to create mock data for a specific date
function createMockDataForDate(dateStr) {
    const mockEntries = [];
    const date = new Date(dateStr);
    const now = new Date();
    
    // Generate entries for each hour up to current hour
    const currentHour = now.getHours();
    
    for(let i = 0; i < 24; i++) {
        // Only add data for hours that have already passed today
        if (i <= currentHour) {
            const isUp = Math.random() > 0.1; // 90% chance of being up
            const responseTime = Math.floor(Math.random() * 500) + 50; // 50-550ms
            
            mockEntries.push({
                timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), i, 0, 0).toISOString(),
                data: {
                    status: isUp,
                    responseTimeMs: responseTime,
                    statusCode: isUp ? 200 : 503
                }
            });
            
            // Add a few more data points within the hour
            for(let j = 1; j < 4; j++) {
                const minutes = j * 15; // 15, 30, 45 minutes
                const isUpFollowup = Math.random() > 0.05; // 95% chance of being up
                const responseTimeFollowup = Math.floor(Math.random() * 400) + 50; // 50-450ms
                
                mockEntries.push({
                    timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), i, minutes, 0).toISOString(),
                    data: {
                        status: isUpFollowup,
                        responseTimeMs: responseTimeFollowup,
                        statusCode: isUpFollowup ? 200 : 503
                    }
                });
            }
        }
    }
    
    return mockEntries;
}

// Function to create mock data if needed
function createMockData() {
    const data = {};
    
    // Create today's data
    const today = new Date();
    let todayStr;
    
    try {
        // Try to format the date using the server's timezone
        const options = { timeZone: serverTimezone };
        const tzDate = new Date(today.toLocaleString('en-US', options));
        todayStr = tzDate.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch (e) {
        // Fallback if timezone is invalid
        console.error("Error formatting date with timezone:", e);
        todayStr = today.toISOString().split('T')[0];
    }
    
    data[todayStr] = createMockDataForDate(todayStr);
    
    // Create yesterday's data for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let yesterdayStr;
    
    try {
        // Format yesterday's date in server timezone
        const options = { timeZone: serverTimezone };
        const tzYesterday = new Date(yesterday.toLocaleString('en-US', options));
        yesterdayStr = tzYesterday.toISOString().split('T')[0];
    } catch (e) {
        // Fallback
        yesterdayStr = yesterday.toISOString().split('T')[0];
    }
    
    data[yesterdayStr] = createMockDataForDate(yesterdayStr);
    
    console.log("Created mock data:", data);
    return data;
}

// Function to determine status color based on status value
function getStatusColor(status) {
    return status ? 'bg-status-up' : 'bg-status-down';
}

// Function to format date for display
function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Function to format time for display
function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
}

// Function to format date in the server's timezone
function formatDateInTimezone(dateStr) {
    try {
        const date = new Date(dateStr);
        const options = { 
            timeZone: serverTimezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        console.error("Error formatting date with timezone:", e);
        return new Date(dateStr).toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Function to format time in the server's timezone
function formatTimeInTimezone(dateStr) {
    try {
        const date = new Date(dateStr);
        const options = { 
            timeZone: serverTimezone,
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        return date.toLocaleTimeString('en-US', options);
    } catch (e) {
        console.error("Error formatting time with timezone:", e);
        return new Date(dateStr).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
} 