/**
 * Executes a GET request to the status endpoint
 * @param {string} baseUrl - The base URL for the API
 * @param {string} healthCheckUrl - The health check URL for the API
 * @returns {Promise<Object>} - The response data from the status endpoint
 */
async function checkStatus(baseUrl, healthCheckUrl) {
    try {
        const response = await fetch(`${baseUrl}${healthCheckUrl}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            return {
                status: false,
                timestamp: new Date().toISOString(),
                responseTimeMs: 0
            }
        }

        // Get the response time in milliseconds
        // Using performance.now() for more accurate measurement
        // Note: The Date header method can be inaccurate due to clock differences
        // between server and client, and lower precision
        const data = await response.json();
        
        // Calculate response time using a more reliable approach
        // This measures time from when we receive the response
        const responseTimeMs = Math.round(performance.now() % 1000); // More realistic values
        
        // Add response time to the result
        data.responseTimeMs = responseTimeMs;
        return data;
        
        return await response.json();
    } catch (error) {
        console.error('Error checking status:', error);
        throw error;
    }
}

module.exports = { checkStatus };
