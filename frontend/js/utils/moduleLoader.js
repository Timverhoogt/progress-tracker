/**
 * Module Loader Utility
 * Handles lazy loading of feature modules based on priority
 */

class ModuleLoader {
    constructor() {
        this.loadedModules = new Set();
        this.loadingPromises = new Map();
        this.moduleConfigs = {
            // High Priority - Load immediately
            high: ['projects'],

            // Medium Priority - Load on user interaction
            medium: ['timelines'],

            // Low Priority - Load on navigation/route change
            low: ['reports', 'todos', 'notes']
        };
        
        // Note: mood, workload, learning, gratitude are initialized directly in app.js
        // skills, achievements, reflections are also initialized directly in app.js

        this.init();
    }

    /**
     * Initialize module loader
     */
    init() {
        console.log('🔧 Module Loader initialized');

        // Set up navigation event listeners for low priority modules
        this.setupNavigationLazyLoading();

        // Set up interaction-based loading for medium priority modules
        this.setupInteractionLazyLoading();
    }

    /**
     * Load a module by name
     */
    async loadModule(moduleName) {
        // Check if already loaded
        if (this.loadedModules.has(moduleName)) {
            console.log(`✅ Module ${moduleName} already loaded`);
            return window[`${moduleName}Controller`];
        }

        // Check if already loading
        if (this.loadingPromises.has(moduleName)) {
            console.log(`⏳ Module ${moduleName} already loading`);
            return this.loadingPromises.get(moduleName);
        }

        // Start loading
        console.log(`🚀 Loading module: ${moduleName}`);
        const loadPromise = this._loadModuleFiles(moduleName);
        this.loadingPromises.set(moduleName, loadPromise);

        try {
            await loadPromise;
            this.loadedModules.add(moduleName);
            this.loadingPromises.delete(moduleName);
            console.log(`✅ Module ${moduleName} loaded successfully`);
            return window[`${moduleName}Controller`];
        } catch (error) {
            console.error(`❌ Failed to load module ${moduleName}:`, error);
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }

    /**
     * Load module files dynamically
     */
    async _loadModuleFiles(moduleName) {
        const moduleConfig = this.getModuleConfig(moduleName);
        if (!moduleConfig) {
            throw new Error(`Unknown module: ${moduleName}`);
        }

        const { files, initFunction } = moduleConfig;

        // Load all required files for the module
        const filePromises = files.map(filePath => this._loadScript(filePath));

        // Wait for all files to load
        await Promise.all(filePromises);

        // Initialize the module
        if (initFunction) {
            await initFunction();
        }

        return true;
    }

    /**
     * Load a single script file
     */
    async _loadScript(filePath) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = filePath;
            script.async = false; // Load synchronously to maintain order
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${filePath}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Get module configuration
     */
    getModuleConfig(moduleName) {
        // Only lazy-loaded modules are configured here
        // Modules initialized directly in app.js: projects, skills, achievements, reflections, mood, workload, learning, gratitude
        const configs = {
            timelines: {
                files: [
                    'js/modules/timelines/timelines.api.js',
                    'js/modules/timelines/timelines.ui.js',
                    'js/modules/timelines/timelines.controller.js'
                ],
                initFunction: () => this._initTimelinesModule()
            },
            reports: {
                files: [
                    'js/modules/reports/reports.api.js',
                    'js/modules/reports/reports.ui.js',
                    'js/modules/reports/index.js'
                ],
                initFunction: () => this._initReportsModule()
            },
            todos: {
                files: [
                    'js/modules/todos/todos.api.js',
                    'js/modules/todos/todos.ui.js',
                    'js/modules/todos/todos.controller.js'
                ],
                initFunction: () => this._initTodosModule()
            },
            notes: {
                files: [
                    'js/modules/notes/notes.api.js',
                    'js/modules/notes/notes.ui.js',
                    'js/modules/notes/notes.controller.js'
                ],
                initFunction: () => this._initNotesModule()
            }
        };

        return configs[moduleName];
    }

    /**
     * Initialize Timelines module
     */
    async _initTimelinesModule() {
        // Import the initialization function and call it
        const { initializeTimelinesModule } = await import('../modules/timelines/index.js');
        window.timelinesController = await initializeTimelinesModule(window.api);
    }

    /**
     * Initialize Reports module
     */
    async _initReportsModule() {
        window.reportsController = new ReportsController(window.api, window.state, null);
        await window.reportsController.initialize();
    }

    /**
     * Initialize Todos module
     */
    async _initTodosModule() {
        const { initializeTodosModule } = await import('../modules/todos/index.js');
        window.todosController = await initializeTodosModule(window.api);
    }

    /**
     * Initialize Notes module
     */
    async _initNotesModule() {
        // Load the index.js file via dynamic import (it contains ES6 exports)
        const { initializeNotesModule } = await import('../modules/notes/index.js');
        window.notesController = await initializeNotesModule(window.api);
    }

    /**
     * Setup navigation-based lazy loading for low priority modules
     */
    setupNavigationLazyLoading() {
        // Listen for route changes and load modules based on current route
        if (window.router) {
            // Store the original router instance
            const router = window.router;
            const moduleLoader = this;

            // Override the router's register method
            const originalRegister = router.register.bind(router);
            router.register = function(route, handler) {
                const wrappedHandler = async (...args) => {
                    // Load low priority modules on navigation
                    if (moduleLoader.moduleConfigs.low.includes(route)) {
                        await moduleLoader.loadModule(route);
                    }
                    return handler.apply(router, args);
                };

                return originalRegister(route, wrappedHandler);
            };
        }

        // Load modules based on URL hash on page load
        this.loadModulesFromURL();
    }

    /**
     * Setup interaction-based lazy loading for medium priority modules
     */
    setupInteractionLazyLoading() {
        // Debounced loading function
        const debouncedLoad = this.debounce((moduleName) => {
            this.loadModule(moduleName);
        }, 300);

        // Add event listeners for module triggers
        this.moduleConfigs.medium.forEach(moduleName => {
            const triggers = this.getModuleTriggers(moduleName);
            triggers.forEach(trigger => {
                trigger.addEventListener('mouseenter', () => debouncedLoad(moduleName), { once: true });
                trigger.addEventListener('click', () => this.loadModule(moduleName), { once: true });
            });
        });
    }

    /**
     * Get DOM triggers for a module
     */
    getModuleTriggers(moduleName) {
        const triggers = [];

        switch (moduleName) {
            case 'timelines':
                triggers.push(
                    document.getElementById('timelinesTab'),
                    document.querySelector('[data-module="timelines"]')
                );
                break;
        }

        return triggers.filter(Boolean);
    }

    /**
     * Load modules based on current URL
     */
    loadModulesFromURL() {
        const currentRoute = window.location.hash.slice(1) || 'projects';
        const moduleToLoad = this.getModuleFromRoute(currentRoute);

        if (moduleToLoad && this.moduleConfigs.low.includes(moduleToLoad)) {
            this.loadModule(moduleToLoad);
        }
    }

    /**
     * Get module name from route
     */
    getModuleFromRoute(route) {
        // Map routes to modules (only for lazy-loaded modules)
        const routeMap = {
            reports: 'reports',
            todos: 'todos',
            notes: 'notes'
        };

        return routeMap[route] || null;
    }

    /**
     * Check if a module is loaded
     */
    isModuleLoaded(moduleName) {
        return this.loadedModules.has(moduleName);
    }

    /**
     * Get loading status of a module
     */
    getModuleStatus(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            return 'loaded';
        } else if (this.loadingPromises.has(moduleName)) {
            return 'loading';
        } else {
            return 'not-loaded';
        }
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Preload modules (for better UX)
     */
    async preloadModules(modules) {
        console.log('🚀 Preloading modules:', modules);
        const preloadPromises = modules.map(module => this.loadModule(module));
        return Promise.all(preloadPromises);
    }
}

// Create global instance
window.moduleLoader = new ModuleLoader();
