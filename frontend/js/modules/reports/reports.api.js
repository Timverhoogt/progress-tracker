

class ReportsApi {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Get reports for a specific project
     * @param {string} projectId - Project ID
     * @returns {Promise<Array>} Array of reports
     */
    async getReports(projectId) {
        return await this.apiClient.reports.getAll(projectId);
    }

    /**
     * Generate a new report
     * @param {Object} reportData - Report data
     * @returns {Promise<Object>} Generated report
     */
    async generateReport(reportData) {
        return await this.apiClient.reports.generate(reportData);
    }

    /**
     * Generate a weekly report
     * @param {Object} reportData - Weekly report data
     * @returns {Promise<Object>} Weekly report
     */
    async generateWeeklyReport(reportData) {
        return await this.apiClient.reports.generateWeekly(reportData);
    }

    /**
     * Send a test email
     * @param {Object} emailData - Email data
     * @returns {Promise<Object>} Test email result
     */
    async testEmail(emailData) {
        return await this.apiClient.reports.testEmail(emailData);
    }

    /**
     * Get scheduler status
     * @returns {Promise<Object>} Scheduler status
     */
    async getSchedulerStatus() {
        return await this.apiClient.reports.getSchedulerStatus();
    }

    /**
     * Trigger weekly report manually
     * @returns {Promise<Object>} Trigger result
     */
    async triggerWeeklyReport() {
        return await this.apiClient.reports.triggerWeeklyReport();
    }

    /**
     * Delete a report
     * @param {string} reportId - Report ID
     * @returns {Promise<void>} Deletion result
     */
    async deleteReport(reportId) {
        return await this.apiClient.reports.delete(reportId);
    }

    /**
     * Preview a weekly report
     * @param {Object} previewData - Preview data
     * @returns {Promise<Object>} Preview result
     */
    async previewWeeklyReport(previewData) {
        return await this.apiClient.request('/reports/weekly/preview', {
            method: 'POST',
            body: JSON.stringify(previewData)
        });
    }

    /**
     * Restart the scheduler
     * @returns {Promise<Object>} Restart result
     */
    async restartScheduler() {
        return await this.apiClient.request('/reports/scheduler/restart', {
            method: 'POST'
        });
    }

    /**
     * Get report analytics
     * @param {Object} options - Analytics options
     * @returns {Promise<Object>} Analytics data
     */
    async getReportAnalytics(options = {}) {
        const { projectId, startDate, endDate, reportType } = options;
        let url = '/reports/analytics';

        const params = new URLSearchParams();
        if (projectId) params.append('project_id', projectId);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (reportType) params.append('report_type', reportType);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        return await this.apiClient.request(url);
    }

    /**
     * Export reports to various formats
     * @param {Object} exportOptions - Export options
     * @returns {Promise<Blob>} Exported file
     */
    async exportReports(exportOptions) {
        const { format = 'pdf', projectId, startDate, endDate } = exportOptions;
        let url = `/reports/export/${format}`;

        const params = new URLSearchParams();
        if (projectId) params.append('project_id', projectId);
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        return await this.apiClient.request(url, {
            responseType: 'blob'
        });
    }
}

// ReportsApi is available globally via window.ReportsApi
if (typeof window !== 'undefined') {
    window.ReportsApi = ReportsApi;
}
