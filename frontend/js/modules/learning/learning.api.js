

class LearningApi {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Get learning path statistics
    async getLearningStats() {
        return await this.api.learning.getStats();
    }

    // Get learning recommendations
    async getLearningRecommendations() {
        return await this.api.learning.getRecommendations();
    }

    // Get learning paths with optional status filter
    async getLearningPaths(status = null) {
        return await this.api.learning.getPaths(status);
    }

    // Get specific learning path by ID
    async getLearningPath(id) {
        const paths = await this.api.learning.getPaths();
        return paths.find(path => path.id === id);
    }

    // Create a new learning path
    async createLearningPath(data) {
        return await this.api.learning.createPath(data);
    }

    // Update an existing learning path
    async updateLearningPath(id, data) {
        return await this.api.learning.updatePath(id, data);
    }

    // Delete a learning path
    async deleteLearningPath(id) {
        return await this.api.learning.deletePath(id);
    }

    // Update learning path progress
    async updateLearningProgress(id, progress) {
        return await this.api.learning.updateProgress(id, progress);
    }

    // Get best practices
    async getBestPractices(category = null) {
        return await this.api.learning.getBestPractices(category);
    }

    // Get best practice categories
    async getBestPracticeCategories() {
        const practices = await this.api.learning.getBestPractices();
        const categories = new Set(practices.map(p => p.category));
        return Array.from(categories);
    }

    // Create a new best practice
    async createBestPractice(data) {
        return await this.api.learning.createBestPractice(data);
    }

    // Update a best practice
    async updateBestPractice(id, data) {
        return await this.api.learning.updateBestPractice(id, data);
    }

    // Record usage of a best practice
    async useBestPractice(id) {
        return await this.api.learning.useBestPractice(id);
    }

    // Get learning paths by status
    async getActiveLearningPaths() {
        return await this.getLearningPaths('in_progress');
    }

    async getCompletedLearningPaths() {
        return await this.getLearningPaths('completed');
    }

    async getPausedLearningPaths() {
        return await this.getLearningPaths('paused');
    }

    // Get learning paths by skill focus
    async getLearningPathsBySkill(skill) {
        const allPaths = await this.getLearningPaths();
        return allPaths.filter(path => path.skill_focus === skill);
    }

    // Get learning paths by difficulty
    async getLearningPathsByDifficulty(difficulty) {
        const allPaths = await this.getLearningPaths();
        return allPaths.filter(path => path.difficulty_level === difficulty);
    }

    // Calculate learning statistics
    calculateLearningStats(paths) {
        if (!paths || paths.length === 0) {
            return {
                total_paths: 0,
                completed_paths: 0,
                active_paths: 0,
                avg_progress: 0,
                total_estimated_hours: 0,
                by_difficulty: [],
                recent_activity: []
            };
        }

        const totalPaths = paths.length;
        const completedPaths = paths.filter(path => path.status === 'completed').length;
        const activePaths = paths.filter(path => path.status === 'in_progress').length;
        const avgProgress = paths.reduce((sum, path) => sum + (path.progress_percentage || 0), 0) / totalPaths;
        const totalEstimatedHours = paths.reduce((sum, path) => sum + (path.estimated_duration_hours || 0), 0);

        // Group by difficulty
        const byDifficulty = paths.reduce((acc, path) => {
            const difficulty = path.difficulty_level || 'beginner';
            if (!acc[difficulty]) {
                acc[difficulty] = { difficulty, count: 0, paths: [] };
            }
            acc[difficulty].count++;
            acc[difficulty].paths.push(path);
            return acc;
        }, {});

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentActivity = paths
            .filter(path => {
                const updatedDate = new Date(path.updated_at || path.created_at);
                return updatedDate >= thirtyDaysAgo;
            })
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
            .slice(0, 10);

        return {
            total_paths: totalPaths,
            completed_paths: completedPaths,
            active_paths: activePaths,
            avg_progress: Math.round(avgProgress),
            total_estimated_hours: totalEstimatedHours,
            by_difficulty: Object.values(byDifficulty),
            recent_activity: recentActivity
        };
    }

    // Get skill gaps analysis
    async getSkillGapsAnalysis() {
        const paths = await this.getLearningPaths();
        const completedPaths = paths.filter(path => path.status === 'completed');

        // Analyze skill distribution
        const skillDistribution = paths.reduce((acc, path) => {
            const skill = path.skill_focus;
            if (!acc[skill]) {
                acc[skill] = {
                    skill,
                    total_paths: 0,
                    completed_paths: 0,
                    avg_progress: 0
                };
            }
            acc[skill].total_paths++;
            if (path.status === 'completed') {
                acc[skill].completed_paths++;
            }
            return acc;
        }, {});

        // Calculate skill gaps
        const skillGaps = Object.values(skillDistribution).map(skillData => {
            const completionRate = skillData.total_paths > 0 ?
                (skillData.completed_paths / skillData.total_paths) * 100 : 0;

            return {
                ...skillData,
                completion_rate: Math.round(completionRate),
                gap_percentage: 100 - completionRate,
                needs_attention: completionRate < 50
            };
        });

        return {
            skill_distribution: Object.values(skillDistribution),
            skill_gaps: skillGaps.filter(gap => gap.needs_attention),
            overall_completion: completedPaths.length / paths.length * 100
        };
    }

