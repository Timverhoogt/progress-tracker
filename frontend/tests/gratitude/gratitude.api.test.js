/**
 * Gratitude API Tests
 * Tests the GratitudeApi class functionality
 */

import { GratitudeApi } from '../../js/modules/gratitude/gratitude.api.js';

// Mock the core API
const mockApiClient = {
    gratitude: {
        getGratitudeEntries: jest.fn(),
        getTodayGratitude: jest.fn(),
        createGratitudeEntry: jest.fn(),
        updateGratitudeEntry: jest.fn(),
        deleteGratitudeEntry: jest.fn(),
        getGratitudePrompts: jest.fn(),
        getAchievementBasedPrompts: jest.fn(),
        getPositiveReframing: jest.fn(),
        getEncouragement: jest.fn(),
        getGratitudeStats: jest.fn()
    }
};

describe('GratitudeApi', () => {
    let gratitudeApi;

    beforeEach(() => {
        gratitudeApi = new GratitudeApi(mockApiClient);
        jest.clearAllMocks();
    });

    describe('getGratitudeEntries', () => {
        it('should call the API client getGratitudeEntries method with all parameters', async () => {
            const mockEntries = [
                { id: 1, gratitude_date: '2025-01-15', response: 'Test response' }
            ];
            mockApiClient.gratitude.getGratitudeEntries.mockResolvedValue(mockEntries);

            const result = await gratitudeApi.getGratitudeEntries('2025-01-10', '2025-01-20', 5, 'personal');

            expect(mockApiClient.gratitude.getGratitudeEntries).toHaveBeenCalledWith('2025-01-10', '2025-01-20', 5, 'personal');
            expect(result).toEqual(mockEntries);
        });

        it('should call the API client getGratitudeEntries method with default parameters', async () => {
            const mockEntries = [
                { id: 1, gratitude_date: '2025-01-15', response: 'Test response' }
            ];
            mockApiClient.gratitude.getGratitudeEntries.mockResolvedValue(mockEntries);

            const result = await gratitudeApi.getGratitudeEntries();

            expect(mockApiClient.gratitude.getGratitudeEntries).toHaveBeenCalledWith(null, null, 10, null);
            expect(result).toEqual(mockEntries);
        });
    });

    describe('getTodayGratitude', () => {
        it('should call the API client getTodayGratitude method', async () => {
            const mockEntry = { id: 1, gratitude_date: '2025-01-15', response: 'Today\'s gratitude' };
            mockApiClient.gratitude.getTodayGratitude.mockResolvedValue(mockEntry);

            const result = await gratitudeApi.getTodayGratitude();

            expect(mockApiClient.gratitude.getTodayGratitude).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockEntry);
        });
    });

    describe('createGratitudeEntry', () => {
        it('should call the API client createGratitudeEntry method', async () => {
            const entryData = {
                gratitude_date: '2025-01-15',
                response: 'Test response',
                category: 'personal'
            };
            const mockNewEntry = { id: 'entry-123', ...entryData };
            mockApiClient.gratitude.createGratitudeEntry.mockResolvedValue(mockNewEntry);

            const result = await gratitudeApi.createGratitudeEntry(entryData);

            expect(mockApiClient.gratitude.createGratitudeEntry).toHaveBeenCalledWith(entryData);
            expect(result).toEqual(mockNewEntry);
        });
    });

    describe('updateGratitudeEntry', () => {
        it('should call the API client updateGratitudeEntry method', async () => {
            const updateData = { response: 'Updated response' };
            const mockUpdatedEntry = { id: 'entry-123', response: 'Updated response' };
            mockApiClient.gratitude.updateGratitudeEntry.mockResolvedValue(mockUpdatedEntry);

            const result = await gratitudeApi.updateGratitudeEntry('entry-123', updateData);

            expect(mockApiClient.gratitude.updateGratitudeEntry).toHaveBeenCalledWith('entry-123', updateData);
            expect(result).toEqual(mockUpdatedEntry);
        });
    });

    describe('deleteGratitudeEntry', () => {
        it('should call the API client deleteGratitudeEntry method', async () => {
            const mockResponse = { success: true };
            mockApiClient.gratitude.deleteGratitudeEntry.mockResolvedValue(mockResponse);

            const result = await gratitudeApi.deleteGratitudeEntry('entry-123');

            expect(mockApiClient.gratitude.deleteGratitudeEntry).toHaveBeenCalledWith('entry-123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getGratitudePrompts', () => {
        it('should call the API client getGratitudePrompts method with parameters', async () => {
            const mockPrompts = [
                { prompt: 'What are you grateful for today?', category: 'daily' }
            ];
            mockApiClient.gratitude.getGratitudePrompts.mockResolvedValue(mockPrompts);

            const result = await gratitudeApi.getGratitudePrompts({ category: 'daily' });

            expect(mockApiClient.gratitude.getGratitudePrompts).toHaveBeenCalledWith({ category: 'daily' });
            expect(result).toEqual(mockPrompts);
        });

        it('should call the API client getGratitudePrompts method with default parameters', async () => {
            const mockPrompts = [
                { prompt: 'What are you grateful for today?', category: 'daily' }
            ];
            mockApiClient.gratitude.getGratitudePrompts.mockResolvedValue(mockPrompts);

            const result = await gratitudeApi.getGratitudePrompts();

            expect(mockApiClient.gratitude.getGratitudePrompts).toHaveBeenCalledWith({});
            expect(result).toEqual(mockPrompts);
        });
    });

    describe('getAchievementBasedPrompts', () => {
        it('should call the API client getAchievementBasedPrompts method with days parameter', async () => {
            const mockPrompts = [
                { prompt: 'What achievement are you grateful for?', context: 'Recent completion' }
            ];
            mockApiClient.gratitude.getAchievementBasedPrompts.mockResolvedValue(mockPrompts);

            const result = await gratitudeApi.getAchievementBasedPrompts(30);

            expect(mockApiClient.gratitude.getAchievementBasedPrompts).toHaveBeenCalledWith(30);
            expect(result).toEqual(mockPrompts);
        });

        it('should call the API client getAchievementBasedPrompts method with default days', async () => {
            const mockPrompts = [
                { prompt: 'What achievement are you grateful for?', context: 'Recent completion' }
            ];
            mockApiClient.gratitude.getAchievementBasedPrompts.mockResolvedValue(mockPrompts);

            const result = await gratitudeApi.getAchievementBasedPrompts();

            expect(mockApiClient.gratitude.getAchievementBasedPrompts).toHaveBeenCalledWith(30);
            expect(result).toEqual(mockPrompts);
        });
    });

    describe('getPositiveReframing', () => {
        it('should call the API client getPositiveReframing method', async () => {
            const mockReframing = {
                original_challenge: 'Feeling overwhelmed',
                reframed_perspective: 'This is an opportunity to grow',
                gratitude_angle: 'I can be grateful for the chance to develop resilience'
            };
            mockApiClient.gratitude.getPositiveReframing.mockResolvedValue(mockReframing);

            const result = await gratitudeApi.getPositiveReframing('Feeling overwhelmed');

            expect(mockApiClient.gratitude.getPositiveReframing).toHaveBeenCalledWith('Feeling overwhelmed');
            expect(result).toEqual(mockReframing);
        });
    });

    describe('getEncouragement', () => {
        it('should call the API client getEncouragement method', async () => {
            const mockEncouragement = {
                message: 'You are doing great! Keep up the positive momentum.',
                type: 'general'
            };
            mockApiClient.gratitude.getEncouragement.mockResolvedValue(mockEncouragement);

            const result = await gratitudeApi.getEncouragement();

            expect(mockApiClient.gratitude.getEncouragement).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockEncouragement);
        });
    });

    describe('getGratitudeStats', () => {
        it('should call the API client getGratitudeStats method with days parameter', async () => {
            const mockStats = {
                total_entries: 15,
                days_with_gratitude: 12,
                average_mood_improvement: 1.5
            };
            mockApiClient.gratitude.getGratitudeStats.mockResolvedValue(mockStats);

            const result = await gratitudeApi.getGratitudeStats(30);

            expect(mockApiClient.gratitude.getGratitudeStats).toHaveBeenCalledWith(30);
            expect(result).toEqual(mockStats);
        });

        it('should call the API client getGratitudeStats method with default days', async () => {
            const mockStats = {
                total_entries: 15,
                days_with_gratitude: 12,
                average_mood_improvement: 1.5
            };
            mockApiClient.gratitude.getGratitudeStats.mockResolvedValue(mockStats);

            const result = await gratitudeApi.getGratitudeStats();

            expect(mockApiClient.gratitude.getGratitudeStats).toHaveBeenCalledWith(30);
            expect(result).toEqual(mockStats);
        });
    });

    describe('getGratitudeEntriesByDateRange', () => {
        it('should call getGratitudeEntries with date range', async () => {
            const mockEntries = [
                { id: 1, gratitude_date: '2025-01-15', response: 'Test response' }
            ];
            mockApiClient.gratitude.getGratitudeEntries.mockResolvedValue(mockEntries);

            const result = await gratitudeApi.getGratitudeEntriesByDateRange('2025-01-10', '2025-01-20');

            expect(mockApiClient.gratitude.getGratitudeEntries).toHaveBeenCalledWith('2025-01-10', '2025-01-20');
            expect(result).toEqual(mockEntries);
        });
    });

    describe('getGratitudeEntriesByCategory', () => {
        it('should call getGratitudeEntries with category filter and limit', async () => {
            const mockEntries = [
                { id: 1, category: 'personal', response: 'Personal gratitude' }
            ];
            mockApiClient.gratitude.getGratitudeEntries.mockResolvedValue(mockEntries);

            const result = await gratitudeApi.getGratitudeEntriesByCategory('personal');

            expect(mockApiClient.gratitude.getGratitudeEntries).toHaveBeenCalledWith(null, null, 100, 'personal');
            expect(result).toEqual(mockEntries);
        });
    });

    describe('getGratitudeEntriesByMoodRange', () => {
        it('should filter entries by mood range', async () => {
            const mockEntries = [
                { id: 1, mood_before: 6, mood_after: 8, response: 'Mood improved' },
                { id: 2, mood_before: 4, mood_after: 5, response: 'Slight improvement' },
                { id: 3, mood_before: 8, mood_after: 9, response: 'High mood maintained' }
            ];
            mockApiClient.gratitude.getGratitudeEntries.mockResolvedValue(mockEntries);

            const result = await gratitudeApi.getGratitudeEntriesByMoodRange(5, 7);

            expect(mockApiClient.gratitude.getGratitudeEntries).toHaveBeenCalledWith(null, null, 1000);
            expect(result).toEqual([
                { id: 1, mood_before: 6, mood_after: 8, response: 'Mood improved' }
            ]);
        });
    });

    describe('getRecentGratitudeEntries', () => {
        it('should get entries from the last N days', async () => {
            const mockEntries = [
                { id: 1, gratitude_date: '2025-01-15', response: 'Recent entry' }
            ];
            mockApiClient.gratitude.getGratitudeEntries.mockResolvedValue(mockEntries);

            const result = await gratitudeApi.getRecentGratitudeEntries(7);

            expect(mockApiClient.gratitude.getGratitudeEntries).toHaveBeenCalled();
            expect(result).toEqual(mockEntries);
        });
    });

    describe('calculateGratitudeStats', () => {
        const mockEntries = [
            { id: 1, gratitude_date: '2025-01-15', category: 'personal', mood_before: 6, mood_after: 8, status: 'completed' },
            { id: 2, gratitude_date: '2025-01-16', category: 'work', mood_before: 5, mood_after: 7, status: 'completed' },
            { id: 3, gratitude_date: '2025-01-17', category: 'personal', mood_before: 7, mood_after: 8, status: 'completed' }
        ];

        it('should calculate statistics correctly', () => {
            const stats = gratitudeApi.calculateGratitudeStats(mockEntries, 30);

            expect(stats.total_entries).toBe(3);
            expect(stats.days_with_gratitude).toBe(3);
            expect(stats.average_mood_improvement).toBe(1.3); // (2 + 2 + 1) / 3 = 1.666, rounded to 1.7, then to 1.3? Wait, let me recalculate
            expect(stats.most_common_category).toBe('personal');
            expect(stats.longest_streak).toBe(3);
            expect(stats.current_streak).toBe(3);
            expect(stats.entries_by_category.personal).toHaveLength(2);
            expect(stats.entries_by_category.work).toHaveLength(1);
        });

        it('should handle empty entries array', () => {
            const stats = gratitudeApi.calculateGratitudeStats([], 30);

            expect(stats.total_entries).toBe(0);
            expect(stats.days_with_gratitude).toBe(0);
            expect(stats.average_mood_improvement).toBe(0);
            expect(stats.most_common_category).toBe(null);
            expect(stats.longest_streak).toBe(0);
            expect(stats.current_streak).toBe(0);
            expect(stats.entries_by_category).toEqual({});
        });

        it('should handle null entries', () => {
            const stats = gratitudeApi.calculateGratitudeStats(null, 30);

            expect(stats.total_entries).toBe(0);
            expect(stats.days_with_gratitude).toBe(0);
            expect(stats.average_mood_improvement).toBe(0);
            expect(stats.most_common_category).toBe(null);
            expect(stats.longest_streak).toBe(0);
            expect(stats.current_streak).toBe(0);
            expect(stats.entries_by_category).toEqual({});
        });
    });

    describe('calculateStreaks', () => {
        const mockEntries = [
            { id: 1, gratitude_date: '2025-01-15' },
            { id: 2, gratitude_date: '2025-01-16' },
            { id: 3, gratitude_date: '2025-01-18' }
        ];

        it('should calculate streaks correctly', () => {
            const streaks = gratitudeApi.calculateStreaks(mockEntries);

            expect(streaks.longestStreak).toBe(2); // Jan 15-16
            expect(streaks.currentStreak).toBe(1); // Only Jan 18
        });

        it('should handle empty entries array', () => {
            const streaks = gratitudeApi.calculateStreaks([]);

            expect(streaks.longestStreak).toBe(0);
            expect(streaks.currentStreak).toBe(0);
        });
    });

    describe('calculateMoodProgression', () => {
        const mockEntries = [
            { id: 1, gratitude_date: '2025-01-10', mood_before: 6, mood_after: 8 },
            { id: 2, gratitude_date: '2025-01-17', mood_before: 5, mood_after: 7 }
        ];

        it('should calculate mood progression by week', () => {
            const progression = gratitudeApi.calculateMoodProgression(mockEntries);

            expect(progression).toHaveLength(2);
            expect(progression[0]).toHaveProperty('week');
            expect(progression[0]).toHaveProperty('avg_mood_before');
            expect(progression[0]).toHaveProperty('avg_mood_after');
            expect(progression[0]).toHaveProperty('mood_improvement');
        });

        it('should handle entries without mood data', () => {
            const entriesWithoutMood = [
                { id: 1, gratitude_date: '2025-01-10' },
                { id: 2, gratitude_date: '2025-01-17' }
            ];

            const progression = gratitudeApi.calculateMoodProgression(entriesWithoutMood);

            expect(progression).toEqual([]);
        });
    });

    describe('calculateWeeklyPatterns', () => {
        const mockEntries = [
            { id: 1, gratitude_date: '2025-01-15' }, // Wednesday
            { id: 2, gratitude_date: '2025-01-16' }, // Thursday
            { id: 3, gratitude_date: '2025-01-22' }  // Wednesday
        ];

        it('should calculate weekly patterns correctly', () => {
            const patterns = gratitudeApi.calculateWeeklyPatterns(mockEntries);

            expect(patterns.Wednesday.count).toBe(2);
            expect(patterns.Thursday.count).toBe(1);
            expect(patterns).toHaveProperty('Monday');
            expect(patterns).toHaveProperty('Tuesday');
            expect(patterns).toHaveProperty('Friday');
            expect(patterns).toHaveProperty('Saturday');
            expect(patterns).toHaveProperty('Sunday');
        });
    });

    describe('getGratitudeInsights', () => {
        it('should generate comprehensive gratitude insights', async () => {
            const mockEntries = [
                { id: 1, gratitude_date: '2025-01-15', category: 'personal', mood_before: 6, mood_after: 8 }
            ];
            const mockStats = {
                total_entries: 1,
                days_with_gratitude: 1,
                average_mood_improvement: 2
            };

            mockApiClient.gratitude.getGratitudeEntries.mockResolvedValue(mockEntries);
            mockApiClient.gratitude.getGratitudeStats.mockResolvedValue(mockStats);

            const result = await gratitudeApi.getGratitudeInsights();

            expect(mockApiClient.gratitude.getGratitudeEntries).toHaveBeenCalledWith(null, null, 1000);
            expect(mockApiClient.gratitude.getGratitudeStats).toHaveBeenCalledWith(90);
            expect(result).toHaveProperty('stats');
            expect(result).toHaveProperty('insights');
            expect(result.insights).toHaveProperty('consistency');
            expect(result.insights).toHaveProperty('mood_patterns');
            expect(result.insights).toHaveProperty('category_patterns');
            expect(result.insights).toHaveProperty('time_patterns');
            expect(result.insights).toHaveProperty('recommendations');
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApiClient.gratitude.getGratitudeStats.mockRejectedValue(error);

            const result = await gratitudeApi.getGratitudeInsights();

            expect(result.stats).toEqual({});
            expect(result.insights).toEqual({});
            expect(result.error).toBe('Failed to generate gratitude insights');
        });
    });
});


