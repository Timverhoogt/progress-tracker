


class ReportsController {
    constructor(apiClient, state, eventBus) {
        this.api = new ReportsApi(apiClient);
        this.ui = new ReportsUI();
        this.state = state;
        this.eventBus = eventBus;
        this.currentProject = null;

        this.setupEventListeners();
    }

    /**
     * Initialize the reports module
     */
    async initialize() {
        console.log('📊 Reports module initialized');

        // Get DOM elements for UI initialization
        const elements = {
            container: document.getElementById('reports'),
            reportsList: document.getElementById('reportsList'),
            reportModal: document.getElementById('reportModal'),
            reportForm: document.getElementById('reportForm'),
            reportType: document.getElementById('reportType'),
            reportTitle: document.getElementById('reportTitle'),
            reportRecipient: document.getElementById('reportRecipient'),
            reportContent: document.getElementById('reportContent'),
            projectSelector: document.getElementById('reportsProjectSelector')
        };

        this.ui.initialize(elements);

        // Subscribe to state changes
        this.state.subscribe('currentProject', (project) => {
            this.currentProject = project;
            if (project) {
                this.loadReports(project.id);
            } else {
                this.ui.showProjectSelectionState();
            }
        });

        // Load initial data
        if (this.state.getState('currentProject')) {
            this.currentProject = this.state.getState('currentProject');
            this.loadReports(this.currentProject.id);
        } else {
            this.ui.showProjectSelectionState();
        }

        // Load scheduler status
        this.refreshSchedulerStatus();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for report generation events
        document.addEventListener('reports:generate', (e) => {
            this.handleReportGeneration(e.detail.reportData);
        });

        // Listen for weekly report generation
        document.addEventListener('reports:generateWeekly', () => {
            this.handleWeeklyReportGeneration();
        });

        // Listen for status refresh
        document.addEventListener('reports:refreshStatus', () => {
            this.refreshSchedulerStatus();
        });

        // Listen for scheduler restart
        document.addEventListener('reports:restartScheduler', () => {
            this.restartScheduler();
        });

        // Listen for weekly preview
        document.addEventListener('reports:previewWeekly', () => {
            this.previewWeeklyReport();
        });

        // Listen for test email
        document.addEventListener('reports:testEmail', () => {
            this.sendTestEmail();
        });

        // Listen for reports load
        document.addEventListener('reports:load', (e) => {
            this.loadReports(e.detail.projectId);
        });

        // Listen for report deletion
        document.addEventListener('reports:delete', (e) => {
            this.deleteReport(e.detail.reportId);
        });

        // Listen for report download
        document.addEventListener('reports:download', (e) => {
            this.downloadReport(e.detail.reportId);
        });

        // Listen for report view
        document.addEventListener('reports:view', (e) => {
            this.viewReport(e.detail.reportId);
        });
    }