    // Get learning progress trends
    async getLearningProgressTrends(days = 30) {
        const paths = await this.getLearningPaths();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentPaths = paths.filter(path => {
            const createdDate = new Date(path.created_at);
            return createdDate >= cutoffDate;
        });

        // Group by day
        const dailyProgress = {};
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];

            dailyProgress[dateKey] = {
                date: dateKey,
                paths_created: 0,
                paths_completed: 0,
                progress_updates: 0
            };
        }

        // Populate with actual data
        recentPaths.forEach(path => {
            const createdDate = new Date(path.created_at).toISOString().split('T')[0];
            if (dailyProgress[createdDate]) {
                dailyProgress[createdDate].paths_created++;
            }

            if (path.status === 'completed') {
                const completedDate = new Date(path.updated_at || path.created_at).toISOString().split('T')[0];
                if (dailyProgress[completedDate]) {
                    dailyProgress[completedDate].paths_completed++;
                }
            }
        });

        return {
            daily_progress: Object.values(dailyProgress),
            total_created: recentPaths.length,
            total_completed: recentPaths.filter(path => path.status === 'completed').length,
            trend_data: this.calculateTrendData(Object.values(dailyProgress))
        };
    }

    // Calculate trend data for visualization
    calculateTrendData(dailyData) {
        const createdTrend = dailyData.map(day => ({
            date: day.date,
            value: day.paths_created,
            type: 'created'
        }));

        const completedTrend = dailyData.map(day => ({
            date: day.date,
            value: day.paths_completed,
            type: 'completed'
        }));

        return {
            created: createdTrend,
            completed: completedTrend,
            net_progress: createdTrend.map((day, index) => ({
                date: day.date,
                value: day.value - (completedTrend[index]?.value || 0)
            }))
        };
    }

    // Get personalized learning recommendations based on current progress
    async getPersonalizedRecommendations() {
        try {
            const [stats, paths, skillGaps] = await Promise.all([
                this.getLearningStats(),
                this.getLearningPaths(),
                this.getSkillGapsAnalysis()
            ]);

            const recommendations = [];

            // Recommend based on skill gaps
            skillGaps.skill_gaps.forEach(gap => {
                recommendations.push({
                    type: 'skill_gap',
                    priority: 'high',
                    title: `Improve ${gap.skill}`,
                    description: `Focus on ${gap.skill} skills. You have ${Math.round(gap.gap_percentage)}% of learning paths to complete.`,
                    action: `Create learning paths for ${gap.skill}`,
                    estimated_time: '2-4 weeks'
                });
            });

            // Recommend based on low progress paths
            const lowProgressPaths = paths
                .filter(path => path.progress_percentage < 25 && path.status === 'in_progress')
                .slice(0, 3);

            lowProgressPaths.forEach(path => {
                recommendations.push({
                    type: 'low_progress',
                    priority: 'medium',
                    title: `Resume ${path.path_name}`,
                    description: `Your learning path "${path.path_name}" is only ${path.progress_percentage}% complete.`,
                    action: 'Update progress or review learning materials',
                    estimated_time: '1-2 hours'
                });
            });

            // Recommend based on difficulty progression
            const beginnerPaths = paths.filter(path => path.difficulty_level === 'beginner');
            const intermediatePaths = paths.filter(path => path.difficulty_level === 'intermediate');
            const advancedPaths = paths.filter(path => path.difficulty_level === 'advanced');

            if (beginnerPaths.filter(p => p.status === 'completed').length > 2 &&
                intermediatePaths.length === 0) {
                recommendations.push({
                    type: 'progression',
                    priority: 'medium',
                    title: 'Level up your learning',
                    description: 'You\'ve completed several beginner paths. Ready for intermediate challenges?',
                    action: 'Create intermediate difficulty learning paths',
                    estimated_time: '4-8 weeks'
                });
            }

            return {
                recommendations: recommendations.slice(0, 5), // Top 5 recommendations
                stats,
                skill_gaps: skillGaps.skill_gaps.slice(0, 3) // Top 3 skill gaps
            };
        } catch (error) {
            console.error('Error generating personalized recommendations:', error);
            return {
                recommendations: [],
                error: 'Failed to generate recommendations'
            };
        }
    }
}

// LearningApi is available globally via window.LearningApi
if (typeof window !== 'undefined') {
    window.LearningApi = LearningApi;
}
