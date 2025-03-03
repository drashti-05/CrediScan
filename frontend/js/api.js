console.log('API.js loaded'); // Add this at the top of the file

class API {
    static async request(endpoint, options = {}) {
        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            credentials: 'include',
            mode: 'cors'
        };

        try {
            console.log('Making request to:', CONFIG.API_URL + endpoint);
            
            const response = await fetch(CONFIG.API_URL + endpoint, {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...(options.headers || {})
                }
            });

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return { success: true };
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async login(username, password, role) {
        const data = await this.request(CONFIG.ROUTES.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ username, password, role })
        });
        
        if (data.token) {
            localStorage.setItem(CONFIG.TOKEN_KEY, data.token);
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user));
        }
        
        return data;
    }

    static async register(username, password, role) {
        return await this.request(CONFIG.ROUTES.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify({
                username,
                password,
                role
            })
        });
    }

    static async getUserProfile() {
        try {
            const response = await this.request(CONFIG.ROUTES.USER.PROFILE, {
                params: { include: 'basic' } // Only fetch basic user info
            });
            return response;
        } catch (error) {
            console.error('Error in getUserProfile:', error);
            throw error;
        }
    }

    static async getUserCreditRequests() {
        try {
            const response = await this.request(CONFIG.ROUTES.USER.CREDIT_REQUESTS);
            return response;
        } catch (error) {
            console.error('Error in getUserCreditRequests:', error);
            throw error;
        }
    }

    static async getUserScanHistory() {
        try {
            const response = await this.request(CONFIG.ROUTES.USER.SCAN_HISTORY);
            return response;
        } catch (error) {
            console.error('Error in getUserScanHistory:', error);
            throw error;
        }
    }

    static async uploadDocument(formData) {
        try {
            console.log('Making upload request to server');
            const token = localStorage.getItem(CONFIG.TOKEN_KEY);
            const response = await fetch(CONFIG.API_URL + CONFIG.ROUTES.SCAN.UPLOAD, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
                credentials: 'same-origin'
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            return data;
        } catch (error) {
            console.error('Upload API error:', error);
            throw error;
        }
    }

    static async getAdminOverview() {
        return await this.request(CONFIG.ROUTES.ADMIN.OVERVIEW);
    }

    static async getCreditRequests() {
        return await this.request(CONFIG.ROUTES.ADMIN.CREDIT_REQUESTS);
    }

    static async getTopUsers() {
        return await this.request(CONFIG.ROUTES.ADMIN.USERS);
    }
} 