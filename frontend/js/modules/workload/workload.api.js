

class WorkloadApi {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Get today's workload entry
    async getTodayWorkload() {
        return await this.api.workload.getTodayWorkload();
    }

    // Get workload entries with optional filtering
    async getWorkloadEntries(startDate, endDate, limit = 10) {
        return await this.api.workload.getWorkloadEntries(startDate, endDate, limit);
    }

    // Get workload statistics
    async getWorkloadStats(days = 30) {
        return await this.api.workload.getWorkloadStats(days);
    }

    // Get workload patterns analysis
    async getWorkloadPatterns(days = 90) {
        return await this.api.workload.getWorkloadPatterns(days);
    }

    // Get workload balance analysis
    async getWorkloadBalanceAnalysis(days = 30) {
        return await this.api.workload.getWorkloadBalanceAnalysis(days);
    }

    // Get break recommendations
    async getBreakRecommendations(days = 7) {
        return await this.api.workload.getBreakRecommendations(days);
    }

    // Get balance dashboard data
    async getBalanceDashboard(days = 30) {
        return await this.api.workload.getBalanceDashboard(days);
    }

    // Create a new workload entry
    async createWorkloadEntry(data) {
        return await this.api.workload.createWorkloadEntry(data);
    }

    // Update an existing workload entry
    async updateWorkloadEntry(date, data) {
        return await this.api.workload.updateWorkloadEntry(date, data);
    }

    // Delete a workload entry
    async deleteWorkloadEntry(date) {
        return await this.api.workload.deleteWorkloadEntry(date);
    }

    // Get workload entry by date
    async getWorkloadEntryByDate(date) {
        const entries = await this.getWorkloadEntries(date, date);
        return entries.find(entry => entry.work_date === date);
    }

    // Calculate work hours from start/end times
    calculateWorkHours(startTime, endTime, breakDuration = 0) {
        if (!startTime || !endTime) return 0;

        const start = new Date(`1970-01-01T${startTime}`);
        const end = new Date(`1970-01-01T${endTime}`);
        const diffMs = end - start - (breakDuration * 60000); // Convert break to milliseconds
        return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
    }
}

// WorkloadApi is available globally via window.WorkloadApi
if (typeof window !== 'undefined') {
    window.WorkloadApi = WorkloadApi;
}
