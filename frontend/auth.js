// Authentication disabled - direct access to app
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
        this.init();
    }

    init() {
        // Authentication disabled - directly show app
        this.showApp();
    }

    showApp() {
        // Navigate to the main application
        window.location.href = '/app';
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

})(); // End of IIFE guard clause
