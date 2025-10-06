

class ProjectsApi {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Get all projects
    async getAll() {
        return await this.api.projects.getAll();
    }

    // Create a new project
    async create(data) {
        return await this.api.projects.create(data);
    }

    // Update an existing project
    async update(id, data) {
        return await this.api.projects.update(id, data);
    }

    // Delete a project
    async delete(id) {
        return await this.api.projects.delete(id);
    }

    // Get project by ID
    async getById(id) {
        const projects = await this.getAll();
        return projects.find(project => project.id === id);
    }
}

// Expose to global scope
window.ProjectsApi = ProjectsApi;

