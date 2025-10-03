class TodosApi {
    constructor(apiClient) {
        this.api = apiClient;
    }

    async getAll(projectId) {
        return await this.api.todos.getAll(projectId);
    }

    async create(data) {
        return await this.api.todos.create(data);
    }

    async update(id, data) {
        return await this.api.todos.update(id, data);
    }

    async delete(id) {
        return await this.api.todos.delete(id);
    }

    async generate(projectId) {
        return await this.api.todos.generate(projectId);
    }

    async bulkUpdate(ids, data) {
        return await this.api.todos.bulkUpdate(ids, data);
    }

    async bulkDelete(ids) {
        return await this.api.todos.bulkDelete(ids);
    }
}

// Expose to global scope for traditional script loading
window.TodosApi = TodosApi;
