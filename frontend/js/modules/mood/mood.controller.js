


class MoodController {
    constructor(apiClient) {
        this.api = new MoodApi(apiClient);
        this.ui = new MoodUI();
        this.currentTab = 'overview';
        this.initialize();
    }

    // Initialize the controller
    async initialize() {
        console.log('MoodController initialized');
        await this.loadMoodData();
        this.bindEvents();
        this.ui.bindNavigationEvents();
        this.ui.bindMoodScoreUpdates();
    }

    // Load initial mood data
    async loadMoodData() {
        this.ui.showLoading();
        try {
            // Load today's mood and recent entries in parallel
            const [todayMood, recentEntries] = await Promise.all([
                this.api.getTodayMood(),
                this.api.getMoodEntries(null, null, 10)
            ]);

            this.ui.renderTodayMood(todayMood);
            this.ui.renderMoodEntries(recentEntries);
        } catch (error) {
            console.error('Error loading mood data:', error);
            this.ui.showError('Failed to load mood data');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Create a new mood entry
    async createMoodEntry(data) {
        // Validate data
        if (!data.mood_score || data.mood_score < 1 || data.mood_score > 10) {
            this.ui.showError('Mood score must be between 1 and 10');
            return;
        }

        this.ui.showLoading();
        try {
            const newEntry = await this.api.createMoodEntry(data);
            this.ui.showSuccess('Mood entry created successfully');
            this.ui.hideMoodModal();
            await this.loadMoodData(); // Refresh the data
            return newEntry;
        } catch (error) {
            console.error('Failed to create mood entry:', error);
            this.ui.showError('Failed to create mood entry');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Update an existing mood entry
    async updateMoodEntry(date, data) {
        // Validate data
        if (!data.mood_score || data.mood_score < 1 || data.mood_score > 10) {
            this.ui.showError('Mood score must be between 1 and 10');
            return;
        }

        this.ui.showLoading();
        try {
            const updatedEntry = await this.api.updateMoodEntry(date, data);
            this.ui.showSuccess('Mood entry updated successfully');
            this.ui.hideMoodModal();
            await this.loadMoodData(); // Refresh the data
            return updatedEntry;
        } catch (error) {
            console.error('Failed to update mood entry:', error);
            this.ui.showError('Failed to update mood entry');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Delete a mood entry
    async deleteMoodEntry(date) {
        if (!confirm('Are you sure you want to delete this mood entry? This action cannot be undone.')) {
            return;
        }

        this.ui.showLoading();
        try {
            await this.api.deleteMoodEntry(date);
            this.ui.showSuccess('Mood entry deleted successfully');
            await this.loadMoodData(); // Refresh the data
        } catch (error) {
            console.error('Failed to delete mood entry:', error);
            this.ui.showError('Failed to delete mood entry');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Edit a mood entry
    async editMoodEntry(date) {
        try {
            const entry = await this.api.getMoodEntryByDate(date);
            if (entry) {
                this.ui.setFormData(entry);
                this.ui.showMoodModal(date);
            } else {
                this.ui.showError('Mood entry not found');
            }
        } catch (error) {
            console.error('Failed to load mood entry for editing:', error);
            this.ui.showError('Failed to load mood entry for editing');
        }
    }

    // Show mood modal
    showMoodModal(editDate = null) {
        this.ui.showMoodModal(editDate);
    }

    // Handle form submission
    async handleFormSubmission(data, editDate) {
        if (editDate) {
            await this.updateMoodEntry(editDate, data);
        } else {
            await this.createMoodEntry(data);
        }
    }

    // Handle mood statistics request
    async handleStatsRequest() {
        this.ui.showLoading();
        try {
            const stats = await this.api.getMoodStats(30);
            this.ui.renderMoodStats(stats);
        } catch (error) {
            console.error('Error loading mood stats:', error);
            this.ui.showError('Failed to load mood statistics');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Handle mood patterns request
    async handlePatternsRequest() {
        this.ui.showLoading();
        try {
            const patterns = await this.api.getMoodPatterns(90);
            this.ui.renderMoodPatterns(patterns);
        } catch (error) {
            console.error('Error loading mood patterns:', error);
            this.ui.showError('Failed to load mood patterns');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Handle AI analysis request
    async handleAIAnalysisRequest() {
        this.ui.showLoading();
        try {
            const analysis = await this.api.getMoodAIAnalysis(90);
            this.ui.renderMoodAIAnalysis(analysis);
        } catch (error) {
            console.error('Error loading mood AI analysis:', error);
            this.ui.showError('Failed to load mood analysis');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Handle new mood entry request
    handleNewMoodRequest() {
        this.ui.showMoodModal();
    }

    // Handle mood edit request
    async handleEditRequest(date) {
        await this.editMoodEntry(date);
    }

    // Handle mood delete request
    async handleDeleteRequest(date) {
        await this.deleteMoodEntry(date);
    }

    // Bind UI events to controller actions
    bindEvents() {
        // Handle form submission
        this.ui.bindFormSubmission(async (data, editDate) => {
            await this.handleFormSubmission(data, editDate);
        });

        // Handle mood statistics
        this.ui.on('mood:stats', async () => {
            await this.handleStatsRequest();
        });

        // Handle mood patterns
        this.ui.on('mood:patterns', async () => {
            await this.handlePatternsRequest();
        });

        // Handle AI analysis
        this.ui.on('mood:ai-analysis', async () => {
            await this.handleAIAnalysisRequest();
        });

        // Handle new mood entry
        this.ui.on('mood:new', () => {
            this.handleNewMoodRequest();
        });

        // Handle mood editing
        this.ui.on('mood:edit', async (date) => {
            await this.handleEditRequest(date);
        });

        // Handle mood deletion
        this.ui.on('mood:delete', async (date) => {
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

    // Get current mood data (for other modules)
    async getCurrentMoodData() {
        try {
            const todayMood = await this.api.getTodayMood();
            const recentEntries = await this.api.getMoodEntries(null, null, 10);
            return {
                todayMood,
                recentEntries,
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error('Failed to get current mood data:', error);
            return null;
        }
    }

    // Get mood statistics (for other modules)
    async getMoodStats(days = 30) {
        try {
            return await this.api.getMoodStats(days);
        } catch (error) {
            console.error('Failed to get mood stats:', error);
            return null;
        }
    }

    // Refresh mood data
    async refresh() {
        await this.loadMoodData();
    }
}

