


class GratitudeController {
    constructor(apiClient) {
        this.api = new GratitudeApi(apiClient);
        this.ui = new GratitudeUI();
        this.currentEntryId = null;
        this.initialize();
    }

    // Initialize the controller
    async initialize() {
        console.log('GratitudeController initialized');
        await this.loadGratitudeData();
        this.ui.bindNavigationEvents();
    }

    // Load initial gratitude data
    async loadGratitudeData() {
        this.ui.showLoading();
        try {
            // Load today's gratitude and recent entries in parallel
            const [todayEntry, recentEntries] = await Promise.all([
                this.api.getTodayGratitude().catch(() => null), // Handle no entry gracefully
                this.api.getGratitudeEntries(null, null, 10)
            ]);

            this.ui.renderTodayGratitude(todayEntry);
            this.ui.renderGratitudeEntries(recentEntries);

            // Load gratitude insights for analytics
            const insights = await this.api.getGratitudeInsights();
            this.ui.renderGratitudeStats(insights);

        } catch (error) {
            console.error('Error loading gratitude data:', error);
            this.ui.showError('Failed to load gratitude data');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Load today's gratitude entry
    async loadTodayGratitude() {
        this.ui.showLoading();
        try {
            const todayEntry = await this.api.getTodayGratitude();
            this.ui.renderTodayGratitude(todayEntry);
        } catch (error) {
            // No entry for today is not an error, just show empty state
            if (error.message && error.message.includes('No gratitude entry for today')) {
                this.ui.renderTodayGratitude(null);
            } else {
                console.error('Error loading today\'s gratitude:', error);
                this.ui.showError('Failed to load today\'s gratitude');
            }
        } finally {
            this.ui.hideLoading();
        }
    }

    // Load gratitude entries history
    async loadGratitudeEntries(startDate = null, endDate = null, limit = 10) {
        this.ui.showLoading();
        try {
            const entries = await this.api.getGratitudeEntries(startDate, endDate, limit);
            this.ui.renderGratitudeEntries(entries);
        } catch (error) {
            console.error('Error loading gratitude entries:', error);
            this.ui.showError('Failed to load gratitude entries');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Load AI-generated gratitude prompts
    async loadGratitudePrompts(params = {}) {
        this.ui.showLoading();
        try {
            const prompts = await this.api.getGratitudePrompts(params);
            this.ui.renderGratitudePrompts(prompts);

            // Also load achievement-based prompts if available
            const achievementPrompts = await this.api.getAchievementBasedPrompts();
            if (achievementPrompts && achievementPrompts.length > 0) {
                this.ui.renderAchievementGratitudePrompts(achievementPrompts);
            }
        } catch (error) {
            console.error('Error loading gratitude prompts:', error);
            this.ui.showError('Failed to load gratitude prompts');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Load gratitude statistics
    async loadGratitudeStats(days = 30) {
        this.ui.showLoading();
        try {
            const stats = await this.api.getGratitudeStats(days);
            this.ui.renderGratitudeStats(stats);
        } catch (error) {
            console.error('Error loading gratitude stats:', error);
            this.ui.showError('Failed to load gratitude statistics');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Create a new gratitude entry
    async createGratitudeEntry(data) {
        // Validate required fields
        if (!data.gratitude_date) {
            this.ui.showError('Date is required');
            return;
        }

        if (!data.response || data.response.trim().length === 0) {
            this.ui.showError('Gratitude response is required');
            return;
        }

        // Validate mood values if provided
        if (data.mood_before !== null && (data.mood_before < 1 || data.mood_before > 10)) {
            this.ui.showError('Mood before must be between 1 and 10');
            return;
        }

        if (data.mood_after !== null && (data.mood_after < 1 || data.mood_after > 10)) {
            this.ui.showError('Mood after must be between 1 and 10');
            return;
        }

        this.ui.showLoading();
        try {
            const newEntry = await this.api.createGratitudeEntry(data);
            this.ui.showSuccess('Gratitude entry created successfully');
            this.ui.hideGratitudeModal();
            await this.loadGratitudeData(); // Refresh all data
            return newEntry;
        } catch (error) {
            console.error('Error creating gratitude entry:', error);
            this.ui.showError('Failed to create gratitude entry');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Update an existing gratitude entry
    async updateGratitudeEntry(id, data) {
        // Same validation as create
        if (!data.gratitude_date) {
            this.ui.showError('Date is required');
            return;
        }

        if (!data.response || data.response.trim().length === 0) {
            this.ui.showError('Gratitude response is required');
            return;
        }

        if (data.mood_before !== null && (data.mood_before < 1 || data.mood_before > 10)) {
            this.ui.showError('Mood before must be between 1 and 10');
            return;
        }

        if (data.mood_after !== null && (data.mood_after < 1 || data.mood_after > 10)) {
            this.ui.showError('Mood after must be between 1 and 10');
            return;
        }

        this.ui.showLoading();
        try {
            const updatedEntry = await this.api.updateGratitudeEntry(id, data);
            this.ui.showSuccess('Gratitude entry updated successfully');
            this.ui.hideGratitudeModal();
            await this.loadGratitudeData(); // Refresh all data
            return updatedEntry;
        } catch (error) {
            console.error('Error updating gratitude entry:', error);
            this.ui.showError('Failed to update gratitude entry');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Delete a gratitude entry
    async deleteGratitudeEntry(id) {
        if (!confirm('Are you sure you want to delete this gratitude entry? This action cannot be undone.')) {
            return;
        }

        this.ui.showLoading();
        try {
            await this.api.deleteGratitudeEntry(id);
            this.ui.showSuccess('Gratitude entry deleted successfully');
            await this.loadGratitudeData(); // Refresh all data
        } catch (error) {
            console.error('Error deleting gratitude entry:', error);
            this.ui.showError('Failed to delete gratitude entry');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Edit a gratitude entry
    async editGratitudeEntry(id) {
        this.ui.showLoading();
        try {
            // Find the entry in current data or fetch it
            let entry = null;
            if (this.currentEntries) {
                entry = this.currentEntries.find(e => e.id === id);
            }

            if (!entry) {
                // Fetch from API if not in current data
                entry = await this.api.getGratitudeEntries(null, null, 1, null, id);
                entry = entry.find(e => e.id === id);
            }

            if (entry) {
                this.currentEntryId = id;
                this.ui.setGratitudeFormData(entry);
                this.ui.showGratitudeModal(id);
            } else {
                this.ui.showError('Gratitude entry not found');
            }
        } catch (error) {
            console.error('Error loading gratitude entry:', error);
            this.ui.showError('Failed to load gratitude entry');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Show gratitude modal
    showGratitudeModal(entryId = null) {
        this.currentEntryId = entryId;
        this.ui.showGratitudeModal(entryId);
    }

    // Handle gratitude form submission
    async handleGratitudeSubmit(formData) {
        try {
            if (this.currentEntryId) {
                await this.updateGratitudeEntry(this.currentEntryId, formData);
            } else {
                await this.createGratitudeEntry(formData);
            }
        } catch (error) {
            console.error('Error handling gratitude submission:', error);
            this.ui.showError('Failed to save gratitude entry');
        }
    }

    // Use a gratitude prompt
    useGratitudePrompt(prompt) {
        if (this.ui.elements.gratitudePrompt) {
            this.ui.elements.gratitudePrompt.value = prompt;
        }
        this.ui.showGratitudeModal();
    }

    // Get positive reframing for a challenge
    async getPositiveReframing(challenge) {
        this.ui.showLoading();
        try {
            const reframing = await this.api.getPositiveReframing(challenge);
            this.ui.showSuccess('Positive reframing generated');
            return reframing;
        } catch (error) {
            console.error('Error getting positive reframing:', error);
            this.ui.showError('Failed to generate positive reframing');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Get personalized encouragement
    async getEncouragement() {
        this.ui.showLoading();
        try {
            const encouragement = await this.api.getEncouragement();
            this.ui.showSuccess('Encouragement received');
            return encouragement;
        } catch (error) {
            console.error('Error getting encouragement:', error);
            this.ui.showError('Failed to get encouragement');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Get gratitude entries by category
    async getGratitudeEntriesByCategory(category) {
        this.ui.showLoading();
        try {
            const entries = await this.api.getGratitudeEntriesByCategory(category);
            this.ui.renderGratitudeEntries(entries);
        } catch (error) {
            console.error('Error loading entries by category:', error);
            this.ui.showError('Failed to load entries by category');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Get gratitude entries by mood range
    async getGratitudeEntriesByMoodRange(minMood, maxMood) {
        this.ui.showLoading();
        try {
            const entries = await this.api.getGratitudeEntriesByMoodRange(minMood, maxMood);
            this.ui.renderGratitudeEntries(entries);
        } catch (error) {
            console.error('Error loading entries by mood range:', error);
            this.ui.showError('Failed to load entries by mood range');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Get recent gratitude entries
    async getRecentGratitudeEntries(days = 7) {
        this.ui.showLoading();
        try {
            const entries = await this.api.getRecentGratitudeEntries(days);
            this.ui.renderGratitudeEntries(entries);
        } catch (error) {
            console.error('Error loading recent entries:', error);
            this.ui.showError('Failed to load recent entries');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Get gratitude insights and analytics
    async getGratitudeInsights() {
        this.ui.showLoading();
        try {
            const insights = await this.api.getGratitudeInsights();
            this.ui.renderGratitudeStats(insights);
            return insights;
        } catch (error) {
            console.error('Error loading gratitude insights:', error);
            this.ui.showError('Failed to load gratitude insights');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Export gratitude data
    async exportGratitudeData() {
        try {
            const entries = await this.api.getGratitudeEntries(null, null, 1000);
            const insights = await this.api.getGratitudeInsights();

            const exportData = {
                generated_at: new Date().toISOString(),
                summary: {
                    total_entries: entries.length,
                    date_range: entries.length > 0 ? {
                        earliest: entries[entries.length - 1]?.gratitude_date,
                        latest: entries[0]?.gratitude_date
                    } : null,
                    categories: [...new Set(entries.map(e => e.category).filter(Boolean))],
                    average_mood_improvement: insights.stats.average_mood_improvement || 0
                },
                entries: entries,
                insights: insights
            };

            const content = JSON.stringify(exportData, null, 2);

            // Create download
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gratitude-journal-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.ui.showSuccess('Gratitude data exported successfully');
        } catch (error) {
            console.error('Error exporting gratitude data:', error);
            this.ui.showError('Failed to export gratitude data');
        }
    }

    // Refresh all data
    async refreshData() {
        await this.loadGratitudeData();
    }

    // Clean up resources
    cleanup() {
        this.ui.cleanup();
    }

    // Get current entry ID
    getCurrentEntryId() {
        return this.currentEntryId;
    }

    // Set current entry ID
    setCurrentEntryId(id) {
        this.currentEntryId = id;
    }
}


