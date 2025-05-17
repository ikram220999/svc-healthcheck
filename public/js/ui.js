// Function to display hourly detail chart
function showHourlyDetail(hourData, hour, date) {
    // Sort data by timestamp
    hourData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Get modal elements
    const modal = document.getElementById('hourlyDetailModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalStats = document.getElementById('modalStats');
    
    // Set modal title and stats
    // Use timezone-aware date formatting if available
    let formattedDate;
    if (typeof formatDateInTimezone === 'function') {
        formattedDate = formatDateInTimezone(date.toISOString());
    } else {
        formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    modalTitle.textContent = `Detailed Timeline for ${formattedDate}, ${hour}:00 - ${hour+1}:00`;
    
    // Calculate stats
    const upCount = hourData.filter(entry => entry.data.status === true).length;
    const downCount = hourData.filter(entry => entry.data.status === false).length;
    const responseTimes = hourData.map(entry => entry.data.responseTimeMs);
    const avgResponseTime = responseTimes.length > 0 
        ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
        : 'N/A';
    const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes).toFixed(2) : 'N/A';
    const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes).toFixed(2) : 'N/A';
    
    modalStats.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div class="bg-gray-50 p-3 rounded">
                <div class="text-xs text-gray-500">Total Checks</div>
                <div class="text-lg font-medium">${hourData.length}</div>
            </div>
            <div class="bg-gray-50 p-3 rounded">
                <div class="text-xs text-gray-500">Status</div>
                <div class="flex items-center gap-2">
                    <span class="text-status-up">${upCount} up</span>
                    <span class="text-gray-400">•</span>
                    <span class="text-status-down">${downCount} down</span>
                </div>
            </div>
            <div class="bg-gray-50 p-3 rounded">
                <div class="text-xs text-gray-500">Avg Response</div>
                <div class="text-lg font-medium">${avgResponseTime} ms</div>
            </div>
            <div class="bg-gray-50 p-3 rounded">
                <div class="text-xs text-gray-500">Min/Max Response</div>
                <div class="text-sm">${minResponseTime} / ${maxResponseTime} ms</div>
            </div>
        </div>
    `;
    
    createResponseTimeChart(hourData);
    
    // Show modal
    modal.style.display = 'block';
}

// Function to create response time chart
function createResponseTimeChart(hourData) {
    // Prepare chart data
    // Use timezone-aware time formatting if available
    let labels;
    if (typeof formatTimeInTimezone === 'function') {
        labels = hourData.map(entry => formatTimeInTimezone(entry.timestamp));
    } else {
        labels = hourData.map(entry => formatTime(entry.timestamp));
    }
    
    const chartData = hourData.map(entry => entry.data.responseTimeMs);
    const statusColors = hourData.map(entry => 
        entry.data.status === true ? 'rgba(64, 196, 99, 0.8)' : 'rgba(220, 53, 69, 0.8)'
    );
    
    // Create chart
    const canvas = document.getElementById('responseTimeChart');
    
    // Destroy previous chart if it exists
    if (window.responseChart) {
        window.responseChart.destroy();
    }
    
    window.responseChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Response Time (ms)',
                data: chartData,
                borderColor: 'rgba(66, 153, 225, 0.8)',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                borderWidth: 1,
                tension: 0.2,
                pointBackgroundColor: statusColors,
                pointBorderColor: statusColors,
                pointRadius: 1.5,
                pointHoverRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Response Time (ms)'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const index = context.dataIndex;
                            const status = hourData[index].data.status;
                            return `Status: ${status ? 'Up' : 'Down'}`;
                        }
                    }
                }
            }
        }
    });
}

// Function to initialize modal event handlers
function initializeModalHandlers() {
    // Set up modal close button
    const closeBtn = document.querySelector('.close');
    const modal = document.getElementById('hourlyDetailModal');

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
} 