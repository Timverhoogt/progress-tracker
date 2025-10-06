// Format utilities are available globally in the browser environment via window

class ReportsUI {
    constructor() {
        this.container = null;
        this.reportsList = null;
        this.reportModal = null;
        this.reportForm = null;
        this.reportType = null;
        this.reportTitle = null;
        this.reportRecipient = null;
        this.reportContent = null;
        this.projectSelector = null;
    }

    /**
     * Initialize the UI elements
     * @param {Object} elements - DOM elements
     */
    initialize(elements) {
        this.container = elements.container;
        this.reportsList = elements.reportsList;
        this.reportModal = elements.reportModal;
        this.reportForm = elements.reportForm;
        this.reportType = elements.reportType;
        this.reportTitle = elements.reportTitle;
        this.reportRecipient = elements.reportRecipient;
        this.reportContent = elements.reportContent;
        this.projectSelector = elements.projectSelector;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Report generation button
        const generateBtn = document.getElementById('generateReportBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.showReportModal());
        }

        // Report form submission
        if (this.reportForm) {
            this.reportForm.addEventListener('submit', (e) => this.handleReportGeneration(e));
        }

        // Report modal close handlers
        const closeModal = document.getElementById('closeReportModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideReportModal());
        }

        const cancelModal = document.getElementById('cancelReportModal');
        if (cancelModal) {
            cancelModal.addEventListener('click', () => this.hideReportModal());
        }

        // Project selector change
        if (this.projectSelector) {
            this.projectSelector.addEventListener('change', (e) => {
                const projectId = e.target.value;
                if (projectId) {
                    this.loadReports(projectId);
                } else {
                    this.showEmptyState();
                }
            });
        }

        // Weekly report buttons
        const generateWeeklyBtn = document.getElementById('generateWeeklyBtn');
        if (generateWeeklyBtn) {
            generateWeeklyBtn.addEventListener('click', () => this.handleWeeklyReportGeneration());
        }

        const refreshStatusBtn = document.getElementById('refreshStatusBtn');
        if (refreshStatusBtn) {
            refreshStatusBtn.addEventListener('click', () => this.refreshSchedulerStatus());
        }

        const restartSchedulerBtn = document.getElementById('restartSchedulerBtn');
        if (restartSchedulerBtn) {
            restartSchedulerBtn.addEventListener('click', () => this.restartScheduler());
        }

        // Preview weekly button
        const previewWeeklyBtn = document.getElementById('previewWeeklyBtn');
        if (previewWeeklyBtn) {
            previewWeeklyBtn.addEventListener('click', () => this.previewWeeklyReport());
        }

        // Test email button
        const testEmailBtn = document.getElementById('testEmailBtn');
        if (testEmailBtn) {
            testEmailBtn.addEventListener('click', () => this.sendTestEmail());
        }
    }

    /**
     * Show report modal
     */
    showReportModal() {
        if (this.reportModal) {
            this.reportModal.style.display = 'block';
            this.reportModal.classList.add('show');
        }
    }

    /**
     * Hide report modal
     */
    hideReportModal() {
        if (this.reportModal) {
            this.reportModal.style.display = 'none';
            this.reportModal.classList.remove('show');
            if (this.reportForm) this.reportForm.reset();
        }
    }

