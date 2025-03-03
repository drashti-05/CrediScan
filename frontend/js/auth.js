class Auth {
    static init() {
        this.bindLoginForm();
        this.bindRegisterForm();
        this.checkAuthStatus();
    }

    static bindLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = loginForm.username.value;
                const password = loginForm.password.value;
                const role = loginForm.role.value;

                console.log('Attempting login with:', { username, role });

                try {
                    const response = await API.login(username, password, role);
                    if (response.success) {
                        if (response.user.role !== role) {
                            this.showError(`Invalid credentials for ${role} login`);
                            return;
                        }
                        this.handleLoginSuccess(response);
                    }
                } catch (error) {
                    this.showError(error.message);
                }
            });
        }
    }

    static bindRegisterForm() {
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = registerForm.username.value;
                const password = registerForm.password.value;
                const confirmPassword = registerForm.confirmPassword.value;
                const role = registerForm.role.value;

                if (password !== confirmPassword) {
                    this.showError('Passwords do not match');
                    return;
                }

                try {
                    const response = await API.register(username, password, role);
                    if (response.success) {
                        this.handleRegistrationSuccess(response);
                    }
                } catch (error) {
                    this.showError(error.message);
                }
            });
        }
    }

    static handleLoginSuccess(response) {
        localStorage.setItem(CONFIG.TOKEN_KEY, response.token);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(response.user));
        
        const redirectPath = response.user.role === 'admin' ? './admin.html' : './dashboard.html';
        window.location.href = redirectPath;
    }

    static handleRegistrationSuccess(response) {
        this.showSuccess('Registration successful! Please login.');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    }

    static checkAuthStatus() {
        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
        const user = JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '{}');
        
        if (token && user) {
            // On auth pages, redirect to appropriate dashboard
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('register.html')) {
                window.location.href = user.role === 'admin' ? './admin.html' : './dashboard.html';
            }
            // Prevent users from accessing admin dashboard
            else if (window.location.pathname.includes('admin.html') && user.role !== 'admin') {
                window.location.href = './dashboard.html';
            }
            // Prevent admins from accessing user dashboard
            else if (window.location.pathname.includes('dashboard.html') && user.role === 'admin') {
                window.location.href = './admin.html';
            }
        } else {
            // If not authenticated, redirect to login
            if (!window.location.pathname.includes('login.html') && 
                !window.location.pathname.includes('register.html')) {
                window.location.href = './login.html';
            }
        }
    }

    static showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.textContent = message;
        this.showAlert(alertDiv);
    }

    static showSuccess(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success';
        alertDiv.textContent = message;
        this.showAlert(alertDiv);
    }

    static showAlert(alertDiv) {
        const container = document.querySelector('.auth-container');
        const existingAlert = container.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => alertDiv.remove(), 5000);
    }

    static logout() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        window.location.href = './login.html';
    }
} 