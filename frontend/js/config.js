const CONFIG = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000'
        : 'https://your-production-url.com',
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'user_data',
    ROUTES: {
        AUTH: {
            LOGIN: '/api/auth/login',
            REGISTER: '/api/auth/register'
        },
        USER: {
            PROFILE: '/api/user/profile',
            CREDIT_REQUESTS: '/api/user/credit-requests',
            SCAN_HISTORY: '/api/user/scan-history'
        },
        SCAN: {
            UPLOAD: '/api/scan/upload',
            GET: (id) => `/api/scan/${id}`
        },
        CREDITS: {
            BALANCE: '/api/credits/balance',
            REQUEST: '/api/credits/request'
        },
        ADMIN: {
            OVERVIEW: '/api/admin/overview',
            USERS: '/api/admin/top-users',
            STATS: '/api/admin/daily-stats',
            CREDIT_STATS: '/api/admin/credit-stats',
            DOCUMENT_STATS: '/api/admin/document-stats',
            CREDIT_REQUESTS: '/api/admin/credits/requests',
            APPROVE_CREDIT: (id) => `/api/admin/credits/approve/${id}`,
            DENY_CREDIT: (id) => `/api/admin/credits/deny/${id}`,
            MODIFY_CREDITS: (userId) => `/api/admin/users/${userId}/credits`,
        }
    }
}; 