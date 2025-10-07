// API Configuration - Prefer same-origin to support HTTPS/mobiles; fall back for localhost dev
const getApiBaseUrl = () => {
    const currentHost = window.location.hostname;
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return 'http://localhost:3060/api';
    }
    // Same-origin relative path lets HTTPS reverse proxy handle API
    return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Global state
let currentProject = null;
let projects = [];

// DOM Elements
const elements = {
    // Navigation
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Projects
    projectsGrid: document.getElementById('projectsGrid'),
    newProjectBtn: document.getElementById('newProjectBtn'),
    projectModal: document.getElementById('projectModal'),
    projectForm: document.getElementById('projectForm'),
    projectName: document.getElementById('projectName'),
    projectDescription: document.getElementById('projectDescription'),
    
    // Notes
    notesProjectSelector: document.getElementById('notesProjectSelector'),
    noteInput: document.getElementById('noteInput'),
    addNoteBtn: document.getElementById('addNoteBtn'),
    recordVoiceBtn: document.getElementById('recordVoiceBtn'),
    recordStatus: document.getElementById('recordStatus'),
    notesList: document.getElementById('notesList'),
    
    // Todos
    todosProjectSelector: document.getElementById('todosProjectSelector'),
    generateTodosBtn: document.getElementById('generateTodosBtn'),
    newTodoBtn: document.getElementById('newTodoBtn'),
    todosList: document.getElementById('todosList'),
    todoModal: document.getElementById('todoModal'),
    todoForm: document.getElementById('todoForm'),
    
    // Reports
    reportsProjectSelector: document.getElementById('reportsProjectSelector'),
    generateReportBtn: document.getElementById('generateReportBtn'),
    reportsList: document.getElementById('reportsList'),
    reportModal: document.getElementById('reportModal'),
    reportForm: document.getElementById('reportForm'),
    
    // Timelines
    timelinesProjectSelector: document.getElementById('timelinesProjectSelector'),
    timelineZoom: document.getElementById('timelineZoom'),
    estimateTimelineBtn: document.getElementById('estimateTimelineBtn'),
    exportTimelineBtn: document.getElementById('exportTimelineBtn'),
    newMilestoneBtn: document.getElementById('newMilestoneBtn'),
    timelineContainer: document.getElementById('timelineContainer'),
    
    // Milestone Modal
    milestoneModal: document.getElementById('milestoneModal'),
    milestoneForm: document.getElementById('milestoneForm'),
    milestoneTitle: document.getElementById('milestoneTitle'),
    milestoneDescription: document.getElementById('milestoneDescription'),
    milestoneTargetDate: document.getElementById('milestoneTargetDate'),
    milestoneStatus: document.getElementById('milestoneStatus'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Mood
    moodStatsBtn: document.getElementById('moodStatsBtn'),
    moodPatternsBtn: document.getElementById('moodPatternsBtn'),
    moodAIAnalysisBtn: document.getElementById('moodAIAnalysisBtn'),
    newMoodEntryBtn: document.getElementById('newMoodEntryBtn'),
    
    // Coping Strategies
    viewAllStrategiesBtn: document.getElementById('viewAllStrategiesBtn'),
    recommendedStrategiesBtn: document.getElementById('recommendedStrategiesBtn'),
    strategyAnalyticsBtn: document.getElementById('strategyAnalyticsBtn'),
    addStrategyBtn: document.getElementById('addStrategyBtn'),
    strategiesContent: document.getElementById('strategiesContent'),
    strategyModal: document.getElementById('strategyModal'),
    strategyForm: document.getElementById('strategyForm'),
    strategyName: document.getElementById('strategyName'),
    strategyCategory: document.getElementById('strategyCategory'),
    strategyDescription: document.getElementById('strategyDescription'),
    strategyInstructions: document.getElementById('strategyInstructions'),
    strategyDuration: document.getElementById('strategyDuration'),
    strategyDifficulty: document.getElementById('strategyDifficulty'),
    strategyMoodTags: document.getElementById('strategyMoodTags'),
    strategyStressLevels: document.getElementById('strategyStressLevels'),
    strategyTriggers: document.getElementById('strategyTriggers'),
    todayMoodContent: document.getElementById('todayMoodContent'),
    moodEntries: document.getElementById('moodEntries'),
    moodInsightsSection: document.getElementById('moodInsightsSection'),
    moodInsightsContent: document.getElementById('moodInsightsContent'),
    moodModal: document.getElementById('moodModal'),
    moodForm: document.getElementById('moodForm'),
    moodDate: document.getElementById('moodDate'),
    moodScore: document.getElementById('moodScore'),
    moodScoreValue: document.getElementById('moodScoreValue'),
    energyLevel: document.getElementById('energyLevel'),
    energyLevelValue: document.getElementById('energyLevelValue'),
    stressLevel: document.getElementById('stressLevel'),
    stressLevelValue: document.getElementById('stressLevelValue'),
    motivationLevel: document.getElementById('motivationLevel'),
    motivationLevelValue: document.getElementById('motivationLevelValue'),
    moodTags: document.getElementById('moodTags'),
    moodNotes: document.getElementById('moodNotes'),
    moodTriggers: document.getElementById('moodTriggers'),
    copingStrategies: document.getElementById('copingStrategies'),
    
    // New Phase 3 Features
    breakRecommendationsContent: document.getElementById('breakRecommendationsContent'),
    stressAlertsContent: document.getElementById('stressAlertsContent'),
    balanceDashboardContent: document.getElementById('balanceDashboardContent'),
    
    // Gratitude System
    newGratitudeEntryBtn: document.getElementById('newGratitudeEntryBtn'),
    gratitudePromptsBtn: document.getElementById('gratitudePromptsBtn'),
    gratitudeStatsBtn: document.getElementById('gratitudeStatsBtn'),
    todayGratitudeCard: document.getElementById('todayGratitudeCard'),
    todayGratitudeContent: document.getElementById('todayGratitudeContent'),
    gratitudePromptsSection: document.getElementById('gratitudePromptsSection'),
    gratitudePromptsContent: document.getElementById('gratitudePromptsContent'),
    achievementGratitudeSection: document.getElementById('achievementGratitudeSection'),
    achievementGratitudeContent: document.getElementById('achievementGratitudeContent'),
    reframingSection: document.getElementById('reframingSection'),
    reframingContent: document.getElementById('reframingContent'),
    encouragementSection: document.getElementById('encouragementSection'),
    encouragementContent: document.getElementById('encouragementContent'),
    gratitudeEntries: document.getElementById('gratitudeEntries'),
    gratitudeModal: document.getElementById('gratitudeModal'),
    gratitudeForm: document.getElementById('gratitudeForm'),
    gratitudeDate: document.getElementById('gratitudeDate'),
    gratitudeCategory: document.getElementById('gratitudeCategory'),
    gratitudePrompt: document.getElementById('gratitudePrompt'),
    gratitudeResponse: document.getElementById('gratitudeResponse'),
    gratitudeMoodBefore: document.getElementById('gratitudeMoodBefore'),
    gratitudeMoodBeforeValue: document.getElementById('gratitudeMoodBeforeValue'),
    gratitudeMoodAfter: document.getElementById('gratitudeMoodAfter'),
    gratitudeMoodAfterValue: document.getElementById('gratitudeMoodAfterValue'),
    gratitudeTags: document.getElementById('gratitudeTags')
};

// Utility Functions
const showLoading = () => elements.loadingOverlay.classList.add('active');
const hideLoading = () => elements.loadingOverlay.classList.remove('active');

const showModal = (modal) => modal.classList.add('active');
const hideModal = (modal) => modal.classList.remove('active');

// Message display function
const showMessage = (message, type = 'info') => {
    // Remove any existing message
    const existingMessage = document.querySelector('.message-toast');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message-toast message-${type}`;
    messageEl.innerHTML = `
        <div class="message-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add animation styles
    if (!document.querySelector('#message-styles')) {
        const style = document.createElement('style');
        style.id = 'message-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .message-toast .message-content {
                display: flex;
                align-items: center;
                gap: 8px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 300);
        }
    }, 5000);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

// API Functions
const api = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                let message = `Request failed (${response.status})`;
                try {
                    const errorBody = await response.json();
                    if (errorBody) {
                        message = errorBody.error || message;
                        if (Array.isArray(errorBody.details) && errorBody.details.length) {
                            const detailsText = errorBody.details.map(d => d.message).join(', ');
                            if (detailsText) message = `${message}: ${detailsText}`;
                        }
                    }
                } catch {
                    // ignore JSON parse errors and keep default message
                }
                const err = new Error(message);
                err.name = 'ApiError';
                throw err;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Projects
    getProjects: () => api.request('/projects'),
    createProject: (data) => api.request('/projects', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateProject: (id, data) => api.request(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteProject: (id) => api.request(`/projects/${id}`, { method: 'DELETE' }),

    // Notes
    getNotes: (projectId) => api.request(`/notes?project_id=${projectId}`),
    createNote: (data) => api.request('/notes', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    deleteNote: (id) => api.request(`/notes/${id}`, { method: 'DELETE' }),

    // Todos
    getTodos: (projectId) => api.request(`/todos?project_id=${projectId}`),
    createTodo: (data) => api.request('/todos', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateTodo: (id, data) => api.request(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    generateTodos: (projectId) => api.request('/todos/generate', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId })
    }),
    deleteTodo: (id) => api.request(`/todos/${id}`, { method: 'DELETE' }),

    // Reports
    getReports: (projectId) => api.request(`/reports?project_id=${projectId}`),
    generateReport: (data) => api.request('/reports/generate', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    generateWeeklyReport: (data) => api.request('/reports/weekly', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    testEmail: (data) => api.request('/reports/test-email', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getSchedulerStatus: () => api.request('/reports/scheduler/status'),
    triggerWeeklyReport: () => api.request('/reports/scheduler/trigger', { method: 'POST' }),
    deleteReport: (id) => api.request(`/reports/${id}`, { method: 'DELETE' }),

    // Settings
    getSettings: () => api.request('/settings'),
    getEmailSettings: () => api.request('/settings/email'),
    getProfiles: () => api.request('/settings/profiles'),
    saveProfiles: (profiles) => api.request('/settings/profiles', { method: 'PUT', body: JSON.stringify(profiles) }),
    updateSettings: (data) => api.request('/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    updateEmailSettings: (data) => api.request('/settings/email/quick', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    // Timelines
    getTimeline: (projectId) => api.request(`/timelines?project_id=${projectId}`),
    createMilestone: (data) => api.request('/timelines/milestones', { method: 'POST', body: JSON.stringify(data) }),
    updateMilestone: (id, data) => api.request(`/timelines/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteMilestone: (id) => api.request(`/timelines/milestones/${id}`, { method: 'DELETE' }),
    estimateTimeline: (projectId) => api.request('/timelines/estimate', { method: 'POST', body: JSON.stringify({ project_id: projectId }) }),

    // Mood
    getMoodEntries: (startDate, endDate, limit) => {
        let url = '/mood?';
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}&`;
        if (limit) url += `limit=${limit}&`;
        return api.request(url.slice(0, -1));
    },
    getTodayMood: () => api.request('/mood/today'),
    getMoodStats: (days) => api.request(`/mood/stats?days=${days || 30}`),
    getMoodPatterns: (days) => api.request(`/mood/patterns?days=${days || 90}`),
    getMoodAIAnalysis: (days) => api.request(`/mood/ai-analysis?days=${days || 90}`),
    getInterventionTriggers: (days) => api.request(`/mood/intervention-triggers?days=${days || 14}`),
    logIntervention: (data) => api.request('/mood/intervention-log', 'POST', data),
    
    // Workload Tracking
    getWorkloadEntries: (startDate, endDate, limit) => {
        let url = '/workload?';
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}&`;
        if (limit) url += `limit=${limit}&`;
        return api.request(url.slice(0, -1));
    },
    getTodayWorkload: () => api.request('/workload/today'),
    getWorkloadStats: (days) => api.request(`/workload/stats?days=${days || 30}`),
    getWorkloadPatterns: (days) => api.request(`/workload/patterns?days=${days || 90}`),
    getWorkloadBalanceAnalysis: (days) => api.request(`/workload/balance-analysis?days=${days || 30}`),
    createWorkloadEntry: (data) => api.request('/workload', { method: 'POST', body: JSON.stringify(data) }),
    updateWorkloadEntry: (date, data) => api.request(`/workload/${date}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteWorkloadEntry: (date) => api.request(`/workload/${date}`, { method: 'DELETE' }),
    
    // Work Preferences
    getWorkPreferences: () => api.request('/work-preferences'),
    updateWorkPreferences: (data) => api.request('/work-preferences', { method: 'PUT', body: JSON.stringify(data) }),
    resetWorkPreferences: () => api.request('/work-preferences/reset', { method: 'POST' }),
    getWorkBoundaries: (days) => api.request(`/work-preferences/boundaries?days=${days || 30}`),
    getStressAlerts: (days) => api.request(`/work-preferences/stress-alerts?days=${days || 7}`),

    // General Preferences
    getPreferences: () => api.request('/preferences'),
    getPreferencesByCategory: (category) => api.request(`/preferences/${category}`),
    getPreference: (category, key) => api.request(`/preferences/${category}/${key}`),
    createPreference: (data) => api.request('/preferences', { method: 'POST', body: JSON.stringify(data) }),
    updatePreference: (category, key, data) => api.request(`/preferences/${category}/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePreference: (category, key) => api.request(`/preferences/${category}/${key}`, { method: 'DELETE' }),
    bulkUpdatePreferences: (preferences) => api.request('/preferences/bulk', { method: 'POST', body: JSON.stringify({ preferences }) }),
    
    // Break Recommendations
    getBreakRecommendations: (days) => api.request(`/workload/break-recommendations?days=${days || 7}`),
    
    // Balance Dashboard
    getBalanceDashboard: (days) => api.request(`/workload/balance-dashboard?days=${days || 30}`),

    // Learning System
    getLearningStats: () => api.request('/learning/paths/stats'),
    getSkillGaps: () => {
        // Get skills with gaps (current_level < target_level)
        return api.request('/skills?gap_analysis=true');
    },
    getLearningRecommendations: () => api.request('/learning/recommendations'),
    getLearningPaths: (status) => {
        let url = '/learning/paths';
        if (status) url += `?status=${status}`;
        return api.request(url);
    },
    createLearningPath: (data) => api.request('/learning/paths', { method: 'POST', body: JSON.stringify(data) }),
    updateLearningPath: (id, data) => api.request(`/learning/paths/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteLearningPath: (id) => api.request(`/learning/paths/${id}`, { method: 'DELETE' }),
    updateLearningProgress: (id, progress) => api.request(`/learning/paths/${id}/progress`, { method: 'POST', body: JSON.stringify({ progress_percentage: progress }) }),
    getBestPractices: (category, search) => {
        let url = '/learning/practices';
        if (category || search) url += '?';
        if (category) url += `category=${category}&`;
        if (search) url += `tags=${search}&`;
        return api.request(url.slice(0, -1));
    },
    createBestPractice: (data) => api.request('/learning/practices', { method: 'POST', body: JSON.stringify(data) }),
    updateBestPractice: (id, data) => api.request(`/learning/practices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    useBestPractice: (id) => api.request(`/learning/practices/${id}/use`, { method: 'POST' }),

    // Gratitude System
    getGratitudeEntries: (startDate, endDate, limit, category) => {
        let url = '/gratitude?';
        if (startDate) url += `start_date=${startDate}&`;
        if (endDate) url += `end_date=${endDate}&`;
        if (limit) url += `limit=${limit}&`;
        if (category) url += `category=${category}&`;
        return api.request(url.slice(0, -1));
    },
    getTodayGratitude: () => api.request('/gratitude/today'),
    getGratitudePrompts: (params) => {
        let url = '/gratitude/prompts?';
        if (params.category) url += `category=${params.category}&`;
        if (params.mood_level) url += `mood_level=${params.mood_level}&`;
        if (params.recent_achievements) url += `recent_achievements=${params.recent_achievements}&`;
        if (params.personal_focus) url += `personal_focus=${params.personal_focus}&`;
        return api.request(url.slice(0, -1));
    },
    getAchievementBasedPrompts: (days) => api.request(`/gratitude/achievement-based?days=${days || 30}`),
    getPositiveReframing: (challenge) => api.request(`/gratitude/reframing?challenge=${encodeURIComponent(challenge)}`),
    getEncouragement: () => api.request('/gratitude/encouragement'),
    getGratitudeStats: (days) => api.request(`/gratitude/stats?days=${days || 30}`),
    createGratitudeEntry: (data) => api.request('/gratitude', { method: 'POST', body: JSON.stringify(data) }),
    updateGratitudeEntry: (id, data) => api.request(`/gratitude/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteGratitudeEntry: (id) => api.request(`/gratitude/${id}`, { method: 'DELETE' }),
    createMoodEntry: (data) => api.request('/mood', { method: 'POST', body: JSON.stringify(data) }),
    updateMoodEntry: (date, data) => api.request(`/mood/${date}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteMoodEntry: (date) => api.request(`/mood/${date}`, { method: 'DELETE' }),
    
    // Coping Strategies
    getCopingStrategies: (params) => {
        let url = '/coping-strategies?';
        if (params.category) url += `category=${params.category}&`;
        if (params.mood) url += `mood=${params.mood}&`;
        if (params.stressLevel) url += `stress_level=${params.stressLevel}&`;
        if (params.limit) url += `limit=${params.limit}&`;
        return api.request(url.slice(0, -1));
    },
    getRecommendedStrategies: () => api.request('/coping-strategies/recommended'),
    getStrategyCategories: () => api.request('/coping-strategies/categories'),
    getStrategyAnalytics: (days) => api.request(`/coping-strategies/analytics?days=${days || 30}`),
    createStrategy: (data) => api.request('/coping-strategies', { method: 'POST', body: JSON.stringify(data) }),
    useStrategy: (data) => api.request('/coping-strategies/use', { method: 'POST', body: JSON.stringify(data) }),
    getStrategyUsage: (strategyId, limit) => {
        let url = '/coping-strategies/usage?';
        if (strategyId) url += `strategy_id=${strategyId}&`;
        if (limit) url += `limit=${limit}&`;
        return api.request(url.slice(0, -1));
    }
};

// Navigation
// Navigation is now handled by the ProgressTracker class in js/app.js
// This function has been removed to prevent duplicate event listeners

async function loadTabContent(tab) {
    console.log('🏷️ TAB DEBUG: loadTabContent() called for tab:', tab);
    switch(tab) {
        case 'projects':
            console.log('🏷️ TAB DEBUG: Loading projects tab');
            await loadProjects();
            break;
        case 'notes':
            console.log('🏷️ TAB DEBUG: Loading notes tab');
            await loadProjectSelectors();
            bindNotesEvents();
            if (currentProject) await loadNotes(currentProject);
            break;
        case 'todos':
            console.log('🏷️ TAB DEBUG: Loading todos tab');
            await loadProjectSelectors();
            bindTodosEvents();
            if (currentProject) await loadTodos(currentProject);
            break;
        case 'reports':
            console.log('🏷️ TAB DEBUG: Loading reports tab');
            await loadProjectSelectors();
            if (currentProject) await loadReports(currentProject);
            break;
        case 'timelines':
            console.log('🏷️ TAB DEBUG: Loading timelines tab');
            await loadProjectSelectors();
            if (currentProject) await loadTimeline(currentProject);
            bindTimelineEvents();
            break;
        case 'settings':
            console.log('🏷️ TAB DEBUG: Loading settings tab');
            await loadSettings();
            break;
        case 'mood':
            console.log('🏷️ TAB DEBUG: Loading mood tab');
            await loadMoodData();
            await loadCopingStrategies();
            initMoodVisualization();
            break;
        case 'workload':
            console.log('🏷️ TAB DEBUG: Loading workload tab');
            await loadWorkloadData();
            break;
        case 'gratitude':
            console.log('🏷️ TAB DEBUG: Loading gratitude tab');
            await loadGratitudeData();
            break;
        case 'skills':
            console.log('🏷️ TAB DEBUG: Loading skills tab');
            await loadSkills();
            break;
        case 'achievements':
            console.log('🏷️ TAB DEBUG: Loading achievements tab');
            await loadAchievements();
            break;
        case 'reflections':
            console.log('🏷️ TAB DEBUG: Loading reflections tab');
            await loadReflections();
            break;
        case 'learning':
            console.log('🏷️ TAB DEBUG: Loading learning tab');
            await loadLearningData();
            break;
    }
    console.log('🏷️ TAB DEBUG: Tab content loaded for:', tab);
}

// Projects
async function loadProjects() {
    console.log('📁 PROJECT DEBUG: loadProjects() called');
    try {
        console.log('📁 PROJECT DEBUG: Fetching projects from API...');
        projects = await api.getProjects();
        console.log('📁 PROJECT DEBUG: Projects loaded:', projects.length);
        
        console.log('📁 PROJECT DEBUG: Rendering projects...');
        renderProjects();
        console.log('📁 PROJECT DEBUG: Projects rendered successfully');
    } catch (error) {
        console.error('Failed to load projects:', error);
        showError('Failed to load projects');
    }
}

function renderProjects() {
    if (projects.length === 0) {
        elements.projectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Projects Yet</h3>
                <p>Create your first project to start tracking progress</p>
            </div>
        `;
        return;
    }

    elements.projectsGrid.innerHTML = projects.map(project => `
        <div class="card project-card" data-id="${project.id}">
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.description || 'No description')}</p>
            <div class="project-status status-${project.status}">${project.status.replace('_', ' ')}</div>
            <div class="flex gap-2 mt-4">
                <button class="btn btn-primary select-project-btn" data-id="${project.id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-secondary edit-project-btn" data-id="${project.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger delete-project-btn" data-id="${project.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.select-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.target.closest('button').dataset.id;
            selectProject(projectId);
        });
    });

    document.querySelectorAll('.edit-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.target.closest('button').dataset.id;
            editProject(projectId);
        });
    });

    document.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.target.closest('button').dataset.id;
            deleteProject(projectId);
        });
    });
}

function selectProject(projectId) {
    currentProject = projectId;
    updateProjectSelectors();

    // Switch to notes tab
    document.querySelector('[data-tab="notes"]').click();
}

// Update project selection from dropdowns
function updateCurrentProject(projectId) {
    currentProject = projectId;
    updateProjectSelectors();
}

async function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    elements.projectName.value = project.name;
    elements.projectDescription.value = project.description || '';
    elements.projectForm.dataset.editId = projectId;
    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    
    showModal(elements.projectModal);
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated notes, todos, and reports.')) {
        return;
    }

    try {
        showLoading();
        await api.deleteProject(projectId);
        await loadProjects();
        if (currentProject === projectId) {
            currentProject = null;
            updateProjectSelectors();
        }
    } catch (error) {
        showError('Failed to delete project');
    } finally {
        hideLoading();
    }
}

// Project Selectors
async function loadProjectSelectors() {
    if (projects.length === 0) {
        await loadProjects();
    }
    updateProjectSelectors();
}

function updateProjectSelectors() {
    const selectors = [
        elements.notesProjectSelector,
        elements.todosProjectSelector, 
        elements.reportsProjectSelector,
        elements.timelinesProjectSelector
    ];

    selectors.forEach(selector => {
        if (!selector) return;
        
        const currentValue = selector.value;
        selector.innerHTML = '<option value="">Select a project...</option>' +
            projects.map(project => 
                `<option value="${project.id}" ${project.id === currentProject ? 'selected' : ''}>
                    ${escapeHtml(project.name)}
                </option>`
            ).join('');
            
        if (currentProject) {
            selector.value = currentProject;
        }
    });
}

// Notes
function bindNotesEvents() {
    if (elements.notesProjectSelector) {
        elements.notesProjectSelector.onchange = async (e) => {
            updateCurrentProject(e.target.value || null);
            if (currentProject) await loadNotes(currentProject);
        };
    }
}

// Todos
function bindTodosEvents() {
    if (elements.todosProjectSelector) {
        elements.todosProjectSelector.onchange = async (e) => {
            updateCurrentProject(e.target.value || null);
            if (currentProject) await loadTodos(currentProject);
        };
    }
}

// Timelines
function bindTimelineEvents() {
    if (elements.timelinesProjectSelector) {
        elements.timelinesProjectSelector.onchange = async (e) => {
            updateCurrentProject(e.target.value || null);
            if (currentProject) await loadTimeline(currentProject);
        };
    }
    
    if (elements.timelineZoom) {
        elements.timelineZoom.onchange = async () => {
            if (currentProject) await loadTimeline(currentProject);
        };
    }
    
    if (elements.estimateTimelineBtn) {
        elements.estimateTimelineBtn.onclick = async () => {
            if (!currentProject) { showError('Please select a project'); return; }
            try {
                showLoading();
                const res = await api.estimateTimeline(currentProject);
                try {
                    const data = JSON.parse(res.data || '{}');
                    renderTimelineSuggestion(data);
                } catch {
                    // If backend already parsed to object
                    renderTimelineSuggestion(res.data);
                }
            } catch (err) {
                showError('Failed to estimate timeline');
            } finally {
                hideLoading();
            }
        };
    }
    
    if (elements.exportTimelineBtn) {
        elements.exportTimelineBtn.onclick = async () => {
            if (!currentProject) { 
                showError('Please select a project'); 
                return; 
            }
            await exportTimeline();
        };
    }
    
    if (elements.newMilestoneBtn) {
        elements.newMilestoneBtn.onclick = () => {
            if (!currentProject) { 
                showError('Please select a project'); 
                return; 
            }
            openMilestoneModal();
        };
    }
}

// Export Timeline
async function exportTimeline() {
    try {
        showLoading();
        
        // Get current project and timeline data
        const project = projects.find(p => p.id === currentProject);
        if (!project) {
            showError('Project not found');
            return;
        }
        
        const data = await api.getTimeline(currentProject);
        const zoomFilter = elements.timelineZoom?.value || 'all';
        
        // Prepare timeline items
        const allItems = [
            ...data.milestones.map(m => ({
                type: 'milestone',
                date: m.target_date,
                title: m.title,
                description: m.description,
                status: m.status
            })),
            ...data.todos.map(t => ({
                type: 'todo',
                date: t.due_date,
                title: t.title,
                description: t.description,
                status: t.status
            }))
        ].filter(i => i.date);
        
        const items = filterTimelineItems(allItems, zoomFilter);
        
        // Create export content
        const exportContent = generateTimelineExport(project, items, zoomFilter);
        
        // Show export options
        showExportOptions(exportContent, `${project.name}_timeline`);
        
    } catch (error) {
        showError('Failed to export timeline');
    } finally {
        hideLoading();
    }
}

function generateTimelineExport(project, items, filter) {
    const filterLabel = getZoomFilterLabel(filter);
    const date = new Date().toLocaleDateString();
    
    let content = `PROJECT TIMELINE EXPORT\n`;
    content += `========================\n\n`;
    content += `Project: ${project.name}\n`;
    content += `Description: ${project.description || 'No description'}\n`;
    content += `Filter: ${filterLabel}\n`;
    content += `Export Date: ${date}\n`;
    content += `Total Items: ${items.length}\n\n`;
    
    if (items.length === 0) {
        content += `No timeline items found for ${filterLabel}.\n`;
        return content;
    }
    
    // Group by type
    const milestones = items.filter(i => i.type === 'milestone');
    const todos = items.filter(i => i.type === 'todo');
    
    if (milestones.length > 0) {
        content += `MILESTONES\n`;
        content += `==========\n`;
        milestones.forEach(item => {
            content += `• ${item.title}\n`;
            content += `  Date: ${item.date}\n`;
            content += `  Status: ${item.status || 'planned'}\n`;
            if (item.description) {
                content += `  Description: ${item.description}\n`;
            }
            content += `\n`;
        });
    }
    
    if (todos.length > 0) {
        content += `TASKS\n`;
        content += `=====\n`;
        todos.forEach(item => {
            content += `• ${item.title}\n`;
            content += `  Due Date: ${item.date}\n`;
            content += `  Status: ${item.status || 'pending'}\n`;
            if (item.description) {
                content += `  Description: ${item.description}\n`;
            }
            content += `\n`;
        });
    }
    
    return content;
}

function showExportOptions(content, filename) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Export Timeline</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Choose export format:</p>
                <div class="export-options" style="display: flex; gap: 12px; margin: 16px 0;">
                    <button class="btn btn-primary" id="exportTxt">
                        <i class="fas fa-file-text"></i> Text File
                    </button>
                    <button class="btn btn-secondary" id="exportClipboard">
                        <i class="fas fa-clipboard"></i> Copy to Clipboard
                    </button>
                    <button class="btn btn-secondary" id="exportPrint">
                        <i class="fas fa-print"></i> Print
                    </button>
                </div>
                <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 0.9rem;">${content}</textarea>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="closeExportModal">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Export handlers
    modal.querySelector('#exportTxt').onclick = () => {
        downloadAsFile(content, `${filename}.txt`, 'text/plain');
        document.body.removeChild(modal);
    };
    
    modal.querySelector('#exportClipboard').onclick = async () => {
        try {
            await navigator.clipboard.writeText(content);
            showSuccess('Timeline copied to clipboard');
            document.body.removeChild(modal);
        } catch (error) {
            showError('Failed to copy to clipboard');
        }
    };
    
    modal.querySelector('#exportPrint').onclick = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${filename}</title>
                    <style>
                        body { font-family: monospace; margin: 40px; line-height: 1.5; }
                        h1 { color: #333; }
                        pre { white-space: pre-wrap; }
                    </style>
                </head>
                <body>
                    <pre>${content}</pre>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        document.body.removeChild(modal);
    };
    
    modal.querySelector('.modal-close').onclick = () => {
        document.body.removeChild(modal);
    };
    
    modal.querySelector('#closeExportModal').onclick = () => {
        document.body.removeChild(modal);
    };
}

function downloadAsFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Milestone Modal Functions
function openMilestoneModal(milestoneData = null) {
    if (milestoneData) {
        // Edit mode
        document.getElementById('milestoneModalTitle').textContent = 'Edit Milestone';
        elements.milestoneTitle.value = milestoneData.title || '';
        elements.milestoneDescription.value = milestoneData.description || '';
        elements.milestoneTargetDate.value = milestoneData.target_date || '';
        elements.milestoneStatus.value = milestoneData.status || 'planned';
        elements.milestoneForm.dataset.editId = milestoneData.id;
    } else {
        // Create mode
        document.getElementById('milestoneModalTitle').textContent = 'New Milestone';
        elements.milestoneForm.reset();
        delete elements.milestoneForm.dataset.editId;
    }
    showModal(elements.milestoneModal);
}

async function saveMilestone(data) {
    const editId = elements.milestoneForm.dataset.editId;
    
    try {
        showLoading();
        if (editId) {
            await api.updateMilestone(editId, data);
        } else {
            await api.createMilestone({ ...data, project_id: currentProject });
        }
        await loadTimeline(currentProject);
        hideModal(elements.milestoneModal);
        showSuccess(editId ? 'Milestone updated' : 'Milestone created');
    } catch (error) {
        showError(editId ? 'Failed to update milestone' : 'Failed to create milestone');
    } finally {
        hideLoading();
    }
}

async function loadTimeline(projectId) {
    if (!projectId) {
        elements.timelineContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-stream"></i>
                <h3>Select a Project</h3>
                <p>Choose a project to view timeline</p>
            </div>
        `;
        return;
    }
    try {
        const data = await api.getTimeline(projectId);
        renderTimeline(data);
    } catch (e) {
        console.error('Failed to load timeline', e);
        showError('Failed to load timeline');
    }
}

let currentTimelineData = null;

function renderTimeline(data) {
    currentTimelineData = data;
    const now = new Date();
    let allItems = [
        ...data.milestones.map(m => ({
            type: 'milestone',
            date: m.target_date,
            title: m.title,
            description: m.description,
            status: m.status,
            id: m.id
        })),
        ...data.todos.map(t => ({
            type: 'todo',
            date: t.due_date,
            title: t.title,
            description: t.description,
            status: t.status,
            id: t.id
        }))
    ].filter(i => i.date).map(item => {
        // Check for overdue items
        const itemDate = new Date(item.date);
        const isOverdue = itemDate < now && item.status !== 'completed' && item.status !== 'cancelled';
        return {
            ...item,
            isOverdue,
            statusClass: isOverdue ? 'overdue' : (item.status || 'pending').replace('_', '-')
        };
    }).sort((a,b) => new Date(a.date) - new Date(b.date));
    
    // Apply zoom filter
    const zoomFilter = elements.timelineZoom?.value || 'all';
    const items = filterTimelineItems(allItems, zoomFilter);
    const totalCount = allItems.length;

    if (items.length === 0) {
        const emptyMessage = totalCount === 0 
            ? 'No timeline items yet'
            : `No items for ${getZoomFilterLabel(zoomFilter)}`;
        const emptySubtext = totalCount === 0 
            ? 'Add due dates to todos or create milestones'
            : `${totalCount} total items available - try a different time range`;
            
        elements.timelineContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-stream"></i>
                <h3>${emptyMessage}</h3>
                <p>${emptySubtext}</p>
            </div>`;
        return;
    }

    const filterInfo = totalCount !== items.length 
        ? `<div class="timeline-filter-info">
            Showing <span class="filter-count">${items.length}</span> of ${totalCount} items for ${getZoomFilterLabel(zoomFilter)}
           </div>`
        : '';

    elements.timelineContainer.innerHTML = `
        ${filterInfo}
        <div class="timeline">
            ${items.map(it => `
                <div class="timeline-item ${it.type} status-${it.statusClass}" draggable="true" data-type="${it.type}" data-id="${it.id}" data-date="${it.date}">
                    <div class="timeline-date">${escapeHtml(it.date)}</div>
                    <div class="timeline-content">
                        <div class="timeline-title">${it.type === 'milestone' ? '<i class="fas fa-flag"></i>' : '<i class="fas fa-check-square"></i>'} ${escapeHtml(it.title)}</div>
                        ${it.description ? `<div class="timeline-desc">${escapeHtml(it.description)}</div>` : ''}
                        <div class="timeline-meta">
                            <span class="timeline-status-badge ${it.statusClass}">${it.isOverdue ? 'Overdue' : (it.status || 'pending').replace('_', ' ')}</span>
                            ${it.isOverdue ? '<i class="fas fa-exclamation-triangle" style="color: #dc2626; margin-left: 8px;" title="Overdue"></i>' : ''}
                        </div>
                        ${it.type === 'milestone' ? `<div class="flex gap-2">
                            <button class="btn btn-small" data-action="edit" data-id="${it.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-small btn-danger" data-action="delete" data-id="${it.id}"><i class="fas fa-trash"></i></button>
                        </div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    elements.timelineContainer.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('Delete milestone?')) return;
            try {
                showLoading();
                await api.deleteMilestone(id);
                await loadTimeline(currentProject);
            } catch {
                showError('Failed to delete milestone');
            } finally {
                hideLoading();
            }
        });
    });

    elements.timelineContainer.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            // Get milestone data from current timeline data instead of API call
            const milestoneData = currentTimelineData?.milestones?.find(m => m.id === id);
            if (milestoneData) {
                openMilestoneModal(milestoneData);
            } else {
                showError('Milestone not found');
            }
        });
    });

    // Drag & drop reschedule
    const itemsEls = elements.timelineContainer.querySelectorAll('.timeline-item');
    itemsEls.forEach(el => {
        el.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                id: el.getAttribute('data-id'),
                type: el.getAttribute('data-type'),
                date: el.getAttribute('data-date')
            }));
        });
    });
    elements.timelineContainer.addEventListener('dragover', e => {
        e.preventDefault();
    });
    elements.timelineContainer.addEventListener('drop', async e => {
        e.preventDefault();
        const payload = e.dataTransfer.getData('text/plain');
        if (!payload) return;
        let dataObj; try { dataObj = JSON.parse(payload); } catch { return; }
        const newDate = prompt('New date (YYYY-MM-DD):', dataObj.date || '');
        if (!newDate) return;
        try {
            showLoading();
            if (dataObj.type === 'milestone') {
                await api.updateMilestone(dataObj.id, { target_date: newDate });
            } else {
                await api.updateTodo(dataObj.id, { due_date: newDate });
            }
            await loadTimeline(currentProject);
        } catch (err) {
            showError('Failed to reschedule item');
        } finally {
            hideLoading();
        }
    });
}

