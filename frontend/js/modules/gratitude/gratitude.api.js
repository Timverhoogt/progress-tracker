

class GratitudeApi {
    constructor(apiClient) {
        this.api = apiClient;
    }

    // Get gratitude entries with optional filtering
    async getGratitudeEntries(startDate = null, endDate = null, limit = 10, category = null) {
        return await this.api.gratitude.getGratitudeEntries(startDate, endDate, limit, category);
    }

    // Get today's gratitude entry
    async getTodayGratitude() {
        return await this.api.gratitude.getTodayGratitude();
    }

    // Create a new gratitude entry
    async createGratitudeEntry(data) {
        return await this.api.gratitude.createGratitudeEntry(data);
    }

    // Update an existing gratitude entry
    async updateGratitudeEntry(id, data) {
        return await this.api.gratitude.updateGratitudeEntry(id, data);
    }

    // Delete a gratitude entry
    async deleteGratitudeEntry(id) {
        return await this.api.gratitude.deleteGratitudeEntry(id);
    }

    // Get AI-generated gratitude prompts
    async getGratitudePrompts(params = {}) {
        return await this.api.gratitude.getGratitudePrompts(params);
    }

    // Get achievement-based gratitude prompts
    async getAchievementBasedPrompts(days = 30) {
        return await this.api.gratitude.getAchievementBasedPrompts(days);
    }

    // Get positive reframing suggestions for challenges
    async getPositiveReframing(challenge) {
        return await this.api.gratitude.getPositiveReframing(challenge);
    }

    // Get personalized encouragement
    async getEncouragement() {
        return await this.api.gratitude.getEncouragement();
    }

    // Get gratitude statistics
    async getGratitudeStats(days = 30) {
        return await this.api.gratitude.getGratitudeStats(days);
    }

    // Get gratitude entries by date range
    async getGratitudeEntriesByDateRange(startDate, endDate) {
        return await this.api.gratitude.getGratitudeEntries(startDate, endDate);
    }

    // Get gratitude entries by category
    async getGratitudeEntriesByCategory(category) {
        return await this.api.gratitude.getGratitudeEntries(null, null, 100, category);
    }

    // Get gratitude entries by mood range
    async getGratitudeEntriesByMoodRange(minMood = 1, maxMood = 10) {
        const allEntries = await this.getGratitudeEntries(null, null, 1000);
        return allEntries.filter(entry => {
            const moodBefore = entry.mood_before;
            const moodAfter = entry.mood_after;
            return (moodBefore >= minMood && moodBefore <= maxMood) ||
                   (moodAfter >= minMood && moodAfter <= maxMood);
        });
    }

