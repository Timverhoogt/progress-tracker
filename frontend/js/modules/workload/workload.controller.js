// WorkloadApi and WorkloadUI are available globally via window

class WorkloadController {
    constructor(apiClient) {
        this.api = new WorkloadApi(apiClient);
        this.ui = new WorkloadUI();
        this.currentTab = 'overview';
        this.initialize();
    }

    // Initialize the controller
    async initialize() {
        console.log('WorkloadController initialized');
        await this.loadWorkloadData();
        this.bindEvents();
        this.ui.bindNavigationEvents();
    }

    // Load initial workload data
    async loadWorkloadData() {
        this.ui.showLoading();
        try {
            // Load today's workload and recent entries in parallel
            const [todayWorkload, recentEntries] = await Promise.all([
                this.api.getTodayWorkload(),
                this.api.getWorkloadEntries(null, null, 10)
            ]);

            this.ui.renderTodayWorkload(todayWorkload);
            this.ui.renderWorkloadEntries(recentEntries);
        } catch (error) {
            console.error('Error loading workload data:', error);
            this.ui.showError('Failed to load workload data');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Create a new workload entry
    async createWorkloadEntry(data) {
        // Validate required fields
        if (!data.work_date || !data.start_time || !data.end_time) {
            this.ui.showError('Date, start time, and end time are required');
            return;
        }

        if (data.start_time >= data.end_time) {
            this.ui.showError('End time must be after start time');
            return;
        }

        if (data.break_duration < 0) {
            this.ui.showError('Break duration cannot be negative');
            return;
        }

        // Validate scores
        const scoreFields = ['intensity_level', 'focus_level', 'productivity_score'];
        for (const field of scoreFields) {
            if (data[field] < 1 || data[field] > 10) {
                this.ui.showError(`${field.replace('_', ' ')} must be between 1 and 10`);
                return;
            }
        }

        this.ui.showLoading();
        try {
            const newEntry = await this.api.createWorkloadEntry(data);
            this.ui.showSuccess('Work session logged successfully');
            this.ui.hideWorkloadModal();
            await this.loadWorkloadData(); // Refresh the data
            return newEntry;
        } catch (error) {
            console.error('Failed to create workload entry:', error);
            this.ui.showError('Failed to log work session');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Update an existing workload entry
    async updateWorkloadEntry(date, data) {
        // Same validation as create
        if (!data.work_date || !data.start_time || !data.end_time) {
            this.ui.showError('Date, start time, and end time are required');
            return;
        }

        if (data.start_time >= data.end_time) {
            this.ui.showError('End time must be after start time');
            return;
        }

        if (data.break_duration < 0) {
            this.ui.showError('Break duration cannot be negative');
            return;
        }

        const scoreFields = ['intensity_level', 'focus_level', 'productivity_score'];
        for (const field of scoreFields) {
            if (data[field] < 1 || data[field] > 10) {
                this.ui.showError(`${field.replace('_', ' ')} must be between 1 and 10`);
                return;
            }
        }

        this.ui.showLoading();
        try {
            const updatedEntry = await this.api.updateWorkloadEntry(date, data);
            this.ui.showSuccess('Work session updated successfully');
            this.ui.hideWorkloadModal();
            await this.loadWorkloadData(); // Refresh the data
            return updatedEntry;
        } catch (error) {
            console.error('Failed to update workload entry:', error);
            this.ui.showError('Failed to update work session');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Delete a workload entry
    async deleteWorkloadEntry(date) {
        if (!confirm('Are you sure you want to delete this work session? This action cannot be undone.')) {
            return;
        }

        this.ui.showLoading();
        try {
            await this.api.deleteWorkloadEntry(date);
            this.ui.showSuccess('Work session deleted successfully');
            await this.loadWorkloadData(); // Refresh the data
        } catch (error) {
            console.error('Failed to delete workload entry:', error);
            this.ui.showError('Failed to delete work session');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Edit a workload entry
    async editWorkloadEntry(date) {
        try {
            const entry = await this.api.getWorkloadEntryByDate(date);
            if (entry) {
                this.ui.setFormData(entry);
                this.ui.showWorkloadModal(date);
            } else {
                this.ui.showError('Work session not found');
            }
        } catch (error) {
            console.error('Failed to load workload entry for editing:', error);
            this.ui.showError('Failed to load work session for editing');
        }
    }

    // Show workload modal
    showWorkloadModal(editDate = null) {
        this.ui.showWorkloadModal(editDate);
    }

    // Handle form submission
    async handleFormSubmission(data, editDate) {
        if (editDate) {
            await this.updateWorkloadEntry(editDate, data);
        } else {
            await this.createWorkloadEntry(data);
        }
    }

    // Handle workload statistics request
    async handleStatsRequest() {
        this.ui.showLoading();
        try {
            const stats = await this.api.getWorkloadStats(30);
            this.ui.renderWorkloadStats(stats);
        } catch (error) {
            console.error('Error loading workload stats:', error);
            this.ui.showError('Failed to load workload statistics');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Handle workload patterns request
    async handlePatternsRequest() {
        this.ui.showLoading();
        try {
            const patterns = await this.api.getWorkloadPatterns(90);
            this.ui.renderWorkloadPatterns(patterns);
        } catch (error) {
            console.error('Error loading workload patterns:', error);
            this.ui.showError('Failed to load workload patterns');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Handle workload balance request
    async handleBalanceRequest() {
        this.ui.showLoading();
        try {
            const balance = await this.api.getWorkloadBalanceAnalysis(30);
            this.ui.renderWorkloadBalance(balance);
        } catch (error) {
            console.error('Error loading workload balance analysis:', error);
            this.ui.showError('Failed to load workload balance analysis');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Handle new workload entry request
    handleNewWorkloadRequest() {
        this.ui.showWorkloadModal();
    }

    // Handle workload edit request
    async handleEditRequest(date) {
        await this.editWorkloadEntry(date);
    }

    // Handle workload delete request
    async handleDeleteRequest(date) {
        await this.deleteWorkloadEntry(date);
    }

    // Bind UI events to controller actions
    bindEvents() {
        // Handle form submission
        this.ui.bindFormSubmission(async (data, editDate) => {
            await this.handleFormSubmission(data, editDate);
        });

        // Handle workload statistics
        this.ui.on('workload:stats', async () => {
            await this.handleStatsRequest();
        });

        // Handle workload patterns
        this.ui.on('workload:patterns', async () => {
            await this.handlePatternsRequest();
        });

        // Handle workload balance
        this.ui.on('workload:balance', async () => {
            await this.handleBalanceRequest();
        });

        // Handle new workload entry
        this.ui.on('workload:new', () => {
            this.handleNewWorkloadRequest();
        });

        // Handle workload editing
        this.ui.on('workload:edit', async (date) => {
            await this.handleEditRequest(date);
        });

        // Handle workload deletion
        this.ui.on('workload:delete', async (date) => {
            await this.handleDeleteRequest(date);
        });
    }

    // Event system for cross-module communication
    on(event, handler) {
        this.ui.on(event, handler);
    }

    emit(event, data) {
        this.ui.emit(event, data);
    }

    // Get current workload data (for other modules)
    async getCurrentWorkloadData() {
        try {
            const todayWorkload = await this.api.getTodayWorkload();
            const recentEntries = await this.api.getWorkloadEntries(null, null, 10);
            return {
                todayWorkload,
                recentEntries,
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error('Failed to get current workload data:', error);
            return null;
        }
    }

    // Get workload statistics (for other modules)
    async getWorkloadStats(days = 30) {
        try {
            return await this.api.getWorkloadStats(days);
        } catch (error) {
            console.error('Failed to get workload stats:', error);
            return null;
        }
    }

    // Get workload balance analysis (for other modules)
    async getWorkloadBalance(days = 30) {
        try {
            return await this.api.getWorkloadBalanceAnalysis(days);
        } catch (error) {
            console.error('Failed to get workload balance:', error);
            return null;
        }
    }

    // Refresh workload data
    async refresh() {
        await this.loadWorkloadData();
    }
}

// WorkloadController is available globally via window.WorkloadController
if (typeof window !== 'undefined') {
    window.WorkloadController = WorkloadController;
}