    /**
     * Load reports for a project
     * @param {string} projectId - Project ID
     */
    async loadReports(projectId) {
        if (!projectId) {
            this.ui.showProjectSelectionState();
            return;
        }

        this.ui.showLoading('Loading reports...');

        try {
            const reports = await this.api.getReports(projectId);
            this.ui.renderReports(reports);
            console.log(`📊 Loaded ${reports.length} reports for project ${projectId}`);
        } catch (error) {
            console.error('Failed to load reports:', error);
            this.ui.showError('Failed to load reports');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Handle report generation
     * @param {Object} reportData - Report data
     */
    async handleReportGeneration(reportData) {
        this.ui.showLoading('Generating report...');

        try {
            const report = await this.api.generateReport(reportData);
            this.ui.hideReportModal();
            this.ui.showSuccess('Report generated successfully!');

            // Reload reports for current project
            if (this.currentProject) {
                await this.loadReports(this.currentProject.id);
            }

            console.log('📊 Report generated:', report);
        } catch (error) {
            console.error('Failed to generate report:', error);
            this.ui.showError('Failed to generate report');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Handle weekly report generation
     */
    async handleWeeklyReportGeneration() {
        if (!this.currentProject) {
            this.ui.showError('Please select a project first');
            return;
        }

        this.ui.showLoading('Generating weekly report...');

        try {
            const reportData = {
                project_id: this.currentProject.id,
                template: 'self',
                sections: {
                    includeNotes: true,
                    includeTodos: true
                },
                narrativeOnly: false
            };

            const report = await this.api.generateWeeklyReport(reportData);
            this.ui.showSuccess('Weekly report generated successfully!');
            console.log('📊 Weekly report generated:', report);
        } catch (error) {
            console.error('Failed to generate weekly report:', error);
            this.ui.showError('Failed to generate weekly report');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Delete a report
     * @param {string} reportId - Report ID
     */
    async deleteReport(reportId) {
        if (!confirm('Are you sure you want to delete this report?')) {
            return;
        }

        this.ui.showLoading('Deleting report...');

        try {
            await this.api.deleteReport(reportId);
            this.ui.showSuccess('Report deleted successfully');

            // Reload reports for current project
            if (this.currentProject) {
                await this.loadReports(this.currentProject.id);
            }

            console.log('📊 Report deleted:', reportId);
        } catch (error) {
            console.error('Failed to delete report:', error);
            this.ui.showError('Failed to delete report');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Refresh scheduler status
     */
    async refreshSchedulerStatus() {
        try {
            const status = await this.api.getSchedulerStatus();
            this.ui.updateSchedulerStatus(status);
            console.log('📊 Scheduler status refreshed:', status);
        } catch (error) {
            console.error('Failed to refresh scheduler status:', error);
            this.ui.showError('Failed to refresh scheduler status');
        }
    }

    /**
     * Restart the scheduler
     */
    async restartScheduler() {
        if (!confirm('Are you sure you want to restart the scheduler?')) {
            return;
        }

        this.ui.showLoading('Restarting scheduler...');

        try {
            await this.api.restartScheduler();
            this.ui.showSuccess('Scheduler restarted successfully');
            await this.refreshSchedulerStatus();
            console.log('📊 Scheduler restarted');
        } catch (error) {
            console.error('Failed to restart scheduler:', error);
            this.ui.showError('Failed to restart scheduler');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Preview weekly report
     */
    async previewWeeklyReport() {
        if (!this.currentProject) {
            this.ui.showError('Please select a project first');
            return;
        }

        this.ui.showLoading('Generating preview...');

        try {
            const previewData = {
                project_id: this.currentProject.id,
                template: 'self',
                sections: {
                    includeNotes: true,
                    includeTodos: true
                },
                narrativeOnly: false
            };

            const preview = await this.api.previewWeeklyReport(previewData);
            this.showReportPreview(preview);
            console.log('📊 Weekly report preview generated');
        } catch (error) {
            console.error('Failed to generate preview:', error);
            this.ui.showError('Failed to generate preview');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Send test email
     */
    async sendTestEmail() {
        const email = document.getElementById('weeklyReportEmail').value;
        if (!email) {
            this.ui.showError('Please set your email address in settings first');
            return;
        }

        this.ui.showLoading('Sending test email...');

        try {
            const emailData = {
                to: email,
                template: 'self',
                sections: {
                    includeNotes: true,
                    includeTodos: true
                },
                narrativeOnly: false
            };

            await this.api.testEmail(emailData);
            this.ui.showSuccess('Test email sent successfully!');
            console.log('📊 Test email sent to:', email);
        } catch (error) {
            console.error('Failed to send test email:', error);
            this.ui.showError('Failed to send test email');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Show report preview (placeholder for modal implementation)
     * @param {Object} preview - Preview data
     */
    showReportPreview(preview) {
        // This would open a modal or display the preview
        console.log('📊 Report preview:', preview);
        this.ui.showMessage('Preview generated successfully! Check console for details.', 'info');
    }

    /**
     * Download report (placeholder for download implementation)
     * @param {string} reportId - Report ID
     */
    async downloadReport(reportId) {
        this.ui.showLoading('Preparing download...');

        try {
            const exportOptions = {
                format: 'pdf',
                reportId: reportId
            };

            const blob = await this.api.exportReports(exportOptions);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.ui.showSuccess('Report downloaded successfully!');
            console.log('📊 Report downloaded:', reportId);
        } catch (error) {
            console.error('Failed to download report:', error);
            this.ui.showError('Failed to download report');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * View report (placeholder for view implementation)
     * @param {string} reportId - Report ID
     */
    async viewReport(reportId) {
        this.ui.showLoading('Loading report...');

        try {
            // This would open a modal or navigate to a report view
            console.log('📊 Viewing report:', reportId);
            this.ui.showMessage('Report view functionality coming soon!', 'info');
        } catch (error) {
            console.error('Failed to view report:', error);
            this.ui.showError('Failed to view report');
        } finally {
            this.ui.hideLoading();
        }
    }

    /**
     * Get analytics data
     * @param {Object} options - Analytics options
     * @returns {Promise<Object>} Analytics data
     */
    async getAnalytics(options = {}) {
        try {
            const analytics = await this.api.getReportAnalytics(options);
            return analytics;
        } catch (error) {
            console.error('Failed to get analytics:', error);
            throw error;
        }
    }
}

