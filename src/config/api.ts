// Smart API URL detection for localhost + IP testing
const getApiUrls = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  if (isLocalhost) {
    // Localhost development
    return {
      authApiUrl: 'http://localhost:5000/api/auth',
      chatApiUrl: 'http://localhost:5001/api', 
      socketUrl: 'http://localhost:5001',
    };
  } else {
    // IP-based testing (phone/external device)
    const computerIP = '10.205.15.217'; // Your actual IP address
    return {
      authApiUrl: `http://${computerIP}:5000/api/auth`,
      chatApiUrl: `http://${computerIP}:5001/api`,
      socketUrl: `http://${computerIP}:5001`,
    };
  }
};

export const API_CONFIG = getApiUrls();

// Log current configuration for debugging
console.log('🔧 API Configuration:', {
  hostname: window.location.hostname,
  isLocalhost: window.location.hostname === 'localhost',
  config: API_CONFIG
});