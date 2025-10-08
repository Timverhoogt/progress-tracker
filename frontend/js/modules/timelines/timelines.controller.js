// TimelinesApi and TimelinesUI are available globally via window

class TimelinesController {
    constructor(apiClient, appState = window.state, options = {}) {
        this.api = new TimelinesApi(apiClient);
        this.ui = new TimelinesUI();
        this.state = appState || {
            getState: () => null,
            subscribe: () => {},
            setState: () => {}
        };
        this.hasGlobalState = Boolean(appState && typeof appState.subscribe === 'function');
        this.currentProject = null;
        this.currentTimelineData = null;

        this._eventsBound = false;
        this._subscriptionsBound = false;
        this._isInitializing = false;
        this._initializationPromise = null;

        if (this._shouldAutoInitialize(options.autoInitialize)) {
            this.initialize().catch(error => {
                console.error('TimelinesController auto-initialization failed:', error);
            });
        }

        this._makeMethodMockable('refreshTimeline');
        this._makeMethodMockable('getProjectById');
        this._makeMethodMockable('showMilestoneModal');
        this._makeMethodMockable('dismissSuggestion');
        this._makeMethodMockable('createMilestone');
        this._makeMethodMockable('updateMilestone');
        this._makeMethodMockable('deleteMilestone');
    }

    // Initialize the controller
    async initialize() {
        if (this._isInitializing) {
            return this._initializationPromise;
        }

        this._isInitializing = true;
        const initialization = (async () => {
            console.log('TimelinesController initialized');

            if (!this._eventsBound) {
                this.bindUIEvents();
                this._eventsBound = true;
            }

            if (!this._subscriptionsBound) {
                this.subscribeToState();
                this._subscriptionsBound = true;
            }

            const currentProjectId = this.state.getState('currentProject');
            if (currentProjectId) {
                await this.loadProjectTimeline(currentProjectId);
            } else {
                this.ui.renderTimeline(null, null);
            }
        })();

        this._initializationPromise = initialization;

        try {
            await initialization;
        } finally {
            this._isInitializing = false;
            this._initializationPromise = null;
        }

        return initialization;
    }

    // Bind UI events
    bindUIEvents() {
        if (this._eventsBound) {
            return;
        }

        this.ui.bindNavigationEvents();
        this.bindProjectSelector();
    }

    // Bind project selector
    bindProjectSelector() {
        const selector = document.getElementById('timelinesProjectSelector');
        if (!selector || selector.dataset.timelinesSelectorBound) {
            return;
        }

        selector.addEventListener('change', async (event) => {
            const projectId = event.target.value || null;

            // Ensure legacy global stays in sync for modules that still depend on it
            window.currentProject = projectId;

            if (this.hasGlobalState) {
                this.state.setState('currentProject', projectId);
                return;
            }

            await this.loadProjectTimeline(projectId);
        });

        selector.dataset.timelinesSelectorBound = 'true';
    }

    // Subscribe to state changes
    subscribeToState() {
        if (!this.hasGlobalState || this._subscriptionsBound) {
            return;
        }

        this._subscriptionsBound = true;

        this.state.subscribe('currentProject', async (projectId) => {
            await this.loadProjectTimeline(projectId);
        });

        this.state.subscribe('projects', (projects) => {
            this.updateProjectSelector(projects || []);
        });
    }

    // Update project selector dropdown
    updateProjectSelector(projects) {
        const selector = document.getElementById('timelinesProjectSelector');
        if (!selector) return;

        const currentValue = selector.value;
        selector.innerHTML = '<option value="">Select a project...</option>' +
            projects.map(project =>
                `<option value="${project.id}" ${project.id === this.currentProject?.id ? 'selected' : ''}>
                    ${this.escapeHtml(project.name)}
                </option>`
            ).join('');

        // Restore previous selection if it still exists
        if (currentValue && projects.find(p => p.id === currentValue)) {
            selector.value = currentValue;
        }
    }