function renderTimelineSuggestion(suggestion) {
    if (!suggestion || !suggestion.proposed_milestones) {
        showError('No suggestion received');
        return;
    }
    const html = `
        <div class="timeline-suggestion">
            <h3><i class="fas fa-lightbulb"></i> AI Proposed Timeline</h3>
            <ol>
                ${suggestion.proposed_milestones.map(m => `<li><strong>${escapeHtml(m.title)}</strong> — ${escapeHtml(m.target_date || '')}<br><small>${escapeHtml(m.reason || '')}</small></li>`).join('')}
            </ol>
            ${suggestion.timeline_summary ? `<p>${escapeHtml(suggestion.timeline_summary)}</p>` : ''}
            ${suggestion.risks?.length ? `<div class="timeline-risks"><strong>Risks:</strong> ${suggestion.risks.map(escapeHtml).join(', ')}</div>` : ''}
            <div class="flex gap-2" style="margin-top:8px;">
                <button class="btn btn-primary" id="applySuggestionBtn"><i class="fas fa-check"></i> Apply as milestones</button>
            </div>
        </div>`;
    elements.timelineContainer.insertAdjacentHTML('afterbegin', html);
    const applyBtn = document.getElementById('applySuggestionBtn');
    if (applyBtn) {
        applyBtn.onclick = async () => {
            try {
                showLoading();
                for (const m of suggestion.proposed_milestones) {
                    await api.createMilestone({ project_id: currentProject, title: m.title, target_date: m.target_date });
                }
                await loadTimeline(currentProject);
            } catch {
                showError('Failed to apply milestones');
            } finally {
                hideLoading();
            }
        };
    }
}

// Notes
async function loadNotes(projectId) {
    if (!projectId) {
        elements.notesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h3>Select a Project</h3>
                <p>Choose a project to view and add notes</p>
            </div>
        `;
        return;
    }

    try {
        const notes = await api.getNotes(projectId);
        renderNotes(notes);
    } catch (error) {
        console.error('Failed to load notes:', error);
        showError('Failed to load notes');
    }
}

function renderNotes(notes) {
    if (notes.length === 0) {
        elements.notesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h3>No Notes Yet</h3>
                <p>Add your first note above to get started</p>
            </div>
        `;
        return;
    }

    elements.notesList.innerHTML = notes.map(note => {
        const structuredData = note.structured_data;
        let enhancedSection = '';
        
        if (note.enhanced_content && structuredData) {
            enhancedSection = `
                <div class="note-enhanced">
                    <div class="note-enhanced-header">
                        <i class="fas fa-magic"></i> AI Enhanced
                    </div>
                    <div class="enhanced-content">${escapeHtml(note.enhanced_content)}</div>
                    ${structuredData.key_insights ? `
                        <div class="note-insights">
                            ${structuredData.key_insights.map(insight => 
                                `<span class="insight-tag">${escapeHtml(insight)}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        return `
            <div class="card note-card">
                <div class="note-header">
                    <span class="note-date">${formatDate(note.created_at)}</span>
                    <button class="btn btn-danger btn-small delete-note-btn" data-id="${note.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="note-content">${escapeHtml(note.content).replace(/\n/g, '<br>')}</div>
                ${enhancedSection}
            </div>
        `;
    }).join('');

    // Add delete event listeners
    document.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const noteId = e.target.closest('button').dataset.id;
            await deleteNote(noteId);
        });
    });
}

async function addNote() {
    const content = elements.noteInput.value.trim();
    if (!content || !currentProject) {
        showError('Please select a project and enter note content');
        return;
    }

    try {
        showLoading();
        await api.createNote({
            project_id: currentProject,
            content: content
        });
        
        elements.noteInput.value = '';
        await loadNotes(currentProject);
    } catch (error) {
        console.error('Failed to add note:', error);
        showError('Failed to add note');
    } finally {
        hideLoading();
    }
}

// Voice Notes (Speech-to-Text)
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recognition = null;
let isDeviceSttActive = false;
let deviceSttFinalText = '';

async function toggleVoiceRecording() {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const deviceSttSupported = !!SpeechRecognition && location.protocol === 'https:';

        if (!isRecording && !isDeviceSttActive) {
            if (deviceSttSupported) {
                startDeviceStt(SpeechRecognition);
                return;
            }
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showError('Microphone not supported in this browser');
                console.warn('MediaDevices/getUserMedia not available');
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream, { mimeType: getSupportedAudioMimeType() });
            mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
                await uploadForTranscription(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            mediaRecorder.start();
            isRecording = true;
            updateRecordUI(true);
        } else {
            if (isDeviceSttActive) {
                stopDeviceStt();
            } else {
                mediaRecorder?.stop();
                isRecording = false;
                updateRecordUI(false);
            }
        }
    } catch (e) {
        showError('Failed to access microphone');
        updateRecordUI(false);
    }
}

function startDeviceStt(SpeechRecognitionCtor) {
    try {
        recognition = new SpeechRecognitionCtor();
        recognition.lang = navigator.language || 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;
        isDeviceSttActive = true;
        deviceSttFinalText = '';
        updateRecordUI(true);
        elements.recordStatus.textContent = 'Listening… click to stop';

        const startingNoteValue = elements.noteInput.value;

        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const res = event.results[i];
                if (res.isFinal) {
                    const t = res[0].transcript.trim();
                    if (t) deviceSttFinalText += (deviceSttFinalText ? ' ' : '') + t;
                } else {
                    interim += res[0].transcript;
                }
            }
            const parts = [];
            if (startingNoteValue) parts.push(startingNoteValue);
            if (deviceSttFinalText) parts.push(deviceSttFinalText);
            if (interim.trim()) parts.push(interim.trim());
            elements.noteInput.value = parts.join('\n');
        };

        recognition.onerror = () => {
            showError('Device speech recognition error');
            stopDeviceStt();
        };

        recognition.onend = () => {
            if (isDeviceSttActive) {
                elements.recordStatus.textContent = '';
                updateRecordUI(false);
                isDeviceSttActive = false;
            }
        };

        recognition.start();
    } catch (err) {
        showError('Device speech recognition unavailable');
        isDeviceSttActive = false;
        updateRecordUI(false);
    }
}

function stopDeviceStt() {
    try { if (recognition && recognition.stop) recognition.stop(); } catch {}
    isDeviceSttActive = false;
    updateRecordUI(false);
    elements.recordStatus.textContent = '';
}

function getSupportedAudioMimeType() {
    const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg'
    ];
    for (const t of candidates) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return 'audio/webm';
}

function updateRecordUI(active) {
    const btn = elements.recordVoiceBtn;
    const status = elements.recordStatus;
    if (!btn) return;
    if (active) {
        btn.classList.add('recording');
        status.textContent = 'Recording... click to stop';
    } else {
        btn.classList.remove('recording');
        status.textContent = '';
    }
}

async function uploadForTranscription(blob) {
    try {
        // Use inline mic status instead of global overlay
        elements.recordVoiceBtn?.classList.add('transcribing');
        elements.recordStatus.textContent = 'Transcribing audio…';
        const form = new FormData();
        const filename = `voice-note-${Date.now()}.${blob.type.includes('ogg') ? 'ogg' : 'webm'}`;
        form.append('audio', blob, filename);
        const res = await fetch(`${API_BASE_URL}/notes/transcribe`, {
            method: 'POST',
            body: form
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || 'Transcription failed');
        }
        const data = await res.json();
        if (data?.transcript) {
            const existing = elements.noteInput.value;
            elements.noteInput.value = existing ? `${existing}\n${data.transcript}` : data.transcript;
        } else {
            showError('No transcript returned');
        }
    } catch (e) {
        showError('Failed to transcribe audio');
    } finally {
        elements.recordVoiceBtn?.classList.remove('transcribing');
        if (!isRecording) elements.recordStatus.textContent = '';
    }
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        showLoading();
        await api.deleteNote(noteId);
        await loadNotes(currentProject);
    } catch (error) {
        showError('Failed to delete note');
    } finally {
        hideLoading();
    }
}

// Todos
async function loadTodos(projectId) {
    if (!projectId) {
        elements.todosList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>Select a Project</h3>
                <p>Choose a project to view and manage todos</p>
            </div>
        `;
        return;
    }

    try {
        const todos = await api.getTodos(projectId);
        renderTodos(todos);
    } catch (error) {
        console.error('Failed to load todos:', error);
        showError('Failed to load todos');
    }
}

function renderTodos(todos) {
    if (todos.length === 0) {
        elements.todosList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No Tasks Yet</h3>
                <p>Add tasks manually or use AI suggestions</p>
            </div>
        `;
        return;
    }

    elements.todosList.innerHTML = todos.map(todo => `
        <div class="card todo-card ${todo.status === 'completed' ? 'todo-completed' : ''}">
            <input type="checkbox" class="todo-checkbox" 
                   ${todo.status === 'completed' ? 'checked' : ''}
                   data-id="${todo.id}">
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
                <div class="todo-meta">
                    <span class="priority-${todo.priority}">${todo.priority} priority</span>
                    ${todo.due_date ? `<span><i class="fas fa-calendar"></i> ${formatDate(todo.due_date)}</span>` : ''}
                    <span>${todo.status}</span>
                    ${todo.llm_generated ? '<span class="ai-generated"><i class="fas fa-robot"></i> AI Generated</span>' : ''}
                </div>
            </div>
            <button class="btn btn-danger btn-small delete-todo-btn" data-id="${todo.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const todoId = e.target.dataset.id;
            const completed = e.target.checked;
            await toggleTodo(todoId, completed);
        });
    });

    document.querySelectorAll('.delete-todo-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const todoId = e.target.closest('button').dataset.id;
            await deleteTodo(todoId);
        });
    });
}

async function toggleTodo(todoId, completed) {
    try {
        await api.updateTodo(todoId, {
            status: completed ? 'completed' : 'pending'
        });
    } catch (error) {
        showError('Failed to update todo');
        // Revert checkbox state
        document.querySelector(`[data-id="${todoId}"]`).checked = !completed;
    }
}

async function generateTodos() {
    if (!currentProject) {
        showError('Please select a project first');
        return;
    }

    try {
        showLoading();
        await api.generateTodos(currentProject);
        await loadTodos(currentProject);
    } catch (error) {
        console.error('Failed to generate todos:', error);
        showError('Failed to generate AI todo suggestions');
    } finally {
        hideLoading();
    }
}

async function deleteTodo(todoId) {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
        await api.deleteTodo(todoId);
        await loadTodos(currentProject);
    } catch (error) {
        showError('Failed to delete todo');
    }
}

