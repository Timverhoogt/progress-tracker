// CONFIG and DEFAULT_DAYS are available globally from config.js

// Custom error class for API errors
class ApiError extends Error {
    constructor(response) {
        super(`Request failed (${response.status})`);
        this.name = 'ApiError';
        this.status = response.status;
        this.response = response;
    }
}

class ApiClient {
    constructor(baseUrl = CONFIG.API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.interceptors = [];
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
                const err = new ApiError(response);
                err.message = message;
                throw err;
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Projects API
    projects = {
        getAll: () => this.request('/projects'),
        create: (data) => this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id) => this.request(`/projects/${id}`, { method: 'DELETE' })
    };

    // Notes API
    notes = {
        getAll: (projectId) => this.request(`/notes?project_id=${projectId}`),
        create: (data) => this.request('/notes', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        delete: (id) => this.request(`/notes/${id}`, { method: 'DELETE' })
    };

    // Todos API
    todos = {
        getAll: (projectId) => this.request(`/todos?project_id=${projectId}`),
        create: (data) => this.request('/todos', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => this.request(`/todos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        generate: (projectId) => this.request('/todos/generate', {
            method: 'POST',
            body: JSON.stringify({ project_id: projectId })
        }),
        delete: (id) => this.request(`/todos/${id}`, { method: 'DELETE' })
    };

    // Reports API
    reports = {
        getAll: (projectId) => this.request(`/reports?project_id=${projectId}`),
        generate: (data) => this.request('/reports/generate', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        generateWeekly: (data) => this.request('/reports/weekly', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        testEmail: (data) => this.request('/reports/test-email', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        getSchedulerStatus: () => this.request('/reports/scheduler/status'),
        triggerWeeklyReport: () => this.request('/reports/scheduler/trigger', { method: 'POST' }),
        delete: (id) => this.request(`/reports/${id}`, { method: 'DELETE' })
    };

    // Settings API
    settings = {
        getAll: () => this.request('/settings'),
        getEmail: () => this.request('/settings/email'),
        getProfiles: () => this.request('/settings/profiles'),
        saveProfiles: (profiles) => this.request('/settings/profiles', {
            method: 'PUT',
            body: JSON.stringify(profiles)
        }),
        update: (data) => this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        updateEmail: (data) => this.request('/settings/email/quick', {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    };

    // Timelines API
    timelines = {
        getAll: (projectId) => this.request(`/timelines?project_id=${projectId}`),
        createMilestone: (data) => this.request('/timelines/milestones', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        updateMilestone: (id, data) => this.request(`/timelines/milestones/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        deleteMilestone: (id) => this.request(`/timelines/milestones/${id}`, { method: 'DELETE' }),
        estimate: (projectId) => this.request('/timelines/estimate', {
            method: 'POST',
            body: JSON.stringify({ project_id: projectId })
        })
    };

    // Mood API
    mood = {
        getEntries: (startDate, endDate, limit) => {
            let url = '/mood?';
            if (startDate) url += `start_date=${startDate}&`;
            if (endDate) url += `end_date=${endDate}&`;
            if (limit) url += `limit=${limit}&`;
            return this.request(url.slice(0, -1));
        },
        getMoodEntries: (startDate, endDate, limit) => {
            let url = '/mood?';
            if (startDate) url += `start_date=${startDate}&`;
            if (endDate) url += `end_date=${endDate}&`;
            if (limit) url += `limit=${limit}&`;
            return this.request(url.slice(0, -1));
        },
        getToday: () => this.request('/mood/today'),
        getTodayMood: () => this.request('/mood/today'),
        getStats: (days) => this.request(`/mood/stats?days=${days || DEFAULT_DAYS.STATS}`),
        getMoodStats: (days) => this.request(`/mood/stats?days=${days || DEFAULT_DAYS.STATS}`),
        getPatterns: (days) => this.request(`/mood/patterns?days=${days || DEFAULT_DAYS.PATTERNS}`),
        getMoodPatterns: (days) => this.request(`/mood/patterns?days=${days || DEFAULT_DAYS.PATTERNS}`),
        getAIAnalysis: (days) => this.request(`/mood/ai-analysis?days=${days || DEFAULT_DAYS.ANALYSIS}`),
        getMoodAIAnalysis: (days) => this.request(`/mood/ai-analysis?days=${days || DEFAULT_DAYS.ANALYSIS}`),
        getInterventionTriggers: (days) => this.request(`/mood/intervention-triggers?days=${days || DEFAULT_DAYS.INTERVENTION_TRIGGERS}`),
        logIntervention: (data) => this.request('/mood/intervention-log', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        create: (data) => this.request('/mood', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        createMoodEntry: (data) => this.request('/mood', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (date, data) => this.request(`/mood/${date}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        updateMoodEntry: (date, data) => this.request(`/mood/${date}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (date) => this.request(`/mood/${date}`, { method: 'DELETE' }),
        deleteMoodEntry: (date) => this.request(`/mood/${date}`, { method: 'DELETE' })
    };

    // Workload API
    workload = {
        getEntries: (startDate, endDate, limit) => {
            let url = '/workload?';
            if (startDate) url += `start_date=${startDate}&`;
            if (endDate) url += `end_date=${endDate}&`;
            if (limit) url += `limit=${limit}&`;
            return this.request(url.slice(0, -1));
        },
        getToday: () => this.request('/workload/today'),
        getStats: (days) => this.request(`/workload/stats?days=${days || DEFAULT_DAYS.STATS}`),
        getPatterns: (days) => this.request(`/workload/patterns?days=${days || DEFAULT_DAYS.PATTERNS}`),
        getBalanceAnalysis: (days) => this.request(`/workload/balance-analysis?days=${days || DEFAULT_DAYS.WORK_BOUNDARIES}`),
        getBalanceDashboard: (days) => this.request(`/workload/balance-dashboard?days=${days || DEFAULT_DAYS.WORK_BOUNDARIES}`),
        create: (data) => this.request('/workload', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (date, data) => this.request(`/workload/${date}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (date) => this.request(`/workload/${date}`, { method: 'DELETE' }),
        getBreakRecommendations: (days) => this.request(`/workload/break-recommendations?days=${days || DEFAULT_DAYS.BREAK_RECOMMENDATIONS}`)
    };

    // Work Preferences API
    workPreferences = {
        getAll: () => this.request('/work-preferences'),
        update: (data) => this.request('/work-preferences', {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        reset: () => this.request('/work-preferences/reset', { method: 'POST' }),
        getBoundaries: (days) => this.request(`/work-preferences/boundaries?days=${days || DEFAULT_DAYS.WORK_BOUNDARIES}`),
        getStressAlerts: (days) => this.request(`/work-preferences/stress-alerts?days=${days || DEFAULT_DAYS.STRESS_ALERTS}`)
    };

    // Learning API
    learning = {
        getStats: () => this.request('/learning/paths/stats'),
        getSkillGaps: () => this.request('/skills?gap_analysis=true'),
        getRecommendations: () => this.request('/learning/recommendations'),
        getPaths: (status) => {
            let url = '/learning/paths';
            if (status) url += `?status=${status}`;
            return this.request(url);
        },
        createPath: (data) => this.request('/learning/paths', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        updatePath: (id, data) => this.request(`/learning/paths/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        deletePath: (id) => this.request(`/learning/paths/${id}`, { method: 'DELETE' }),
        updateProgress: (id, progress) => this.request(`/learning/paths/${id}/progress`, {
            method: 'POST',
            body: JSON.stringify({ progress_percentage: progress })
        }),
        getBestPractices: (category, search) => {
            let url = '/learning/practices';
            if (category || search) url += '?';
            if (category) url += `category=${category}&`;
            if (search) url += `tags=${search}&`;
            return this.request(url.slice(0, -1));
        },
        createBestPractice: (data) => this.request('/learning/practices', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        updateBestPractice: (id, data) => this.request(`/learning/practices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        useBestPractice: (id) => this.request(`/learning/practices/${id}/use`, { method: 'POST' })
    };

    // Gratitude API
    gratitude = {
        getEntries: (startDate, endDate, limit, category) => {
            let url = '/gratitude?';
            if (startDate) url += `start_date=${startDate}&`;
            if (endDate) url += `end_date=${endDate}&`;
            if (limit) url += `limit=${limit}&`;
            if (category) url += `category=${category}&`;
            return this.request(url.slice(0, -1));
        },
        getGratitudeEntries: (startDate, endDate, limit, category) => {
            let url = '/gratitude?';
            if (startDate) url += `start_date=${startDate}&`;
            if (endDate) url += `end_date=${endDate}&`;
            if (limit) url += `limit=${limit}&`;
            if (category) url += `category=${category}&`;
            return this.request(url.slice(0, -1));
        },
        getToday: () => this.request('/gratitude/today'),
        getTodayGratitude: () => this.request('/gratitude/today'),
        getPrompts: (params) => {
            let url = '/gratitude/prompts?';
            if (params) {
                Object.keys(params).forEach(key => {
                    url += `${key}=${params[key]}&`;
                });
            }
            return this.request(url.slice(0, -1));
        },
        getGratitudePrompts: (params) => {
            let url = '/gratitude/prompts?';
            if (params) {
                Object.keys(params).forEach(key => {
                    url += `${key}=${params[key]}&`;
                });
            }
            return this.request(url.slice(0, -1));
        },
        getAchievementBasedPrompts: (days) => this.request(`/gratitude/prompts/achievements?days=${days || 30}`),
        getPositiveReframing: (challenge) => this.request('/gratitude/prompts/reframe', {
            method: 'POST',
            body: JSON.stringify({ challenge })
        }),
        getEncouragement: () => this.request('/gratitude/prompts/encouragement'),
        create: (data) => this.request('/gratitude', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        createGratitudeEntry: (data) => this.request('/gratitude', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => this.request(`/gratitude/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        updateGratitudeEntry: (id, data) => this.request(`/gratitude/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id) => this.request(`/gratitude/${id}`, { method: 'DELETE' }),
        deleteGratitudeEntry: (id) => this.request(`/gratitude/${id}`, { method: 'DELETE' }),
        getStats: (days) => this.request(`/gratitude/stats?days=${days || DEFAULT_DAYS.GRATITUDE_STATS}`),
        getGratitudeStats: (days) => this.request(`/gratitude/stats?days=${days || DEFAULT_DAYS.GRATITUDE_STATS}`),
        getPatterns: (days) => this.request(`/gratitude/patterns?days=${days || DEFAULT_DAYS.PATTERNS}`)
    };
}

// Export a singleton instance as global
window.api = new ApiClient();
