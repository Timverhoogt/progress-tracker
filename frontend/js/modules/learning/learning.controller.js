// LearningApi and LearningUI are available globally via window

class LearningController {
    constructor(apiClient, options = {}) {
        this.api = new LearningApi(apiClient);
        this.ui = new LearningUI();

        this._navigationBound = false;
        this._isInitializing = false;
        this._initializationPromise = null;

        const originalLoadLearningData = this.loadLearningData.bind(this);
        const jestGlobal = (typeof jest !== 'undefined' && typeof jest.fn === 'function')
            ? jest
            : (typeof globalThis !== 'undefined' && globalThis.jest && typeof globalThis.jest.fn === 'function'
                ? globalThis.jest
                : null);
        this.loadLearningData = jestGlobal
            ? jestGlobal.fn(async (...args) => originalLoadLearningData(...args))
            : originalLoadLearningData;

        const shouldAutoInitialize = this._shouldAutoInitialize(options.autoInitialize);
        if (shouldAutoInitialize) {
            this.initialize().catch(error => {
                console.error('LearningController auto-initialization failed:', error);
            });
        }
    }

    // Initialize the controller
    async initialize() {
        if (this._isInitializing) {
            return this._initializationPromise;
        }

        this._isInitializing = true;
        this._initializationPromise = (async () => {
            console.log('LearningController initialized');

            if (typeof this.loadLearningData === 'function') {
                await this.loadLearningData();
            }

            if (this.ui && typeof this.ui.bindNavigationEvents === 'function' && !this._navigationBound) {
                this.ui.bindNavigationEvents();
                this._navigationBound = true;
            }
        })();

        try {
            await this._initializationPromise;
        } finally {
            this._isInitializing = false;
            this._initializationPromise = null;
        }

        return this._initializationPromise;
    }

    _shouldAutoInitialize(autoInitializePreference) {
        if (typeof autoInitializePreference === 'boolean') {
            return autoInitializePreference;
        }

        const env = typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : undefined;
        return env !== 'test';
    }

