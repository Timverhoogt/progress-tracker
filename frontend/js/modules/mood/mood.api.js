

class MoodApi {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Get today's mood entry
    async getTodayMood() {
        return await this.api.mood.getTodayMood();
    }

    // Get mood entries with optional filtering
    async getMoodEntries(startDate, endDate, limit = 10) {
        return await this.api.mood.getMoodEntries(startDate, endDate, limit);
    }

    // Get mood statistics
    async getMoodStats(days = 30) {
        return await this.api.mood.getMoodStats(days);
    }

    // Get mood patterns analysis
    async getMoodPatterns(days = 90) {
        return await this.api.mood.getMoodPatterns(days);
    }

    // Get AI analysis of mood data
    async getMoodAIAnalysis(days = 90) {
        return await this.api.mood.getMoodAIAnalysis(days);
    }

    // Get intervention triggers
    async getInterventionTriggers(days = 14) {
        return await this.api.mood.getInterventionTriggers(days);
    }

    // Log an intervention
    async logIntervention(data) {
        return await this.api.mood.logIntervention(data);
    }

    // Create a new mood entry
    async createMoodEntry(data) {
        return await this.api.mood.createMoodEntry(data);
    }

    // Update an existing mood entry
    async updateMoodEntry(date, data) {
        return await this.api.mood.updateMoodEntry(date, data);
    }

    // Delete a mood entry
    async deleteMoodEntry(date) {
        return await this.api.mood.deleteMoodEntry(date);
    }

    // Get mood entry by date
    async getMoodEntryByDate(date) {
        const entries = await this.getMoodEntries(date, date);
        return entries.find(entry => entry.mood_date === date);
    }
}

// MoodApi is available globally via window.MoodApi
if (typeof window !== 'undefined') {
    window.MoodApi = MoodApi;
}
