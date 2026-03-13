// Smart API URL detection for development and production
const getApiUrls = () => {
  // Check if we're in production (Vercel sets NODE_ENV)
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    // Production: Use environment variables
    return {
      authApiUrl: import.meta.env.VITE_AUTH_API_URL || 'https://your-auth-service.onrender.com/api/auth',
      chatApiUrl: import.meta.env.VITE_API_BASE_URL || 'https://your-chat-service.onrender.com/api',
      socketUrl: import.meta.env.VITE_SOCKET_URL || 'https://your-chat-service.onrender.com',
    };
  }
  
  // Development: Smart localhost/IP detection
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
  environment: import.meta.env.PROD ? 'production' : 'development',
  hostname: window.location.hostname,
  isLocalhost: window.location.hostname === 'localhost',
  config: API_CONFIG
});