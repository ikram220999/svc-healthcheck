// Main function to initialize the status display
async function initializeStatusDisplay() {
    const statusData = await loadStatusData();
    const timelineContainer = document.querySelector('.space-y-6');
    
    // Clear existing content
    timelineContainer.innerHTML = '';

    // Use the server's date string as "today"
    const todayStr = serverDate;
    
    console.log(`Using server's date as today: ${todayStr}`);
    console.log('Available dates in data:', Object.keys(statusData));

    // Process data for each date
    Object.entries(statusData).forEach(([dateStr, dayData]) => {
        if (!dayData || dayData.length === 0) return;

        const date = new Date(dateStr);
        
        // Get day name using the server's timezone
        let dayName;
        try {
            dayName = date.toLocaleDateString('en-US', { 
                timeZone: serverTimezone,
                weekday: 'long'
            });
        } catch (e) {
            dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        }
        
        // Check if this is today's data - ONLY use the server's date
        const isToday = dateStr === todayStr;
        console.log(`Comparing date ${dateStr} with server's today ${todayStr}, isToday: ${isToday}`);
        
        const dayContainer = document.createElement('div');
        // Apply special styling for today's stats
        dayContainer.className = isToday 
            ? 'bg-white rounded-lg p-6 shadow-md border-2 border-blue-400 relative' 
            : 'bg-white rounded-lg p-4 shadow-sm';
        
        // Add "Today" badge if this is today's data
        if (isToday) {
            const todayBadge = document.createElement('div');
            todayBadge.className = 'absolute -top-3 -right-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm';
            todayBadge.textContent = 'TODAY';
            dayContainer.appendChild(todayBadge);
        }
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'flex justify-between items-center mb-3';
        
        const timeline = document.createElement('div');
        timeline.className = 'timeline-grid';
        
        let upCount = 0;
        let failedCount = 0;
        let totalDataPoints = 0;
        
        // Initialize hourly data array
        const hourlyData = Array(24).fill(null);
        const hourlyScans = Array(24).fill(0);
        
        // Group data by hour
        dayData.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            
            // Get hour in the server's timezone
            let hour;
            try {
                const options = { timeZone: serverTimezone };
                const tzDate = new Date(entryDate.toLocaleString('en-US', options));
                hour = tzDate.getHours();
            } catch (e) {
                console.error("Error getting hour with timezone:", e);
                hour = entryDate.getHours();
            }
            
            hourlyData[hour] = entry.data.status;
            hourlyScans[hour]++;
            
            // Count uptime and downtime based on status
            if (entry.data.status === true) {
                upCount++;
            } else if (entry.data.status === false) {
                failedCount++;
            }
            totalDataPoints++;
        });
        
        // Generate 24 hours of timeline
        createHourlyTimeline(timeline, hourlyData, hourlyScans, dayData, date, isToday);
        
        // Calculate uptime percentage only for hours with data
        const uptimePercentage = totalDataPoints > 0 ? ((upCount / totalDataPoints) * 100).toFixed(1) : '0.0';
        
        // Create status indicator
        const statusColor = uptimePercentage >= 99.9 ? 'text-status-up' : 
                          uptimePercentage >= 90 ? 'text-status-degraded' : 
                          'text-status-down';
        
        // Format the full date using the server's timezone
        const fullDate = formatDateInTimezone(dateStr);
        
        // Make today's header text larger
        const textSizeClass = isToday ? 'text-base font-semibold' : 'text-sm font-medium';
        const uptimeTextClass = isToday ? 'text-sm font-bold' : 'text-xs font-medium';
        
        dayHeader.innerHTML = `
            <div class="flex items-center gap-3">
                <h3 class="${textSizeClass} text-gray-900">${dayName} (${fullDate})</h3>
                <span class="${uptimeTextClass} ${statusColor}">${uptimePercentage}% uptime</span>
            </div>
            <div class="flex items-center gap-2 text-xs font-medium">
                <span class="text-status-up">${upCount} up</span>
                <span class="text-gray-400">•</span>
                <span class="text-status-down">${failedCount} down</span>
                <span class="text-gray-400">•</span>
                <span class="text-gray-500">${totalDataPoints} total scans</span>
            </div>
        `;
        
        dayContainer.appendChild(dayHeader);
        dayContainer.appendChild(timeline);
        
        // Insert today's data at the top
        if (isToday) {
            timelineContainer.insertBefore(dayContainer, timelineContainer.firstChild);
        } else {
            timelineContainer.appendChild(dayContainer);
        }
    });
    
    // Add today summary card at the top if available
    createTodaySummaryCard(statusData, todayStr);

    // Initialize modal handlers
    initializeModalHandlers();
}