// Reports
async function loadReports(projectId) {
    if (!projectId) {
        elements.reportsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>Select a Project</h3>
                <p>Choose a project to view and generate reports</p>
            </div>
        `;
        return;
    }

    try {
        // Dispatch event for reports module to handle
        const event = new CustomEvent('reports:load', {
            detail: { projectId }
        });
        document.dispatchEvent(event);
    } catch (error) {
        console.error('Failed to load reports:', error);
        showError('Failed to load reports');
    }
}

function renderReports(reports) {
    // This function is deprecated - reports module handles rendering
    console.warn('renderReports function is deprecated. Reports module handles rendering now.');
}

async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
        // Dispatch event for reports module to handle
        const event = new CustomEvent('reports:delete', {
            detail: { reportId }
        });
        document.dispatchEvent(event);
    } catch (error) {
        showError('Failed to delete report');
    }
}

// Preferences Functions
async function loadPreferences() {
    try {
        const preferences = await api.getPreferences();

        // Group preferences by category for easier access
        const prefsByCategory = {};
        preferences.forEach(pref => {
            if (!prefsByCategory[pref.preference_category]) {
                prefsByCategory[pref.preference_category] = {};
            }
            prefsByCategory[pref.preference_category][pref.preference_key] = pref.preference_value;
        });

        // Load coaching preferences
        if (prefsByCategory.coaching) {
            const coaching = prefsByCategory.coaching;
            document.getElementById('coachingPersonality').value = coaching.personality || 'supportive';
            document.getElementById('communicationFrequency').value = coaching.communication_frequency || 'moderate';
            document.getElementById('detailLevel').value = coaching.detail_level || 'balanced';
        }

        // Load notification preferences
        if (prefsByCategory.notifications) {
            const notifications = prefsByCategory.notifications;
            document.getElementById('moodCheckReminder').checked = notifications.mood_check_reminder === 'true';
            document.getElementById('reflectionReminders').checked = notifications.reflection_reminders === 'true';
            document.getElementById('achievementCelebrations').checked = notifications.achievement_celebrations === 'true';
            document.getElementById('learningSuggestions').checked = notifications.learning_suggestions === 'true';
        }

        // Load wellbeing preferences
        if (prefsByCategory.wellbeing) {
            const wellbeing = prefsByCategory.wellbeing;
            document.getElementById('stressThreshold').value = wellbeing.stress_threshold || '7';
            document.getElementById('workHoursTarget').value = wellbeing.work_hours_target || '8';
            document.getElementById('breakFrequency').value = wellbeing.break_frequency_minutes || '90';
            document.getElementById('weekendWorkAlerts').checked = wellbeing.weekend_work_alerts === 'true';
        }

        // Load learning preferences
        if (prefsByCategory.learning) {
            const learning = prefsByCategory.learning;
            document.getElementById('learningStyle').value = learning.preferred_learning_style || 'balanced';
            document.getElementById('challengeLevel').value = learning.challenge_level || 'moderate';
            document.getElementById('learningTimePreference').value = learning.learning_time_preference || 'morning';
        }

        // Load privacy preferences
        if (prefsByCategory.privacy) {
            const privacy = prefsByCategory.privacy;
            document.getElementById('dataSharingLevel').value = privacy.data_sharing_level || 'minimal';
            document.getElementById('coachingHistoryRetention').value = privacy.coaching_history_retention || '365';
        }

        console.log('Preferences loaded successfully');
    } catch (error) {
        console.error('Error loading preferences:', error);
        showMessage('Failed to load preferences', 'error');
    }
}

async function savePreferences() {
    try {
        const preferences = [
            // Coaching preferences
            {
                preference_category: 'coaching',
                preference_key: 'personality',
                preference_value: document.getElementById('coachingPersonality').value,
                preference_type: 'string',
                description: 'AI coaching personality'
            },
            {
                preference_category: 'coaching',
                preference_key: 'communication_frequency',
                preference_value: document.getElementById('communicationFrequency').value,
                preference_type: 'string',
                description: 'Frequency of AI coaching interactions'
            },
            {
                preference_category: 'coaching',
                preference_key: 'detail_level',
                preference_value: document.getElementById('detailLevel').value,
                preference_type: 'string',
                description: 'Level of coaching detail'
            },

            // Notification preferences
            {
                preference_category: 'notifications',
                preference_key: 'mood_check_reminder',
                preference_value: document.getElementById('moodCheckReminder').checked.toString(),
                preference_type: 'boolean',
                description: 'Enable daily mood check-in reminders'
            },
            {
                preference_category: 'notifications',
                preference_key: 'reflection_reminders',
                preference_value: document.getElementById('reflectionReminders').checked.toString(),
                preference_type: 'boolean',
                description: 'Enable reflection prompt reminders'
            },
            {
                preference_category: 'notifications',
                preference_key: 'achievement_celebrations',
                preference_value: document.getElementById('achievementCelebrations').checked.toString(),
                preference_type: 'boolean',
                description: 'Enable achievement celebration notifications'
            },
            {
                preference_category: 'notifications',
                preference_key: 'learning_suggestions',
                preference_value: document.getElementById('learningSuggestions').checked.toString(),
                preference_type: 'boolean',
                description: 'Enable AI learning path suggestions'
            },

            // Wellbeing preferences
            {
                preference_category: 'wellbeing',
                preference_key: 'stress_threshold',
                preference_value: document.getElementById('stressThreshold').value,
                preference_type: 'integer',
                description: 'Stress level threshold for AI intervention'
            },
            {
                preference_category: 'wellbeing',
                preference_key: 'work_hours_target',
                preference_value: document.getElementById('workHoursTarget').value,
                preference_type: 'integer',
                description: 'Target daily work hours'
            },
            {
                preference_category: 'wellbeing',
                preference_key: 'break_frequency_minutes',
                preference_value: document.getElementById('breakFrequency').value,
                preference_type: 'integer',
                description: 'Recommended break frequency in minutes'
            },
            {
                preference_category: 'wellbeing',
                preference_key: 'weekend_work_alerts',
                preference_value: document.getElementById('weekendWorkAlerts').checked.toString(),
                preference_type: 'boolean',
                description: 'Alert when working on weekends'
            },

            // Learning preferences
            {
                preference_category: 'learning',
                preference_key: 'preferred_learning_style',
                preference_value: document.getElementById('learningStyle').value,
                preference_type: 'string',
                description: 'Preferred learning style'
            },
            {
                preference_category: 'learning',
                preference_key: 'challenge_level',
                preference_value: document.getElementById('challengeLevel').value,
                preference_type: 'string',
                description: 'Preferred challenge level'
            },
            {
                preference_category: 'learning',
                preference_key: 'learning_time_preference',
                preference_value: document.getElementById('learningTimePreference').value,
                preference_type: 'string',
                description: 'Preferred time for learning'
            },

            // Privacy preferences
            {
                preference_category: 'privacy',
                preference_key: 'data_sharing_level',
                preference_value: document.getElementById('dataSharingLevel').value,
                preference_type: 'string',
                description: 'Level of data sharing for AI'
            },
            {
                preference_category: 'privacy',
                preference_key: 'coaching_history_retention',
                preference_value: document.getElementById('coachingHistoryRetention').value,
                preference_type: 'integer',
                description: 'Days to retain coaching session history'
            }
        ];

        await api.bulkUpdatePreferences(preferences);
        showMessage('Preferences saved successfully!', 'success');
        console.log('Preferences saved successfully');
    } catch (error) {
        console.error('Error saving preferences:', error);
        showMessage('Failed to save preferences', 'error');
    }
}

async function resetPreferencesToDefaults() {
    if (!confirm('Are you sure you want to reset all preferences to default values?')) {
        return;
    }

    try {
        // Load current preferences and reset them to defaults
        await loadPreferences();

        // Set all form elements to their default values
        document.getElementById('coachingPersonality').value = 'supportive';
        document.getElementById('communicationFrequency').value = 'moderate';
        document.getElementById('detailLevel').value = 'balanced';

        document.getElementById('moodCheckReminder').checked = true;
        document.getElementById('reflectionReminders').checked = true;
        document.getElementById('achievementCelebrations').checked = true;
        document.getElementById('learningSuggestions').checked = true;

        document.getElementById('stressThreshold').value = '7';
        document.getElementById('workHoursTarget').value = '8';
        document.getElementById('breakFrequency').value = '90';
        document.getElementById('weekendWorkAlerts').checked = true;

        document.getElementById('learningStyle').value = 'balanced';
        document.getElementById('challengeLevel').value = 'moderate';
        document.getElementById('learningTimePreference').value = 'morning';

        document.getElementById('dataSharingLevel').value = 'minimal';
        document.getElementById('coachingHistoryRetention').value = '365';

        showMessage('Preferences reset to defaults', 'success');
        console.log('Preferences reset to defaults');
    } catch (error) {
        console.error('Error resetting preferences:', error);
        showMessage('Failed to reset preferences', 'error');
    }
}

function initPreferencesEventHandlers() {
    // Save preferences button
    document.getElementById('savePreferencesBtn')?.addEventListener('click', savePreferences);

    // Reset preferences button
    document.getElementById('resetPreferencesBtn')?.addEventListener('click', resetPreferencesToDefaults);
}

// Settings
async function loadSettings() {
    try {
        await loadEmailSettings();
        await loadSchedulerStatus();
        await loadProfiles();
        await loadLlmSettings();
        await loadPreferences();
        initCoaching();
    } catch (error) {
        console.error('Failed to load settings:', error);
        showError('Failed to load settings');
    }
}

async function loadEmailSettings() {
    try {
        const emailSettings = await api.getEmailSettings();
        
        document.getElementById('weeklyReportEmail').value = emailSettings.data.weekly_report_email || '';
        document.getElementById('weeklyReportRecipients').value = (emailSettings.data.weekly_report_recipients || []).join(', ');
        document.getElementById('weeklyReportsEnabled').checked = emailSettings.data.weekly_reports_enabled || false;
        document.getElementById('reportSchedule').value = emailSettings.data.weekly_report_schedule || '0 9 * * 1';
        const primarySelect = document.getElementById('primaryProject');
        // Ensure we have projects loaded for the selector
        if (primarySelect) {
            if (!projects || projects.length === 0) {
                try {
                    projects = await api.getProjects();
                } catch (e) {
                    console.warn('Could not load projects for primary project selector');
                }
            }
            primarySelect.innerHTML = '<option value="">Select project for AI status...</option>' +
                projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
            primarySelect.value = emailSettings.data.primary_project_id || '';
        }
        const useAi = document.getElementById('useAiStatus');
        if (useAi) useAi.checked = !!emailSettings.data.weekly_use_ai_status;
        const narrativeOnly = document.getElementById('narrativeOnly');
        if (narrativeOnly) narrativeOnly.checked = !!emailSettings.data.weekly_narrative_only;
    } catch (error) {
        console.error('Failed to load email settings:', error);
    }
}

// Profiles UI
function renderProfiles(profiles) {
    const container = document.getElementById('profilesList');
    if (!container) return;
    if (!Array.isArray(profiles) || profiles.length === 0) {
        container.innerHTML = '<p>No groups yet. Click "Add Group" to create one.</p>';
        return;
    }
    container.innerHTML = profiles.map((p, idx) => `
        <div class="profile-row" data-index="${idx}" style="display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap;">
            <input type="text" class="profile-name" value="${escapeHtml(p.name)}" placeholder="Group name" style="flex:1; min-width:160px;" />
            <select class="profile-template">
                <option value="self" ${p.template === 'self' ? 'selected' : ''}>Self</option>
                <option value="manager" ${p.template === 'manager' ? 'selected' : ''}>Manager</option>
                <option value="company" ${p.template === 'company' ? 'selected' : ''}>Company</option>
            </select>
            <input type="text" class="profile-cron" value="${escapeHtml(p.cron)}" placeholder="Cron (e.g., 0 9 * * 1)" style="width:160px;" />
            <input type="text" class="profile-recipients" value="${escapeHtml((p.recipients||[]).join(', '))}" placeholder="Emails (comma)" style="flex:2; min-width:220px;" />
            <label class="checkbox-label" style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" class="profile-enabled" ${p.enabled ? 'checked' : ''} /> Enabled
            </label>
            <button type="button" class="btn btn-danger btn-small remove-profile">Remove</button>
        </div>
    `).join('');

    // Wire remove buttons
    container.querySelectorAll('.remove-profile').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.profile-row');
            row.remove();
        });
    });
}

async function loadProfiles() {
    try {
        const res = await api.getProfiles();
        renderProfiles(res.data || []);
    } catch (e) {
        console.warn('Failed to load profiles');
    }
}

function collectProfilesFromUI() {
    const container = document.getElementById('profilesList');
    const rows = Array.from(container?.querySelectorAll('.profile-row') || []);
    return rows.map((row, idx) => {
        const name = row.querySelector('.profile-name').value.trim();
        const template = row.querySelector('.profile-template').value;
        const cron = row.querySelector('.profile-cron').value.trim() || '0 9 * * 1';
        const recipients = row.querySelector('.profile-recipients').value.split(',').map(e => e.trim()).filter(Boolean);
        const enabled = row.querySelector('.profile-enabled').checked;
        return { id: `profile-${idx}`, name, template, cron, recipients, enabled };
    });
}

async function loadSchedulerStatus() {
    try {
        const status = await api.getSchedulerStatus();

        const data = status.data || status; // backward compatibility
        // Update status indicators
        document.getElementById('reportsStatusValue').textContent =
            data.scheduler.isRunning ? 'Active' : 'Disabled';
        document.getElementById('reportsStatusValue').className =
            `status-value ${data.scheduler.isRunning ? 'status-active' : 'status-disabled'}`;

        document.getElementById('nextReportTime').textContent =
            data.scheduler.nextRun ? new Date(data.scheduler.nextRun).toLocaleString() : 'Not scheduled';

        document.getElementById('sendgridStatus').textContent =
            data.environment.sendgridConfigured ? 'Configured' : 'Not configured';
        document.getElementById('sendgridStatus').className =
            `status-value ${data.environment.sendgridConfigured ? 'status-active' : 'status-disabled'}`;

        // Hide SendGrid configuration section if already configured
        const sendgridSection = document.getElementById('sendgridConfigSection');
        if (sendgridSection) {
            if (data.environment.sendgridConfigured) {
                sendgridSection.style.display = 'none';
            } else {
                sendgridSection.style.display = '';
            }
        }
    } catch (error) {
        console.error('Failed to load scheduler status:', error);
        document.getElementById('reportsStatusValue').textContent = 'Error loading status';
    }
}

// LLM Settings
async function loadLlmSettings() {
    try {
        const all = await api.getSettings();
        const data = all.data || all;
        
        // Load all the new settings
        const elements = {
            preset: document.getElementById('llmPresetTemplate'),
            tone: document.getElementById('llmTone'),
            detail: document.getElementById('llmDetailLevel'),
            language: document.getElementById('llmLanguage'),
            prompt: document.getElementById('llmSystemPrompt'),
            promptModeGenerated: document.getElementById('llmPromptModeGenerated'),
            promptModeCustom: document.getElementById('llmPromptModeCustom')
        };
        
        if (elements.preset) elements.preset.value = data.llm_preset_template || 'default';
        if (elements.tone) elements.tone.value = data.llm_tone || 'professional';
        if (elements.detail) elements.detail.value = data.llm_detail_level || 'balanced';
        if (elements.language) elements.language.value = data.llm_language || 'auto';
        if (elements.prompt) elements.prompt.value = data.llm_system_prompt || '';
        
        // Set system prompt mode
        const promptMode = data.llm_system_prompt_mode || 'generated';
        if (elements.promptModeGenerated && elements.promptModeCustom) {
            if (promptMode === 'generated') {
                elements.promptModeGenerated.checked = true;
            } else {
                elements.promptModeCustom.checked = true;
            }
        }
        
        // Load generated prompt preview
        await loadGeneratedPromptPreview();
        
        // Update prompt sections visibility
        updatePromptSections();
        
        // Update the preview
        updateLlmPreview();
        
        // Add change listeners for live preview
        Object.values(elements).forEach(el => {
            if (el) {
                if (el.type === 'radio') {
                    el.addEventListener('change', handlePromptModeChange);
                } else {
                    el.addEventListener('change', updateLlmPreview);
                    if (el.tagName === 'TEXTAREA') el.addEventListener('input', updateLlmPreview);
                }
            }
        });
        
    } catch (e) {
        console.warn('Failed to load AI settings');
    }
}

async function loadGeneratedPromptPreview() {
    try {
        const response = await api.request('/llm/generated-prompt');
        const generatedPromptText = document.getElementById('generatedPromptText');
        if (generatedPromptText && response.success) {
            generatedPromptText.textContent = response.data;
        }
    } catch (e) {
        console.warn('Failed to load generated prompt preview');
    }
}

function handlePromptModeChange() {
    updatePromptSections();
    updateLlmPreview();
}

function updatePromptSections() {
    const promptModeGenerated = document.getElementById('llmPromptModeGenerated');
    const generatedSection = document.getElementById('generatedPromptPreview');
    const customSection = document.getElementById('customPromptSection');
    
    if (promptModeGenerated && promptModeGenerated.checked) {
        // Show generated prompt preview, hide custom section
        if (generatedSection) generatedSection.style.display = 'block';
        if (customSection) customSection.style.display = 'none';
    } else {
        // Hide generated prompt preview, show custom section
        if (generatedSection) generatedSection.style.display = 'none';
        if (customSection) customSection.style.display = 'block';
    }
}

function updateLlmPreview() {
    const elements = {
        preset: document.getElementById('llmPresetTemplate'),
        tone: document.getElementById('llmTone'),
        detail: document.getElementById('llmDetailLevel'),
        language: document.getElementById('llmLanguage'),
        prompt: document.getElementById('llmSystemPrompt')
    };
    
    const values = {
        preset: elements.preset?.value || 'default',
        tone: elements.tone?.value || 'professional',
        detail: elements.detail?.value || 'balanced',
        language: elements.language?.value || 'auto',
        prompt: elements.prompt?.value || ''
    };
    
    // Build preview text
    const previewParts = [];
    
    // Role context
    const roleDescriptions = {
        'default': 'Tim\'s AI assistant for continuous improvement at Evos Amsterdam',
        'consultant': 'Management consultant focused on process improvement and strategic recommendations',
        'analyst': 'Business analyst emphasizing data-driven insights and systematic evaluation',
        'manager': 'Project manager focusing on execution, timelines, and stakeholder coordination',
        'technical': 'Technical expert emphasizing implementation details and best practices',
        'creative': 'Creative strategist encouraging innovative approaches and out-of-the-box thinking'
    };
    previewParts.push(`Role: ${roleDescriptions[values.preset]}`);
    
    // Communication style
    const toneDescriptions = {
        'professional': 'Professional, clear, business-appropriate language',
        'friendly': 'Warm, approachable, and supportive communication',
        'formal': 'Strict formality and professional business language',
        'concise': 'Direct, brief, eliminate unnecessary words',
        'enthusiastic': 'Positive energy and excitement about the work',
        'analytical': 'Data-focused, logical, and structured approach',
        'creative': 'Innovative thinking and creative solutions'
    };
    previewParts.push(`Style: ${toneDescriptions[values.tone]}`);
    
    // Detail level
    const detailDescriptions = {
        'brief': 'Essential information only, very concise',
        'balanced': 'Adequate detail without being verbose',
        'detailed': 'Comprehensive explanations and analysis',
        'comprehensive': 'Exhaustive coverage with examples and context'
    };
    previewParts.push(`Detail: ${detailDescriptions[values.detail]}`);
    
    // Language
    if (values.language !== 'auto') {
        const languageMap = {
            'english': 'English',
            'dutch': 'Dutch (Nederlands)',
            'german': 'German (Deutsch)',
            'french': 'French (Français)',
            'spanish': 'Spanish (Español)'
        };
        previewParts.push(`Language: ${languageMap[values.language]}`);
    }
    
    // Custom instructions
    if (values.prompt.trim()) {
        previewParts.push(`\nCustom Instructions:\n"${values.prompt.trim()}"`);
    }
    
    const previewEl = document.getElementById('previewText');
    if (previewEl) {
        previewEl.textContent = previewParts.join('\n');
    }
}

async function saveLlmSettings(event) {
    event.preventDefault();
    
    // Get system prompt mode
    const promptModeGenerated = document.getElementById('llmPromptModeGenerated');
    const systemPromptMode = promptModeGenerated?.checked ? 'generated' : 'custom';
    
    const settings = {
        llm_preset_template: document.getElementById('llmPresetTemplate')?.value || 'default',
        llm_tone: document.getElementById('llmTone')?.value || 'professional',
        llm_detail_level: document.getElementById('llmDetailLevel')?.value || 'balanced',
        llm_language: document.getElementById('llmLanguage')?.value || 'auto',
        llm_system_prompt_mode: systemPromptMode,
        llm_system_prompt: document.getElementById('llmSystemPrompt')?.value || ''
    };
    
    try {
        showLoading();
        await api.updateSettings(settings);
        showSuccess('AI configuration saved successfully!');
    } catch (e) {
        showError('Failed to save AI configuration');
    } finally {
        hideLoading();
    }
}

function resetLlmDefaults() {
    if (!confirm('Reset all AI settings to defaults? This will lose your current configuration.')) {
        return;
    }
    
    const elements = {
        preset: document.getElementById('llmPresetTemplate'),
        tone: document.getElementById('llmTone'),
        detail: document.getElementById('llmDetailLevel'),
        language: document.getElementById('llmLanguage'),
        prompt: document.getElementById('llmSystemPrompt')
    };
    
    if (elements.preset) elements.preset.value = 'default';
    if (elements.tone) elements.tone.value = 'professional';
    if (elements.detail) elements.detail.value = 'balanced';
    if (elements.language) elements.language.value = 'auto';
    if (elements.prompt) elements.prompt.value = '';
    
    updateLlmPreview();
}



async function saveEmailSettings(event) {
    event.preventDefault();
    
    const email = document.getElementById('weeklyReportEmail').value;
    const enabled = document.getElementById('weeklyReportsEnabled').checked;
    const schedule = document.getElementById('reportSchedule').value;
    const primaryProjectId = document.getElementById('primaryProject')?.value || '';
    const useAiStatus = document.getElementById('useAiStatus')?.checked || false;
    const narrativeOnly = document.getElementById('narrativeOnly')?.checked || false;
    
    if (!email) {
        showError('Please enter an email address');
        return;
    }
    
    try {
        showLoading();
        
        // Update email settings
        const recipients = document.getElementById('weeklyReportRecipients').value
            .split(',')
            .map(e => e.trim())
            .filter(e => e.length);
        await api.updateEmailSettings({
            email: email,
            enabled: enabled,
            recipients: recipients,
            weekly_use_ai_status: useAiStatus,
            weekly_narrative_only: narrativeOnly
        });
        
        // Update schedule if provided
        if (schedule) {
            await api.updateSettings({
                weekly_report_schedule: schedule,
                primary_project_id: primaryProjectId
            });
        }
        
        showSuccess('Settings saved successfully!');
        await loadSchedulerStatus();
    } catch (error) {
        console.error('Failed to save settings:', error);
        showError('Failed to save settings');
    } finally {
        hideLoading();
    }
}

async function sendTestEmail() {
    const email = document.getElementById('weeklyReportEmail').value;
    
    if (!email) {
        showError('Please enter an email address first');
        return;
    }
    
    try {
        showLoading();
        const result = await api.testEmail({ recipient: email });
        
        if (result.success) {
            showSuccess(`Test email sent successfully to ${email}!`);
        } else {
            showError('Failed to send test email: ' + result.error);
        }
    } catch (error) {
        console.error('Failed to send test email:', error);
        showError('Failed to send test email');
    } finally {
        hideLoading();
    }
}

async function generateWeeklyReportNow() {
    const email = document.getElementById('weeklyReportEmail').value;

    if (!email) {
        showError('Please configure an email address first');
        return;
    }

    try {
        showLoading();
        // Dispatch event for reports module to handle
        const event = new CustomEvent('reports:generateWeekly');
        document.dispatchEvent(event);
    } catch (error) {
        console.error('Failed to generate weekly report:', error);
        showError('Failed to generate weekly report');
    } finally {
        hideLoading();
    }
}

async function refreshStatus() {
    try {
        showLoading();
        await loadSchedulerStatus();
        showSuccess('Status refreshed');
    } catch (error) {
        showError('Failed to refresh status');
    } finally {
        hideLoading();
    }
}

// Modal Handlers
function initModals() {
    // Project Modal
    document.getElementById("newProjectBtn")?.addEventListener("click", () => {
        const form = document.getElementById("projectForm");
        const modalTitle = document.getElementById("projectModalTitle");
        const modal = document.getElementById("projectModal");
        
        if (form && modalTitle && modal) {
            form.reset();
            delete form.dataset.editId;
            modalTitle.textContent = "New Project";
            showModal(modal);
        }
    });
}
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

function showError(message) {
    // Simple error display - could be enhanced with a toast system
    alert('Error: ' + message);
}

function showSuccess(message) {
    // Simple success display - could be enhanced with a toast system
    alert('Success: ' + message);
}

// Coaching Functions
let coachingConversation = [];

function startConversation(topic) {
    const topicMessages = {
        motivation: "I notice you might need some motivation today. That's completely natural - even the most dedicated professionals have moments when they need a boost. What's been weighing on your mind lately?",
        challenge: "Challenges are growth opportunities in disguise, and you've tackled many before successfully. Tell me about what you're facing right now - I'm here to help you work through it.",
        growth: "Your commitment to continuous improvement shows your dedication to excellence. What aspects of your professional development are you thinking about? Let's explore how you can take the next step forward.",
        confidence: "Confidence comes from recognizing your achievements and trusting your capabilities. You're skilled and intelligent - sometimes we just need to remind ourselves of that. What situation is making you feel uncertain?"
    };

    const message = topicMessages[topic] || "I'm here to support you. What would you like to talk about today?";
    
    // Clear previous conversation and start fresh
    coachingConversation = [];
    showCoachingChat();
    addCoachMessage(message);
}

// Make functions globally available for HTML onclick handlers
window.startConversation = startConversation;

function showCoachingChat() {
    document.getElementById('coachingWelcome').style.display = 'none';
    document.getElementById('coachingChat').style.display = 'flex';
    document.getElementById('coachingInput').focus();
}

function showWelcome() {
    document.getElementById('coachingWelcome').style.display = 'flex';
    document.getElementById('coachingChat').style.display = 'none';
}

function clearConversation() {
    coachingConversation = [];
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('coachingInput').value = '';
    updateDailyInsight();
}

// Add more functions to global scope
window.showWelcome = showWelcome;
window.clearConversation = clearConversation;

function addUserMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        ${escapeHtml(message)}
        <div class="message-time">${formatTime(new Date())}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to conversation history
    coachingConversation.push({ role: 'user', content: message, timestamp: new Date() });
}

function addCoachMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message coach';
    messageDiv.innerHTML = `
        ${escapeHtml(message)}
        <div class="message-time">${formatTime(new Date())}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to conversation history
    coachingConversation.push({ role: 'coach', content: message, timestamp: new Date() });
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function sendCoachingMessage(message) {
    if (!message.trim()) return;
    
    // Add user message to UI
    addUserMessage(message);
    
    // Clear input
    document.getElementById('coachingInput').value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Get comprehensive work context for more personalized coaching
        const projectContext = await getWorkContext();
        
        const response = await api.request('/llm/coaching', {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                conversation: coachingConversation.slice(-10), // Last 10 messages for context
                projectContext: projectContext
            })
        });
        
        hideTypingIndicator();
        
        if (response.success) {
            addCoachMessage(response.data);
            updateDailyInsight();
        } else {
            addCoachMessage("I'm sorry, I'm having trouble connecting right now. Your feelings and concerns are still valid, and I encourage you to try again or talk to someone you trust.");
        }
    } catch (error) {
        hideTypingIndicator();
        console.error('Coaching error:', error);
        addCoachMessage("I'm experiencing some technical difficulties, but that doesn't diminish what you're going through. Please try again in a moment, or consider reaching out to a colleague or friend.");
    }
}

async function getWorkContext() {
    try {
        // Get comprehensive context across ALL projects for better coaching
        const [projectsResponse, allNotesResponse, allTodosResponse] = await Promise.all([
            api.request('/projects'),
            api.request('/notes?limit=10'), // Recent notes across all projects
            api.request('/todos?limit=15')  // Recent todos across all projects
        ]);
        
        const projects = projectsResponse.success ? projectsResponse.data : [];
        const recentNotes = allNotesResponse.success ? allNotesResponse.data.slice(0, 10) : [];
        const allTodos = allTodosResponse.success ? allTodosResponse.data : [];
        
        // Calculate overall workload and progress
        const totalTodos = allTodos.length;
        const completedTodos = allTodos.filter(todo => todo.status === 'completed').length;
        const pendingTodos = allTodos.filter(todo => todo.status === 'pending').length;
        const highPriorityPending = allTodos.filter(todo => todo.status === 'pending' && todo.priority === 'high').length;
        
        // Get project-specific summaries
        const projectSummaries = projects.map(project => {
            const projectTodos = allTodos.filter(todo => todo.project_id === project.id);
            const projectNotes = recentNotes.filter(note => note.project_id === project.id).slice(0, 2);
            return {
                name: project.name,
                status: project.status,
                pendingTasks: projectTodos.filter(t => t.status === 'pending').length,
                completedTasks: projectTodos.filter(t => t.status === 'completed').length,
                recentActivity: projectNotes.length > 0 ? 'active' : 'quiet'
            };
        });
        
        // Recent work context across all projects
        const recentWorkNotes = recentNotes.slice(0, 5).map(note => {
            const project = projects.find(p => p.id === note.project_id);
            return `[${project?.name || 'Unknown'}] ${note.enhanced_content || note.content}`;
        }).filter(Boolean);
        
        return {
            // Overall portfolio
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'active').length,
            
            // Workload overview
            totalTodos,
            completedTodos,
            pendingTodos,
            highPriorityPending,
            completionRate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
            
            // Recent work across all projects
            recentWorkNotes,
            
            // Project-specific insights
            projectSummaries,
            
            // Current focus (if a project is selected)
            currentFocus: currentProject ? {
                projectName: window.currentProjectName || 'Selected Project',
                isActive: true
            } : null
        };
    } catch (error) {
        console.warn('Could not gather work context for coaching:', error);
        return null;
    }
}