    /**
     * Handle report generation form submission
     * @param {Event} e - Form submit event
     */
    async handleReportGeneration(e) {
        e.preventDefault();

        const formData = new FormData(this.reportForm);
        const reportData = {
            project_id: formData.get('project_id'),
            report_type: formData.get('report_type'),
            title: formData.get('title'),
            content: formData.get('content'),
            recipient: formData.get('recipient')
        };

        this.showLoading('Generating report...');

        try {
            // This would be handled by the controller
            const event = new CustomEvent('reports:generate', {
                detail: { reportData }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Error generating report:', error);
            this.showError('Failed to generate report');
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Render reports list
     * @param {Array} reports - Array of reports
     */
    renderReports(reports) {
        if (!this.reportsList) return;

        if (!reports || reports.length === 0) {
            this.showEmptyState();
            return;
        }

        this.reportsList.innerHTML = reports.map(report => `
            <div class="report-card" data-report-id="${report.id}">
                <div class="report-header">
                    <div class="report-title">${escapeHtml(report.title)}</div>
                    <div class="report-meta">
                        <span class="report-type">${escapeHtml(report.report_type)}</span>
                        <span class="report-date">${formatDate(report.created_at)}</span>
                    </div>
                </div>
                <div class="report-content">
                    <div class="report-preview">${this.truncateContent(report.content)}</div>
                </div>
                <div class="report-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewReport('${report.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="downloadReport('${report.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReport('${report.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Show empty state when no reports
     */
    showEmptyState() {
        if (!this.reportsList) return;

        this.reportsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No Reports Yet</h3>
                <p>Generate your first report to get started with progress tracking and insights.</p>
                <button class="btn btn-primary" onclick="showReportModal()">
                    <i class="fas fa-plus"></i> Generate Report
                </button>
            </div>
        `;
    }

    /**
     * Show project selection state
     */
    showProjectSelectionState() {
        if (!this.reportsList) return;

        this.reportsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>Select a Project</h3>
                <p>Choose a project to view and generate reports</p>
            </div>
        `;
    }

    /**
     * Update scheduler status display
     * @param {Object} status - Scheduler status
     */
    updateSchedulerStatus(status) {
        const statusValue = document.getElementById('reportsStatusValue');
        const nextReportTime = document.getElementById('nextReportTime');
        const sendgridStatus = document.getElementById('sendgridStatus');

        if (statusValue) {
            statusValue.textContent = status.isRunning ? 'Active' : 'Disabled';
            statusValue.className = `status-value ${status.isRunning ? 'status-active' : 'status-disabled'}`;
        }

        if (nextReportTime) {
            nextReportTime.textContent = status.nextRun ?
                formatDateTime(status.nextRun) :
                'Not scheduled';
        }

        if (sendgridStatus) {
            sendgridStatus.textContent = status.sendgridConfigured ?
                'Configured' :
                'Not configured';
        }
    }

    /**
     * Truncate content for preview
     * @param {string} content - Content to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated content
     */
    truncateContent(content, maxLength = 200) {
        if (!content || content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    }

    /**
     * Show loading state
     * @param {string} message - Loading message
     */
    showLoading(message = 'Loading...') {
        // This would use the global loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            const loadingText = loadingOverlay.querySelector('p');
            if (loadingText) loadingText.textContent = message;
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Show message
     * @param {string} message - Message text
     * @param {string} type - Message type (error, success, warning, info)
     */
    showMessage(message, type = 'info') {
        // This would use the global message system
        const event = new CustomEvent('ui:showMessage', {
            detail: { message, type }
        });
        document.dispatchEvent(event);
    }

    // Placeholder methods for features that would be implemented by controller
    async handleWeeklyReportGeneration() {
        const event = new CustomEvent('reports:generateWeekly');
        document.dispatchEvent(event);
    }

    async refreshSchedulerStatus() {
        const event = new CustomEvent('reports:refreshStatus');
        document.dispatchEvent(event);
    }

    async restartScheduler() {
        const event = new CustomEvent('reports:restartScheduler');
        document.dispatchEvent(event);
    }

    async previewWeeklyReport() {
        const event = new CustomEvent('reports:previewWeekly');
        document.dispatchEvent(event);
    }

    async sendTestEmail() {
        const event = new CustomEvent('reports:testEmail');
        document.dispatchEvent(event);
    }

    async loadReports(projectId) {
        const event = new CustomEvent('reports:load', {
            detail: { projectId }
        });
        document.dispatchEvent(event);
    }
}

// ReportsUI is available globally via window.ReportsUI
if (typeof window !== 'undefined') {
    window.ReportsUI = ReportsUI;
}