    // Get recent gratitude entries (last N days)
    async getRecentGratitudeEntries(days = 7) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        return await this.getGratitudeEntriesByDateRange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );
    }

    // Calculate gratitude statistics
    calculateGratitudeStats(entries, days = 30) {
        if (!entries || entries.length === 0) {
            return {
                total_entries: 0,
                days_with_gratitude: 0,
                average_mood_improvement: 0,
                most_common_category: null,
                longest_streak: 0,
                current_streak: 0,
                entries_by_category: {},
                mood_progression: [],
                weekly_patterns: {}
            };
        }

        const totalEntries = entries.length;

        // Calculate days with gratitude
        const uniqueDates = new Set(entries.map(entry => entry.gratitude_date));
        const daysWithGratitude = uniqueDates.size;

        // Calculate average mood improvement
        const moodImprovements = entries
            .filter(entry => entry.mood_before && entry.mood_after)
            .map(entry => entry.mood_after - entry.mood_before);

        const averageMoodImprovement = moodImprovements.length > 0
            ? moodImprovements.reduce((sum, improvement) => sum + improvement, 0) / moodImprovements.length
            : 0;

        // Find most common category
        const categoryCount = {};
        entries.forEach(entry => {
            const category = entry.category || 'general';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });

        const mostCommonCategory = Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

        // Calculate streaks
        const { longestStreak, currentStreak } = this.calculateStreaks(entries);

        // Group entries by category
        const entriesByCategory = entries.reduce((acc, entry) => {
            const category = entry.category || 'general';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(entry);
            return acc;
        }, {});

        // Calculate mood progression over time
        const moodProgression = this.calculateMoodProgression(entries);

        // Calculate weekly patterns
        const weeklyPatterns = this.calculateWeeklyPatterns(entries);

        return {
            total_entries: totalEntries,
            days_with_gratitude: daysWithGratitude,
            average_mood_improvement: Math.round(averageMoodImprovement * 10) / 10,
            most_common_category: mostCommonCategory,
            longest_streak: longestStreak,
            current_streak: currentStreak,
            entries_by_category: entriesByCategory,
            mood_progression: moodProgression,
            weekly_patterns: weeklyPatterns
        };
    }

    // Calculate gratitude streaks
    calculateStreaks(entries) {
        if (!entries || entries.length === 0) {
            return { longestStreak: 0, currentStreak: 0 };
        }

        // Sort entries by date
        const sortedEntries = entries.sort((a, b) =>
            new Date(b.gratitude_date) - new Date(a.gratitude_date)
        );

        let longestStreak = 0;
        let currentStreak = 0;
        let tempStreak = 1;

        // Check if there's an entry for today or yesterday to start current streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const mostRecentEntry = sortedEntries[0];
        const mostRecentDate = new Date(mostRecentEntry.gratitude_date);
        mostRecentDate.setHours(0, 0, 0, 0);

        if (mostRecentDate >= yesterday) {
            currentStreak = 1;
        }

        // Calculate longest streak
        for (let i = 1; i < sortedEntries.length; i++) {
            const currentDate = new Date(sortedEntries[i].gratitude_date);
            const previousDate = new Date(sortedEntries[i - 1].gratitude_date);

            const diffTime = Math.abs(previousDate - currentDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }

        longestStreak = Math.max(longestStreak, tempStreak);

        return { longestStreak, currentStreak };
    }

    // Calculate mood progression over time
    calculateMoodProgression(entries) {
        const entriesWithMood = entries
            .filter(entry => entry.mood_before && entry.mood_after)
            .sort((a, b) => new Date(a.gratitude_date) - new Date(b.gratitude_date));

        if (entriesWithMood.length === 0) {
            return [];
        }

        // Group by week
        const weeklyMood = {};
        entriesWithMood.forEach(entry => {
            const date = new Date(entry.gratitude_date);
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            if (!weeklyMood[weekKey]) {
                weeklyMood[weekKey] = {
                    week: weekKey,
                    entries: [],
                    avg_mood_before: 0,
                    avg_mood_after: 0,
                    mood_improvement: 0
                };
            }

            weeklyMood[weekKey].entries.push(entry);
        });

        // Calculate averages for each week
        return Object.values(weeklyMood).map(week => {
            const moodBefore = week.entries.map(e => e.mood_before).reduce((sum, val) => sum + val, 0) / week.entries.length;
            const moodAfter = week.entries.map(e => e.mood_after).reduce((sum, val) => sum + val, 0) / week.entries.length;

            return {
                week: week.week,
                avg_mood_before: Math.round(moodBefore * 10) / 10,
                avg_mood_after: Math.round(moodAfter * 10) / 10,
                mood_improvement: Math.round((moodAfter - moodBefore) * 10) / 10,
                entry_count: week.entries.length
            };
        }).slice(-12); // Last 12 weeks
    }

    // Calculate weekly patterns
    calculateWeeklyPatterns(entries) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const patterns = {};

        entries.forEach(entry => {
            const date = new Date(entry.gratitude_date);
            const dayOfWeek = dayNames[date.getDay()];

            if (!patterns[dayOfWeek]) {
                patterns[dayOfWeek] = {
                    day: dayOfWeek,
                    count: 0,
                    avg_mood_before: 0,
                    avg_mood_after: 0,
                    total_improvement: 0
                };
            }

            patterns[dayOfWeek].count++;

            if (entry.mood_before) {
                patterns[dayOfWeek].avg_mood_before += entry.mood_before;
            }
            if (entry.mood_after) {
                patterns[dayOfWeek].avg_mood_after += entry.mood_after;
            }
            if (entry.mood_before && entry.mood_after) {
                patterns[dayOfWeek].total_improvement += (entry.mood_after - entry.mood_before);
            }
        });

        // Calculate averages
        Object.values(patterns).forEach(day => {
            if (day.count > 0) {
                day.avg_mood_before = Math.round((day.avg_mood_before / day.count) * 10) / 10;
                day.avg_mood_after = Math.round((day.avg_mood_after / day.count) * 10) / 10;
                day.avg_improvement = Math.round((day.total_improvement / day.count) * 10) / 10;
            }
        });

        return patterns;
    }

    // Get gratitude insights and patterns
    async getGratitudeInsights() {
        try {
            const [entries, stats] = await Promise.all([
                this.getGratitudeEntries(null, null, 1000),
                this.getGratitudeStats(90)
            ]);

            const calculatedStats = this.calculateGratitudeStats(entries, 90);

            // Analyze patterns and insights
            const insights = {
                consistency: this.analyzeConsistency(entries),
                mood_patterns: this.analyzeMoodPatterns(entries),
                category_patterns: this.analyzeCategoryPatterns(entries),
                time_patterns: this.analyzeTimePatterns(entries),
                recommendations: this.generateRecommendations(calculatedStats, entries)
            };

            return {
                stats: calculatedStats,
                insights,
                raw_data: { entries, stats }
            };
        } catch (error) {
            console.error('Error generating gratitude insights:', error);
            return {
                stats: {},
                insights: {},
                error: 'Failed to generate gratitude insights'
            };
        }
    }

    // Analyze consistency patterns
    analyzeConsistency(entries) {
        const last30Days = [];
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const hasEntry = entries.some(entry => entry.gratitude_date === dateStr);
            last30Days.push({
                date: dateStr,
                has_entry: hasEntry,
                day_of_week: date.getDay()
            });
        }

        const entriesInLast30Days = last30Days.filter(day => day.has_entry).length;
        const consistencyRate = entriesInLast30Days / 30;

        return {
            last_30_days_entries: entriesInLast30Days,
            consistency_rate: Math.round(consistencyRate * 100),
            streak_info: this.calculateStreaks(entries),
            weekly_consistency: this.calculateWeeklyConsistency(last30Days)
        };
    }

    // Calculate weekly consistency
    calculateWeeklyConsistency(last30Days) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const weeklyData = {};

        last30Days.forEach(day => {
            const dayName = dayNames[day.day_of_week];
            if (!weeklyData[dayName]) {
                weeklyData[dayName] = { total: 0, with_entry: 0 };
            }
            weeklyData[dayName].total++;
            if (day.has_entry) {
                weeklyData[dayName].with_entry++;
            }
        });

        return Object.entries(weeklyData).map(([day, data]) => ({
            day,
            consistency_rate: Math.round((data.with_entry / data.total) * 100),
            entries: data.with_entry,
            total_days: data.total
        }));
    }

    // Analyze mood patterns
    analyzeMoodPatterns(entries) {
        const entriesWithMood = entries.filter(entry => entry.mood_before && entry.mood_after);

        if (entriesWithMood.length === 0) {
            return { average_improvement: 0, best_days: [], mood_distribution: {} };
        }

        const averageImprovement = entriesWithMood.reduce((sum, entry) => {
            return sum + (entry.mood_after - entry.mood_before);
        }, 0) / entriesWithMood.length;

        // Find best days for gratitude practice
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayImprovements = {};

        entriesWithMood.forEach(entry => {
            const date = new Date(entry.gratitude_date);
            const dayName = dayNames[date.getDay()];

            if (!dayImprovements[dayName]) {
                dayImprovements[dayName] = [];
            }
            dayImprovements[dayName].push(entry.mood_after - entry.mood_before);
        });

        const bestDays = Object.entries(dayImprovements)
            .map(([day, improvements]) => ({
                day,
                avg_improvement: improvements.reduce((sum, val) => sum + val, 0) / improvements.length
            }))
            .sort((a, b) => b.avg_improvement - a.avg_improvement);

        return {
            average_improvement: Math.round(averageImprovement * 10) / 10,
            best_days: bestDays,
            total_entries_with_mood: entriesWithMood.length
        };
    }

    // Analyze category patterns
    analyzeCategoryPatterns(entries) {
        const categoryStats = {};

        entries.forEach(entry => {
            const category = entry.category || 'general';
            if (!categoryStats[category]) {
                categoryStats[category] = {
                    count: 0,
                    total_mood_before: 0,
                    total_mood_after: 0,
                    avg_improvement: 0
                };
            }

            categoryStats[category].count++;

            if (entry.mood_before) {
                categoryStats[category].total_mood_before += entry.mood_before;
            }
            if (entry.mood_after) {
                categoryStats[category].total_mood_after += entry.mood_after;
            }
        });

        // Calculate averages
        Object.keys(categoryStats).forEach(category => {
            const stats = categoryStats[category];
            if (stats.count > 0) {
                stats.avg_mood_before = Math.round((stats.total_mood_before / stats.count) * 10) / 10;
                stats.avg_mood_after = Math.round((stats.total_mood_after / stats.count) * 10) / 10;
                stats.avg_improvement = Math.round((stats.avg_mood_after - stats.avg_mood_before) * 10) / 10;
            }
        });

        return categoryStats;
    }

    // Analyze time patterns
    analyzeTimePatterns(entries) {
        const timeStats = {
            morning: { count: 0, avg_improvement: 0 },
            afternoon: { count: 0, avg_improvement: 0 },
            evening: { count: 0, avg_improvement: 0 }
        };

        entries.forEach(entry => {
            if (!entry.mood_before || !entry.mood_after) return;

            const hour = new Date(entry.gratitude_date).getHours();
            let timeOfDay;

            if (hour < 12) timeOfDay = 'morning';
            else if (hour < 18) timeOfDay = 'afternoon';
            else timeOfDay = 'evening';

            timeStats[timeOfDay].count++;
            timeStats[timeOfDay].avg_improvement += (entry.mood_after - entry.mood_before);
        });

        // Calculate averages
        Object.keys(timeStats).forEach(timeOfDay => {
            const stats = timeStats[timeOfDay];
            if (stats.count > 0) {
                stats.avg_improvement = Math.round((stats.avg_improvement / stats.count) * 10) / 10;
            }
        });

        return timeStats;
    }

    // Generate personalized recommendations
    generateRecommendations(stats, entries) {
        const recommendations = [];

        // Consistency recommendations
        if (stats.consistency_rate < 50) {
            recommendations.push({
                type: 'consistency',
                priority: 'high',
                title: 'Build Daily Gratitude Practice',
                description: 'You\'ve practiced gratitude on ' + stats.consistency_rate + '% of days. Try setting a specific time each day.',
                action: 'Set a daily reminder for gratitude practice',
                expected_benefit: 'Improved mood and wellbeing'
            });
        }

        // Streak recommendations
        if (stats.current_streak === 0) {
            recommendations.push({
                type: 'streak',
                priority: 'medium',
                title: 'Start a Gratitude Streak',
                description: 'Begin practicing gratitude daily to build positive momentum.',
                action: 'Complete gratitude entry today',
                expected_benefit: 'Increased positive mindset'
            });
        }

        // Mood improvement recommendations
        if (stats.average_mood_improvement < 1) {
            recommendations.push({
                type: 'mood',
                priority: 'medium',
                title: 'Focus on Mood-Improving Gratitude',
                description: 'Your average mood improvement is ' + stats.average_mood_improvement + '. Try gratitude practices that focus on positive emotions.',
                action: 'Practice gratitude for things that bring joy',
                expected_benefit: 'Greater mood enhancement'
            });
        }

        // Category recommendations
        const topCategory = Object.entries(stats.entries_by_category)
            .sort(([,a], [,b]) => b.length - a.length)[0];

        if (topCategory && topCategory[1].length < 5) {
            recommendations.push({
                type: 'category',
                priority: 'low',
                title: 'Explore Different Gratitude Categories',
                description: 'You have ' + topCategory[1].length + ' entries in your most common category. Try exploring other areas.',
                action: 'Practice gratitude in new categories',
                expected_benefit: 'More comprehensive gratitude practice'
            });
        }

        return recommendations.slice(0, 5); // Top 5 recommendations
    }
}


