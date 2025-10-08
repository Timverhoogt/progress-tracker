class SkillsApi {
    constructor (apiClient) {
        this.api = apiClient;
    }

    async getAll (filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.api.request(`/skills?${params}`);
    }

    async create (data) {
        return await this.api.request('/skills', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async update (id, updates) {
        return await this.api.request(`/skills/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async delete (id) {
        return await this.api.request(`/skills/${id}`, {
            method: 'DELETE'
        });
    }

    async getProgress () {
        return await this.api.request('/skills/progress');
    }

    async getGaps () {
        return await this.api.request('/skills/gaps');
    }

    async getStats () {
        return await this.api.request('/skills/stats');
    }
}

// Make SkillsApi available globally
if (typeof window !== 'undefined') {
    window.SkillsApi = SkillsApi;
}