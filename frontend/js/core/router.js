


class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.init();
    }

    // Initialize router
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', this.handleHashChange.bind(this));

        // Handle initial route
        this.handleHashChange();
    }

    // Register a route
    register(route, handler) {
        this.routes.set(route, handler);
    }

    // Navigate to a route
    navigate(route, data = {}) {
        this.currentRoute = route;
        window.location.hash = route;

        // Update UI state
        state.setState('ui.activeTab', this.getTabFromRoute(route));

        // Emit navigation event
        events.emit('navigation:changed', { route, data });
    }

    // Handle hash change
    handleHashChange() {
        const hash = window.location.hash.substring(1) || 'projects';
        const route = this.currentRoute = hash.split('/')[0];
        const params = hash.split('/').slice(1);

        // Update UI state
        state.setState('ui.activeTab', this.getTabFromRoute(route));

        // Execute route handler
        if (this.routes.has(route)) {
            this.routes.get(route)(params);
        }

        // Emit navigation event
        events.emit('navigation:changed', { route, params });
    }

    // Get tab name from route
    getTabFromRoute(route) {
        const routeToTab = {
            'projects': 'projects',
            'notes': 'notes',
            'todos': 'todos',
            'reports': 'reports',
            'timelines': 'timelines',
            'mood': 'mood',
            'workload': 'workload',
            'learning': 'learning',
            'gratitude': 'gratitude'
        };

        return routeToTab[route] || 'projects';
    }

    // Get current route
    getCurrentRoute() {
        return this.currentRoute;
    }

    // Get route parameters
    getRouteParams() {
        return window.location.hash.substring(1).split('/').slice(1);
    }

    // Check if current route matches
    isActive(route) {
        return this.currentRoute === route;
    }
}

// Export singleton instance as global
window.router = new Router();
