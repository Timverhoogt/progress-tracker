

class NotesApi {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Get notes for a project
    async getAll(projectId) {
        return await this.api.notes.getAll(projectId);
    }

    // Create a new note
    async create(data) {
        return await this.api.notes.create(data);
    }

    // Delete a note
    async delete(id) {
        return await this.api.notes.delete(id);
    }

    // Transcribe audio note
    async transcribe(formData) {
        return await this.api.notes.transcribe(formData);
    }
}

// Expose to global scope for traditional script loading
window.NotesApi = NotesApi;

