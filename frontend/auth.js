// Simple authentication system
// CRITICAL: This script should ONLY run on the login page, not the app page
(function() {
    // Guard clause: Exit immediately if we're on the app page
    if (window.location.pathname === '/app' ||
        window.location.pathname.includes('index.html') ||
        document.title.includes('Progress Tracker -') && !document.title.includes('Login')) {
        return; // Exit the entire script
    }

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Check if user is already logged in
        const token = localStorage.getItem('auth_token');
        
        if (token && this.validateToken(token)) {
            this.isAuthenticated = true;
            this.showApp();
        } else {
            this.showLogin();
        }
    }

    validateToken(token) {
        // Simple token validation - in production, this should be more secure
        const expirationTime = localStorage.getItem('auth_expiration');
        return expirationTime && new Date().getTime() < parseInt(expirationTime);
    }

    showLogin() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-form">
                    <div class="login-header">
                        <i class="fas fa-chart-line"></i>
                        <h1>Progress Tracker</h1>
                        <p>Tim Verhoogt @ Evos Amsterdam</p>
                    </div>
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input type="text" id="username" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">
                            <i class="fas fa-sign-in-alt"></i> Login
                        </button>
                        <div id="loginError" class="error-message" style="display: none;">
                            Invalid username or password
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add login form styles
        this.addLoginStyles();

        // Handle login form submission
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    addLoginStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .login-container {
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            .login-form {
                background: white;
                padding: 3rem;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                width: 100%;
                max-width: 400px;
                text-align: center;
            }

            .login-header {
                margin-bottom: 2rem;
            }

            .login-header i {
                font-size: 3rem;
                color: #667eea;
                margin-bottom: 0.5rem;
            }

            .login-header h1 {
                margin: 0 0 0.5rem 0;
                color: #333;
                font-size: 1.8rem;
            }

            .login-header p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
            }

            .form-group {
                margin-bottom: 1.5rem;
                text-align: left;
            }

            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #333;
                font-weight: 500;
            }

            .form-group input {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e1e5e9;
                border-radius: 6px;
                font-size: 1rem;
                transition: border-color 0.3s ease;
                box-sizing: border-box;
            }

            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }

            .btn-full {
                width: 100%;
                padding: 1rem;
                font-size: 1rem;
                font-weight: 600;
            }

            .error-message {
                background: #fee;
                color: #c33;
                padding: 0.75rem;
                border-radius: 6px;
                margin-top: 1rem;
                border: 1px solid #fcc;
            }
        `;
        document.head.appendChild(style);
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('loginError');

        // Simple authentication - in production, this should be server-side
        if (username === 'tim.verhoogt' && password === 'Evos2025!') {
            // Set authentication token (24 hours expiration)
            const token = btoa(username + ':' + Date.now());
            const expiration = new Date().getTime() + (24 * 60 * 60 * 1000);
            
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_expiration', expiration.toString());
            
            this.isAuthenticated = true;
            this.showApp();
        } else {
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 3000);
        }
    }

    showApp() {
        // Navigate to the main application
        window.location.href = '/app';
    }

    addLogoutButton() {
        // Add logout button to header after app loads
        setTimeout(() => {
            const header = document.querySelector('.header-content');
            const existingLogoutBtn = document.querySelector('.logout-btn');
            
            if (header && !existingLogoutBtn) {
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'btn btn-secondary logout-btn';
                logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
                logoutBtn.style.cssText = 'position: absolute; top: 1rem; right: 1rem; padding: 0.5rem 1rem;';
                logoutBtn.addEventListener('click', () => this.logout());
                header.appendChild(logoutBtn);
            }
        }, 500);
    }

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_expiration');
        this.isAuthenticated = false;
        window.location.reload();
    }
}

// Initialize authentication when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

})(); // End of IIFE guard clause