function updateDailyInsight() {
    const insights = [
        "Your ability to recognize when you need support shows emotional intelligence and strength.",
        "Every expert was once a beginner who kept going despite uncertainty.",
        "Your work in continuous improvement makes a real difference at Evos Amsterdam.",
        "Confidence grows through action, not through waiting for certainty.",
        "Your analytical skills and dedication are valuable assets to your team.",
        "Progress isn't always linear - setbacks often lead to breakthroughs.",
        "Your willingness to seek guidance demonstrates wisdom and growth mindset.",
        "Remember: you've successfully navigated challenges before, and you will again.",
        "Your contributions to operational excellence create lasting positive impact.",
        "Trust in your abilities - they brought you this far and will take you further."
    ];
    
    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    const insightElement = document.getElementById('dailyInsight');
    if (insightElement) {
        insightElement.innerHTML = `<p><em>${randomInsight}</em></p>`;
    }
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// Initialize coaching functionality
function initCoaching() {
    // Set up form submission
    const coachingForm = document.getElementById('coachingForm');
    if (coachingForm) {
        coachingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('coachingInput');
            const message = input.value.trim();
            if (message) {
                await sendCoachingMessage(message);
            }
        });
    }
    
    // Handle textarea enter key (without shift)
    const coachingInput = document.getElementById('coachingInput');
    if (coachingInput) {
        coachingInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = e.target.value.trim();
                if (message) {
                    sendCoachingMessage(message);
                }
            }
        });
    }
    
    // Initialize with a random insight
    updateDailyInsight();
}

// Keyboard Shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only trigger when not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }
        
        // Check if we're on the timeline tab
        const timelineTab = document.querySelector('[data-tab="timelines"]');
        const isTimelineActive = timelineTab?.classList.contains('active');
        
        if (!isTimelineActive) return;
        
        // Timeline keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    if (elements.timelineZoom) {
                        elements.timelineZoom.value = 'week';
                        elements.timelineZoom.dispatchEvent(new Event('change'));
                    }
                    break;
                case '2':
                    e.preventDefault();
                    if (elements.timelineZoom) {
                        elements.timelineZoom.value = 'month';
                        elements.timelineZoom.dispatchEvent(new Event('change'));
                    }
                    break;
                case '3':
                    e.preventDefault();
                    if (elements.timelineZoom) {
                        elements.timelineZoom.value = 'quarter';
                        elements.timelineZoom.dispatchEvent(new Event('change'));
                    }
                    break;
                case '4':
                    e.preventDefault();
                    if (elements.timelineZoom) {
                        elements.timelineZoom.value = 'year';
                        elements.timelineZoom.dispatchEvent(new Event('change'));
                    }
                    break;
                case '0':
                    e.preventDefault();
                    if (elements.timelineZoom) {
                        elements.timelineZoom.value = 'all';
                        elements.timelineZoom.dispatchEvent(new Event('change'));
                    }
                    break;
                case 'm':
                    e.preventDefault();
                    if (elements.newMilestoneBtn && currentProject) {
                        elements.newMilestoneBtn.click();
                    }
                    break;
                case 'e':
                    e.preventDefault();
                    if (elements.estimateTimelineBtn && currentProject) {
                        elements.estimateTimelineBtn.click();
                    }
                    break;
            }
        }
    });
}

// ========================================
// Phase 2: AI-Powered Personal Development
// ========================================

// Global state for Phase 2 features
let skills = [];
let achievements = [];
let reflections = [];
let reflectionTemplates = [];

// Additional DOM Elements for Phase 2
const phase2Elements = {
    // Skills
    skillsGrid: document.getElementById('skillsGrid'),
    skillsCategoryFilter: document.getElementById('skillsCategoryFilter'),
    skillsViewMode: document.getElementById('skillsViewMode'),
    skillsProgressView: document.getElementById('skillsProgressView'),
    skillsGapsView: document.getElementById('skillsGapsView'),
    skillsGridView: document.getElementById('skillsGridView'),
    skillsProgressBtn: document.getElementById('skillsProgressBtn'),
    skillsGapsBtn: document.getElementById('skillsGapsBtn'),
    newSkillBtn: document.getElementById('newSkillBtn'),
    skillModal: document.getElementById('skillModal'),
    skillForm: document.getElementById('skillForm'),
    
    // Achievements
    achievementsGrid: document.getElementById('achievementsGrid'),
    achievementsStatusFilter: document.getElementById('achievementsStatusFilter'),
    achievementsTypeFilter: document.getElementById('achievementsTypeFilter'),
    achievementsStatsBtn: document.getElementById('achievementsStatsBtn'),
    achievementsSuggestBtn: document.getElementById('achievementsSuggestBtn'),
    newAchievementBtn: document.getElementById('newAchievementBtn'),
    achievementModal: document.getElementById('achievementModal'),
    achievementForm: document.getElementById('achievementForm'),
    
    // Reflections
    reflectionsList: document.getElementById('reflectionsList'),
    templatesGrid: document.getElementById('templatesGrid'),
    insightsDashboard: document.getElementById('insightsDashboard'),
    reflectionsInsightsBtn: document.getElementById('reflectionsInsightsBtn'),
    reflectionsTemplatesBtn: document.getElementById('reflectionsTemplatesBtn'),
    newReflectionBtn: document.getElementById('newReflectionBtn'),
    reflectionModal: document.getElementById('reflectionModal'),
    reflectionForm: document.getElementById('reflectionForm'),
    viewTabs: document.querySelectorAll('.view-tab'),
    reflectionViews: document.querySelectorAll('.reflection-view')
};

