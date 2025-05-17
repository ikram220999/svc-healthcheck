/**
 * Executes a GET request to the status endpoint
 * @param {string} baseUrl - The base URL for the API
 * @param {string} healthCheckUrl - The health check URL for the API
 * @returns {Promise<Object>} - The response data from the status endpoint
 */
async function checkStatus(baseUrl, healthCheckUrl) {
    try {
        // Start timing before the request
        const startTime = performance.now();
        
        const response = await fetch(`${baseUrl}${healthCheckUrl}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(5000)
        })
        
        // Calculate response time immediately after getting the response
        const responseTimeMs = Math.round(performance.now() - startTime);
        
        if (!response || response.status !== 200) {
            return {
                status: false,
                timestamp: new Date().toISOString(),
                responseTimeMs: responseTimeMs
            }
        } 

        return {
            status: true,
            timestamp: new Date().toISOString(),
            responseTimeMs: responseTimeMs
        }
        
    } catch (error) {
        console.error('Error checking status:', error);
        throw error;
    }
}

module.exports = { checkStatus };
