class ReflectionsApi {
    constructor (apiClient) {
        this.api = apiClient;
    }

    async getTemplates () {
        return await this.api.request('/reflections/templates');
    }

    async getAll (filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.api.request(`/reflections/responses?${params}`);
    }

    async create (data) {
        return await this.api.request('/reflections/responses', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getInsights (days = 30) {
        return await this.api.request(`/reflections/insights?days=${days}`);
    }
}

// Make ReflectionsApi available globally
if (typeof window !== 'undefined') {
    window.ReflectionsApi = ReflectionsApi;
}