// Function to create hourly timeline
function createHourlyTimeline(timeline, hourlyData, hourlyScans, dayData, date, isToday) {
    for (let hour = 0; hour < 24; hour++) {
        const hourContainer = document.createElement('div');
        hourContainer.className = 'flex flex-col items-center';
        
        const cell = document.createElement('div');
        // Make today's timeline cells larger
        cell.className = isToday ? 'timeline-cell h-7' : 'timeline-cell';
        
        const status = hourlyData[hour];
        const scans = hourlyScans[hour];
        
        cell.dataset.hour = hour;
        
        if (scans > 0) {
            cell.classList.add(getStatusColor(status));
            
            // Add click handler for cells with data
            cell.addEventListener('click', () => {
                // Filter data for this hour using the same timezone conversion
                const hourData = dayData.filter(entry => {
                    const entryDate = new Date(entry.timestamp);
                    
                    // Get hour in the server's timezone (same method as in main function)
                    let entryHour;
                    try {
                        const options = { timeZone: serverTimezone };
                        const tzDate = new Date(entryDate.toLocaleString('en-US', options));
                        entryHour = tzDate.getHours();
                    } catch (e) {
                        // Fallback to direct Malaysia calculation
                        const malaysiaDate = new Date(entryDate.getTime() + (8 * 60 * 60 * 1000));
                        entryHour = malaysiaDate.getHours();
                    }
                    
                    return entryHour === hour;
                });
                
                // Show detailed chart for this hour
                if (hourData.length > 0) {
                    showHourlyDetail(hourData, hour, date);
                }
            });
        } else {
            cell.classList.add('bg-gray-200');
        }
        
        // Add detailed tooltip with response time
        // Filter using the same timezone calculation as above
        const hourData = dayData.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            
            // Get hour in the server's timezone (same method as in main function)
            let entryHour;
            try {
                const options = { timeZone: serverTimezone };
                const tzDate = new Date(entryDate.toLocaleString('en-US', options));
                entryHour = tzDate.getHours();
            } catch (e) {
                // Fallback to direct Malaysia calculation
                const malaysiaDate = new Date(entryDate.getTime() + (8 * 60 * 60 * 1000));
                entryHour = malaysiaDate.getHours();
            }
            
            return entryHour === hour;
        });
        
        const responseTimes = hourData.map(entry => entry.data.responseTimeMs);
        const avgResponseTime = responseTimes.length > 0 
            ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
            : 'N/A';
        
        cell.title = `${hour}:00 - ${hour + 1}:00\nStatus: ${status ? 'Up' : 'Down'}\nScans: ${scans}\nAvg Response: ${avgResponseTime}ms\nClick for details`;
        
        const hourLabel = document.createElement('div');
        hourLabel.className = 'hour-label';
        hourLabel.textContent = `${hour}:00`;
        
        hourContainer.appendChild(cell);
        hourContainer.appendChild(hourLabel);
        timeline.appendChild(hourContainer);
    }
}

// Function to create today's summary card
function createTodaySummaryCard(statusData, todayStr) {
    // Use only the server's date for consistency
    console.log(`Looking for today's summary data using server date: ${todayStr}`);
    
    const todayData = statusData[todayStr];
    
    if (todayData && todayData.length > 0) {
        // Calculate today's stats
        let upCount = 0;
        let failedCount = 0;
        let totalDataPoints = todayData.length;
        let totalResponseTime = 0;
        
        todayData.forEach(entry => {
            if (entry.data.status === true) {
                upCount++;
            } else if (entry.data.status === false) {
                failedCount++;
            }
            
            if (entry.data.responseTimeMs) {
                totalResponseTime += entry.data.responseTimeMs;
            }
        });
        
        const uptimePercentage = totalDataPoints > 0 ? ((upCount / totalDataPoints) * 100).toFixed(1) : '0.0';
        const avgResponseTime = totalDataPoints > 0 ? (totalResponseTime / totalDataPoints).toFixed(2) : '0';
        
        // Create summary card
        const summaryCard = document.createElement('div');
        summaryCard.className = 'bg-white rounded-lg p-5 shadow-sm mb-6';
        summaryCard.innerHTML = `
            <div class="flex items-center mb-4">
                <div class="w-2 h-2 rounded-full ${uptimePercentage >= 99.9 ? 'bg-status-up' : uptimePercentage >= 90 ? 'bg-status-degraded' : 'bg-status-down'} mr-2"></div>
                <h2 class="text-sm font-medium text-gray-700">Today's Status</h2>
                <span class="ml-auto text-xs text-gray-400">${formatDateInTimezone(todayStr)}</span>
            </div>
            
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <span class="text-xs text-gray-500">Uptime</span>
                    <div class="text-2xl font-medium ${uptimePercentage >= 99.9 ? 'text-status-up' : uptimePercentage >= 90 ? 'text-status-degraded' : 'text-status-down'} mt-1">${uptimePercentage}%</div>
                </div>
                
                <div>
                    <span class="text-xs text-gray-500">Response</span>
                    <div class="flex items-baseline mt-1">
                        <span class="text-2xl font-medium text-gray-700">${avgResponseTime}</span>
                        <span class="text-xs text-gray-500 ml-1">ms</span>
                    </div>
                </div>
                
                <div>
                    <span class="text-xs text-gray-500">Checks</span>
                    <div class="flex gap-3 mt-1">
                        <div class="flex items-center">
                            <span class="text-xl font-medium text-gray-700">${upCount}</span>
                            <div class="w-1.5 h-1.5 rounded-full bg-status-up ml-1"></div>
                        </div>
                        <div class="flex items-center">
                            <span class="text-xl font-medium text-gray-700">${failedCount}</span>
                            <div class="w-1.5 h-1.5 rounded-full bg-status-down ml-1"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insert the summary card before the timeline
        const dailyTimelineContainer = document.querySelector('.bg-gray-50.rounded-lg.p-6');
        dailyTimelineContainer.parentNode.insertBefore(summaryCard, dailyTimelineContainer);
    } else {
        console.log(`No data available for today's (${todayStr}) summary card`);
    }
} 