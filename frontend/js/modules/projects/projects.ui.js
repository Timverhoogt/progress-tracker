


class ProjectsUI {
    constructor() {
        this.elements = this.initializeElements();
        this.events = {};
    }

    // Initialize DOM elements
    initializeElements() {
        return {
            projectsGrid: DOMUtils.getElement('#projectsGrid'),
            newProjectBtn: DOMUtils.getElement('#newProjectBtn'),
            projectModal: DOMUtils.getElement('#projectModal'),
            projectForm: DOMUtils.getElement('#projectForm'),
            projectName: DOMUtils.getElement('#projectName'),
            projectDescription: DOMUtils.getElement('#projectDescription'),
            loadingOverlay: DOMUtils.getElement('#loadingOverlay')
        };
    }

    // Render projects list
    renderProjects(projects) {
        if (!projects || projects.length === 0) {
            this.renderEmptyState();
            return;
        }

        const html = projects.map(project => `
            <div class="project-card" data-id="${project.id}">
                <h3>${TextUtils.escapeHtml(project.name)}</h3>
                <p>${TextUtils.escapeHtml(project.description || 'No description')}</p>
                <div class="project-status status-${project.status}">${project.status.replace('_', ' ')}</div>
                <div class="project-actions">
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

        DOMUtils.setHTML(this.elements.projectsGrid, html);
        this.bindProjectEvents();
    }

    // Render empty state
    renderEmptyState() {
        const html = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Projects Yet</h3>
                <p>Create your first project to start tracking progress</p>
            </div>
        `;
        DOMUtils.setHTML(this.elements.projectsGrid, html);
    }

    // Show loading state
    showLoading() {
        LoadingUtils.show(this.elements.loadingOverlay);
    }

    // Hide loading state
    hideLoading() {
        LoadingUtils.hide(this.elements.loadingOverlay);
    }

    // Show project modal
    showModal() {
        ModalUtils.show(this.elements.projectModal);
    }

    // Hide project modal
    hideModal() {
        ModalUtils.hide(this.elements.projectModal);
        this.clearForm();
    }

    // Clear form data
    clearForm() {
        this.elements.projectForm.reset();
        delete this.elements.projectForm.dataset.editId;
        DOMUtils.setText(DOMUtils.getElement('#projectModalTitle'), 'New Project');
    }

    // Set form data for editing
    setFormData(project) {
        this.elements.projectName.value = project.name;
        this.elements.projectDescription.value = project.description || '';
        this.elements.projectForm.dataset.editId = project.id;
        DOMUtils.setText(DOMUtils.getElement('#projectModalTitle'), 'Edit Project');
    }

    // Get form data
    getFormData() {
        return {
            name: this.elements.projectName.value.trim(),
            description: this.elements.projectDescription.value.trim()
        };
    }

    // Show error message
    showError(message) {
        MessageUtils.showError(message);
    }

    // Show success message
    showSuccess(message) {
        MessageUtils.showSuccess(message);
    }

    // Bind project card events
    bindProjectEvents() {
        // Select project events
        DOMUtils.getAllElements('.select-project-btn').forEach(btn => {
            DOMUtils.on(btn, 'click', (e) => {
                const button = e.currentTarget || e.target.closest('button');
                if (!button) return;
                const projectId = button.dataset.id;
                this.emit('project:select', projectId);
            });
        });

        // Edit project events
        DOMUtils.getAllElements('.edit-project-btn').forEach(btn => {
            DOMUtils.on(btn, 'click', (e) => {
                const projectId = e.target.closest('button').dataset.id;
                this.emit('project:edit', projectId);
            });
        });

        // Delete project events
        DOMUtils.getAllElements('.delete-project-btn').forEach(btn => {
            DOMUtils.on(btn, 'click', (e) => {
                const projectId = e.target.closest('button').dataset.id;
                this.emit('project:delete', projectId);
            });
        });
    }

    // Event system
    on(event, handler) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(handler);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(handler => handler(data));
        }
    }

    // Bind new project button
    bindNewProjectButton() {
        if (this.elements.newProjectBtn) {
            DOMUtils.on(this.elements.newProjectBtn, 'click', () => {
                this.emit('project:new');
            });
        }
    }

    // Bind form submission
    bindFormSubmission(handler) {
        DOMUtils.on(this.elements.projectForm, 'submit', (e) => {
            e.preventDefault();
            const formData = this.getFormData();
            const editId = this.elements.projectForm.dataset.editId;
            handler(formData, editId);
        });
    }
}

