// ==================== API CONFIGURATION ====================

// Dynamically determine API base URL based on environment
function getApiBaseUrl() {
  // In development, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  
  // In production, use the same host as the client
  return `${window.location.protocol}//${window.location.host}/api`;
}

// Export for use in api.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getApiBaseUrl };
}
