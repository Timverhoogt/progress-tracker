class AchievementsController {
    constructor (apiClient, options = {}) {
        this.api = new AchievementsApi(apiClient);
        this.ui = new AchievementsUI();
        this.achievements = [];
        this.currentAchievementId = null;
        this._eventsBound = false;
        this._isInitializing = false;
        this._initializationPromise = null;

        if (this._shouldAutoInitialize(options.autoInitialize)) {
            this.initialize().catch(error => {
                console.error('AchievementsController auto-initialization failed:', error);
            });
        }
    }

    async initialize () {
        if (this._isInitializing) {
            return this._initializationPromise;
        }

        this._isInitializing = true;
        const initialization = (async () => {
            if (!this._eventsBound) {
                this.bindEvents();
                this._eventsBound = true;
            }
            await this.loadAchievements();
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

    bindEvents () {
        if (this._eventsBound) {
            return;
        }

        // Bind new achievement button
        this.ui.bindNewAchievementButton(() => this.showAchievementModal());

        // Bind form submission
        this.ui.bindFormSubmit((data) => this.handleSaveAchievement(data));

        // Bind achievement actions
        this.ui.bindAchievementActions(
            (achievementId) => this.editAchievement(achievementId),
            (achievementId) => this.completeAchievement(achievementId)
        );

        // Bind filters
        this.ui.bindStatusFilter(() => this.loadAchievements());
        this.ui.bindTypeFilter(() => this.loadAchievements());

        // Bind analysis buttons
        this.ui.bindStatsButton(() => this.showStats());
        this.ui.bindSuggestButton(() => this.showSuggestions());

        if (typeof this.ui.bindModalControls === 'function') {
            this.ui.bindModalControls();
        }
    }

    async loadAchievements () {
        this.ui.showLoading();
        try {
            const statusFilter = document.getElementById('achievementsStatusFilter');
            const typeFilter = document.getElementById('achievementsTypeFilter');

            const filters = {
                status: statusFilter?.value || '',
                type: typeFilter?.value || ''
            };

            this.achievements = await this.api.getAll(filters);
            this.ui.renderAchievements(this.achievements);
        } catch (error) {
            console.error('Error loading achievements:', error);
            this.ui.showMessage('Failed to load achievements', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    showAchievementModal (achievementId = null) {
        this.currentAchievementId = achievementId;

        if (achievementId) {
            const achievement = this.achievements.find(a => a.id === achievementId);
            if (achievement) {
                this.ui.showModal(achievement);
            }
        } else {
            this.ui.showModal();
        }
    }

    async handleSaveAchievement (data) {
        try {
            if (this.currentAchievementId) {
                await this.api.update(this.currentAchievementId, data);
                this.ui.showMessage('Achievement updated successfully!', 'success');
            } else {
                await this.api.create(data);
                this.ui.showMessage('Achievement added successfully!', 'success');
            }

            this.ui.hideModal();
            this.currentAchievementId = null;
            await this.loadAchievements();
        } catch (error) {
            console.error('Error saving achievement:', error);
            this.ui.showMessage('Failed to save achievement', 'error');
        }
    }

    editAchievement (achievementId) {
        this.showAchievementModal(achievementId);
    }

    async completeAchievement (achievementId) {
        try {
            await this.api.complete(achievementId);
            this.ui.showMessage('Achievement completed! 🎉', 'success');
            await this.loadAchievements();
        } catch (error) {
            console.error('Error completing achievement:', error);
            this.ui.showMessage('Failed to complete achievement', 'error');
        }
    }

    async showStats () {
        try {
            this.ui.showLoading();
            const stats = await this.api.getStats();
            // TODO: Render stats in a modal or dashboard
            console.log('Achievement stats:', stats);
            this.ui.showMessage('Stats loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading achievement stats:', error);
            this.ui.showMessage('Failed to load achievement statistics', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async showSuggestions () {
        try {
            this.ui.showLoading();
            const suggestions = await this.api.getSuggestions();
            // TODO: Render suggestions in a modal
            console.log('Achievement suggestions:', suggestions);
            this.ui.showMessage('Suggestions loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading achievement suggestions:', error);
            this.ui.showMessage('Failed to load achievement suggestions', 'error');
        } finally {
            this.ui.hideLoading();
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
}

// Make AchievementsController available globally
if (typeof window !== 'undefined') {
    window.AchievementsController = AchievementsController;
}
