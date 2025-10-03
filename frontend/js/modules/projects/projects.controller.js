



class ProjectsController {
    constructor(apiClient) {
        this.api = new ProjectsApi(apiClient);
        this.ui = new ProjectsUI();
        this.projects = []; // Store projects data for other modules
        this.initialize();
    }

    // Initialize the controller
    async initialize() {
        await this.loadProjects();
        this.bindEvents();
        this.ui.bindNewProjectButton();
    }

    // Load all projects
    async loadProjects() {
        this.ui.showLoading();
        try {
            const projects = await this.api.getAll();
            this.projects = projects; // Store projects data
            this.ui.renderProjects(projects);

            // Expose projects globally for other modules
            window.projects = projects;

            // Ensure currentProject is available globally
            if (typeof window.currentProject === 'undefined') {
                window.currentProject = null;
            }

            // Update state management system
            if (window.state) {
                window.state.setState('projects', projects);
            }

            // Update project selectors in other modules (fallback for modules not using state)
            if (window.updateProjectSelectors) {
                window.updateProjectSelectors();
            } else {
                // Fallback: update project selectors directly
                this.updateProjectSelectors(projects);
            }

            console.log('📁 PROJECT DEBUG: Projects loaded and exposed globally:', projects.length);
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.ui.showError('Failed to load projects');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Update project selectors across all modules
    updateProjectSelectors(projects) {
        const selectors = [
            'notesProjectSelector',
            'todosProjectSelector',
            'reportsProjectSelector',
            'timelinesProjectSelector'
        ];

        selectors.forEach(selectorId => {
            const selector = document.getElementById(selectorId);
            if (!selector) return;

            const currentValue = selector.value;
            selector.innerHTML = '<option value="">Select a project...</option>' +
                projects.map(project =>
                    `<option value="${project.id}" ${project.id === window.currentProject ? 'selected' : ''}>
                        ${this.escapeHtml(project.name)}
                    </option>`
                ).join('');

            // Restore previous selection if it still exists
            if (currentValue && projects.find(p => p.id === currentValue)) {
                selector.value = currentValue;
            }
        });

        console.log('✅ Project selectors updated');
    }

    // Simple HTML escaping utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Create a new project
    async createProject(data) {
        // Validate data
        if (!ValidationUtils.isValidProjectName(data.name)) {
            this.ui.showError('Project name is required and must be 1-100 characters');
            return;
        }

        if (!ValidationUtils.isValidProjectDescription(data.description)) {
            this.ui.showError('Project description must be no more than 1000 characters');
            return;
        }

        this.ui.showLoading();
        try {
            const newProject = await this.api.create(data);
            this.ui.showSuccess('Project created successfully');
            this.ui.hideModal();
            await this.loadProjects(); // Refresh the list and update global data/state/selectors
            return newProject;
        } catch (error) {
            console.error('Failed to create project:', error);
            this.ui.showError('Failed to create project');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Update an existing project
    async updateProject(id, data) {
        // Validate data
        if (!ValidationUtils.isValidProjectName(data.name)) {
            this.ui.showError('Project name is required and must be 1-100 characters');
            return;
        }

        if (!ValidationUtils.isValidProjectDescription(data.description)) {
            this.ui.showError('Project description must be no more than 1000 characters');
            return;
        }

        this.ui.showLoading();
        try {
            const updatedProject = await this.api.update(id, data);
            this.ui.showSuccess('Project updated successfully');
            this.ui.hideModal();
            await this.loadProjects(); // Refresh the list and update global data/state/selectors
            return updatedProject;
        } catch (error) {
            console.error('Failed to update project:', error);
            this.ui.showError('Failed to update project');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Delete a project
    async deleteProject(id) {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        this.ui.showLoading();
        try {
            await this.api.delete(id);
            this.ui.showSuccess('Project deleted successfully');
            await this.loadProjects(); // Refresh the list and update global data/state/selectors
        } catch (error) {
            console.error('Failed to delete project:', error);
            this.ui.showError('Failed to delete project');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Edit a project
    async editProject(id) {
        try {
            const project = await this.api.getById(id);
            if (project) {
                this.ui.setFormData(project);
                this.ui.showModal();
            } else {
                this.ui.showError('Project not found');
            }
        } catch (error) {
            console.error('Failed to load project for editing:', error);
            this.ui.showError('Failed to load project for editing');
        }
    }

    // Select a project
    selectProject(id) {
        // Emit event for other modules to handle
        this.emit('project:selected', id);
    }

    // Bind UI events to controller actions
    bindEvents() {
        // Handle form submission
        this.ui.bindFormSubmission(async (data, editId) => {
            if (editId) {
                await this.updateProject(editId, data);
            } else {
                await this.createProject(data);
            }
        });

        // Handle project selection
        this.ui.on('project:select', (id) => {
            this.selectProject(id);
        });

        // Handle project editing
        this.ui.on('project:edit', (id) => {
            this.editProject(id);
        });

        // Handle project deletion
        this.ui.on('project:delete', (id) => {
            this.deleteProject(id);
        });

        // Handle new project creation
        this.ui.on('project:new', () => {
            this.ui.showModal();
        });
    }

    // Event system for cross-module communication
    on(event, handler) {
        this.ui.on(event, handler);
    }

    emit(event, data) {
        this.ui.emit(event, data);
    }

    // Get current projects (for other modules)
    getProjects() {
        // This would need to be populated from state or API
        // For now, return empty array
        return [];
    }
}

