// Main application orchestrator
// Note: Using traditional script loading instead of ES6 modules for browser compatibility

// Application class
class ProgressTracker {
    constructor() {
        this.modules = {};
        this.initialized = false;
    }

    // Initialize the application
    async initialize() {
        if (this.initialized) {
            console.warn('Application already initialized');
            return;
        }

        console.log('🚀 Initializing Progress Tracker...');

        try {
            // Initialize core systems
            await this.initializeCoreSystems();

            // Initialize modules
            await this.initializeModules();

            // Setup navigation
            this.setupNavigation();

            // Setup global event handlers
            this.setupGlobalEventHandlers();

            // Load initial data
            await this.loadInitialData();

            this.initialized = true;
            console.log('✅ Progress Tracker initialized successfully!');
        } catch (error) {
            console.error('❌ Failed to initialize Progress Tracker:', error);
            throw error;
        }
    }

    // Initialize core systems
    async initializeCoreSystems() {
        console.log('📱 Initializing core systems...');

        // Initialize core systems (these will be created as globals)
        this.initializeApi();
        this.initializeState();
        this.initializeEvents();
        this.initializeRouter();

        console.log('✅ Core systems initialized');
    }

    // Initialize API client
    initializeApi() {
        // API client will be loaded as a global
        if (typeof window.api === 'undefined') {
            console.warn('API client not loaded');
        } else {
            console.log('✅ API client initialized');
        }
    }

    // Initialize state management
    initializeState() {
        // State management will be loaded as a global
        if (typeof window.state === 'undefined') {
            console.warn('State management not loaded');
        } else {
            console.log('✅ State management initialized');
        }
    }

    // Initialize events system
    initializeEvents() {
        // Events system will be loaded as a global
        if (typeof window.events === 'undefined') {
            console.warn('Events system not loaded');
        } else {
            console.log('✅ Events system initialized');
        }
    }

    // Initialize router
    initializeRouter() {
        // Router will be loaded as a global
        if (typeof window.router === 'undefined') {
            console.warn('Router not loaded');
        } else {
            console.log('✅ Router initialized');
        }
    }

    // Initialize feature modules
    async initializeModules() {
        console.log('📱 Initializing modules...');

        // Initialize High Priority modules immediately
        console.log('🚀 Loading high priority modules...');

        // Projects module (High Priority)
        this.modules.projects = new ProjectsController(window.api, { autoInitialize: false });
        window.projectsController = this.modules.projects;
        await this.modules.projects.initialize();
        console.log('✅ Projects module initialized');

        // Skills module (High Priority)
        this.modules.skills = new SkillsController(window.api, { autoInitialize: false });
        window.skillsController = this.modules.skills;
        await this.modules.skills.initialize();
        console.log('✅ Skills module initialized');

        // Achievements module (High Priority)
        this.modules.achievements = new AchievementsController(window.api, { autoInitialize: false });
        window.achievementsController = this.modules.achievements;
        await this.modules.achievements.initialize();
        console.log('✅ Achievements module initialized');

        // Reflections module (High Priority)
        this.modules.reflections = new ReflectionsController(window.api, { autoInitialize: false });
        window.reflectionsController = this.modules.reflections;
        await this.modules.reflections.initialize();
        console.log('✅ Reflections module initialized');

        // Mood module (Wellbeing - High Priority)
        this.modules.mood = new MoodController(window.api, { autoInitialize: false });
        window.moodController = this.modules.mood;
        await this.modules.mood.initialize();
        console.log('✅ Mood module initialized');

        // Workload module (Wellbeing - High Priority)
        this.modules.workload = new WorkloadController(window.api, { autoInitialize: false });
        window.workloadController = this.modules.workload;
        await this.modules.workload.initialize();
        console.log('✅ Workload module initialized');

        // Gratitude module (Wellbeing - High Priority)
        this.modules.gratitude = new GratitudeController(window.api, { autoInitialize: false });
        window.gratitudeController = this.modules.gratitude;
        await this.modules.gratitude.initialize();
        console.log('✅ Gratitude module initialized');

        // Learning module (Wellbeing - High Priority)
        this.modules.learning = new LearningController(window.api, { autoInitialize: false });
        window.learningController = this.modules.learning;
        await this.modules.learning.initialize();
        console.log('✅ Learning module initialized');


        // Set up module loader for lazy loading
        this.setupModuleLazyLoading();

        console.log('✅ Module system ready - lazy loading enabled');
    }

    // Setup lazy loading for modules
    setupModuleLazyLoading() {
        // High priority modules are loaded immediately
        // Medium and low priority modules will be loaded by ModuleLoader

        // Expose module loading functions globally for manual loading
        window.loadModule = async (moduleName) => {
            return await window.moduleLoader.loadModule(moduleName);
        };

        window.isModuleLoaded = (moduleName) => {
            return window.moduleLoader.isModuleLoaded(moduleName);
        };

        window.getModuleStatus = (moduleName) => {
            return window.moduleLoader.getModuleStatus(moduleName);
        };

        console.log('🔧 Module lazy loading system ready');
    }