// Phase 2 API Functions
const phase2Api = {
    // Skills API
    async getSkills(filters = {}) {
        const params = new URLSearchParams(filters);
        return await api.request(`/skills?${params}`);
    },
    
    async createSkill(skillData) {
        return await api.request('/skills', {
            method: 'POST',
            body: JSON.stringify(skillData)
        });
    },
    
    async updateSkill(id, updates) {
        return await api.request(`/skills/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },
    
    async deleteSkill(id) {
        return await api.request(`/skills/${id}`, {
            method: 'DELETE'
        });
    },
    
    async getSkillsProgress() {
        return await api.request('/skills/progress');
    },
    
    async getSkillsGaps() {
        return await api.request('/skills/gaps');
    },
    
    // Achievements API
    async getAchievements(filters = {}) {
        const params = new URLSearchParams(filters);
        return await api.request(`/achievements?${params}`);
    },
    
    async createAchievement(achievementData) {
        return await api.request('/achievements', {
            method: 'POST',
            body: JSON.stringify(achievementData)
        });
    },
    
    async updateAchievement(id, updates) {
        return await api.request(`/achievements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },
    
    async updateAchievementProgress(id, progressData) {
        return await api.request(`/achievements/${id}/progress`, {
            method: 'POST',
            body: JSON.stringify(progressData)
        });
    },
    
    async completeAchievement(id) {
        return await api.request(`/achievements/${id}/complete`, {
            method: 'POST'
        });
    },
    
    // Reflections API
    async getReflectionTemplates() {
        return await api.request('/reflections/templates');
    },
    
    async getReflections(filters = {}) {
        const params = new URLSearchParams(filters);
        return await api.request(`/reflections/responses?${params}`);
    },
    
    async createReflection(reflectionData) {
        return await api.request('/reflections/responses', {
            method: 'POST',
            body: JSON.stringify(reflectionData)
        });
    },
    
    async getReflectionInsights(days = 30) {
        return await api.request(`/reflections/insights?days=${days}`);
    },
    
    // Skills analysis APIs
    async getSkillsStats() {
        return await api.request('/skills/stats');
    },
    
    async getSkillsGaps() {
        return await api.request('/skills/gaps');
    },
    
    // Achievements analysis APIs
    async getAchievementsStats() {
        return await api.request('/achievements/stats');
    },
    
    async getAchievementSuggestions() {
        return await api.request('/achievements/suggestions');
    }
};

// Skills Functions
async function loadSkills() {
    try {
        showLoading();
        const filters = {
            category: phase2Elements.skillsCategoryFilter?.value || ''
        };
        skills = await phase2Api.getSkills(filters);
        renderSkills();
    } catch (error) {
        console.error('Error loading skills:', error);
        showMessage('Failed to load skills', 'error');
    } finally {
        hideLoading();
    }
}

function renderSkills() {
    if (!phase2Elements.skillsGrid) return;
    
    if (skills.length === 0) {
        phase2Elements.skillsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-brain" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Skills Added</h3>
                <p>Start building your skills profile by adding your first skill assessment.</p>
                <button class="btn btn-primary" onclick="showSkillModal()">
                    <i class="fas fa-plus"></i> Add Your First Skill
                </button>
            </div>
        `;
        return;
    }
    
    phase2Elements.skillsGrid.innerHTML = skills.map(skill => `
        <div class="card skill-card" data-skill-id="${skill.id}">
            <div class="flex justify-between items-center">
                <div>
                    <div class="skill-name">${skill.skill_name}</div>
                    <span class="skill-category">${skill.skill_category}</span>
                </div>
            </div>
            
            <div class="skill-levels">
                <div class="skill-level">
                    <span class="skill-level-label">Current</span>
                    <div class="skill-level-bar">
                        <div class="skill-level-progress skill-level-current" style="width: ${skill.current_level * 10}%"></div>
                    </div>
                    <span class="skill-level-value">${skill.current_level}</span>
                </div>
                <div class="skill-level">
                    <span class="skill-level-label">Target</span>
                    <div class="skill-level-bar">
                        <div class="skill-level-progress skill-level-target" style="width: ${skill.target_level * 10}%"></div>
                    </div>
                    <span class="skill-level-value">${skill.target_level}</span>
                </div>
            </div>
            
            ${skill.current_level < skill.target_level ? `
                <div class="skill-gap">
                    <i class="fas fa-arrow-up skill-gap-icon"></i>
                    <span class="skill-gap-text">Gap: ${skill.target_level - skill.current_level} levels to target</span>
                </div>
            ` : skill.current_level >= skill.target_level ? `
                <div class="skill-gap positive">
                    <i class="fas fa-check skill-gap-icon"></i>
                    <span class="skill-gap-text">Target achieved!</span>
                </div>
            ` : ''}
            
            <div class="flex gap-2">
                <button class="skill-action-btn" onclick="editSkill('${skill.id}')">
                    <i class="fas fa-edit"></i> Update
                </button>
                <button class="skill-action-btn primary" onclick="assessSkill('${skill.id}')">
                    <i class="fas fa-chart-line"></i> Assess
                </button>
            </div>
        </div>
    `).join('');
}

function showSkillModal(skillId = null) {
    const modal = phase2Elements.skillModal;
    if (!modal) return;
    
    if (skillId) {
        const skill = skills.find(s => s.id === skillId);
        if (skill) {
            document.getElementById('skillName').value = skill.skill_name;
            document.getElementById('skillCategory').value = skill.skill_category;
            document.getElementById('currentLevel').value = skill.current_level;
            document.getElementById('targetLevel').value = skill.target_level;
            document.getElementById('selfAssessmentScore').value = skill.self_assessment_score || 5;
            document.getElementById('assessmentNotes').value = skill.assessment_notes || '';
            
            // Update range value displays
            updateRangeValue('currentLevel', skill.current_level);
            updateRangeValue('targetLevel', skill.target_level);
            updateRangeValue('selfAssessmentScore', skill.self_assessment_score || 5);
        }
    } else {
        phase2Elements.skillForm.reset();
        updateRangeValue('currentLevel', 5);
        updateRangeValue('targetLevel', 8);
        updateRangeValue('selfAssessmentScore', 5);
    }
    
    showModal(modal);
}

// Achievements Functions
async function loadAchievements() {
    try {
        showLoading();
        const filters = {
            status: phase2Elements.achievementsStatusFilter?.value || '',
            type: phase2Elements.achievementsTypeFilter?.value || ''
        };
        achievements = await phase2Api.getAchievements(filters);
        renderAchievements();
    } catch (error) {
        console.error('Error loading achievements:', error);
        showMessage('Failed to load achievements', 'error');
    } finally {
        hideLoading();
    }
}

function renderAchievements() {
    if (!phase2Elements.achievementsGrid) return;
    
    if (achievements.length === 0) {
        phase2Elements.achievementsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Achievements Set</h3>
                <p>Define your goals and track your progress towards meaningful achievements.</p>
                <button class="btn btn-primary" onclick="showAchievementModal()">
                    <i class="fas fa-plus"></i> Set Your First Goal
                </button>
            </div>
        `;
        return;
    }
    
    phase2Elements.achievementsGrid.innerHTML = achievements.map(achievement => {
        const progressPercentage = achievement.target_value > 0 
            ? Math.min(100, (achievement.current_value / achievement.target_value) * 100)
            : 0;
        
        return `
            <div class="card achievement-card ${achievement.status}" data-achievement-id="${achievement.id}">
                <div class="flex justify-between items-center">
                    <div class="achievement-name">${achievement.achievement_name}</div>
                    <span class="achievement-type ${achievement.achievement_type}">${achievement.achievement_type}</span>
                </div>
                
                ${achievement.description ? `
                    <div class="achievement-description">${achievement.description}</div>
                ` : ''}
                
                ${achievement.target_value > 0 ? `
                    <div class="achievement-progress">
                        <div class="achievement-progress-header">
                            <span class="achievement-progress-label">Progress</span>
                            <span class="achievement-progress-percentage">${Math.round(progressPercentage)}%</span>
                        </div>
                        <div class="achievement-progress-bar">
                            <div class="achievement-progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                ` : ''}
                
                <span class="achievement-priority ${achievement.priority_level}">${achievement.priority_level} priority</span>
                
                <div class="flex gap-2">
                    ${achievement.status !== 'completed' ? `
                        <button class="achievement-action-btn" onclick="editAchievement('${achievement.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="achievement-action-btn complete" onclick="completeAchievement('${achievement.id}')">
                            <i class="fas fa-check"></i> Complete
                        </button>
                    ` : `
                        <div class="achievement-completed">
                            <i class="fas fa-trophy"></i> Completed!
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function showAchievementModal(achievementId = null) {
    const modal = phase2Elements.achievementModal;
    if (!modal) return;
    
    if (achievementId) {
        const achievement = achievements.find(a => a.id === achievementId);
        if (achievement) {
            document.getElementById('achievementName').value = achievement.achievement_name;
            document.getElementById('achievementType').value = achievement.achievement_type;
            document.getElementById('achievementDescription').value = achievement.description || '';
            document.getElementById('achievementCriteria').value = achievement.criteria || '';
            document.getElementById('targetValue').value = achievement.target_value || '';
            document.getElementById('currentValue').value = achievement.current_value || 0;
            document.getElementById('priorityLevel').value = achievement.priority_level;
            document.getElementById('celebrationMessage').value = achievement.celebration_message || '';
        }
    } else {
        phase2Elements.achievementForm.reset();
    }
    
    showModal(modal);
}

// Reflections Functions
async function loadReflections() {
    try {
        showLoading();
        reflectionTemplates = await phase2Api.getReflectionTemplates();
        reflections = await phase2Api.getReflections({ limit: 20 });
        renderReflections();
        renderTemplates();
    } catch (error) {
        console.error('Error loading reflections:', error);
        showMessage('Failed to load reflections', 'error');
    } finally {
        hideLoading();
    }
}

function renderReflections() {
    if (!phase2Elements.reflectionsList) return;
    
    if (reflections.length === 0) {
        phase2Elements.reflectionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-mirror" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Reflections Yet</h3>
                <p>Start your reflection journey to gain insights into your personal and professional growth.</p>
                <button class="btn btn-primary" onclick="showReflectionModal()">
                    <i class="fas fa-plus"></i> Start Your First Reflection
                </button>
            </div>
        `;
        return;
    }
    
    phase2Elements.reflectionsList.innerHTML = reflections.map(reflection => `
        <div class="card card-gray reflection-card" data-reflection-id="${reflection.id}">
            <div class="flex justify-between items-center">
                <div>
                    <div class="reflection-template-name">${reflection.template_name}</div>
                    <div class="reflection-date">${formatDate(reflection.reflection_date)}</div>
                </div>
                ${reflection.mood_at_reflection ? `
                    <div class="reflection-mood">
                        <i class="fas fa-smile"></i> Mood: ${reflection.mood_at_reflection}/10
                    </div>
                ` : ''}
            </div>
            <div class="reflection-summary">
                ${Object.values(reflection.responses)[0]?.substring(0, 200) + '...' || 'No response provided'}
            </div>
        </div>
    `).join('');
}

function renderTemplates() {
    if (!phase2Elements.templatesGrid) return;
    
    phase2Elements.templatesGrid.innerHTML = reflectionTemplates.map(template => `
        <div class="card card-gray template-card" onclick="useTemplate('${template.id}')">
            <div class="template-name">${template.template_name}</div>
            <span class="template-type">${template.template_type}</span>
            <div class="template-questions-count">
                ${template.prompt_questions.length} questions
            </div>
        </div>
    `).join('');
}

// AI Analysis Render Functions
function renderSkillsStats(stats) {
    if (!phase2Elements.skillsProgressView) return;
    
    phase2Elements.skillsProgressView.innerHTML = `
        <div class="skills-stats-container">
            <h3><i class="fas fa-chart-bar"></i> Skills Progress Overview</h3>
            <div class="stats-grid">
                <div class="card card-sm stat-card">
                    <div class="stat-value">${stats.total_skills || 0}</div>
                    <div class="stat-label">Total Skills</div>
                </div>
                <div class="card card-sm stat-card">
                    <div class="stat-value">${stats.average_level || 0}</div>
                    <div class="stat-label">Average Level</div>
                </div>
                <div class="card card-sm stat-card">
                    <div class="stat-value">${stats.completed_skills || 0}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="card card-sm stat-card">
                    <div class="stat-value">${stats.in_progress_skills || 0}</div>
                    <div class="stat-label">In Progress</div>
                </div>
            </div>
            <div class="skills-progress-chart">
                <canvas id="skillsProgressChart" width="800" height="400"></canvas>
            </div>
        </div>
    `;
}

function renderSkillsGaps(gaps) {
    if (!phase2Elements.skillsGapsView) return;
    
    phase2Elements.skillsGapsView.innerHTML = `
        <div class="skills-gaps-container">
            <h3><i class="fas fa-search"></i> Skills Gap Analysis</h3>
            <div class="gaps-list">
                ${gaps.map(gap => `
                    <div class="gap-item">
                        <div class="gap-skill">${gap.skill_name}</div>
                        <div class="gap-details">
                            <span class="current-level">Current: ${gap.current_level}/5</span>
                            <span class="target-level">Target: ${gap.target_level}/5</span>
                            <span class="gap-priority priority-${gap.priority}">${gap.priority} Priority</span>
                        </div>
                        <div class="gap-recommendations">
                            ${gap.recommendations ? gap.recommendations.map(rec => `<div class="recommendation">• ${rec}</div>`).join('') : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderAchievementsStats(stats) {
    // This would render achievement statistics
    console.log('Rendering achievements stats:', stats);
}

function renderAchievementSuggestions(suggestions) {
    // This would render AI-generated achievement suggestions
    console.log('Rendering achievement suggestions:', suggestions);
}

function renderReflectionInsights(insightsData) {
    if (!phase2Elements.insightsDashboard) return;
    
    const { insights, mood_trends, reflection_frequency, period_days } = insightsData;
    
    // Create insight cards from the different categories
    const insightCards = [];
    
    // Patterns insights
    if (insights.patterns && insights.patterns.length > 0) {
        insights.patterns.forEach(pattern => {
            insightCards.push({
                title: 'Pattern Detected',
                description: pattern,
                type: 'pattern'
            });
        });
    }
    
    // Growth areas
    if (insights.growth_areas && insights.growth_areas.length > 0) {
        insights.growth_areas.forEach(area => {
            insightCards.push({
                title: 'Growth Opportunity',
                description: area,
                type: 'growth'
            });
        });
    }
    
    // Recurring themes
    if (insights.recurring_themes && insights.recurring_themes.length > 0) {
        insights.recurring_themes.forEach(theme => {
            insightCards.push({
                title: 'Recurring Theme',
                description: theme,
                type: 'theme'
            });
        });
    }
    
    // Action trends
    if (insights.action_trends && insights.action_trends.length > 0) {
        insights.action_trends.forEach(action => {
            insightCards.push({
                title: 'Action Item',
                description: action,
                type: 'action'
            });
        });
    }
    
    // If no insights available, show a helpful message
    if (insightCards.length === 0) {
        insightCards.push({
            title: 'No Insights Yet',
            description: `You haven't completed any reflections in the past ${period_days} days. Start reflecting to see AI-generated insights!`,
            type: 'empty'
        });
    }
    
    phase2Elements.insightsDashboard.innerHTML = `
        <div class="insights-container">
            <h3><i class="fas fa-lightbulb"></i> AI Insights</h3>
            <div class="insights-stats">
                <div class="stat-item">
                    <span class="stat-label">Reflections Completed:</span>
                    <span class="stat-value">${reflection_frequency}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Period:</span>
                    <span class="stat-value">${period_days} days</span>
                </div>
            </div>
            <div class="insights-content">
                ${insightCards.map(insight => `
                    <div class="card card-gray insight-card insight-${insight.type}">
                        <div class="insight-title">${insight.title}</div>
                        <div class="insight-description">${insight.description}</div>
                    </div>
                `).join('')}
            </div>
            ${mood_trends.length > 0 ? `
                <div class="mood-trends">
                    <h4>Mood Trends</h4>
                    <div class="mood-chart">
                        ${mood_trends.map(trend => `
                            <div class="mood-point" style="height: ${(trend.mood / 10) * 100}%">
                                <span class="mood-value">${trend.mood}</span>
                                <span class="mood-date">${new Date(trend.date).toLocaleDateString()}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function showReflectionModal(templateId = null) {
    const modal = phase2Elements.reflectionModal;
    if (!modal) return;
    
    // Populate template selector
    const templateSelect = document.getElementById('reflectionTemplate');
    if (templateSelect) {
        templateSelect.innerHTML = `
            <option value="">Select template...</option>
            ${reflectionTemplates.map(template => `
                <option value="${template.id}" ${template.id === templateId ? 'selected' : ''}>
                    ${template.template_name}
                </option>
            `).join('')}
        `;
    }
    
    // Set default date to today
    const dateInput = document.getElementById('reflectionDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // If template is preselected, load questions
    if (templateId) {
        loadReflectionQuestions(templateId);
    }
    
    showModal(modal);
}

function loadReflectionQuestions(templateId) {
    const template = reflectionTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    const questionsContainer = document.getElementById('reflectionQuestions');
    if (!questionsContainer) return;
    
    questionsContainer.innerHTML = template.prompt_questions.map((question, index) => `
        <div class="reflection-question">
            <label for="question_${index}">${question}</label>
            <textarea id="question_${index}" name="question_${index}" placeholder="Share your thoughts..."></textarea>
        </div>
    `).join('');
}

// Utility Functions for Phase 2
function updateRangeValue(rangeId, value) {
    const valueSpan = document.getElementById(rangeId + 'Value');
    if (valueSpan) {
        valueSpan.textContent = value;
    }
}

function switchReflectionView(viewName) {
    // Update view tabs
    phase2Elements.viewTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewName);
    });
    
    // Update view content
    phase2Elements.reflectionViews.forEach(view => {
        view.classList.toggle('active', view.id === viewName + 'ReflectionsView' || view.id === viewName + 'View');
    });
}

// Event Handlers for Phase 2
function initPhase2EventHandlers() {
    // Skills event handlers
    if (phase2Elements.newSkillBtn) {
        phase2Elements.newSkillBtn.addEventListener('click', () => showSkillModal());
    }
    
    if (phase2Elements.skillForm) {
        phase2Elements.skillForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const skillData = {
                    skill_name: document.getElementById('skillName').value,
                    skill_category: document.getElementById('skillCategory').value,
                    current_level: parseInt(document.getElementById('currentLevel').value),
                    target_level: parseInt(document.getElementById('targetLevel').value),
                    self_assessment_score: parseInt(document.getElementById('selfAssessmentScore').value),
                    assessment_notes: document.getElementById('assessmentNotes').value
                };
                
                await phase2Api.createSkill(skillData);
                hideModal(phase2Elements.skillModal);
                await loadSkills();
                showMessage('Skill added successfully!', 'success');
            } catch (error) {
                console.error('Error creating skill:', error);
                showMessage('Failed to add skill', 'error');
            }
        });
    }
    
    // Skills AI analysis buttons
    if (phase2Elements.skillsProgressBtn) {
        phase2Elements.skillsProgressBtn.addEventListener('click', async () => {
            try {
                showLoading();
                const stats = await phase2Api.getSkillsStats();
                renderSkillsStats(stats);
                phase2Elements.skillsViewMode.value = 'progress';
                phase2Elements.skillsViewMode.dispatchEvent(new Event('change'));
            } catch (error) {
                console.error('Error loading skills progress:', error);
                showMessage('Failed to load skills progress', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    if (phase2Elements.skillsGapsBtn) {
        phase2Elements.skillsGapsBtn.addEventListener('click', async () => {
            try {
                showLoading();
                const gaps = await phase2Api.getSkillsGaps();
                renderSkillsGaps(gaps);
                phase2Elements.skillsViewMode.value = 'gaps';
                phase2Elements.skillsViewMode.dispatchEvent(new Event('change'));
            } catch (error) {
                console.error('Error loading skills gaps:', error);
                showMessage('Failed to load skills gaps analysis', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    // Skills filter handlers
    if (phase2Elements.skillsCategoryFilter) {
        phase2Elements.skillsCategoryFilter.addEventListener('change', loadSkills);
    }
    
    if (phase2Elements.skillsViewMode) {
        phase2Elements.skillsViewMode.addEventListener('change', (e) => {
            const viewMode = e.target.value;
            
            // Hide all views
            phase2Elements.skillsGridView.style.display = 'none';
            phase2Elements.skillsProgressView.style.display = 'none';
            phase2Elements.skillsGapsView.style.display = 'none';
            
            // Show selected view
            switch (viewMode) {
                case 'grid':
                    phase2Elements.skillsGridView.style.display = 'block';
                    break;
                case 'progress':
                    phase2Elements.skillsProgressView.style.display = 'block';
                    // TODO: Load and render progress chart
                    break;
                case 'gaps':
                    phase2Elements.skillsGapsView.style.display = 'block';
                    // TODO: Load and render gaps analysis
                    break;
            }
        });
    }
    
    // Range input handlers for real-time updates
    ['currentLevel', 'targetLevel', 'selfAssessmentScore', 'moodAtReflection'].forEach(id => {
        const range = document.getElementById(id);
        if (range) {
            range.addEventListener('input', (e) => {
                updateRangeValue(id, e.target.value);
            });
        }
    });
    
    // Achievements event handlers
    if (phase2Elements.newAchievementBtn) {
        phase2Elements.newAchievementBtn.addEventListener('click', () => showAchievementModal());
    }
    
    if (phase2Elements.achievementForm) {
        phase2Elements.achievementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const achievementData = {
                    achievement_name: document.getElementById('achievementName').value,
                    achievement_type: document.getElementById('achievementType').value,
                    description: document.getElementById('achievementDescription').value,
                    criteria: document.getElementById('achievementCriteria').value,
                    target_value: document.getElementById('targetValue').value ? parseInt(document.getElementById('targetValue').value) : null,
                    current_value: parseInt(document.getElementById('currentValue').value) || 0,
                    priority_level: document.getElementById('priorityLevel').value,
                    celebration_message: document.getElementById('celebrationMessage').value
                };
                
                await phase2Api.createAchievement(achievementData);
                hideModal(phase2Elements.achievementModal);
                await loadAchievements();
                showMessage('Achievement added successfully!', 'success');
            } catch (error) {
                console.error('Error creating achievement:', error);
                showMessage('Failed to add achievement', 'error');
            }
        });
    }
    
    // Achievement AI analysis buttons
    if (phase2Elements.achievementsStatsBtn) {
        phase2Elements.achievementsStatsBtn.addEventListener('click', async () => {
            try {
                showLoading();
                const stats = await phase2Api.getAchievementsStats();
                renderAchievementsStats(stats);
            } catch (error) {
                console.error('Error loading achievements stats:', error);
                showMessage('Failed to load achievements statistics', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    if (phase2Elements.achievementsSuggestBtn) {
        phase2Elements.achievementsSuggestBtn.addEventListener('click', async () => {
            try {
                showLoading();
                const suggestions = await phase2Api.getAchievementSuggestions();
                renderAchievementSuggestions(suggestions);
            } catch (error) {
                console.error('Error loading achievement suggestions:', error);
                showMessage('Failed to load achievement suggestions', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    // Achievement filter handlers
    if (phase2Elements.achievementsStatusFilter) {
        phase2Elements.achievementsStatusFilter.addEventListener('change', loadAchievements);
    }
    
    if (phase2Elements.achievementsTypeFilter) {
        phase2Elements.achievementsTypeFilter.addEventListener('change', loadAchievements);
    }
    
    // Reflections event handlers
    if (phase2Elements.newReflectionBtn) {
        phase2Elements.newReflectionBtn.addEventListener('click', () => showReflectionModal());
    }
    
    if (phase2Elements.reflectionForm) {
        // Template change handler
        const templateSelect = document.getElementById('reflectionTemplate');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    loadReflectionQuestions(e.target.value);
                }
            });
        }
        
        phase2Elements.reflectionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const templateId = document.getElementById('reflectionTemplate').value;
                const template = reflectionTemplates.find(t => t.id === templateId);
                
                // Collect responses to questions
                const responses = {};
                template.prompt_questions.forEach((question, index) => {
                    const questionInput = document.getElementById(`question_${index}`);
                    responses[question] = questionInput ? questionInput.value : '';
                });
                
                const reflectionData = {
                    template_id: templateId,
                    reflection_date: document.getElementById('reflectionDate').value,
                    responses: JSON.stringify(responses),
                    mood_at_reflection: parseInt(document.getElementById('moodAtReflection').value)
                };
                
                await phase2Api.createReflection(reflectionData);
                hideModal(phase2Elements.reflectionModal);
                await loadReflections();
                showMessage('Reflection saved successfully!', 'success');
            } catch (error) {
                console.error('Error creating reflection:', error);
                showMessage('Failed to save reflection', 'error');
            }
        });
    }
    
    // Reflection AI analysis buttons
    if (phase2Elements.reflectionsInsightsBtn) {
        phase2Elements.reflectionsInsightsBtn.addEventListener('click', async () => {
            try {
                showLoading();
                const insights = await phase2Api.getReflectionInsights(30);
                renderReflectionInsights(insights);
                switchReflectionView('insights');
            } catch (error) {
                console.error('Error loading reflection insights:', error);
                showMessage('Failed to load reflection insights', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    if (phase2Elements.reflectionsTemplatesBtn) {
        phase2Elements.reflectionsTemplatesBtn.addEventListener('click', () => {
            switchReflectionView('templates');
        });
    }
    
    // Reflection view tabs
    phase2Elements.viewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchReflectionView(tab.dataset.view);
        });
    });
}

// Global functions for Phase 2 (called from HTML)
window.editSkill = (id) => showSkillModal(id);
window.assessSkill = (id) => showSkillModal(id);
window.editAchievement = (id) => showAchievementModal(id);
window.completeAchievement = async (id) => {
    try {
        await phase2Api.completeAchievement(id);
        await loadAchievements();
        showMessage('Achievement completed! 🎉', 'success');
    } catch (error) {
        console.error('Error completing achievement:', error);
        showMessage('Failed to complete achievement', 'error');
    }
};
window.useTemplate = (id) => showReflectionModal(id);

// Mood Functions
async function loadMoodData() {
    try {
        showLoading();
        
        // Load today's mood and recent entries
        const [todayMood, recentEntries] = await Promise.all([
            api.getTodayMood(),
            api.getMoodEntries(null, null, 10)
        ]);
        
        renderTodayMood(todayMood);
        renderMoodEntries(recentEntries);
        
    } catch (error) {
        console.error('Error loading mood data:', error);
        showMessage('Failed to load mood data', 'error');
    } finally {
        hideLoading();
    }
}

function renderTodayMood(moodEntry) {
    const content = elements.todayMoodContent;
    
    if (!moodEntry) {
        content.innerHTML = `
            <div class="today-mood-content no-entry">
                <p class="mood-checkin-prompt">How are you feeling today?</p>
                <button class="mood-checkin-cta" onclick="showMoodModal()">
                    <i class="fas fa-plus"></i> Log Your Mood
                </button>
            </div>
        `;
    } else {
        const moodEmoji = getMoodEmoji(moodEntry.mood_score);
        const moodColor = getMoodColor(moodEntry.mood_score);
        
        content.innerHTML = `
            <div class="today-mood-content has-entry">
                <div class="mood-entry-header">
                    <h4>Today's Mood</h4>
                    <div class="mood-score">
                        <span style="font-size: 2rem;">${moodEmoji}</span>
                        <span class="mood-score-value" style="background: ${moodColor};">${moodEntry.mood_score}/10</span>
                    </div>
                </div>
                <div class="mood-metrics">
                    <div class="mood-metric">
                        <div class="mood-metric-label">Energy</div>
                        <div class="mood-metric-value">${moodEntry.energy_level || 'N/A'}</div>
                    </div>
                    <div class="mood-metric">
                        <div class="mood-metric-label">Stress</div>
                        <div class="mood-metric-value">${moodEntry.stress_level || 'N/A'}</div>
                    </div>
                    <div class="mood-metric">
                        <div class="mood-metric-label">Motivation</div>
                        <div class="mood-metric-value">${moodEntry.motivation_level || 'N/A'}</div>
                    </div>
                </div>
                ${moodEntry.notes ? `<div class="mood-notes">${moodEntry.notes}</div>` : ''}
                <div style="margin-top: 1rem;">
                    <button class="btn btn-secondary" onclick="editMoodEntry('${moodEntry.mood_date}')">
                        <i class="fas fa-edit"></i> Edit Entry
                    </button>
                </div>
            </div>
        `;
    }
}

function renderMoodEntries(entries) {
    const container = elements.moodEntries;
    
    if (!entries || entries.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No mood entries yet. Start tracking your mood to see your history here.</p>';
        return;
    }
    
    container.innerHTML = entries.map(entry => {
        const moodEmoji = getMoodEmoji(entry.mood_score);
        const moodColor = getMoodColor(entry.mood_score);
        const date = new Date(entry.mood_date).toLocaleDateString();
        
        return `
            <div class="mood-entry">
                <div class="mood-entry-header">
                    <div class="mood-date">${date}</div>
                    <div class="mood-score">
                        <span style="font-size: 1.5rem;">${moodEmoji}</span>
                        <span class="mood-score-value" style="background: ${moodColor};">${entry.mood_score}/10</span>
                    </div>
                </div>
                <div class="mood-metrics">
                    <div class="mood-metric">
                        <div class="mood-metric-label">Energy</div>
                        <div class="mood-metric-value">${entry.energy_level || 'N/A'}</div>
                    </div>
                    <div class="mood-metric">
                        <div class="mood-metric-label">Stress</div>
                        <div class="mood-metric-value">${entry.stress_level || 'N/A'}</div>
                    </div>
                    <div class="mood-metric">
                        <div class="mood-metric-label">Motivation</div>
                        <div class="mood-metric-value">${entry.motivation_level || 'N/A'}</div>
                    </div>
                </div>
                ${entry.mood_tags ? `
                    <div class="mood-tags">
                        ${entry.mood_tags.split(',').map(tag => `<span class="mood-tag">${tag.trim()}</span>`).join('')}
                    </div>
                ` : ''}
                ${entry.notes ? `<div class="mood-notes">${entry.notes}</div>` : ''}
                ${entry.triggers ? `<div class="mood-triggers"><strong>Triggers:</strong> ${entry.triggers}</div>` : ''}
                ${entry.coping_strategies_used ? `<div class="mood-coping"><strong>Coping:</strong> ${entry.coping_strategies_used}</div>` : ''}
            </div>
        `;
    }).join('');
}

function getMoodEmoji(score) {
    if (score >= 9) return '😄';
    if (score >= 7) return '😊';
    if (score >= 5) return '😐';
    if (score >= 3) return '😕';
    return '😞';
}

function getMoodColor(score) {
    if (score >= 8) return 'linear-gradient(135deg, #10b981, #059669)';
    if (score >= 6) return 'linear-gradient(135deg, #3b82f6, #2563eb)';
    if (score >= 4) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
}

function showMoodModal(editDate = null) {
    const modal = elements.moodModal;
    const form = elements.moodForm;
    
    // Reset form
    form.reset();
    
    // Set date to today or edit date
    const today = new Date().toISOString().split('T')[0];
    elements.moodDate.value = editDate || today;
    
    // Set default values
    elements.moodScore.value = 7;
    elements.moodScoreValue.textContent = '7';
    elements.energyLevel.value = 7;
    elements.energyLevelValue.textContent = '7';
    elements.stressLevel.value = 3;
    elements.stressLevelValue.textContent = '3';
    elements.motivationLevel.value = 7;
    elements.motivationLevelValue.textContent = '7';
    
    // Update modal title
    document.getElementById('moodModalTitle').textContent = editDate ? 'Edit Mood Entry' : 'Log Mood Entry';
    
    showModal(modal);
}

function editMoodEntry(date) {
    showMoodModal(date);
    // TODO: Load existing data for editing
}

// Mood modal event handlers
function initMoodEventHandlers() {
    // New mood entry button
    elements.newMoodEntryBtn?.addEventListener('click', () => showMoodModal());
    
    // Mood stats button
    elements.moodStatsBtn?.addEventListener('click', async () => {
        try {
            showLoading();
            const stats = await api.getMoodStats(30);
            renderMoodStats(stats);
        } catch (error) {
            console.error('Error loading mood stats:', error);
            showMessage('Failed to load mood statistics', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Mood patterns button
    elements.moodPatternsBtn?.addEventListener('click', async () => {
        try {
            showLoading();
            const patterns = await api.getMoodPatterns(90);
            renderMoodPatterns(patterns);
        } catch (error) {
            console.error('Error loading mood patterns:', error);
            showMessage('Failed to load mood patterns', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Mood AI analysis button
    elements.moodAIAnalysisBtn?.addEventListener('click', async () => {
        try {
            showLoading();
            const analysis = await api.getMoodAIAnalysis(90);
            renderMoodAIAnalysis(analysis);
        } catch (error) {
            console.error('Error loading AI mood analysis:', error);
            showMessage('Failed to load AI mood analysis', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Coping Strategies buttons
    elements.viewAllStrategiesBtn?.addEventListener('click', loadCopingStrategies);
    elements.recommendedStrategiesBtn?.addEventListener('click', loadRecommendedStrategies);
    elements.strategyAnalyticsBtn?.addEventListener('click', loadStrategyAnalytics);
    elements.addStrategyBtn?.addEventListener('click', showStrategyModal);
    
    // Range slider updates
    const sliders = ['moodScore', 'energyLevel', 'stressLevel', 'motivationLevel'];
    sliders.forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(sliderId + 'Value');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
            });
        }
    });
    
    // Mood form submission
    elements.moodForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = {
                mood_date: elements.moodDate.value,
                mood_score: parseInt(elements.moodScore.value),
                energy_level: parseInt(elements.energyLevel.value),
                stress_level: parseInt(elements.stressLevel.value),
                motivation_level: parseInt(elements.motivationLevel.value),
                mood_tags: elements.moodTags.value,
                notes: elements.moodNotes.value,
                triggers: elements.moodTriggers.value,
                coping_strategies_used: elements.copingStrategies.value
            };
            
            await api.createMoodEntry(formData);
            hideModal(elements.moodModal);
            await loadMoodData();
            showMessage('Mood entry saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving mood entry:', error);
            showMessage('Failed to save mood entry', 'error');
        }
    });
    
    // Strategy form submission
    elements.strategyForm?.addEventListener('submit', handleStrategyFormSubmit);
    
    // Intervention monitoring buttons
    document.getElementById('checkInterventionTriggersBtn')?.addEventListener('click', checkInterventionTriggers);
    document.getElementById('viewInterventionHistoryBtn')?.addEventListener('click', viewInterventionHistory);
    document.getElementById('emergencySupportBtn')?.addEventListener('click', showEmergencySupport);
    
    // Modal close handlers
    document.getElementById('closeMoodModal')?.addEventListener('click', () => hideModal(elements.moodModal));
    document.getElementById('cancelMoodModal')?.addEventListener('click', () => hideModal(elements.moodModal));
    document.getElementById('closeStrategyModal')?.addEventListener('click', () => hideModal(elements.strategyModal));
    document.getElementById('cancelStrategyModal')?.addEventListener('click', () => hideModal(elements.strategyModal));
}

function renderMoodStats(stats) {
    const summary = stats.summary;
    const trends = stats.weekly_trends;
    
    elements.moodInsightsContent.innerHTML = `
        <div class="metrics-grid">
            <div class="card card-sm metric">
                <div class="mood-stat-value">${summary.avg_mood_score?.toFixed(1) || 'N/A'}</div>
                <div class="mood-stat-label">Average Mood</div>
            </div>
            <div class="card card-sm metric">
                <div class="mood-stat-value">${summary.good_mood_days || 0}</div>
                <div class="mood-stat-label">Good Days (7+)</div>
            </div>
            <div class="card card-sm metric">
                <div class="mood-stat-value">${summary.low_mood_days || 0}</div>
                <div class="mood-stat-label">Low Days (4-)</div>
            </div>
            <div class="card card-sm metric">
                <div class="mood-stat-value">${summary.high_stress_days || 0}</div>
                <div class="mood-stat-label">High Stress Days</div>
            </div>
        </div>
        <div class="card card-gray insight-card">
            <div class="insight-title">
                <i class="fas fa-chart-line"></i>
                Weekly Trends
            </div>
            <div class="insight-content">
                ${trends.length > 0 ? 
                    trends.map(week => `
                        <p><strong>Week ${week.week}:</strong> Mood ${week.avg_mood?.toFixed(1) || 'N/A'}, 
                        Energy ${week.avg_energy?.toFixed(1) || 'N/A'}, 
                        Stress ${week.avg_stress?.toFixed(1) || 'N/A'}</p>
                    `).join('') : 
                    '<p>Not enough data for trend analysis yet.</p>'
                }
            </div>
        </div>
    `;
    
    elements.moodInsightsSection.style.display = 'block';
}

function renderMoodPatterns(patterns) {
    const dayPatterns = patterns.day_of_week_patterns;
    const triggers = patterns.common_triggers;
    const coping = patterns.effective_coping_strategies;
    
    elements.moodInsightsContent.innerHTML = `
        <div class="card card-gray insight-card">
            <div class="insight-title">
                <i class="fas fa-calendar-week"></i>
                Day of Week Patterns
            </div>
            <div class="insight-content">
                ${dayPatterns.map(day => `
                    <p><strong>${day.day_of_week}:</strong> 
                    Mood ${day.avg_mood?.toFixed(1) || 'N/A'}, 
                    Energy ${day.avg_energy?.toFixed(1) || 'N/A'}, 
                    Stress ${day.avg_stress?.toFixed(1) || 'N/A'}</p>
                `).join('')}
            </div>
        </div>
        
        ${triggers.length > 0 ? `
            <div class="card card-gray insight-card">
                <div class="insight-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    Common Triggers
                </div>
                <div class="insight-content">
                    ${triggers.map(trigger => `
                        <p><strong>${trigger.triggers}:</strong> ${trigger.frequency} times</p>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${coping.length > 0 ? `
            <div class="card card-gray insight-card">
                <div class="insight-title">
                    <i class="fas fa-heart"></i>
                    Effective Coping Strategies
                </div>
                <div class="insight-content">
                    ${coping.map(strategy => `
                        <p><strong>${strategy.coping_strategies_used}:</strong> 
                        Average mood after: ${strategy.avg_mood_after?.toFixed(1) || 'N/A'}, 
                        Used ${strategy.usage_count} times</p>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    elements.moodInsightsSection.style.display = 'block';
}

function renderMoodAIAnalysis(analysis) {
    const { analysis: summary, trends, triggers, recommendations, insights } = analysis;
    
    elements.moodInsightsContent.innerHTML = `
        <div class="ai-analysis-header">
            <h4><i class="fas fa-robot"></i> AI Mood Analysis</h4>
            <p class="ai-summary">${summary}</p>
        </div>
        
        ${trends && trends.length > 0 ? `
            <div class="card card-gray insight-card">
                <div class="insight-title">
                    <i class="fas fa-chart-line"></i>
                    Mood Trends
                </div>
                <div class="insight-content">
                    ${trends.map(trend => `
                        <div class="trend-item">
                            <h5>${trend.type.replace('_', ' ').toUpperCase()}</h5>
                            <p><strong>Confidence:</strong> ${trend.confidence}</p>
                            <p>${trend.description}</p>
                            ${trend.data ? `<p><em>Data: ${trend.data}</em></p>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${triggers && triggers.length > 0 ? `
            <div class="card card-gray insight-card">
                <div class="insight-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    Identified Triggers
                </div>
                <div class="insight-content">
                    ${triggers.map(trigger => `
                        <div class="trigger-item">
                            <h5>${trigger.trigger}</h5>
                            <p><strong>Frequency:</strong> ${trigger.frequency}</p>
                            <p><strong>Impact:</strong> ${trigger.impact}</p>
                            <p>${trigger.description}</p>
                            <p><strong>Recommendation:</strong> ${trigger.recommendation}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${recommendations && recommendations.length > 0 ? `
            <div class="card card-gray insight-card">
                <div class="insight-title">
                    <i class="fas fa-lightbulb"></i>
                    AI Recommendations
                </div>
                <div class="insight-content">
                    ${recommendations.map(rec => `
                        <div class="recommendation-item ${rec.priority}">
                            <h5>${rec.title}</h5>
                            <p><strong>Category:</strong> ${rec.category.replace('_', ' ').toUpperCase()}</p>
                            <p><strong>Priority:</strong> ${rec.priority.toUpperCase()}</p>
                            <p>${rec.description}</p>
                            ${rec.actionable_steps && rec.actionable_steps.length > 0 ? `
                                <div class="action-steps">
                                    <strong>Action Steps:</strong>
                                    <ol>
                                        ${rec.actionable_steps.map(step => `<li>${step}</li>`).join('')}
                                    </ol>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${insights && insights.length > 0 ? `
            <div class="card card-gray insight-card">
                <div class="insight-title">
                    <i class="fas fa-eye"></i>
                    Key Insights
                </div>
                <div class="insight-content">
                    ${insights.map(insight => `
                        <div class="insight-item ${insight.type}">
                            <h5>${insight.title}</h5>
                            <p>${insight.description}</p>
                            ${insight.action_required ? '<p><strong>⚠️ Action Required</strong></p>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    elements.moodInsightsSection.style.display = 'block';
}

// Mood Visualization Functions
let moodCharts = {};

function initMoodVisualization() {
    // Initialize visualization tab switching
    const vizTabs = document.querySelectorAll('.viz-tab');
    const vizContents = document.querySelectorAll('.viz-content');
    
    vizTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetViz = tab.dataset.viz;
            
            // Update active tab
            vizTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            vizContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `mood${targetViz.charAt(0).toUpperCase() + targetViz.slice(1)}Viz`) {
                    content.classList.add('active');
                }
            });
            
            // Load data for the selected visualization
            loadMoodVisualizationData(targetViz);
        });
    });
    
    // Time range selector
    const timeRangeSelector = document.getElementById('moodTimeRange');
    if (timeRangeSelector) {
        timeRangeSelector.addEventListener('change', () => {
            const currentTab = document.querySelector('.viz-tab.active');
            if (currentTab) {
                loadMoodVisualizationData(currentTab.dataset.viz);
            }
        });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshMoodViz');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const currentTab = document.querySelector('.viz-tab.active');
            if (currentTab) {
                loadMoodVisualizationData(currentTab.dataset.viz);
            }
        });
    }
    
    // Load initial data
    loadMoodVisualizationData('overview');
}

async function loadMoodVisualizationData(vizType) {
    try {
        const timeRange = document.getElementById('moodTimeRange')?.value || 30;
        const days = parseInt(timeRange);
        
        // Get mood data for the specified time range
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        const moodData = await api.getMoodEntries(startDateStr, endDate, days);
        
        switch (vizType) {
            case 'overview':
                renderMoodOverview(moodData);
                break;
            case 'trends':
                renderMoodTrends(moodData);
                break;
            case 'correlations':
                renderMoodCorrelations(moodData);
                break;
            case 'patterns':
                renderMoodPatterns(moodData);
                break;
        }
    } catch (error) {
        console.error('Error loading mood visualization data:', error);
        showMessage('Failed to load mood visualization data', 'error');
    }
}

function renderMoodOverview(moodData) {
    // Today's mood gauge
    const todayMood = moodData.find(entry => entry.mood_date === new Date().toISOString().split('T')[0]);
    renderTodayMoodGauge(todayMood);
    
    // Weekly summary
    renderWeeklySummary(moodData);
    
    // Mood trend indicator
    renderMoodTrendIndicator(moodData);
}

function renderTodayMoodGauge(todayMood) {
    const container = document.getElementById('todayMoodGauge');
    if (!container) return;
    
    if (!todayMood) {
        container.innerHTML = '<p style="color: #64748b;">No mood entry for today</p>';
        return;
    }
    
    const score = todayMood.mood_score;
    const emoji = getMoodEmoji(score);
    const color = getMoodColor(score);
    
    container.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">${emoji}</div>
            <div style="font-size: 3rem; font-weight: 700; color: #3b82f6; margin-bottom: 0.5rem;">${score}</div>
            <div style="color: #64748b; font-size: 0.9rem;">out of 10</div>
            <div style="margin-top: 1rem; padding: 0.5rem; background: ${color}; border-radius: 6px; color: white; font-size: 0.8rem;">
                ${score >= 8 ? 'Excellent' : score >= 6 ? 'Good' : score >= 4 ? 'Fair' : 'Needs Attention'}
            </div>
        </div>
    `;
}

function renderWeeklySummary(moodData) {
    const container = document.getElementById('weeklySummary');
    if (!container) return;
    
    // Group data by day of week
    const weeklyData = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    moodData.forEach(entry => {
        const date = new Date(entry.mood_date);
        const dayOfWeek = days[date.getDay()];
        
        if (!weeklyData[dayOfWeek]) {
            weeklyData[dayOfWeek] = [];
        }
        weeklyData[dayOfWeek].push(entry.mood_score);
    });
    
    // Calculate averages
    const weeklyAverages = {};
    Object.keys(weeklyData).forEach(day => {
        const scores = weeklyData[day];
        weeklyAverages[day] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    container.innerHTML = `
        <div class="weekly-summary">
            ${days.map(day => `
                <div class="week-day">
                    <div class="week-day-label">${day.substring(0, 3)}</div>
                    <div class="week-day-value">${weeklyAverages[day] ? weeklyAverages[day].toFixed(1) : 'N/A'}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderMoodTrendIndicator(moodData) {
    const container = document.getElementById('moodTrendIndicator');
    if (!container) return;
    
    if (moodData.length < 2) {
        container.innerHTML = '<p style="color: #64748b;">Not enough data for trend analysis</p>';
        return;
    }
    
    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(moodData.length / 2);
    const firstHalf = moodData.slice(0, midPoint);
    const secondHalf = moodData.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, entry) => sum + entry.mood_score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, entry) => sum + entry.mood_score, 0) / secondHalf.length;
    
    const trend = secondHalfAvg - firstHalfAvg;
    const trendDirection = trend > 0.5 ? 'up' : trend < -0.5 ? 'down' : 'stable';
    const trendIcon = trendDirection === 'up' ? '↗️' : trendDirection === 'down' ? '↘️' : '→';
    const trendColor = trendDirection === 'up' ? '#059669' : trendDirection === 'down' ? '#dc2626' : '#64748b';
    
    container.innerHTML = `
        <div class="trend-indicator">
            <div class="trend-value" style="color: ${trendColor};">${trendIcon}</div>
            <div class="trend-label">${trendDirection === 'up' ? 'Improving' : trendDirection === 'down' ? 'Declining' : 'Stable'}</div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.5rem;">
                Change: ${trend > 0 ? '+' : ''}${trend.toFixed(1)}
            </div>
        </div>
    `;
}

function renderMoodTrends(moodData) {
    // Mood over time chart
    renderMoodTrendChart(moodData);
    
    // Multi-metric chart
    renderMultiMetricChart(moodData);
}

function renderMoodTrendChart(moodData) {
    const ctx = document.getElementById('moodTrendChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (moodCharts.moodTrend) {
        moodCharts.moodTrend.destroy();
    }
    
    const labels = moodData.map(entry => {
        const date = new Date(entry.mood_date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();
    
    const moodScores = moodData.map(entry => entry.mood_score).reverse();
    
    moodCharts.moodTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mood Score',
                data: moodScores,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Mood: ${context.parsed.y}/10`;
                        }
                    }
                }
            }
        }
    });
}

function renderMultiMetricChart(moodData) {
    const ctx = document.getElementById('multiMetricChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (moodCharts.multiMetric) {
        moodCharts.multiMetric.destroy();
    }
    
    const labels = moodData.map(entry => {
        const date = new Date(entry.mood_date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();
    
    const moodScores = moodData.map(entry => entry.mood_score || 0).reverse();
    const energyLevels = moodData.map(entry => entry.energy_level || 0).reverse();
    const stressLevels = moodData.map(entry => entry.stress_level || 0).reverse();
    const motivationLevels = moodData.map(entry => entry.motivation_level || 0).reverse();
    
    moodCharts.multiMetric = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Mood',
                    data: moodScores,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Energy',
                    data: energyLevels,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Stress',
                    data: stressLevels,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Motivation',
                    data: motivationLevels,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

function renderMoodCorrelations(moodData) {
    // Mood correlations heatmap
    renderCorrelationChart(moodData);
    
    // Stress vs Mood scatter plot
    renderStressMoodScatter(moodData);
}

function renderCorrelationChart(moodData) {
    const ctx = document.getElementById('correlationChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (moodCharts.correlation) {
        moodCharts.correlation.destroy();
    }
    
    // Calculate correlations between different metrics
    const metrics = ['mood_score', 'energy_level', 'stress_level', 'motivation_level'];
    const metricLabels = ['Mood', 'Energy', 'Stress', 'Motivation'];
    
    const correlationMatrix = [];
    for (let i = 0; i < metrics.length; i++) {
        correlationMatrix[i] = [];
        for (let j = 0; j < metrics.length; j++) {
            if (i === j) {
                correlationMatrix[i][j] = 1;
            } else {
                correlationMatrix[i][j] = calculateCorrelation(
                    moodData.map(entry => entry[metrics[i]] || 0),
                    moodData.map(entry => entry[metrics[j]] || 0)
                );
            }
        }
    }
    
    moodCharts.correlation = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: metricLabels,
            datasets: metricLabels.map((label, index) => ({
                label: label,
                data: correlationMatrix[index],
                backgroundColor: `hsl(${index * 90}, 70%, 60%)`,
                borderColor: `hsl(${index * 90}, 70%, 40%)`,
                borderWidth: 1
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 1,
                    min: -1
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderStressMoodScatter(moodData) {
    const ctx = document.getElementById('stressMoodScatter');
    if (!ctx) return;
    
    // Destroy existing chart
    if (moodCharts.stressMoodScatter) {
        moodCharts.stressMoodScatter.destroy();
    }
    
    const scatterData = moodData.map(entry => ({
        x: entry.stress_level || 0,
        y: entry.mood_score || 0
    }));
    
    moodCharts.stressMoodScatter = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Stress vs Mood',
                data: scatterData,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Stress Level'
                    },
                    min: 0,
                    max: 10
                },
                y: {
                    title: {
                        display: true,
                        text: 'Mood Score'
                    },
                    min: 0,
                    max: 10
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Stress: ${context.parsed.x}, Mood: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

function renderMoodPatterns(moodData) {
    // Day of week patterns
    renderDayOfWeekChart(moodData);
    
    // Mood distribution
    renderMoodDistributionChart(moodData);
}

function renderDayOfWeekChart(moodData) {
    const ctx = document.getElementById('dayOfWeekChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (moodCharts.dayOfWeek) {
        moodCharts.dayOfWeek.destroy();
    }
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayAverages = {};
    
    // Initialize day averages
    days.forEach(day => {
        dayAverages[day] = [];
    });
    
    // Group data by day of week
    moodData.forEach(entry => {
        const date = new Date(entry.mood_date);
        const dayOfWeek = days[date.getDay()];
        if (dayAverages[dayOfWeek]) {
            dayAverages[dayOfWeek].push(entry.mood_score);
        }
    });
    
    // Calculate averages
    const averages = days.map(day => {
        const scores = dayAverages[day];
        return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    });
    
    moodCharts.dayOfWeek = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days.map(day => day.substring(0, 3)),
            datasets: [{
                label: 'Average Mood',
                data: averages,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: '#3b82f6',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderMoodDistributionChart(moodData) {
    const ctx = document.getElementById('moodDistributionChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (moodCharts.moodDistribution) {
        moodCharts.moodDistribution.destroy();
    }
    
    // Count mood scores
    const distribution = {};
    for (let i = 1; i <= 10; i++) {
        distribution[i] = 0;
    }
    
    moodData.forEach(entry => {
        const score = entry.mood_score;
        if (score >= 1 && score <= 10) {
            distribution[score]++;
        }
    });
    
    const labels = Object.keys(distribution);
    const data = Object.values(distribution);
    
    moodCharts.moodDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: data,
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: '#10b981',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function calculateCorrelation(x, y) {
    const n = x.length;
    if (n === 0) return 0;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

// Intervention Monitoring Functions
async function checkInterventionTriggers() {
    try {
        showLoading();
        const interventionData = await api.getInterventionTriggers(14);
        renderInterventionTriggers(interventionData);
    } catch (error) {
        console.error('Error checking intervention triggers:', error);
        showMessage('Failed to check intervention triggers', 'error');
    } finally {
        hideLoading();
    }
}

function renderInterventionTriggers(data) {
    const container = document.getElementById('interventionContent');
    if (!container) return;
    
    const { triggers, recommendations, analysis, data_summary } = data;
    
    if (triggers.length === 0) {
        container.innerHTML = `
            <div class="no-triggers">
                <i class="fas fa-check-circle"></i>
                <h4>No Concerns Detected</h4>
                <p>Your recent mood patterns look healthy. Keep up the great work!</p>
                <div style="margin-top: 1rem; font-size: 0.9rem; color: #9ca3af;">
                    <p><strong>Data Summary:</strong></p>
                    <p>• Average Mood: ${data_summary.avg_mood?.toFixed(1) || 'N/A'}/10</p>
                    <p>• Low Mood Days: ${data_summary.low_mood_percentage?.toFixed(0) || 0}%</p>
                    <p>• Average Stress: ${data_summary.avg_stress?.toFixed(1) || 'N/A'}/10</p>
                </div>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="intervention-analysis">
            <h4><i class="fas fa-exclamation-triangle"></i> ${analysis}</h4>
        </div>
    `;
    
    // Render triggers
    triggers.forEach(trigger => {
        html += `
            <div class="intervention-trigger ${trigger.severity}">
                <div class="trigger-header">
                    <span class="trigger-type">${trigger.type.replace('_', ' ')}</span>
                    <span class="trigger-severity ${trigger.severity}">${trigger.severity}</span>
                </div>
                <div class="trigger-description">${trigger.description}</div>
                <div class="trigger-recommendation">${trigger.recommendation}</div>
            </div>
        `;
    });
    
    // Render recommendations
    if (recommendations && recommendations.length > 0) {
        const rec = recommendations[0];
        html += `
            <div class="intervention-recommendations">
                <div class="recommendations-title">
                    <i class="fas fa-lightbulb"></i>
                    Recommended Actions
                </div>
                ${rec.immediate ? `
                    <div class="recommendation-category">
                        <h5>Immediate Actions</h5>
                        <ul class="recommendation-list">
                            ${rec.immediate.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${rec.short_term ? `
                    <div class="recommendation-category">
                        <h5>Short-term Actions</h5>
                        <ul class="recommendation-list">
                            ${rec.short_term.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${rec.long_term ? `
                    <div class="recommendation-category">
                        <h5>Long-term Actions</h5>
                        <ul class="recommendation-list">
                            ${rec.long_term.map(action => `<li>${action}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Add action buttons
    html += `
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="logInterventionAction('acknowledged')">
                <i class="fas fa-check"></i> Acknowledge
            </button>
            <button class="btn btn-secondary" onclick="logInterventionAction('action_taken')">
                <i class="fas fa-clipboard-check"></i> Mark Action Taken
            </button>
            <button class="btn btn-primary" onclick="showEmergencySupport()">
                <i class="fas fa-phone"></i> Get Support
            </button>
        </div>
    `;
    
    container.innerHTML = html;
}

async function logInterventionAction(actionType) {
    try {
        const actionText = actionType === 'acknowledged' ? 'Acknowledged intervention trigger' : 'Took action on intervention trigger';
        
        await api.logIntervention({
            trigger_type: 'user_action',
            action_taken: actionText,
            notes: `User ${actionType} via intervention monitoring interface`,
            effectiveness: 3 // Default neutral rating
        });
        
        showMessage('Action logged successfully', 'success');
    } catch (error) {
        console.error('Error logging intervention action:', error);
        showMessage('Failed to log action', 'error');
    }
}

function viewInterventionHistory() {
    const container = document.getElementById('interventionContent');
    if (!container) return;
    
    // For now, show a placeholder. In a full implementation, you'd fetch from the API
    container.innerHTML = `
        <div class="intervention-history">
            <h4><i class="fas fa-history"></i> Intervention History</h4>
            <div class="history-item">
                <div class="history-details">
                    <div class="history-trigger">Mood Check</div>
                    <div class="history-action">Acknowledged intervention trigger</div>
                </div>
                <div class="history-date">Today</div>
            </div>
            <div class="history-item">
                <div class="history-details">
                    <div class="history-trigger">Stress Management</div>
                    <div class="history-action">Used coping strategy: Deep breathing</div>
                </div>
                <div class="history-date">Yesterday</div>
            </div>
            <div class="history-item">
                <div class="history-details">
                    <div class="history-trigger">Energy Boost</div>
                    <div class="history-action">Took a 15-minute walk</div>
                </div>
                <div class="history-date">2 days ago</div>
            </div>
        </div>
        <div style="margin-top: 1rem;">
            <button class="btn btn-secondary" onclick="checkInterventionTriggers()">
                <i class="fas fa-search"></i> Check Current Triggers
            </button>
        </div>
    `;
}

function showEmergencySupport() {
    const container = document.getElementById('interventionContent');
    if (!container) return;
    
    container.innerHTML = `
        <div class="emergency-support">
            <h4><i class="fas fa-phone"></i> Emergency Support Resources</h4>
            <p>If you're experiencing a mental health crisis or need immediate support, please reach out to these resources:</p>
            
            <div class="emergency-links">
                <a href="tel:113" class="emergency-link">
                    <i class="fas fa-phone"></i>
                    Netherlands: 113 Suicide Prevention (113)
                </a>
                <a href="tel:0800-0113" class="emergency-link">
                    <i class="fas fa-phone"></i>
                    Netherlands: 113 Crisis Line (0800-0113)
                </a>
                <a href="https://www.113.nl" target="_blank" class="emergency-link">
                    <i class="fas fa-globe"></i>
                    113.nl Online Chat
                </a>
            </div>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: #f0f9ff; border-radius: 6px; border: 1px solid #bae6fd;">
                <h5 style="color: #0369a1; margin-bottom: 0.5rem;">Remember:</h5>
                <ul style="color: #0c4a6e; margin: 0; padding-left: 1.5rem;">
                    <li>You are not alone</li>
                    <li>Help is available 24/7</li>
                    <li>It's okay to ask for support</li>
                    <li>Your wellbeing matters</li>
                </ul>
            </div>
            
            <div style="margin-top: 1rem;">
                <button class="btn btn-secondary" onclick="checkInterventionTriggers()">
                    <i class="fas fa-arrow-left"></i> Back to Monitoring
                </button>
            </div>
        </div>
    `;
}

// Work Preferences Functions
async function loadWorkPreferences() {
    try {
        showLoading();
        const preferences = await api.getWorkPreferences();
        renderWorkPreferences(preferences);
    } catch (error) {
        console.error('Error loading work preferences:', error);
        showMessage('Failed to load work preferences', 'error');
    } finally {
        hideLoading();
    }
}

function renderWorkPreferences(preferences) {
    if (!preferences) return;
    
    // Populate form fields with current preferences
    document.getElementById('maxDailyHours').value = preferences.max_daily_hours || 8;
    document.getElementById('maxWeeklyHours').value = preferences.max_weekly_hours || 40;
    document.getElementById('preferredStartTime').value = preferences.preferred_start_time || '09:00';
    document.getElementById('preferredEndTime').value = preferences.preferred_end_time || '17:00';
    document.getElementById('breakDurationMinutes').value = preferences.break_duration_minutes || 60;
    document.getElementById('breakReminderInterval').value = preferences.break_reminder_interval || 90;
    document.getElementById('maxIntensityLevel').value = preferences.max_intensity_level || 8;
    document.getElementById('stressThreshold').value = preferences.stress_threshold || 7;
    document.getElementById('weekendWorkAllowed').checked = preferences.weekend_work_allowed || false;
    document.getElementById('maxWeekendHours').value = preferences.max_weekend_hours || 4;
    document.getElementById('overtimeThresholdHours').value = preferences.overtime_threshold_hours || 2;
    document.getElementById('workLifeBalanceGoal').value = preferences.work_life_balance_goal || 'balanced';
    document.getElementById('autoBreakSuggestions').checked = preferences.auto_break_suggestions !== false;
    document.getElementById('intensityWarnings').checked = preferences.intensity_warnings !== false;
    document.getElementById('overworkAlerts').checked = preferences.overwork_alerts !== false;
    document.getElementById('weeklySummary').checked = preferences.weekly_summary !== false;
    
    // Update slider value displays
    document.getElementById('maxIntensityValue').textContent = preferences.max_intensity_level || 8;
    document.getElementById('stressThresholdValue').textContent = preferences.stress_threshold || 7;
    
    // Show/hide weekend hours group based on weekend work setting
    const weekendHoursGroup = document.getElementById('weekendHoursGroup');
    if (preferences.weekend_work_allowed) {
        weekendHoursGroup.style.display = 'block';
    } else {
        weekendHoursGroup.style.display = 'none';
    }
}

function showWorkPreferencesModal() {
    const modal = document.getElementById('workPreferencesModal');
    showModal(modal);
    
    // Load current preferences
    loadWorkPreferences();
}

function initWorkPreferencesEventHandlers() {
    // Work preferences button
    document.getElementById('workPreferencesBtn')?.addEventListener('click', showWorkPreferencesModal);
    
    // Modal close handlers
    document.getElementById('closeWorkPreferencesModal')?.addEventListener('click', () => 
        hideModal(document.getElementById('workPreferencesModal')));
    document.getElementById('cancelWorkPreferencesModal')?.addEventListener('click', () => 
        hideModal(document.getElementById('workPreferencesModal')));
    
    // Weekend work toggle
    document.getElementById('weekendWorkAllowed')?.addEventListener('change', (e) => {
        const weekendHoursGroup = document.getElementById('weekendHoursGroup');
        if (e.target.checked) {
            weekendHoursGroup.style.display = 'block';
        } else {
            weekendHoursGroup.style.display = 'none';
        }
    });
    
    // Range slider updates
    const sliders = ['maxIntensityLevel', 'stressThreshold'];
    sliders.forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(sliderId + 'Value');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
            });
        }
    });
    
    // Work preferences form submission
    document.getElementById('workPreferencesForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = {
                max_daily_hours: parseFloat(document.getElementById('maxDailyHours').value),
                max_weekly_hours: parseFloat(document.getElementById('maxWeeklyHours').value),
                preferred_start_time: document.getElementById('preferredStartTime').value,
                preferred_end_time: document.getElementById('preferredEndTime').value,
                break_duration_minutes: parseInt(document.getElementById('breakDurationMinutes').value),
                max_intensity_level: parseInt(document.getElementById('maxIntensityLevel').value),
                stress_threshold: parseInt(document.getElementById('stressThreshold').value),
                weekend_work_allowed: document.getElementById('weekendWorkAllowed').checked,
                max_weekend_hours: parseFloat(document.getElementById('maxWeekendHours').value),
                overtime_threshold_hours: parseFloat(document.getElementById('overtimeThresholdHours').value),
                break_reminder_interval: parseInt(document.getElementById('breakReminderInterval').value),
                work_life_balance_goal: document.getElementById('workLifeBalanceGoal').value,
                auto_break_suggestions: document.getElementById('autoBreakSuggestions').checked,
                intensity_warnings: document.getElementById('intensityWarnings').checked,
                overwork_alerts: document.getElementById('overworkAlerts').checked,
                weekly_summary: document.getElementById('weeklySummary').checked
            };
            
            await api.updateWorkPreferences(formData);
            hideModal(document.getElementById('workPreferencesModal'));
            showMessage('Work preferences saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving work preferences:', error);
            showMessage('Failed to save work preferences', 'error');
        }
    });
    
    // Reset to defaults button
    document.getElementById('resetWorkPreferencesBtn')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all work preferences to default values?')) {
            try {
                await api.resetWorkPreferences();
                showMessage('Work preferences reset to defaults', 'success');
                // Reload the form with default values
                loadWorkPreferences();
            } catch (error) {
                console.error('Error resetting work preferences:', error);
                showMessage('Failed to reset work preferences', 'error');
            }
        }
    });
}

// Workload Tracking Functions
async function loadWorkloadData() {
    try {
        showLoading();
        
        // Load today's workload and recent entries
        const [todayWorkload, recentEntries] = await Promise.all([
            api.getTodayWorkload(),
            api.getWorkloadEntries(null, null, 10)
        ]);
        
        renderTodayWorkload(todayWorkload);
        renderWorkloadEntries(recentEntries);
        
        // Load new Phase 3 features
        await loadBreakRecommendations();
        await loadStressAlerts();
        await loadBalanceDashboard();
        
        // Initialize workload event handlers
        initWorkloadEventHandlers();
        
        // Initialize work preferences event handlers
        initWorkPreferencesEventHandlers();

        // Initialize preferences event handlers
        initPreferencesEventHandlers();
    } catch (error) {
        console.error('Error loading workload data:', error);
        showMessage('Failed to load workload data', 'error');
    } finally {
        hideLoading();
    }
}

function renderTodayWorkload(workloadEntry) {
    const content = document.getElementById('todayWorkloadContent');
    if (!content) return;
    
    if (!workloadEntry) {
        content.innerHTML = `
            <div class="today-workload-content no-entry">
                <p style="color: #6b7280; text-align: center; padding: 1rem;">
                    No work session logged for today yet.
                </p>
                <button class="btn btn-primary" onclick="showWorkloadModal()">
                    <i class="fas fa-plus"></i> Log Today's Work
                </button>
            </div>
        `;
        return;
    }
    
    const workHours = calculateWorkHours(workloadEntry.start_time, workloadEntry.end_time, workloadEntry.break_duration || 0);
    
    content.innerHTML = `
        <div class="today-workload-content">
            <div class="workload-summary">
                <div class="workload-hours">
                    <span class="hours-value">${workHours.toFixed(1)}</span>
                    <span class="hours-label">hours</span>
                </div>
                <div class="workload-details">
                    <div class="workload-time">
                        <i class="fas fa-clock"></i>
                        ${workloadEntry.start_time} - ${workloadEntry.end_time}
                    </div>
                    ${workloadEntry.work_type ? `
                        <div class="workload-type">
                            ${workloadEntry.work_type.replace('_', ' ')}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="workload-metrics">
                <div class="workload-metric">
                    <div class="workload-metric-label">Intensity</div>
                    <div class="workload-metric-value">${workloadEntry.intensity_level}/10</div>
                </div>
                <div class="workload-metric">
                    <div class="workload-metric-label">Focus</div>
                    <div class="workload-metric-value">${workloadEntry.focus_level || 'N/A'}/10</div>
                </div>
                <div class="workload-metric">
                    <div class="workload-metric-label">Productivity</div>
                    <div class="workload-metric-value">${workloadEntry.productivity_score || 'N/A'}/10</div>
                </div>
                <div class="workload-metric">
                    <div class="workload-metric-label">Tasks</div>
                    <div class="workload-metric-value">${workloadEntry.tasks_completed || 0}</div>
                </div>
            </div>
            
            ${workloadEntry.notes ? `
                <div class="workload-notes">
                    <strong>Notes:</strong> ${workloadEntry.notes}
                </div>
            ` : ''}
            
            <div class="workload-actions">
                <button class="btn btn-secondary" onclick="editWorkloadEntry('${workloadEntry.work_date}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-primary" onclick="showWorkloadModal()">
                    <i class="fas fa-plus"></i> Add Another
                </button>
            </div>
        </div>
    `;
}

function renderWorkloadEntries(entries) {
    const container = document.getElementById('workloadEntries');
    if (!container) return;
    
    if (!entries || entries.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No work sessions logged yet. Start tracking your workload to see your history here.</p>';
        return;
    }
    
    container.innerHTML = entries.map(entry => {
        const workHours = calculateWorkHours(entry.start_time, entry.end_time, entry.break_duration || 0);
        
        return `
            <div class="card card-sm workload-entry-card">
                <div class="workload-entry-header">
                    <span class="workload-entry-date">${formatDate(entry.work_date)}</span>
                    <span class="workload-entry-hours">${workHours.toFixed(1)}h</span>
                </div>
                
                <div class="workload-entry-metrics">
                    <div class="workload-metric">
                        <div class="workload-metric-label">Intensity</div>
                        <div class="workload-metric-value">${entry.intensity_level}/10</div>
                    </div>
                    <div class="workload-metric">
                        <div class="workload-metric-label">Focus</div>
                        <div class="workload-metric-value">${entry.focus_level || 'N/A'}/10</div>
                    </div>
                    <div class="workload-metric">
                        <div class="workload-metric-label">Productivity</div>
                        <div class="workload-metric-value">${entry.productivity_score || 'N/A'}/10</div>
                    </div>
                    <div class="workload-metric">
                        <div class="workload-metric-label">Tasks</div>
                        <div class="workload-metric-value">${entry.tasks_completed || 0}</div>
                    </div>
                </div>
                
                <div class="workload-entry-details">
                    <div>
                        ${entry.work_type ? `<span class="workload-type">${entry.work_type.replace('_', ' ')}</span>` : ''}
                        ${entry.location ? `<span class="workload-location">📍 ${entry.location}</span>` : ''}
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline" onclick="editWorkloadEntry('${entry.work_date}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="deleteWorkloadEntry('${entry.work_date}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${entry.notes ? `
                    <div class="workload-notes">
                        <strong>Notes:</strong> ${entry.notes}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function calculateWorkHours(startTime, endTime, breakDuration = 0) {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    const workMinutes = totalMinutes - breakDuration;
    return Math.max(0, workMinutes / 60);
}


function showWorkloadModal(editDate = null) {
    const modal = document.getElementById('workloadModal');
    const form = document.getElementById('workloadForm');
    
    // Reset form
    form.reset();
    
    // Set default date
    const dateInput = document.getElementById('workloadDate');
    if (editDate) {
        dateInput.value = editDate;
    } else {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Set default times
    document.getElementById('startTime').value = '09:00';
    document.getElementById('endTime').value = '17:00';
    
    // Update modal title
    const title = document.getElementById('workloadModalTitle');
    title.textContent = editDate ? 'Edit Work Session' : 'Log Work Session';
    
    showModal(modal);
}

function editWorkloadEntry(date) {
    showWorkloadModal(date);
    // TODO: Load existing data for editing
}

async function deleteWorkloadEntry(date) {
    if (!confirm('Are you sure you want to delete this work session?')) {
        return;
    }
    
    try {
        await api.deleteWorkloadEntry(date);
        await loadWorkloadData();
        showMessage('Work session deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting workload entry:', error);
        showMessage('Failed to delete work session', 'error');
    }
}

function initWorkloadEventHandlers() {
    // New workload entry button
    document.getElementById('newWorkloadEntryBtn')?.addEventListener('click', () => showWorkloadModal());
    
    // Workload stats button
    document.getElementById('workloadStatsBtn')?.addEventListener('click', async () => {
        try {
            showLoading();
            const stats = await api.getWorkloadStats(30);
            renderWorkloadStats(stats);
        } catch (error) {
            console.error('Error loading workload stats:', error);
            showMessage('Failed to load workload statistics', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Workload patterns button
    document.getElementById('workloadPatternsBtn')?.addEventListener('click', async () => {
        try {
            showLoading();
            const patterns = await api.getWorkloadPatterns(90);
            renderWorkloadPatterns(patterns);
        } catch (error) {
            console.error('Error loading workload patterns:', error);
            showMessage('Failed to load workload patterns', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Workload balance button
    document.getElementById('workloadBalanceBtn')?.addEventListener('click', async () => {
        try {
            showLoading();
            const balance = await api.getWorkloadBalanceAnalysis(30);
            renderWorkloadBalance(balance);
        } catch (error) {
            console.error('Error loading workload balance analysis:', error);
            showMessage('Failed to load balance analysis', 'error');
        } finally {
            hideLoading();
        }
    });
    
    // Range slider updates
    const sliders = ['intensityLevel', 'focusLevel', 'productivityScore'];
    sliders.forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(sliderId + 'Value');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
            });
        }
    });
    
    // Workload form submission
    document.getElementById('workloadForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = {
                work_date: document.getElementById('workloadDate').value,
                start_time: document.getElementById('startTime').value,
                end_time: document.getElementById('endTime').value,
                break_duration: parseInt(document.getElementById('breakDuration').value) || 0,
                intensity_level: parseInt(document.getElementById('intensityLevel').value),
                focus_level: parseInt(document.getElementById('focusLevel').value),
                productivity_score: parseInt(document.getElementById('productivityScore').value),
                tasks_completed: parseInt(document.getElementById('tasksCompleted').value) || 0,
                notes: document.getElementById('workloadNotes').value,
                work_type: document.getElementById('workType').value,
                location: document.getElementById('workloadLocation').value
            };
            
            await api.createWorkloadEntry(formData);
            hideModal(document.getElementById('workloadModal'));
            await loadWorkloadData();
            showMessage('Work session saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving workload entry:', error);
            showMessage('Failed to save work session', 'error');
        }
    });
    
    // Modal close handlers
    document.getElementById('closeWorkloadModal')?.addEventListener('click', () => hideModal(document.getElementById('workloadModal')));
    document.getElementById('cancelWorkloadModal')?.addEventListener('click', () => hideModal(document.getElementById('workloadModal')));
}

function renderWorkloadStats(stats) {
    const summary = stats.summary;
    const patterns = stats.weekly_patterns;
    
    document.getElementById('workloadInsightsContent').innerHTML = `
        <div class="metrics-grid">
            <div class="card card-sm metric">
                <div class="workload-stat-value">${summary.avg_work_hours?.toFixed(1) || 'N/A'}</div>
                <div class="workload-stat-label">Avg Hours/Day</div>
            </div>
            <div class="card card-sm metric">
                <div class="workload-stat-value">${summary.total_work_hours?.toFixed(1) || 'N/A'}</div>
                <div class="workload-stat-label">Total Hours</div>
            </div>
            <div class="card card-sm metric">
                <div class="workload-stat-value">${summary.avg_intensity?.toFixed(1) || 'N/A'}</div>
                <div class="workload-stat-label">Avg Intensity</div>
            </div>
            <div class="card card-sm metric">
                <div class="workload-stat-value">${summary.avg_productivity?.toFixed(1) || 'N/A'}</div>
                <div class="workload-stat-label">Avg Productivity</div>
            </div>
            <div class="card card-sm metric">
                <div class="workload-stat-value">${summary.high_intensity_days || 0}</div>
                <div class="workload-stat-label">High Intensity Days</div>
            </div>
            <div class="card card-sm metric">
                <div class="workload-stat-value">${summary.long_work_days || 0}</div>
                <div class="workload-stat-label">Long Work Days (10h+)</div>
            </div>
        </div>
    `;
    
    document.getElementById('workloadInsightsSection').style.display = 'block';
}

function renderWorkloadPatterns(patterns) {
    const dayPatterns = patterns.day_of_week_patterns;
    const workTypePatterns = patterns.work_type_patterns;
    
    document.getElementById('workloadInsightsContent').innerHTML = `
        <div class="card card-gray insight-card">
            <div class="insight-title">
                <i class="fas fa-calendar-week"></i>
                Day of Week Patterns
            </div>
            <div class="insight-content">
                ${dayPatterns.map(day => `
                    <p><strong>${day.day_of_week}:</strong> 
                    ${day.avg_hours?.toFixed(1) || 'N/A'}h avg, 
                    Intensity ${day.avg_intensity?.toFixed(1) || 'N/A'}/10, 
                    Productivity ${day.avg_productivity?.toFixed(1) || 'N/A'}/10</p>
                `).join('')}
            </div>
        </div>
        
        ${workTypePatterns.length > 0 ? `
            <div class="card card-gray insight-card">
                <div class="insight-title">
                    <i class="fas fa-briefcase"></i>
                    Work Type Patterns
                </div>
                <div class="insight-content">
                    ${workTypePatterns.map(type => `
                        <p><strong>${type.work_type.replace('_', ' ')}:</strong> 
                        ${type.avg_hours?.toFixed(1) || 'N/A'}h avg, 
                        Intensity ${type.avg_intensity?.toFixed(1) || 'N/A'}/10, 
                        Used ${type.count} times</p>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    document.getElementById('workloadInsightsSection').style.display = 'block';
}

function renderWorkloadBalance(balance) {
    const { analysis, recommendations, balance_score, metrics } = balance;
    
    document.getElementById('workloadInsightsContent').innerHTML = `
        <div class="balance-score">
            <div class="balance-score-value">${balance_score.toFixed(0)}</div>
            <div class="balance-score-label">Work-Life Balance Score</div>
        </div>
        
        <div class="card card-gray insight-card">
            <div class="insight-title">
                <i class="fas fa-chart-pie"></i>
                Analysis
            </div>
            <div class="insight-content">
                <p>${analysis}</p>
                <div style="margin-top: 1rem;">
                    <p><strong>Key Metrics:</strong></p>
                    <ul>
                        <li>Average work hours: ${metrics.avg_work_hours?.toFixed(1) || 'N/A'} hours/day</li>
                        <li>Total work hours: ${metrics.total_work_hours?.toFixed(1) || 'N/A'} hours</li>
                        <li>Weekend work days: ${metrics.weekend_work_days || 0}</li>
                        <li>Average intensity: ${metrics.avg_intensity?.toFixed(1) || 'N/A'}/10</li>
                        <li>Average productivity: ${metrics.avg_productivity?.toFixed(1) || 'N/A'}/10</li>
                    </ul>
                </div>
            </div>
        </div>
        
        ${recommendations.length > 0 ? `
            <div class="balance-recommendations">
                <h4><i class="fas fa-lightbulb"></i> Recommendations</h4>
                ${recommendations.map(rec => `
                    <div class="recommendation-item ${rec.severity}">
                        <div class="recommendation-title">${rec.title}</div>
                        <div class="recommendation-description">${rec.description}</div>
                        <div class="recommendation-text">${rec.recommendation}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    document.getElementById('workloadInsightsSection').style.display = 'block';
}

// Coping Strategies Functions
async function loadCopingStrategies() {
    try {
        showLoading();
        const strategies = await api.getCopingStrategies({ limit: 20 });
        renderCopingStrategies(strategies);
    } catch (error) {
        console.error('Error loading coping strategies:', error);
        showMessage('Failed to load coping strategies', 'error');
    } finally {
        hideLoading();
    }
}

async function loadRecommendedStrategies() {
    try {
        showLoading();
        const response = await api.getRecommendedStrategies();
        renderCopingStrategies(response.recommendations, 'Recommended for you');
    } catch (error) {
        console.error('Error loading recommended strategies:', error);
        showMessage('Failed to load recommended strategies', 'error');
    } finally {
        hideLoading();
    }
}

async function loadStrategyAnalytics() {
    try {
        showLoading();
        const analytics = await api.getStrategyAnalytics(30);
        renderStrategyAnalytics(analytics);
    } catch (error) {
        console.error('Error loading strategy analytics:', error);
        showMessage('Failed to load strategy analytics', 'error');
    } finally {
        hideLoading();
    }
}

function renderCopingStrategies(strategies, title = 'Coping Strategies') {
    if (!strategies || strategies.length === 0) {
        elements.strategiesContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart"></i>
                <h3>No strategies found</h3>
                <p>Add your first coping strategy to get started.</p>
            </div>
        `;
        return;
    }

    elements.strategiesContent.innerHTML = `
        <div class="strategies-header">
            <h4>${title}</h4>
            <p>${strategies.length} strategies available</p>
        </div>
        <div class="strategies-grid">
            ${strategies.map(strategy => renderStrategyCard(strategy)).join('')}
        </div>
    `;
}

function renderStrategyCard(strategy) {
    const tags = strategy.mood_tags ? strategy.mood_tags.split(',').map(tag => tag.trim()) : [];
    const stressLevels = strategy.stress_levels ? strategy.stress_levels.split(',').map(level => level.trim()) : [];
    const triggers = strategy.triggers ? strategy.triggers.split(',').map(trigger => trigger.trim()) : [];
    
    return `
        <div class="card strategy-card">
            <div class="flex justify-between items-center">
                <h5 class="strategy-title">${strategy.strategy_name}</h5>
                <span class="strategy-category">${strategy.strategy_category}</span>
            </div>
            
            <p class="strategy-description">${strategy.description}</p>
            
            <div class="strategy-instructions">
                <strong>Instructions:</strong><br>
                ${strategy.instructions}
            </div>
            
            <div class="strategy-meta">
                ${strategy.duration_minutes ? `
                    <div class="strategy-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${strategy.duration_minutes} min</span>
                    </div>
                ` : ''}
                <div class="strategy-meta-item">
                    <i class="fas fa-signal"></i>
                    <span>Difficulty: ${strategy.difficulty_level}/5</span>
                </div>
                ${strategy.effectiveness_rating > 0 ? `
                    <div class="strategy-meta-item">
                        <i class="fas fa-star"></i>
                        <span>${strategy.effectiveness_rating.toFixed(1)}/5</span>
                    </div>
                ` : ''}
                ${strategy.usage_count > 0 ? `
                    <div class="strategy-meta-item">
                        <i class="fas fa-chart-line"></i>
                        <span>Used ${strategy.usage_count} times</span>
                    </div>
                ` : ''}
            </div>
            
            ${tags.length > 0 ? `
                <div class="strategy-tags">
                    ${tags.map(tag => `<span class="strategy-tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="flex gap-2">
                <button class="strategy-use-btn" onclick="useCopingStrategy('${strategy.id}', '${strategy.strategy_name}')">
                    <i class="fas fa-play"></i> Use Strategy
                </button>
            </div>
        </div>
    `;
}

function renderStrategyAnalytics(analytics) {
    const { strategy_effectiveness, category_stats, period_days } = analytics;
    
    elements.strategiesContent.innerHTML = `
        <div class="analytics-header">
            <h4>Strategy Effectiveness Analytics</h4>
            <p>Last ${period_days} days</p>
        </div>
        
        <div class="analytics-section">
            <h5>Strategy Performance</h5>
            <div class="strategies-grid">
                ${strategy_effectiveness.map(strategy => `
                    <div class="card strategy-card">
                        <div class="flex justify-between items-center">
                            <h6 class="strategy-title">${strategy.strategy_name}</h6>
                            <span class="strategy-category">${strategy.strategy_category}</span>
                        </div>
                        
                        <div class="strategy-analytics">
                            <div class="analytics-grid">
                                <div class="analytics-item">
                                    <div class="analytics-value">${strategy.usage_count || 0}</div>
                                    <div class="analytics-label">Uses</div>
                                </div>
                                <div class="analytics-item">
                                    <div class="analytics-value">${strategy.avg_effectiveness ? strategy.avg_effectiveness.toFixed(1) : 'N/A'}</div>
                                    <div class="analytics-label">Effectiveness</div>
                                </div>
                                <div class="analytics-item">
                                    <div class="analytics-value">${strategy.avg_mood_improvement ? '+' + strategy.avg_mood_improvement.toFixed(1) : 'N/A'}</div>
                                    <div class="analytics-label">Mood Improvement</div>
                                </div>
                                <div class="analytics-item">
                                    <div class="analytics-value">${strategy.avg_stress_reduction ? '-' + strategy.avg_stress_reduction.toFixed(1) : 'N/A'}</div>
                                    <div class="analytics-label">Stress Reduction</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="analytics-section">
            <h5>Category Performance</h5>
            <div class="category-stats">
                ${category_stats.map(category => `
                    <div class="category-stat">
                        <h6>${category.strategy_category}</h6>
                        <p>${category.total_usage} uses • ${category.avg_effectiveness ? category.avg_effectiveness.toFixed(1) : 'N/A'} avg effectiveness</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function useCopingStrategy(strategyId, strategyName) {
    // Get current mood data for before/after comparison
    const currentMood = await api.getTodayMood();
    
    const beforeMood = currentMood?.mood_score || 5;
    const beforeStress = currentMood?.stress_level || 5;
    
    // Show a simple prompt for after-mood
    const afterMood = prompt(`How is your mood now after using "${strategyName}"? (1-10):`, beforeMood);
    const afterStress = prompt(`How is your stress level now? (1-10):`, beforeStress);
    const effectiveness = prompt(`How effective was this strategy? (1-5):`, 3);
    const notes = prompt(`Any notes about this strategy? (optional):`, '');
    
    if (afterMood && afterStress && effectiveness) {
        try {
            showLoading();
            await api.useStrategy({
                strategy_id: strategyId,
                mood_before: parseInt(beforeMood),
                mood_after: parseInt(afterMood),
                stress_before: parseInt(beforeStress),
                stress_after: parseInt(afterStress),
                effectiveness_rating: parseInt(effectiveness),
                notes: notes || null,
                context: 'manual_use'
            });
            
            showMessage('Strategy usage recorded successfully!', 'success');
            // Refresh the strategies to show updated effectiveness
            loadCopingStrategies();
        } catch (error) {
            console.error('Error recording strategy usage:', error);
            showMessage('Failed to record strategy usage', 'error');
        } finally {
            hideLoading();
        }
    }
}

function showStrategyModal() {
    elements.strategyModal.style.display = 'flex';
    elements.strategyForm.reset();
}

function hideStrategyModal() {
    elements.strategyModal.style.display = 'none';
}

async function handleStrategyFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        strategy_name: elements.strategyName.value,
        strategy_category: elements.strategyCategory.value,
        description: elements.strategyDescription.value,
        instructions: elements.strategyInstructions.value,
        duration_minutes: elements.strategyDuration.value ? parseInt(elements.strategyDuration.value) : null,
        difficulty_level: parseInt(elements.strategyDifficulty.value),
        mood_tags: elements.strategyMoodTags.value || null,
        stress_levels: elements.strategyStressLevels.value || null,
        triggers: elements.strategyTriggers.value || null
    };
    
    try {
        showLoading();
        await api.createStrategy(formData);
        showMessage('Coping strategy created successfully!', 'success');
        hideStrategyModal();
        loadCopingStrategies();
    } catch (error) {
        console.error('Error creating strategy:', error);
        showMessage('Failed to create coping strategy', 'error');
    } finally {
        hideLoading();
    }
}

// Global functions for mood (called from HTML)
window.showMoodModal = function(editDate = null) {
    if (window.moodController) {
        window.moodController.showMoodModal(editDate);
    } else {
        // Fallback to old function if controller not available
        showMoodModal(editDate);
    }
};

window.editMoodEntry = function(date) {
    if (window.moodController) {
        window.moodController.editMoodEntry(date);
    } else {
        // Fallback to old function if controller not available
        editMoodEntry(date);
    }
};

// Global functions for coping strategies (called from HTML)
window.useCopingStrategy = useCopingStrategy;
window.showStrategyModal = showStrategyModal;

// Learning System Functions

// Load learning data
async function loadLearningData() {
    try {
        showLoading();

        // Load learning statistics
        const stats = await api.getLearningStats();
        renderLearningStats(stats);

        // Load skill gap analysis
        const skillGaps = await api.getSkillGaps();
        renderSkillGapAnalysis(skillGaps);

        // Load learning recommendations
        const recommendations = await api.getLearningRecommendations();
        renderLearningRecommendations(recommendations);

        // Initialize learning event handlers
        initLearningEventHandlers();

    } catch (error) {
        console.error('Error loading learning data:', error);
        showMessage('Failed to load learning data', 'error');
    } finally {
        hideLoading();
    }
}

// Render learning statistics
function renderLearningStats(stats) {
    const { summary, by_difficulty } = stats;

    // Update stat cards
    document.getElementById('totalLearningPaths').textContent = summary.total_paths || 0;
    document.getElementById('completedPaths').textContent = summary.completed_paths || 0;
    document.getElementById('totalHours').textContent = `${(summary.total_estimated_hours || 0)}h`;
    document.getElementById('bestPracticesCount').textContent = stats.practices_count || 0;
}

// Render skill gap analysis
function renderSkillGapAnalysis(skillGaps) {
    const container = document.getElementById('skillGapContent');

    if (!skillGaps || skillGaps.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h4>No Skill Gaps Detected</h4>
                <p>Complete a skills assessment to see personalized learning recommendations</p>
                <button class="btn btn-primary" onclick="showSkills()">
                    <i class="fas fa-clipboard-list"></i> Take Skills Assessment
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = skillGaps.map(gap => `
        <div class="skill-gap-card">
            <div class="gap-header">
                <h4>${gap.skill_name}</h4>
                <span class="gap-priority ${gap.gap_size > 2 ? 'high' : gap.gap_size > 1 ? 'medium' : 'low'}">
                    Priority: ${gap.gap_size > 2 ? 'High' : gap.gap_size > 1 ? 'Medium' : 'Low'}
                </span>
            </div>
            <div class="gap-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(gap.current_level / gap.target_level) * 100}%"></div>
                </div>
                <div class="progress-labels">
                    <span>Level ${gap.current_level}</span>
                    <span>Level ${gap.target_level}</span>
                </div>
            </div>
            <p class="gap-description">${gap.assessment_notes || 'Bridge the gap between your current and target skill level'}</p>
            <button class="btn btn-secondary" onclick="createLearningPathForSkill('${gap.skill_name}', ${gap.target_level - gap.current_level})">
                <i class="fas fa-route"></i> Create Learning Path
            </button>
        </div>
    `).join('');
}

// Render learning recommendations
function renderLearningRecommendations(recommendations) {
    const container = document.getElementById('learningRecommendationsContent');

    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <h4>AI Recommendations</h4>
                <p>Click "Get Recommendations" to see personalized learning suggestions based on your goals and progress</p>
            </div>
        `;
        return;
    }

    const { skill_based_recommendations, relevant_practices } = recommendations;

    container.innerHTML = `
        <div class="recommendations-grid">
            ${skill_based_recommendations.map(rec => `
                <div class="card card-sm card-gray recommendation-card ${rec.priority}">
                    <div class="recommendation-header">
                        <h4>${rec.title}</h4>
                        <span class="priority-badge ${rec.priority}">${rec.priority}</span>
                    </div>
                    <p class="recommendation-description">${rec.description}</p>
                    <div class="recommendation-meta">
                        <span><i class="fas fa-clock"></i> ${rec.estimated_duration_hours}h estimated</span>
                        <span><i class="fas fa-signal"></i> ${rec.difficulty_level}</span>
                    </div>
                    <button class="btn btn-primary" onclick="createLearningPath('${rec.skill_focus}', '${rec.title}', '${rec.description}', ${rec.estimated_duration_hours})">
                        <i class="fas fa-plus"></i> Create Path
                    </button>
                </div>
            `).join('')}

            ${relevant_practices.length > 0 ? `
                <div class="practices-preview">
                    <h4><i class="fas fa-book"></i> Relevant Best Practices</h4>
                    ${relevant_practices.slice(0, 3).map(practice => `
                        <div class="practice-preview-card">
                            <h5>${practice.practice_title}</h5>
                            <p>${practice.practice_description}</p>
                            <span class="practice-category">${practice.practice_category}</span>
                        </div>
                    `).join('')}
                    <button class="btn btn-secondary" onclick="showBestPractices()">
                        <i class="fas fa-arrow-right"></i> View All Practices
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// Initialize learning event handlers
function initLearningEventHandlers() {
    // Get Recommendations button
    document.getElementById('learningRecommendationsBtn')?.addEventListener('click', async () => {
        try {
            showLoading();
            const recommendations = await api.getLearningRecommendations();
            renderLearningRecommendations(recommendations);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            showMessage('Failed to get learning recommendations', 'error');
        } finally {
            hideLoading();
        }
    });

    // Learning Paths button
    document.getElementById('learningPathsBtn')?.addEventListener('click', () => {
        showLearningPaths();
    });

    // Best Practices button
    document.getElementById('bestPracticesBtn')?.addEventListener('click', () => {
        showBestPractices();
    });

    // New Learning Path button
    document.getElementById('newLearningPathBtn')?.addEventListener('click', () => {
        showNewLearningPathModal();
    });

    // Practice filters
    document.getElementById('practiceCategoryFilter')?.addEventListener('change', (e) => {
        filterBestPractices(e.target.value, document.getElementById('practiceSearch').value);
    });

    document.getElementById('practiceSearch')?.addEventListener('input', (e) => {
        filterBestPractices(document.getElementById('practiceCategoryFilter').value, e.target.value);
    });
}

// Show learning paths section
async function showLearningPaths() {
    try {
        const paths = await api.getLearningPaths();
        renderLearningPaths(paths);
        hideAllLearningSections();
        document.getElementById('learningPathsSection').style.display = 'block';
    } catch (error) {
        console.error('Error loading learning paths:', error);
        showMessage('Failed to load learning paths', 'error');
    }
}

// Render learning paths
function renderLearningPaths(paths) {
    const container = document.getElementById('learningPathsGrid');

    if (!paths || paths.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-route"></i>
                <h4>No Learning Paths Yet</h4>
                <p>Create your first learning path to start your development journey</p>
                <button class="btn btn-primary" onclick="showNewLearningPathModal()">
                    <i class="fas fa-plus"></i> Create Learning Path
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = paths.map(path => `
        <div class="card card-sm card-gray learning-path-card ${path.status}">
            <div class="path-header">
                <h4>${path.path_name}</h4>
                <span class="path-status ${path.status}">${path.status.replace('_', ' ')}</span>
            </div>
            <p class="path-description">${path.path_description || 'No description'}</p>
            <div class="path-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${path.progress_percentage}%"></div>
                </div>
                <span class="progress-text">${path.progress_percentage}% complete</span>
            </div>
            <div class="path-meta">
                <span><i class="fas fa-signal"></i> ${path.difficulty_level}</span>
                <span><i class="fas fa-clock"></i> ${path.estimated_duration_hours || 0}h</span>
                <span><i class="fas fa-bullseye"></i> ${path.skill_focus}</span>
            </div>
            <div class="path-actions">
                <button class="btn btn-secondary" onclick="editLearningPath('${path.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-primary" onclick="updateLearningProgress('${path.id}')">
                    <i class="fas fa-play"></i> Continue
                </button>
                <button class="btn btn-danger" onclick="deleteLearningPath('${path.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Show best practices section
async function showBestPractices() {
    try {
        const practices = await api.getBestPractices();
        renderBestPractices(practices);
        hideAllLearningSections();
        document.getElementById('bestPracticesSection').style.display = 'block';
    } catch (error) {
        console.error('Error loading best practices:', error);
        showMessage('Failed to load best practices', 'error');
    }
}

// Render best practices
function renderBestPractices(practices) {
    const container = document.getElementById('bestPracticesGrid');

    if (!practices || practices.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h4>No Best Practices Yet</h4>
                <p>Extract lessons from your experiences to build your knowledge library</p>
            </div>
        `;
        return;
    }

    container.innerHTML = practices.map(practice => `
        <div class="card card-sm card-gray practice-card">
            <div class="flex justify-between items-center">
                <h4>${practice.practice_title}</h4>
                <span class="practice-category">${practice.practice_category}</span>
            </div>
            <p class="practice-description">${practice.practice_description}</p>
            <div class="practice-meta">
                <span class="effectiveness">⭐ ${practice.effectiveness_rating}/5</span>
                <span class="usage-count">Used ${practice.usage_count} times</span>
                ${practice.last_used ? `<span class="last-used">Last: ${new Date(practice.last_used).toLocaleDateString()}</span>` : ''}
            </div>
            <div class="flex gap-2">
                <button class="btn btn-secondary" onclick="useBestPractice('${practice.id}')">
                    <i class="fas fa-check"></i> Use This Practice
                </button>
                <button class="btn btn-primary" onclick="editBestPractice('${practice.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        </div>
    `).join('');
}

// Filter best practices
async function filterBestPractices(category, search) {
    try {
        const practices = await api.getBestPractices(category, search);
        renderBestPractices(practices);
    } catch (error) {
        console.error('Error filtering practices:', error);
        showMessage('Failed to filter practices', 'error');
    }
}

// Hide all learning sections
function hideAllLearningSections() {
    document.getElementById('learningPathsSection').style.display = 'none';
    document.getElementById('bestPracticesSection').style.display = 'none';
}

// Modal functions
function showNewLearningPathModal() {
    // Implementation for new learning path modal
    showMessage('New learning path creation coming soon!', 'info');
}

function createLearningPathForSkill(skill, gap) {
    // Implementation for creating learning path from skill gap
    showMessage(`Creating learning path for ${skill} (gap: ${gap} levels)`, 'info');
}

function createLearningPath(skillFocus, title, description, hours) {
    // Implementation for creating learning path from recommendation
    showMessage(`Creating learning path: ${title}`, 'info');
}

function editLearningPath(id) {
    showMessage(`Edit learning path ${id}`, 'info');
}

function updateLearningProgress(id) {
    showMessage(`Update progress for learning path ${id}`, 'info');
}

function deleteLearningPath(id) {
    if (confirm('Are you sure you want to delete this learning path?')) {
        showMessage(`Deleted learning path ${id}`, 'success');
    }
}

function useBestPractice(id) {
    showMessage(`Used best practice ${id}`, 'success');
}

function editBestPractice(id) {
    showMessage(`Edit best practice ${id}`, 'info');
}

// Global learning functions
window.showLearningPaths = showLearningPaths;
window.showBestPractices = showBestPractices;
window.createLearningPathForSkill = createLearningPathForSkill;
window.createLearningPath = createLearningPath;
window.editLearningPath = editLearningPath;
window.updateLearningProgress = updateLearningProgress;
window.deleteLearningPath = deleteLearningPath;
window.useBestPractice = useBestPractice;
window.editBestPractice = editBestPractice;

// Initialize Application
// Load break recommendations
async function loadBreakRecommendations() {
    try {
        const recommendations = await api.getBreakRecommendations(7);
        renderBreakRecommendations(recommendations);
    } catch (error) {
        console.error('Error loading break recommendations:', error);
        elements.breakRecommendationsContent.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load break recommendations</p>
            </div>
        `;
    }
}

function renderBreakRecommendations(data) {
    const container = elements.breakRecommendationsContent;
    if (!container) return;
    
    if (!data.recommendations || data.recommendations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-coffee"></i>
                <h4>No Break Recommendations Yet</h4>
                <p>Log more work sessions to get personalized break suggestions</p>
            </div>
        `;
        return;
    }
    
    const nextBreak = data.next_break_suggestion;
    
    container.innerHTML = `
        ${nextBreak ? `
            <div class="next-break-suggestion ${nextBreak.urgency}">
                <div class="break-suggestion-header">
                    <i class="fas fa-clock"></i>
                    <h4>Next Break Suggestion</h4>
                </div>
                <p>${nextBreak.message}</p>
                <div class="break-activities">
                    ${nextBreak.suggested_activities.map(activity => 
                        `<span class="break-activity-tag">${activity}</span>`
                    ).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="break-recommendations-list">
            ${data.recommendations.map(rec => `
                <div class="break-recommendation-card ${rec.priority}">
                    <div class="recommendation-header">
                        <h4>${rec.title}</h4>
                        <span class="priority-badge ${rec.priority}">${rec.priority}</span>
                    </div>
                    <p class="recommendation-description">${rec.description}</p>
                    <div class="recommendation-details">
                        <div class="detail-item">
                            <i class="fas fa-lightbulb"></i>
                            <span>${rec.suggestion}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>${rec.timing}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-hourglass-half"></i>
                            <span>${rec.duration}</span>
                        </div>
                    </div>
                    <div class="recommendation-activities">
                        <h5>Suggested Activities:</h5>
                        <div class="activity-tags">
                            ${rec.activities.map(activity => 
                                `<span class="activity-tag">${activity}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="break-analysis">
            <h4>Break Analysis</h4>
            <div class="analysis-metrics">
                <div class="metric">
                    <span class="metric-label">Current Break Frequency:</span>
                    <span class="metric-value">${(data.analysis.break_frequency * 100).toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Recommended Frequency:</span>
                    <span class="metric-value">${(data.analysis.recommended_break_frequency * 100).toFixed(1)}%</span>
                </div>
            </div>
        </div>
    `;
}

// Load stress alerts
async function loadStressAlerts() {
    try {
        const alerts = await api.getStressAlerts(7);
        renderStressAlerts(alerts);
    } catch (error) {
        console.error('Error loading stress alerts:', error);
        elements.stressAlertsContent.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load stress alerts</p>
            </div>
        `;
    }
}

function renderStressAlerts(data) {
    const container = elements.stressAlertsContent;
    if (!container) return;
    
    // Handle null/undefined data gracefully
    if (!data || !data.risk_assessment) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shield-alt"></i>
                <h3>No Stress Data Available</h3>
                <p>Log some work sessions and mood entries to see stress analysis.</p>
            </div>
        `;
        return;
    }
    
    const { alerts = [], warnings = [], risk_assessment } = data;
    const factors = risk_assessment?.factors || {};
    
    container.innerHTML = `
        <div class="stress-risk-overview">
            <div class="risk-score ${risk_assessment.risk_level || 'low'}">
                <div class="risk-score-value">${risk_assessment.stress_risk_score || 0}</div>
                <div class="risk-score-label">Stress Risk Score</div>
                <div class="risk-level">${(risk_assessment.risk_level || 'low').toUpperCase()}</div>
            </div>
            <div class="risk-factors">
                <h4>Risk Factors</h4>
                <div class="factor-list">
                    <div class="factor-item">
                        <span class="factor-label">Stress Level:</span>
                        <span class="factor-value ${(factors.stress_level || 0) > 6 ? 'high' : 'normal'}">${(factors.stress_level || 0).toFixed(1)}/10</span>
                    </div>
                    <div class="factor-item">
                        <span class="factor-label">Work Intensity:</span>
                        <span class="factor-value ${(factors.work_intensity || 0) > 7 ? 'high' : 'normal'}">${(factors.work_intensity || 0).toFixed(1)}/10</span>
                    </div>
                    <div class="factor-item">
                        <span class="factor-label">Work Hours:</span>
                        <span class="factor-value ${(factors.work_hours || 0) > 8 ? 'high' : 'normal'}">${(factors.work_hours || 0).toFixed(1)}h/day</span>
                    </div>
                    <div class="factor-item">
                        <span class="factor-label">Mood Level:</span>
                        <span class="factor-value ${(factors.mood_level || 5) < 5 ? 'low' : 'normal'}">${(factors.mood_level || 5).toFixed(1)}/10</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${alerts.length > 0 ? `
            <div class="alerts-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Critical Alerts (${alerts.length})</h4>
                <div class="alerts-list">
                    ${alerts.map(alert => `
                        <div class="alert-card ${alert.severity}">
                            <div class="alert-header">
                                <h5>${alert.title}</h5>
                                <span class="severity-badge ${alert.severity}">${alert.severity}</span>
                            </div>
                            <p class="alert-description">${alert.description}</p>
                            <div class="alert-actions">
                                <h6>Recommended Actions:</h6>
                                <ul>
                                    ${alert.actions.map(action => `<li>${action}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${warnings.length > 0 ? `
            <div class="warnings-section">
                <h4><i class="fas fa-exclamation-circle"></i> Warnings (${warnings.length})</h4>
                <div class="warnings-list">
                    ${warnings.map(warning => `
                        <div class="warning-card ${warning.severity}">
                            <div class="warning-header">
                                <h5>${warning.title}</h5>
                                <span class="severity-badge ${warning.severity}">${warning.severity}</span>
                            </div>
                            <p class="warning-description">${warning.description}</p>
                            <div class="warning-actions">
                                <h6>Recommended Actions:</h6>
                                <ul>
                                    ${warning.actions.map(action => `<li>${action}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${alerts.length === 0 && warnings.length === 0 ? `
            <div class="no-alerts">
                <i class="fas fa-check-circle"></i>
                <h4>All Good!</h4>
                <p>No stress alerts or warnings at this time. Keep monitoring your wellbeing.</p>
            </div>
        ` : ''}
    `;
}

// Load balance dashboard
async function loadBalanceDashboard() {
    try {
        const dashboard = await api.getBalanceDashboard(30);
        renderBalanceDashboard(dashboard);
    } catch (error) {
        console.error('Error loading balance dashboard:', error);
        elements.balanceDashboardContent.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load balance dashboard</p>
            </div>
        `;
    }
}

function renderBalanceDashboard(data) {
    const container = elements.balanceDashboardContent;
    if (!container) return;
    
    // Handle null/undefined data gracefully
    if (!data || !data.dashboard) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-pie"></i>
                <h3>No Balance Data Available</h3>
                <p>Log some work sessions and mood entries to see work-life balance analysis.</p>
            </div>
        `;
        return;
    }
    
    const { dashboard } = data;
    const { overview, metrics, patterns, recommendations, insights } = dashboard;
    
    container.innerHTML = `
        <div class="dashboard-overview">
            <div class="balance-score-card ${overview.balance_score >= 80 ? 'excellent' : overview.balance_score >= 60 ? 'good' : 'needs-attention'}">
                <div class="balance-score-value">${overview.balance_score}</div>
                <div class="balance-score-label">Work-Life Balance Score</div>
                <div class="balance-score-description">
                    ${overview.balance_score >= 80 ? 'Excellent balance!' : 
                      overview.balance_score >= 60 ? 'Good balance with room for improvement.' : 
                      'Needs attention to prevent burnout.'}
                </div>
            </div>
            
            <div class="data-quality">
                <span class="quality-indicator ${overview.data_quality}">
                    <i class="fas fa-${overview.data_quality === 'good' ? 'check-circle' : 'exclamation-triangle'}"></i>
                    Data Quality: ${overview.data_quality}
                </span>
                <span class="period-info">Last ${overview.period_days} days</span>
            </div>
        </div>
        
        <div class="dashboard-metrics">
            <div class="metrics-section">
                <h4>Work Metrics</h4>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${metrics.work.avg_daily_hours.toFixed(1)}h</div>
                        <div class="metric-label">Avg Daily Hours</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${metrics.work.avg_intensity.toFixed(1)}/10</div>
                        <div class="metric-label">Avg Intensity</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${metrics.work.avg_productivity.toFixed(1)}/10</div>
                        <div class="metric-label">Avg Productivity</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${metrics.work.avg_break_duration.toFixed(0)}m</div>
                        <div class="metric-label">Avg Break Duration</div>
                    </div>
                </div>
            </div>
            
            <div class="metrics-section">
                <h4>Wellbeing Metrics</h4>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value ${metrics.wellbeing.avg_mood >= 7 ? 'good' : metrics.wellbeing.avg_mood >= 5 ? 'ok' : 'poor'}">${metrics.wellbeing.avg_mood.toFixed(1)}/10</div>
                        <div class="metric-label">Avg Mood</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value ${metrics.wellbeing.avg_energy >= 7 ? 'good' : metrics.wellbeing.avg_energy >= 5 ? 'ok' : 'poor'}">${metrics.wellbeing.avg_energy.toFixed(1)}/10</div>
                        <div class="metric-label">Avg Energy</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value ${metrics.wellbeing.avg_stress <= 4 ? 'good' : metrics.wellbeing.avg_stress <= 6 ? 'ok' : 'poor'}">${metrics.wellbeing.avg_stress.toFixed(1)}/10</div>
                        <div class="metric-label">Avg Stress</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value ${metrics.wellbeing.avg_motivation >= 7 ? 'good' : metrics.wellbeing.avg_motivation >= 5 ? 'ok' : 'poor'}">${metrics.wellbeing.avg_motivation.toFixed(1)}/10</div>
                        <div class="metric-label">Avg Motivation</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="dashboard-patterns">
            <h4>Work Patterns</h4>
            <div class="patterns-grid">
                <div class="pattern-card">
                    <h5>Work Type Distribution</h5>
                    <div class="pattern-content">
                        ${Object.keys(patterns.work_type_distribution).length > 0 ? 
                            Object.entries(patterns.work_type_distribution).map(([type, count]) => 
                                `<div class="pattern-item">
                                    <span class="pattern-label">${type.replace('_', ' ')}</span>
                                    <span class="pattern-value">${count} days</span>
                                </div>`
                            ).join('') :
                            '<p class="no-data">No work type data available</p>'
                        }
                    </div>
                </div>
                
                <div class="pattern-card">
                    <h5>Day of Week Patterns</h5>
                    <div class="pattern-content">
                        ${Object.keys(patterns.day_of_week_patterns).length > 0 ? 
                            Object.entries(patterns.day_of_week_patterns).map(([day, data]) => 
                                `<div class="pattern-item">
                                    <span class="pattern-label">${day}</span>
                                    <span class="pattern-value">${data.avgHours.toFixed(1)}h avg</span>
                                </div>`
                            ).join('') :
                            '<p class="no-data">No day pattern data available</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
        
        ${recommendations.length > 0 ? `
            <div class="dashboard-recommendations">
                <h4>Recommendations</h4>
                <div class="recommendations-list">
                    ${recommendations.map(rec => `
                        <div class="card card-sm card-gray recommendation-card ${rec.type}">
                            <div class="recommendation-header">
                                <h5>${rec.title}</h5>
                                <span class="type-badge ${rec.type}">${rec.type}</span>
                            </div>
                            <p class="recommendation-description">${rec.description}</p>
                            <div class="recommendation-actions">
                                <h6>Actions:</h6>
                                <ul>
                                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${insights.length > 0 ? `
            <div class="dashboard-insights">
                <h4>Insights</h4>
                <div class="insights-list">
                    ${insights.map(insight => `
                        <div class="card card-gray insight-card ${insight.impact}">
                            <div class="insight-header">
                                <h5>${insight.title}</h5>
                                <span class="impact-badge ${insight.impact}">${insight.impact}</span>
                            </div>
                            <p class="insight-description">${insight.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

// Gratitude System Functions
async function loadGratitudeData() {
    try {
        console.log('🔄 Loading gratitude data...');
        await Promise.all([
            loadTodayGratitude(),
            loadGratitudeEntries(),
            loadEncouragement()
        ]);
    } catch (error) {
        console.error('Error loading gratitude data:', error);
    }
}

async function loadTodayGratitude() {
    try {
        const today = await api.getTodayGratitude();
        renderTodayGratitude(today);
    } catch (error) {
        if (error.message && error.message.includes('No gratitude entry for today')) {
            renderTodayGratitude(null);
        } else {
            console.error('Error loading today\'s gratitude:', error);
        }
    }
}

function renderTodayGratitude(entry) {
    if (!entry) {
        elements.todayGratitudeContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-heart empty-icon"></i>
                <h4>No gratitude entry for today</h4>
                <p>Start your day with gratitude practice</p>
                <button class="btn btn-primary" onclick="elements.newGratitudeEntryBtn.click()">
                    <i class="fas fa-plus"></i> Create Entry
                </button>
            </div>
        `;
        return;
    }
    
    elements.todayGratitudeContent.innerHTML = `
        <div class="card gratitude-entry-card">
            <div class="gratitude-header">
                <h4>${entry.category ? entry.category.charAt(0).toUpperCase() + entry.category.slice(1) : 'General'} Gratitude</h4>
                <span class="gratitude-date">${new Date(entry.gratitude_date).toLocaleDateString()}</span>
            </div>
            <div class="gratitude-prompt">
                <strong>Prompt:</strong> ${entry.prompt}
            </div>
            <div class="gratitude-response">
                <strong>Your Response:</strong> ${entry.response}
            </div>
            ${entry.mood_before && entry.mood_after ? `
                <div class="gratitude-mood">
                    <span class="mood-before">Mood Before: ${entry.mood_before}/10</span>
                    <span class="mood-after">Mood After: ${entry.mood_after}/10</span>
                    <span class="mood-improvement ${entry.mood_after > entry.mood_before ? 'positive' : 'neutral'}">
                        ${entry.mood_after > entry.mood_before ? '+' : ''}${entry.mood_after - entry.mood_before}
                    </span>
                </div>
            ` : ''}
            ${entry.tags ? `
                <div class="gratitude-tags">
                    ${entry.tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

async function loadGratitudeEntries() {
    try {
        const entries = await api.getGratitudeEntries(null, null, 10);
        renderGratitudeEntries(entries);
    } catch (error) {
        console.error('Error loading gratitude entries:', error);
        elements.gratitudeEntries.innerHTML = '<p class="error">Failed to load gratitude entries</p>';
    }
}

function renderGratitudeEntries(entries) {
    if (!entries || entries.length === 0) {
        elements.gratitudeEntries.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history empty-icon"></i>
                <h4>No gratitude entries yet</h4>
                <p>Start practicing gratitude to see your history here</p>
            </div>
        `;
        return;
    }
    
    elements.gratitudeEntries.innerHTML = entries.map(entry => `
        <div class="gratitude-entry-item">
            <div class="gratitude-entry-header">
                <h5>${entry.category ? entry.category.charAt(0).toUpperCase() + entry.category.slice(1) : 'General'} Gratitude</h5>
                <span class="gratitude-date">${new Date(entry.gratitude_date).toLocaleDateString()}</span>
            </div>
            <div class="gratitude-entry-content">
                <div class="gratitude-prompt">
                    <strong>Prompt:</strong> ${entry.prompt}
                </div>
                <div class="gratitude-response">
                    <strong>Response:</strong> ${entry.response}
                </div>
                ${entry.mood_before && entry.mood_after ? `
                    <div class="gratitude-mood">
                        <span class="mood-before">Before: ${entry.mood_before}/10</span>
                        <span class="mood-after">After: ${entry.mood_after}/10</span>
                        <span class="mood-improvement ${entry.mood_after > entry.mood_before ? 'positive' : 'neutral'}">
                            ${entry.mood_after > entry.mood_before ? '+' : ''}${entry.mood_after - entry.mood_before}
                        </span>
                    </div>
                ` : ''}
            </div>
            <div class="gratitude-entry-actions">
                <button class="btn btn-sm btn-secondary" onclick="editGratitudeEntry('${entry.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteGratitudeEntry('${entry.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function loadGratitudePrompts() {
    try {
        const prompts = await api.getGratitudePrompts({});
        renderGratitudePrompts(prompts);
        elements.gratitudePromptsSection.style.display = 'block';
    } catch (error) {
        console.error('Error loading gratitude prompts:', error);
    }
}

function renderGratitudePrompts(data) {
    const prompts = data.prompts || [];
    elements.gratitudePromptsContent.innerHTML = prompts.map(prompt => `
        <div class="gratitude-prompt-card">
            <div class="prompt-header">
                <h5>${prompt.prompt}</h5>
                <div class="prompt-meta">
                    <span class="prompt-category">${prompt.category}</span>
                    <span class="prompt-difficulty">${prompt.difficulty}</span>
                    <span class="prompt-duration">${prompt.suggested_duration}</span>
                </div>
            </div>
            <div class="prompt-content">
                <p class="prompt-focus">${prompt.focus_area}</p>
                ${prompt.follow_up_questions && prompt.follow_up_questions.length > 0 ? `
                    <div class="follow-up-questions">
                        <h6>Follow-up Questions:</h6>
                        <ul>
                            ${prompt.follow_up_questions.map(q => `<li>${q}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            <div class="prompt-actions">
                <button class="btn btn-primary btn-sm" onclick="useGratitudePrompt('${prompt.prompt}')">
                    <i class="fas fa-plus"></i> Use This Prompt
                </button>
            </div>
        </div>
    `).join('');
}

async function loadAchievementBasedPrompts() {
    try {
        const data = await api.getAchievementBasedPrompts(30);
        renderAchievementBasedPrompts(data);
        elements.achievementGratitudeSection.style.display = 'block';
    } catch (error) {
        console.error('Error loading achievement-based prompts:', error);
    }
}

function renderAchievementBasedPrompts(data) {
    const prompts = data.prompts || [];
    elements.achievementGratitudeContent.innerHTML = prompts.map(prompt => `
        <div class="achievement-gratitude-card">
            <div class="flex justify-between items-center">
                <h5>${prompt.achievement_title}</h5>
                <span class="achievement-date">${new Date(prompt.achievement_context.completion_date).toLocaleDateString()}</span>
            </div>
            <div class="achievement-content">
                <p class="achievement-description">${prompt.achievement_context.description}</p>
                <div class="gratitude-prompt">
                    <strong>Gratitude Prompt:</strong> ${prompt.prompt}
                </div>
                ${prompt.follow_up_questions && prompt.follow_up_questions.length > 0 ? `
                    <div class="follow-up-questions">
                        <h6>Reflection Questions:</h6>
                        <ul>
                            ${prompt.follow_up_questions.map(q => `<li>${q}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            <div class="flex gap-2">
                <button class="btn btn-primary btn-sm" onclick="useGratitudePrompt('${prompt.prompt}')">
                    <i class="fas fa-plus"></i> Use This Prompt
                </button>
            </div>
        </div>
    `).join('');
}

async function loadPositiveReframing(challenge) {
    if (!challenge) {
        const challengeInput = prompt('What challenge would you like help reframing?');
        if (!challengeInput) return;
        challenge = challengeInput;
    }
    
    try {
        const data = await api.getPositiveReframing(challenge);
        renderPositiveReframing(data);
        elements.reframingSection.style.display = 'block';
    } catch (error) {
        console.error('Error loading positive reframing:', error);
    }
}

function renderPositiveReframing(data) {
    elements.reframingContent.innerHTML = `
        <div class="reframing-container">
            <div class="reframing-intro">
                <h4>Positive Reframing for Your Challenge</h4>
                <p class="reframing-advice">${data.general_advice}</p>
            </div>
            <div class="reframing-perspectives">
                ${data.reframings.map(reframing => `
                    <div class="reframing-card">
                        <h5>${reframing.title}</h5>
                        <p class="reframing-perspective">${reframing.perspective}</p>
                        <div class="reframing-details">
                            <div class="learning-opportunity">
                                <strong>Learning Opportunity:</strong> ${reframing.learning_opportunity}
                            </div>
                            <div class="action-steps">
                                <strong>Action Steps:</strong>
                                <ul>
                                    ${reframing.action_steps.map(step => `<li>${step}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="encouragement">
                                <strong>Encouragement:</strong> ${reframing.encouragement}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="gratitude-angle">
                <h5>Future Gratitude</h5>
                <p>${data.gratitude_angle}</p>
            </div>
        </div>
    `;
}

async function loadEncouragement() {
    try {
        const data = await api.getEncouragement();
        renderEncouragement(data);
        elements.encouragementSection.style.display = 'block';
    } catch (error) {
        console.error('Error loading encouragement:', error);
    }
}

function renderEncouragement(data) {
    elements.encouragementContent.innerHTML = `
        <div class="encouragement-card">
            <div class="encouragement-message">
                <h4>${data.encouragement_message}</h4>
            </div>
            <div class="encouragement-details">
                <div class="strengths">
                    <h5>Your Strengths:</h5>
                    <ul>
                        ${data.strengths_highlighted.map(strength => `<li>${strength}</li>`).join('')}
                    </ul>
                </div>
                <div class="recent-wins">
                    <h5>Recent Wins:</h5>
                    <ul>
                        ${data.recent_wins.map(win => `<li>${win}</li>`).join('')}
                    </ul>
                </div>
                <div class="actionable-motivation">
                    <h5>Next Steps:</h5>
                    <p>${data.actionable_motivation}</p>
                </div>
                <div class="gratitude-reminder">
                    <h5>Gratitude Reminder:</h5>
                    <p>${data.gratitude_reminder}</p>
                </div>
                <div class="affirmation">
                    <h5>Daily Affirmation:</h5>
                    <p class="affirmation-text">"${data.affirmation}"</p>
                </div>
            </div>
        </div>
    `;
}

async function loadGratitudeStats() {
    try {
        const data = await api.getGratitudeStats(30);
        renderGratitudeStats(data);
    } catch (error) {
        console.error('Error loading gratitude stats:', error);
    }
}

function renderGratitudeStats(data) {
    const stats = data.summary;
    const categoryStats = data.category_breakdown;
    
    // Create a modal or overlay to show stats
    const statsModal = document.createElement('div');
    statsModal.className = 'modal';
    statsModal.style.display = 'block';
    statsModal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Gratitude Statistics (Last 30 Days)</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="gratitude-stats">
                <div class="stats-overview">
                    <div class="card card-sm stat-card">
                        <h4>${stats.total_entries}</h4>
                        <p>Total Entries</p>
                    </div>
                    <div class="card card-sm stat-card">
                        <h4>${stats.days_with_gratitude}</h4>
                        <p>Days with Gratitude</p>
                    </div>
                    <div class="card card-sm stat-card">
                        <h4>${stats.avg_mood_improvement ? stats.avg_mood_improvement.toFixed(1) : 'N/A'}</h4>
                        <p>Avg Mood Improvement</p>
                    </div>
                    <div class="card card-sm stat-card">
                        <h4>${stats.achievement_based_entries}</h4>
                        <p>Achievement-Based</p>
                    </div>
                </div>
                <div class="category-stats">
                    <h4>Category Breakdown</h4>
                    <div class="category-list">
                        ${categoryStats.map(cat => `
                            <div class="category-stat">
                                <span class="category-name">${cat.category || 'General'}</span>
                                <span class="category-count">${cat.count} entries</span>
                                <span class="category-improvement">${cat.avg_mood_improvement ? cat.avg_mood_improvement.toFixed(1) : 'N/A'} avg improvement</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(statsModal);
}

function useGratitudePrompt(prompt) {
    elements.gratitudePrompt.value = prompt;
    elements.gratitudeModal.style.display = 'block';
}

async function handleGratitudeSubmit(e) {
    e.preventDefault();
    
    const formData = {
        gratitude_date: elements.gratitudeDate.value,
        category: elements.gratitudeCategory.value || null,
        prompt: elements.gratitudePrompt.value,
        response: elements.gratitudeResponse.value,
        mood_before: elements.gratitudeMoodBefore.value ? parseInt(elements.gratitudeMoodBefore.value) : null,
        mood_after: elements.gratitudeMoodAfter.value ? parseInt(elements.gratitudeMoodAfter.value) : null,
        tags: elements.gratitudeTags.value || null
    };
    
    try {
        await api.createGratitudeEntry(formData);
        elements.gratitudeModal.style.display = 'none';
        elements.gratitudeForm.reset();
        await loadGratitudeData();
        showNotification('Gratitude entry saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving gratitude entry:', error);
        showNotification('Failed to save gratitude entry', 'error');
    }
}

function editGratitudeEntry(id) {
    // Implementation for editing gratitude entry
    console.log('Edit gratitude entry:', id);
}

function deleteGratitudeEntry(id) {
    if (confirm('Are you sure you want to delete this gratitude entry?')) {
        api.deleteGratitudeEntry(id)
            .then(() => {
                loadGratitudeData();
                showNotification('Gratitude entry deleted', 'success');
            })
            .catch(error => {
                console.error('Error deleting gratitude entry:', error);
                showNotification('Failed to delete gratitude entry', 'error');
            });
    }
}

async function init() {
    console.log('📱 APP DEBUG: init() function called');
    console.log('📱 APP DEBUG: Document readyState:', document.readyState);
    console.log('📱 APP DEBUG: Current URL:', window.location.href);

    // Wait for DOM to be fully ready before initializing
    const waitForDOM = () => {
        if (document.readyState === 'loading') {
            return new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
                // Also set a timeout in case DOMContentLoaded doesn't fire
                setTimeout(resolve, 1000);
            });
        }
        return Promise.resolve();
    };

    await waitForDOM();

    // Navigation is now handled by ProgressTracker class in js/app.js
    console.log('📱 APP DEBUG: DOM ready, navigation handled by ProgressTracker class...');

    console.log('📱 APP DEBUG: Initializing modals...');
    initModals();

    console.log('📱 APP DEBUG: Initializing keyboard shortcuts...');
    initKeyboardShortcuts();

    console.log('📱 APP DEBUG: Initializing event handlers...');
    initEventHandlers();

    console.log('📱 APP DEBUG: Initializing Phase 2 event handlers...');
    initPhase2EventHandlers();

    console.log('📱 APP DEBUG: Initializing mood event handlers...');
    initMoodEventHandlers();

    console.log('📱 APP DEBUG: Loading initial projects...');
    // Load initial data
    await loadProjects();

    console.log('🚀 Progress Tracker initialized successfully!');
}

// Authentication disabled - logout function removed

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
