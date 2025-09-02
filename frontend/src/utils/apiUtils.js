import API_BASE_URL from '../components/pages/Config';

/**
 * Utility function to make API requests with proper headers for ngrok
 * @param {string} endpoint - API endpoint to call (without the base URL)
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise} - Fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Ensure headers exist in options
  if (!options.headers) {
    options.headers = {};
  }

  // Add minimal required headers for API requests
  options.headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok warning page
    ...options.headers
  };

  // Don't use credentials for cross-origin requests with ngrok
  options.credentials = 'omit';
  
  // Make the request with proper URL and options
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  try {
    // Add a timestamp to GET requests to prevent caching
    const finalUrl = options.method === 'GET' 
      ? `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}` 
      : url;
    
    console.log(`Making ${options.method} request to: ${finalUrl}`);
    const response = await fetch(finalUrl, options);
    
    // Log response for debugging
    console.log(`Response from ${options.method} ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText
    });
    
    return response;
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Utility function for GET requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise} - Fetch promise
 */
export const apiGet = async (endpoint, options = {}) => {
  return apiRequest(endpoint, { 
    method: 'GET', 
    ...options 
  });
};

/**
 * Utility function for POST requests
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to send in request body
 * @param {Object} options - Additional fetch options
 * @returns {Promise} - Fetch promise
 */
export const apiPost = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  });
};

/**
 * Utility function for PUT requests
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to send in request body
 * @param {Object} options - Additional fetch options
 * @returns {Promise} - Fetch promise
 */
export const apiPut = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options
  });
};

/**
 * Utility function for PATCH requests
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Data to send in request body
 * @param {Object} options - Additional fetch options
 * @returns {Promise} - Fetch promise
 */
export const apiPatch = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  });
};

/**
 * Utility function for DELETE requests
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Additional fetch options
 * @returns {Promise} - Fetch promise
 */
export const apiDelete = async (endpoint, options = {}) => {
  return apiRequest(endpoint, {
    method: 'DELETE',
    ...options
  });
};