    // Setup navigation
    setupNavigation() {
        console.log('📱 Setting up navigation...');

        const routes = [
            ['projects', 'navigation:projects'],
            ['notes', 'navigation:notes'],
            ['todos', 'navigation:todos'],
            ['reports', 'navigation:reports'],
            ['timelines', 'navigation:timelines'],
            ['skills', 'navigation:skills'],
            ['achievements', 'navigation:achievements'],
            ['reflections', 'navigation:reflections'],
            ['learning', 'navigation:learning'],
            ['mood', 'navigation:mood'],
            ['workload', 'navigation:workload'],
            ['gratitude', 'navigation:gratitude'],
            ['coaching', 'navigation:coaching'],
            ['settings', 'navigation:settings']
        ];

        routes.forEach(([route, eventName]) => {
            window.router.register(route, () => {
                this.showTab(route);
                this.emit(eventName);
            });
        });

        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                const targetTab = tab.dataset.tab;
                if (!targetTab) {
                    return;
                }

                // Avoid redundant navigation
                if (window.router && window.router.getCurrentRoute() === targetTab) {
                    this.showTab(targetTab);
                    this.closeMobileNav();
                    return;
                }

                if (window.router) {
                    window.router.navigate(targetTab);
                } else {
                    console.warn('Router not available, falling back to direct tab switch');
                    this.showTab(targetTab);
                }

                this.closeMobileNav();
            });
        });

        this.setupNavSections();
        this.setupNavCollapse();

        console.log('✅ Navigation setup complete');
    }

    setupNavSections() {
        document.querySelectorAll('.nav-section-toggle').forEach((toggle) => {
            const section = toggle.closest('.nav-section');
            const items = section?.querySelector('.nav-section-items');
            const expanded = toggle.getAttribute('aria-expanded') === 'true';

            if (!expanded) {
                section?.classList.add('collapsed');
                if (items) items.hidden = true;
            }

            toggle.addEventListener('click', (event) => {
                event.preventDefault();
                const currentlyExpanded = toggle.getAttribute('aria-expanded') === 'true';
                const nextExpanded = !currentlyExpanded;
                toggle.setAttribute('aria-expanded', String(nextExpanded));
                section?.classList.toggle('collapsed', !nextExpanded);
                if (items) items.hidden = !nextExpanded;
            });
        });
    }

    setupNavCollapse() {
        const collapseToggle = document.querySelector('.nav-collapse-toggle');
        const nav = document.querySelector('.nav-tabs');
        if (!collapseToggle || !nav) {
            return;
        }

        this.navCollapseToggle = collapseToggle;
        this.navElement = nav;

        const syncNavVisibility = () => {
            const isMobile = window.matchMedia('(max-width: 768px)').matches;
            if (!isMobile) {
                nav.classList.add('active');
                collapseToggle.setAttribute('aria-expanded', 'false');
                return;
            }

            const expanded = collapseToggle.getAttribute('aria-expanded') === 'true';
            nav.classList.toggle('active', expanded);
        };

        collapseToggle.addEventListener('click', () => {
            const expanded = collapseToggle.getAttribute('aria-expanded') === 'true';
            collapseToggle.setAttribute('aria-expanded', String(!expanded));
            nav.classList.toggle('active', !expanded);
        });

        window.addEventListener('resize', syncNavVisibility);
        syncNavVisibility();
    }

    closeMobileNav() {
        if (!this.navCollapseToggle || !this.navElement) {
            return;
        }

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (!isMobile) {
            return;
        }

        this.navCollapseToggle.setAttribute('aria-expanded', 'false');
        this.navElement.classList.remove('active');
    }

    // Show specific tab
    showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
        const targetContent = document.querySelector(`.tab-content[data-tab="${tabName}"]`) || document.getElementById(tabName);

        if (targetTab) targetTab.classList.add('active');
        if (targetContent) targetContent.style.display = 'block';

        if (targetTab) {
            const parentSection = targetTab.closest('.nav-section');
            if (parentSection) {
                const toggle = parentSection.querySelector('.nav-section-toggle');
                const items = parentSection.querySelector('.nav-section-items');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'true');
                }
                parentSection.classList.remove('collapsed');
                if (items) items.hidden = false;
            }
        }

        // Update state
        state.setState('ui.activeTab', tabName);
    }

    // Setup global event handlers
    setupGlobalEventHandlers() {
        console.log('📱 Setting up global event handlers...');

        // Project selection handler
        this.modules.projects.on('project:selected', (projectId) => {
            state.setState('currentProject', projectId);
            this.emit('project:selected', projectId);
        });

        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleGlobalError(event.error);
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleGlobalError(event.reason);
        });

        console.log('✅ Global event handlers setup complete');
    }

    // Handle global errors
    handleGlobalError(error) {
        console.error('Global error handler:', error);

        // Show user-friendly error message
        const errorMessage = error.message || 'An unexpected error occurred';
        const messageElement = document.createElement('div');
        messageElement.className = 'error-toast';
        messageElement.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${errorMessage}</span>
            </div>
        `;

        document.body.appendChild(messageElement);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, 5000);
    }

    // Load initial data
    async loadInitialData() {
        console.log('📱 Loading initial data...');

        try {
            // Load projects as initial data
            const projectsController = this.modules.projects;
            const hasProjectsLoaded = Array.isArray(projectsController?.projects) && projectsController.projects.length > 0;

            if (!hasProjectsLoaded) {
                await projectsController.loadProjects();
            }

            console.log('✅ Initial data loaded');
        } catch (error) {
            console.error('Failed to load initial data:', error);
            // Don't throw error for initial data loading
        }
    }

    // Get module instance
    getModule(name) {
        return this.modules[name];
    }

    // Event system
    on(event, handler) {
        events.on(event, handler);
    }

    emit(event, data) {
        events.emit(event, data);
    }

    // Logout function
    logout() {
        // Clear state
        state.reset();

        // Clear localStorage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_expiration');

        // Redirect to login
        window.location.href = '/';
    }

    // Get application state
    getState() {
        return state.getAllState();
    }

    // Update state
    setState(key, value) {
        state.setState(key, value);
    }
}

// Create and export application instance
window.app = new ProgressTracker();

// Initialize application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app.initialize().catch(error => {
            console.error('Failed to initialize application:', error);
        });
    });
} else {
    window.app.initialize().catch(error => {
        console.error('Failed to initialize application:', error);
    });
}

// Export logout function for global use
window.logout = () => window.app.logout();

// Export global helper functions for inline HTML onclick handlers
window.showSkills = () => {
    if (window.router) {
        window.router.navigate('skills');
    }
};

window.showAchievements = () => {
    if (window.router) {
        window.router.navigate('achievements');
    }
};

window.showReflections = () => {
    if (window.router) {
        window.router.navigate('reflections');
    }
};

// Skills module helpers
window.editSkill = (id) => {
    if (window.app && window.app.modules.skills) {
        window.app.modules.skills.editSkill(id);
    }
};

window.assessSkill = (id) => {
    if (window.app && window.app.modules.skills) {
        window.app.modules.skills.assessSkill(id);
    }
};

// Achievements module helpers
window.editAchievement = (id) => {
    if (window.app && window.app.modules.achievements) {
        window.app.modules.achievements.editAchievement(id);
    }
};

window.completeAchievement = async (id) => {
    if (window.app && window.app.modules.achievements) {
        await window.app.modules.achievements.completeAchievement(id);
    }
};

// Reflections module helpers
window.useTemplate = (id) => {
    if (window.app && window.app.modules.reflections) {
        window.app.modules.reflections.useTemplate(id);
    }
};

// Wellbeing Modules - Navigation helpers
window.showMood = () => {
    if (window.router) {
        window.router.navigate('mood');
    }
};

window.showGratitude = () => {
    if (window.router) {
        window.router.navigate('gratitude');
    }
};

window.showLearning = () => {
    if (window.router) {
        window.router.navigate('learning');
    }
};

// Mood module helpers
window.editMoodEntry = (id) => {
    if (window.app && window.app.modules.mood) {
        window.app.modules.mood.editEntry(id);
    }
};

window.deleteMoodEntry = async (id) => {
    if (window.app && window.app.modules.mood) {
        await window.app.modules.mood.deleteEntry(id);
    }
};

// Gratitude module helpers
window.editGratitudeEntry = (id) => {
    if (window.app && window.app.modules.gratitude) {
        window.app.modules.gratitude.editEntry(id);
    }
};

window.deleteGratitudeEntry = async (id) => {
    if (window.app && window.app.modules.gratitude) {
        await window.app.modules.gratitude.deleteEntry(id);
    }
};

// Learning module helpers
window.editLearningPath = (id) => {
    if (window.app && window.app.modules.learning) {
        window.app.modules.learning.editPath(id);
    }
};

window.deleteLearningPath = async (id) => {
    if (window.app && window.app.modules.learning) {
        await window.app.modules.learning.deletePath(id);
    }
};

// Coaching module helpers
window.startConversation = (topic) => {
    // Hide welcome, show chat
    const welcome = document.getElementById('coachingWelcome');
    const chat = document.getElementById('coachingChat');
    if (welcome) welcome.style.display = 'none';
    if (chat) chat.style.display = 'block';
    
    // Add initial topic message
    const input = document.getElementById('coachingInput');
    if (input) {
        const topicMessages = {
            'motivation': "I need some motivation today",
            'challenge': "I'm facing some challenges I'd like to discuss",
            'growth': "I want to talk about my career growth",
            'confidence': "I'd like help building my confidence"
        };
        input.value = topicMessages[topic] || '';
        input.focus();
    }
};

window.clearConversation = () => {
    // Clear chat messages
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // Clear input
    const input = document.getElementById('coachingInput');
    if (input) {
        input.value = '';
    }
    
    // Clear state
    if (window.state) {
        window.state.setState('coaching.conversation', []);
    }
};

window.showWelcome = () => {
    // Show welcome, hide chat
    const welcome = document.getElementById('coachingWelcome');
    const chat = document.getElementById('coachingChat');
    if (welcome) welcome.style.display = 'block';
    if (chat) chat.style.display = 'none';
};
