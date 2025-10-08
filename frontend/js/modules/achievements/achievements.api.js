class AchievementsApi {
    constructor (apiClient) {
        this.api = apiClient;
    }

    async getAll (filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.api.request(`/achievements?${params}`);
    }

    async create (data) {
        return await this.api.request('/achievements', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async update (id, updates) {
        return await this.api.request(`/achievements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async updateProgress (id, progressData) {
        return await this.api.request(`/achievements/${id}/progress`, {
            method: 'POST',
            body: JSON.stringify(progressData)
        });
    }

    async complete (id) {
        return await this.api.request(`/achievements/${id}/complete`, {
            method: 'POST'
        });
    }

    async getStats () {
        return await this.api.request('/achievements/stats');
    }

    async getSuggestions () {
        return await this.api.request('/achievements/suggestions');
    }
}

// Make AchievementsApi available globally
if (typeof window !== 'undefined') {
    window.AchievementsApi = AchievementsApi;
}