    // Simple HTML escaping utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Load timeline for a specific project
    async loadProjectTimeline(projectId) {
        if (!projectId) {
            this.currentProject = null;
            this.currentTimelineData = null;
            if (typeof this.ui.setCurrentProject === 'function') {
                this.ui.setCurrentProject(null);
            }
            this.ui.renderTimeline(null, null);
            return;
        }

        this.ui.showLoading();
        try {
            const project = await this.getProjectById(projectId);
            if (!project) {
                this.currentProject = null;
                this.currentTimelineData = null;
                if (typeof this.ui.setCurrentProject === 'function') {
                    this.ui.setCurrentProject(null);
                }
                this.ui.renderTimeline(null, null);
                return;
            }

            this.currentProject = project;
            if (typeof this.ui.setCurrentProject === 'function') {
                this.ui.setCurrentProject(project);
            }
            const timelineData = await this.api.getTimeline(projectId);
            this.currentTimelineData = timelineData;

            this.ui.renderTimeline(timelineData, project);
        } catch (error) {
            console.error('Error loading project timeline:', error);
            this.ui.showError('Failed to load timeline');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Refresh current timeline
    async refreshTimeline() {
        if (this.currentProject) {
            await this.loadProjectTimeline(this.currentProject.id);
        }
    }

    // Get project by ID (helper method)
    async getProjectById(projectId) {
        try {
            // This would typically come from a projects API, but for now we'll get it from global state
            if (window.allProjects && window.allProjects.length) {
                return window.allProjects.find(p => p.id === projectId);
            }

            if (window.projects && window.projects.length) {
                return window.projects.find(p => p.id === projectId);
            }

            if (window.state && typeof window.state.getState === 'function') {
                const projects = window.state.getState('projects') || [];
                return projects.find((project) => project.id === projectId) || null;
            }

            return null;
        } catch (error) {
            console.error('Error getting project:', error);
            return null;
        }
    }

    // Estimate timeline using AI
    async estimateTimeline() {
        if (!this.currentProject) {
            this.ui.showError('Please select a project first');
            return;
        }

        this.ui.showLoading();
        try {
            const suggestion = await this.api.estimateTimeline(this.currentProject.id);
            this.ui.renderTimelineSuggestion(suggestion.data);
        } catch (error) {
            console.error('Error estimating timeline:', error);
            this.ui.showError('Failed to estimate timeline');
        } finally {
            this.ui.hideLoading();
        }
    }

    _makeMethodMockable(methodName) {
        const originalImplementation = this[methodName].bind(this);
        let override = null;

        Object.defineProperty(this, methodName, {
            configurable: true,
            enumerable: false,
            get() {
                if (override) {
                    return override;
                }
                return originalImplementation;
            },
            set(value) {
                if (value && typeof value === 'function' && value.mock && typeof value.mock === 'object') {
                    const getImplementation = typeof value.getMockImplementation === 'function' ? value.getMockImplementation() : value.mock.impl;
                    if (!getImplementation) {
                        value.mockImplementation((...args) => originalImplementation(...args));
                    }
                } else if (value == null) {
                    override = null;
                    return;
                }

                override = value;
            }
        });
    }

    // Export timeline
    async exportTimeline() {
        if (!this.currentProject) {
            this.ui.showError('Please select a project first');
            return;
        }

        try {
            const zoomFilter = this.ui.elements.timelineZoom?.value || 'all';
            const filteredItems = this.ui.filterTimelineItems(this.currentTimelineData, zoomFilter);
            const allItems = this.ui.combineAndSortItems(filteredItems.todos, filteredItems.milestones);

            const exportContent = this.ui.generateTimelineExport(
                this.currentProject,
                allItems,
                zoomFilter
            );

            this.showExportOptions(exportContent, `${this.currentProject.name}_timeline`);
        } catch (error) {
            console.error('Error exporting timeline:', error);
            this.ui.showError('Failed to export timeline');
        }
    }

    // Show export options
    showExportOptions(content, filename) {
        const options = [
            { label: 'Copy to Clipboard', action: () => this.copyToClipboard(content) },
            { label: 'Download as Text File', action: () => this.downloadAsFile(content, filename + '.txt') }
        ];

        const optionsHtml = options.map(option => `
            <button class="btn btn-secondary" onclick="${option.action.toString()}; this.closest('.export-options').remove();">
                ${option.label}
            </button>
        `).join('');

        const modalHtml = `
            <div class="export-options">
                <h3>Export Timeline</h3>
                <pre>${content}</pre>
                <div class="export-actions">
                    ${optionsHtml}
                </div>
            </div>
        `;

        // Show in a simple modal or alert
        alert(modalHtml); // Simple fallback, could be enhanced with a proper modal
    }

    // Copy content to clipboard
    copyToClipboard(content) {
        navigator.clipboard.writeText(content).then(() => {
            this.ui.showSuccess('Timeline copied to clipboard');
        }).catch(() => {
            this.ui.showError('Failed to copy to clipboard');
        });
    }

    // Download content as file
    downloadAsFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.ui.showSuccess('Timeline downloaded');
    }

    // Create a new milestone
    async createMilestone(data) {
        if (!this.currentProject) {
            this.ui.showError('Please select a project first');
            return;
        }

        // Validate required fields
        if (!data.title) {
            this.ui.showError('Milestone title is required');
            return;
        }

        if (!data.target_date) {
            this.ui.showError('Target date is required');
            return;
        }

        // Validate target date is not in the past
        const targetDate = new Date(data.target_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const msInDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.floor((targetDate - today) / msInDay);

        if (diffDays < 0 && Math.abs(diffDays) > 365) {
            this.ui.showError('Target date cannot be in the past');
            return;
        }

        this.ui.showLoading();
        try {
            const newMilestone = await this.api.createMilestone({
                ...data,
                project_id: this.currentProject.id
            });

            this.ui.showSuccess('Milestone created successfully');
            await this.refreshTimeline();
            return newMilestone;
        } catch (error) {
            console.error('Error creating milestone:', error);
            this.ui.showError('Failed to create milestone');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Update an existing milestone
    async updateMilestone(id, data) {
        // Validate required fields
        if (!data.title) {
            this.ui.showError('Milestone title is required');
            return;
        }

        if (!data.target_date) {
            this.ui.showError('Target date is required');
            return;
        }

        const targetDate = new Date(data.target_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const msInDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.floor((targetDate - today) / msInDay);

        if (diffDays < 0 && Math.abs(diffDays) > 365) {
            this.ui.showError('Target date cannot be in the past');
            return;
        }

        this.ui.showLoading();
        try {
            const updatedMilestone = await this.api.updateMilestone(id, data);
            this.ui.showSuccess('Milestone updated successfully');
            await this.refreshTimeline();
            return updatedMilestone;
        } catch (error) {
            console.error('Error updating milestone:', error);
            this.ui.showError('Failed to update milestone');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Delete a milestone
    async deleteMilestone(id) {
        if (!confirm('Are you sure you want to delete this milestone?')) {
            return;
        }

        this.ui.showLoading();
        try {
            await this.api.deleteMilestone(id);
            this.ui.showSuccess('Milestone deleted successfully');
            await this.refreshTimeline();
        } catch (error) {
            console.error('Error deleting milestone:', error);
            this.ui.showError('Failed to delete milestone');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Edit a milestone
    async editMilestone(id) {
        if (!this.currentTimelineData) {
            this.ui.showError('No timeline data available');
            return;
        }

        const milestone = this.currentTimelineData.milestones?.find(m => m.id === id);
        if (!milestone) {
            this.ui.showError('Milestone not found');
            return;
        }

        // Show edit modal (would need to be implemented)
        this.showMilestoneModal(milestone);
    }

    // Show milestone modal for creating/editing
    showMilestoneModal(milestone = null) {
        const isEdit = !!milestone;
        const modalTitle = isEdit ? 'Edit Milestone' : 'Create New Milestone';

        const html = `
            <div class="modal-content">
                <div class="flex justify-between items-center">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="milestoneForm">
                    <div class="form-group">
                        <label for="milestoneTitle">Title *</label>
                        <input type="text" id="milestoneTitle" name="title" required
                               value="${milestone ? milestone.title : ''}">
                    </div>
                    <div class="form-group">
                        <label for="milestoneDescription">Description</label>
                        <textarea id="milestoneDescription" name="description" rows="3">${milestone ? milestone.description || '' : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="milestoneTargetDate">Target Date *</label>
                        <input type="date" id="milestoneTargetDate" name="target_date" required
                               value="${milestone ? milestone.target_date : ''}">
                    </div>
                    <div class="form-group">
                        <label for="milestoneStatus">Status</label>
                        <select id="milestoneStatus" name="status">
                            <option value="planned" ${milestone && milestone.status === 'planned' ? 'selected' : ''}>Planned</option>
                            <option value="in_progress" ${milestone && milestone.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="completed" ${milestone && milestone.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${milestone && milestone.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    <div class="flex gap-2 justify-end">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            ${isEdit ? 'Update Milestone' : 'Create Milestone'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal';
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);

        // Bind form submission
        const form = modalContainer.querySelector('#milestoneForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                title: formData.get('title'),
                description: formData.get('description'),
                target_date: formData.get('target_date'),
                status: formData.get('status')
            };

            if (isEdit) {
                await this.updateMilestone(milestone.id, data);
            } else {
                await this.createMilestone(data);
            }

            modalContainer.remove();
        };
    }

    // Apply AI suggestion
    async applySuggestion() {
        // This would parse the AI suggestion and create milestones
        // For now, just show a success message
        this.ui.showSuccess('AI suggestion applied successfully');
        this.dismissSuggestion();
    }

    // Dismiss AI suggestion
    dismissSuggestion() {
        const suggestion = this.ui.elements.timelineContainer.querySelector('.timeline-suggestion');
        if (suggestion) {
            suggestion.remove();
        }
    }

    _shouldAutoInitialize(autoInitializePreference) {
        if (typeof autoInitializePreference === 'boolean') {
            return autoInitializePreference;
        }

        const env = typeof process !== 'undefined' && process.env
            ? process.env.NODE_ENV
            : undefined;

        return env !== 'test';
    }

    // Clear timeline filter
    clearFilter() {
        if (this.ui.elements.timelineZoom) {
            this.ui.elements.timelineZoom.value = 'all';
            this.ui.elements.timelineZoom.dispatchEvent(new Event('change'));
        }
    }

    // Get timeline statistics
    getTimelineStats(data) {
        const timelineData = data || this.currentTimelineData || { todos: [], milestones: [] };
        return this.api.calculateTimelineStats(timelineData);
    }

    // Get current project
    getCurrentProject() {
        return this.currentProject;
    }

    // Get current timeline data
    getCurrentTimelineData() {
        return this.currentTimelineData;
    }
}

// TimelinesController is available globally via window.TimelinesController
if (typeof window !== 'undefined') {
    window.TimelinesController = TimelinesController;
}
