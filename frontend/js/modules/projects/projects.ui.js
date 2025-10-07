


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
            loadingOverlay: DOMUtils.getElement('#loadingOverlay'),
            // Details modal elements
            projectDetailsModal: DOMUtils.getElement('#projectDetailsModal'),
            detailProjectName: DOMUtils.getElement('#detailProjectName'),
            detailProjectDescription: DOMUtils.getElement('#detailProjectDescription'),
            detailProjectStatus: DOMUtils.getElement('#detailProjectStatus'),
            detailProjectCreated: DOMUtils.getElement('#detailProjectCreated'),
            detailProjectUpdated: DOMUtils.getElement('#detailProjectUpdated'),
            closeProjectDetailsBtn: DOMUtils.getElement('#closeProjectDetailsBtn'),
            closeProjectDetailsModal: DOMUtils.getElement('#closeProjectDetailsModal'),
            editProjectFromDetailsBtn: DOMUtils.getElement('#editProjectFromDetailsBtn')
        };
    }

    // Render projects list
    renderProjects(projects) {
        if (!projects || projects.length === 0) {
            this.renderEmptyState();
            return;
        }

        const html = projects.map(project => `
            <div class="card project-card" data-id="${project.id}">
                <h3>${TextUtils.escapeHtml(project.name)}</h3>
                <p>${TextUtils.escapeHtml(project.description || 'No description')}</p>
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

    // Show project details modal
    showDetailsModal(project) {
        if (!this.elements.projectDetailsModal) return;

        // Populate details
        DOMUtils.setText(this.elements.detailProjectName, project.name || '-');
        DOMUtils.setText(this.elements.detailProjectDescription, project.description || 'No description provided');
        DOMUtils.setText(this.elements.detailProjectStatus, (project.status || 'active').replace('_', ' '));
        DOMUtils.setText(this.elements.detailProjectCreated,
            project.created_at ? DateUtils.formatDateTime(project.created_at) : '-');
        DOMUtils.setText(this.elements.detailProjectUpdated,
            project.updated_at ? DateUtils.formatDateTime(project.updated_at) : '-');

        // Store project ID for edit button
        this.elements.projectDetailsModal.dataset.projectId = project.id;

        // Show modal
        ModalUtils.show(this.elements.projectDetailsModal);
    }

    // Hide project details modal
    hideDetailsModal() {
        if (!this.elements.projectDetailsModal) return;
        ModalUtils.hide(this.elements.projectDetailsModal);
        delete this.elements.projectDetailsModal.dataset.projectId;
    }

    // Bind project card events
    bindProjectEvents() {
        // View project details events
        DOMUtils.getAllElements('.select-project-btn').forEach(btn => {
            DOMUtils.on(btn, 'click', (e) => {
                const button = e.currentTarget || e.target.closest('button');
                if (!button) return;
                const projectId = button.dataset.id;
                this.emit('project:view', projectId);
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

    // Bind details modal events
    bindDetailsModalEvents() {
        // Close button
        if (this.elements.closeProjectDetailsBtn) {
            DOMUtils.on(this.elements.closeProjectDetailsBtn, 'click', () => {
                this.hideDetailsModal();
            });
        }

        // Close X button
        if (this.elements.closeProjectDetailsModal) {
            DOMUtils.on(this.elements.closeProjectDetailsModal, 'click', () => {
                this.hideDetailsModal();
            });
        }

        // Edit from details button
        if (this.elements.editProjectFromDetailsBtn) {
            DOMUtils.on(this.elements.editProjectFromDetailsBtn, 'click', () => {
                const projectId = this.elements.projectDetailsModal.dataset.projectId;
                if (projectId) {
                    this.hideDetailsModal();
                    this.emit('project:edit', projectId);
                }
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

// Expose to global scope
window.ProjectsUI = ProjectsUI;

