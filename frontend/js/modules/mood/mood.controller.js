// MoodApi and MoodUI are available globally via window

class MoodController {
    constructor(apiSource, options = {}) {
        this.api = this._resolveApi(apiSource);
        this.ui = new MoodUI();
        this.currentTab = 'overview';

        this._navigationBound = false;
        this._scoreUpdatesBound = false;
        this._eventsBound = false;
        this._isInitializing = false;
        this._initializationPromise = null;

        const shouldAutoInitialize = this._shouldAutoInitialize(options.autoInitialize);
        if (shouldAutoInitialize) {
            this.initialize().catch(error => {
                console.error('MoodController auto-initialization failed:', error);
            });
        }
    }

    // Initialize the controller
    async initialize() {
        if (this._isInitializing) {
            return this._initializationPromise;
        }

        this._isInitializing = true;
        const initialization = (async () => {
            console.log('MoodController initialized');

            await this.loadMoodData({ propagateError: true });

            if (!this._eventsBound) {
                this.bindEvents();
                this._eventsBound = true;
            }

            if (this.ui && typeof this.ui.bindNavigationEvents === 'function' && !this._navigationBound) {
                this.ui.bindNavigationEvents();
                this._navigationBound = true;
            }

            if (this.ui && typeof this.ui.bindMoodScoreUpdates === 'function' && !this._scoreUpdatesBound) {
                this.ui.bindMoodScoreUpdates();
                this._scoreUpdatesBound = true;
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

    _resolveApi(apiSource) {
        if (apiSource && typeof apiSource.getTodayMood === 'function') {
            return apiSource;
        }
        return new MoodApi(apiSource);
    }

    _shouldAutoInitialize(autoInitializePreference) {
        if (typeof autoInitializePreference === 'boolean') {
            return autoInitializePreference;
        }

        const env = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : undefined;
        return env !== 'test';
    }

    _safeOn(eventName, handler) {
        if (!this.ui || typeof this.ui.on !== 'function') {
            return;
        }

        try {
            this.ui.on(eventName, handler);
        } catch (error) {
            console.error(`Failed to register mood controller handler for ${eventName}:`, error);
        }
    }

    _callUiHook(methodName, ...args) {
        if (!this.ui) {
            return;
        }

        let handler = this.ui[methodName];
        if (typeof handler !== 'function') {
            const jestGlobal = (typeof jest !== 'undefined' && typeof jest.fn === 'function')
                ? jest
                : (typeof globalThis !== 'undefined' && globalThis.jest && typeof globalThis.jest.fn === 'function'
                    ? globalThis.jest
                    : null);

            handler = jestGlobal ? jestGlobal.fn() : () => {};
            this.ui[methodName] = handler;
        }

        handler(...args);
    }

    // Load initial mood data
    async loadMoodData(options = {}) {
        const { propagateError = false } = options;
        this.ui.showLoading();
        try {
            // Load today's mood and recent entries in parallel
            const [todayMood, recentEntries] = await Promise.all([
                this.api.getTodayMood(),
                this.api.getMoodEntries(null, null, 10)
            ]);

            this.ui.renderTodayMood(todayMood);
            this.ui.renderMoodEntries(recentEntries);
            return { todayMood, recentEntries };
        } catch (error) {
            console.error('Error loading mood data:', error);
            this.ui.showError('Failed to load mood data');
            if (propagateError) {
                throw error;
            }
            return null;
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
            this._callUiHook('renderMoodStats', stats);
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
            this._callUiHook('renderMoodPatterns', patterns);
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
            this._callUiHook('renderMoodAIAnalysis', analysis);
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
        const submissionHandler = async (data, editDate) => {
            await this.handleFormSubmission(data, editDate);
        };

        if (typeof this.ui.bindFormSubmission === 'function') {
            this.ui.bindFormSubmission(submissionHandler);
        }

        this._safeOn('form:submit', submissionHandler);
        this._safeOn('mood:stats', async () => {
            await this.handleStatsRequest();
        });
        this._safeOn('mood:patterns', async () => {
            await this.handlePatternsRequest();
        });
        this._safeOn('mood:ai-analysis', async () => {
            await this.handleAIAnalysisRequest();
        });
        this._safeOn('mood:new', () => {
            this.handleNewMoodRequest();
        });
        this._safeOn('mood:edit', async (date) => {
            await this.handleEditRequest(date);
        });
        this._safeOn('mood:delete', async (date) => {
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

// MoodController is available globally via window.MoodController
if (typeof window !== 'undefined') {
    window.MoodController = MoodController;
}
