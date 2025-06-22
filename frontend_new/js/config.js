// Configuration file for the frontend application
const CONFIG = {
    // API Configuration
    API_BASE_URL: (window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname === '::1' ||
                   window.location.port === '8000')
        ? 'http://localhost:3001/api' 
        : '/api', // Use relative path in production
    
    // Application Settings
    APP_NAME: 'RECORDS',
    VERSION: '1.0.0',
    
    // User Settings (these should come from authentication in a real app)
    DEFAULT_USER: {
        name: 'Aalok Nikam',
        profileImage: 'assets/profile.jpg'
    },
    
    // API Endpoints
    ENDPOINTS: {
        MENU: '/menu',
        ORDERS: '/orders', 
        FEEDBACK: '/feedback'
    }
};

// Make config available globally
window.CONFIG = CONFIG; 