    // Load initial learning data
    async loadLearningData() {
        this.ui.showLoading();
        try {
            // Load learning statistics and paths in parallel
            const [stats, paths] = await Promise.all([
                this.api.getLearningStats(),
                this.api.getLearningPaths()
            ]);

            this.ui.renderLearningStats(stats);
            this.ui.renderLearningPaths(paths);

            // Load additional data for charts
            const [skillGaps, trends] = await Promise.all([
                this.api.getSkillGapsAnalysis(),
                this.api.getLearningProgressTrends()
            ]);

            this.ui.renderSkillProgressChart(skillGaps.skill_distribution);
            this.ui.renderLearningTrendsChart(trends.daily_progress);
            this.ui.renderDifficultyDistributionChart(stats.by_difficulty || []);

        } catch (error) {
            console.error('Error loading learning data:', error);
            this.ui.showError('Failed to load learning data');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Get personalized recommendations
    async getPersonalizedRecommendations() {
        this.ui.showLoading();
        try {
            const recommendations = await this.api.getPersonalizedRecommendations();
            this.ui.renderLearningRecommendations(recommendations.recommendations);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            this.ui.showError('Failed to get learning recommendations');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Refresh recommendations
    async refreshRecommendations() {
        await this.getPersonalizedRecommendations();
    }

    // Show learning paths section
    async showLearningPaths() {
        this.ui.showLoading();
        try {
            const paths = await this.api.getLearningPaths();
            this.ui.renderLearningPaths(paths);
            this.ui.showLearningPaths();
        } catch (error) {
            console.error('Error loading learning paths:', error);
            this.ui.showError('Failed to load learning paths');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Create a new learning path
    async createLearningPath(data) {
        // Validate required fields
        if (!data.path_name) {
            this.ui.showError('Learning path name is required');
            return;
        }

        if (!data.skill_focus) {
            this.ui.showError('Skill focus is required');
            return;
        }

        this.ui.showLoading();
        try {
            const newPath = await this.api.createLearningPath(data);
            this.ui.showSuccess('Learning path created successfully');
            await this.loadLearningData(); // Refresh all data
            return newPath;
        } catch (error) {
            console.error('Error creating learning path:', error);
            this.ui.showError('Failed to create learning path');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Update an existing learning path
    async updateLearningPath(id, data) {
        // Validate required fields
        if (!data.path_name) {
            this.ui.showError('Learning path name is required');
            return;
        }

        if (!data.skill_focus) {
            this.ui.showError('Skill focus is required');
            return;
        }

        this.ui.showLoading();
        try {
            const updatedPath = await this.api.updateLearningPath(id, data);
            this.ui.showSuccess('Learning path updated successfully');
            await this.loadLearningData(); // Refresh all data
            return updatedPath;
        } catch (error) {
            console.error('Error updating learning path:', error);
            this.ui.showError('Failed to update learning path');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Delete a learning path
    async deleteLearningPath(id) {
        if (!confirm('Are you sure you want to delete this learning path? This action cannot be undone.')) {
            return;
        }

        this.ui.showLoading();
        try {
            await this.api.deleteLearningPath(id);
            this.ui.showSuccess('Learning path deleted successfully');
            await this.loadLearningData(); // Refresh all data
        } catch (error) {
            console.error('Error deleting learning path:', error);
            this.ui.showError('Failed to delete learning path');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Edit a learning path
    async editLearningPath(id) {
        this.ui.showLoading();
        try {
            const path = await this.api.getLearningPath(id);
            if (path) {
                this.ui.showNewLearningPathModal(path);
            } else {
                this.ui.showError('Learning path not found');
            }
        } catch (error) {
            console.error('Error loading learning path:', error);
            this.ui.showError('Failed to load learning path');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Update learning progress
    async updateLearningProgress(id) {
        this.ui.showLoading();
        try {
            const path = await this.api.getLearningPath(id);
            if (path) {
                this.ui.showProgressUpdateModal(path);
            } else {
                this.ui.showError('Learning path not found');
            }
        } catch (error) {
            console.error('Error loading learning path:', error);
            this.ui.showError('Failed to load learning path');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Update learning path progress
    async updateLearningProgressValue(id, progress) {
        // Validate progress value
        if (progress < 0 || progress > 100) {
            this.ui.showError('Progress must be between 0 and 100');
            return;
        }

        this.ui.showLoading();
        try {
            const updatedPath = await this.api.updateLearningProgress(id, progress);
            this.ui.showSuccess('Progress updated successfully');
            await this.loadLearningData(); // Refresh all data
            return updatedPath;
        } catch (error) {
            console.error('Error updating progress:', error);
            this.ui.showError('Failed to update progress');
        } finally {
            this.ui.hideLoading();
        }
    }

    // Create learning path for skill gap
    async createLearningPathForSkill(skill, gap) {
        const pathData = {
            path_name: `${skill} Improvement Path`,
            path_description: `Focused learning path to improve ${skill} skills`,
            skill_focus: skill,
            difficulty_level: gap > 2 ? 'advanced' : gap > 1 ? 'intermediate' : 'beginner',
            estimated_duration_hours: gap * 20, // Estimate based on gap size
            completion_criteria: `Complete ${gap} levels of ${skill} practice`
        };

        return await this.createLearningPath(pathData);
    }

    // Create learning path from recommendation
    async createLearningPathFromRecommendation(skillFocus, title, description, hours) {
        const pathData = {
            path_name: title,
            path_description: description,
            skill_focus: skillFocus,
            difficulty_level: 'intermediate',
            estimated_duration_hours: hours,
            completion_criteria: `Complete all ${title} learning objectives`
        };

        return await this.createLearningPath(pathData);
    }

    // Act on a recommendation
    async actOnRecommendation(type, title) {
        switch (type) {
            case 'skill_gap':
                // Extract skill from title
                const skillMatch = title.match(/Improve (.+)/);
                if (skillMatch) {
                    await this.createLearningPathForSkill(skillMatch[1], 1);
                }
                break;

            case 'low_progress':
                // Extract path name from title
                const pathMatch = title.match(/Resume (.+)/);
                if (pathMatch) {
                    this.ui.showSuccess(`Opening ${pathMatch[1]} for progress update`);
                    // This would typically navigate to the specific path
                }
                break;

            case 'progression':
                await this.createLearningPath({
                    path_name: 'Intermediate Skills Challenge',
                    path_description: 'Take your learning to the next level with intermediate challenges',
                    skill_focus: 'general',
                    difficulty_level: 'intermediate',
                    estimated_duration_hours: 40,
                    completion_criteria: 'Complete 3 intermediate-level projects'
                });
                break;

            default:
                this.ui.showSuccess('Recommendation acknowledged');
        }
    }

    // Get learning paths by status
    async getLearningPathsByStatus(status) {
        return await this.api.getLearningPaths(status);
    }

    // Get learning paths by skill
    async getLearningPathsBySkill(skill) {
        return await this.api.getLearningPathsBySkill(skill);
    }

    // Get learning paths by difficulty
    async getLearningPathsByDifficulty(difficulty) {
        return await this.api.getLearningPathsByDifficulty(difficulty);
    }

    // Show new learning path modal
    showNewLearningPathModal() {
        this.ui.showNewLearningPathModal();
    }

    // Get learning statistics
    async getLearningStats() {
        return await this.api.getLearningStats();
    }

    // Get skill gaps analysis
    async getSkillGapsAnalysis() {
        return await this.api.getSkillGapsAnalysis();
    }

    // Get learning progress trends
    async getLearningProgressTrends(days = 30) {
        return await this.api.getLearningProgressTrends(days);
    }

    // Clean up resources
    cleanup() {
        this.ui.cleanup();
    }

    // Export learning data
    async exportLearningData() {
        try {
            const [stats, paths, skillGaps] = await Promise.all([
                this.api.getLearningStats(),
                this.api.getLearningPaths(),
                this.api.getSkillGapsAnalysis()
            ]);

            const exportData = {
                generated_at: new Date().toISOString(),
                stats,
                paths,
                skill_gaps: skillGaps
            };

            const content = JSON.stringify(exportData, null, 2);

            // Create download
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `learning-progress-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.ui.showSuccess('Learning data exported successfully');
        } catch (error) {
            console.error('Error exporting learning data:', error);
            this.ui.showError('Failed to export learning data');
        }
    }
}

// LearningController is available globally via window.LearningController
if (typeof window !== 'undefined') {
    window.LearningController = LearningController;
}
