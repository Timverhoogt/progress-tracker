/**
 * Mood API Tests
 * Tests the MoodApi class functionality
 */

import { MoodApi } from '../../js/modules/mood/mood.api.js';

// Mock the core API
const mockApiClient = {
    mood: {
        getTodayMood: jest.fn(),
        getMoodEntries: jest.fn(),
        getMoodStats: jest.fn(),
        getMoodPatterns: jest.fn(),
        getMoodAIAnalysis: jest.fn(),
        getInterventionTriggers: jest.fn(),
        logIntervention: jest.fn(),
        createMoodEntry: jest.fn(),
        updateMoodEntry: jest.fn(),
        deleteMoodEntry: jest.fn(),
    }
};

describe('MoodApi', () => {
    let moodApi;

    beforeEach(() => {
        moodApi = new MoodApi(mockApiClient);
        jest.clearAllMocks();
    });

    describe('getTodayMood', () => {
        it('should call the API client getTodayMood method', async () => {
            const mockMood = { mood_score: 7, mood_date: '2025-01-21' };
            mockApiClient.mood.getTodayMood.mockResolvedValue(mockMood);

            const result = await moodApi.getTodayMood();

            expect(mockApiClient.mood.getTodayMood).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockMood);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApiClient.mood.getTodayMood.mockRejectedValue(error);

            await expect(moodApi.getTodayMood()).rejects.toThrow('API Error');
        });
    });

    describe('getMoodEntries', () => {
        it('should call with correct parameters', async () => {
            const mockEntries = [
                { mood_score: 7, mood_date: '2025-01-20' },
                { mood_score: 8, mood_date: '2025-01-21' }
            ];
            mockApiClient.mood.getMoodEntries.mockResolvedValue(mockEntries);

            const result = await moodApi.getMoodEntries('2025-01-20', '2025-01-21', 5);

            expect(mockApiClient.mood.getMoodEntries).toHaveBeenCalledWith('2025-01-20', '2025-01-21', 5);
            expect(result).toEqual(mockEntries);
        });

        it('should use default limit when not provided', async () => {
            const mockEntries = [{ mood_score: 7, mood_date: '2025-01-21' }];
            mockApiClient.mood.getMoodEntries.mockResolvedValue(mockEntries);

            await moodApi.getMoodEntries('2025-01-20', '2025-01-21');

            expect(mockApiClient.mood.getMoodEntries).toHaveBeenCalledWith('2025-01-20', '2025-01-21', 10);
        });
    });

    describe('createMoodEntry', () => {
        it('should call the API client createMoodEntry method', async () => {
            const moodData = {
                mood_score: 7,
                energy_level: 5,
                stress_level: 3,
                notes: 'Feeling good today'
            };
            const mockResponse = { id: 1, ...moodData };
            mockApiClient.mood.createMoodEntry.mockResolvedValue(mockResponse);

            const result = await moodApi.createMoodEntry(moodData);

            expect(mockApiClient.mood.createMoodEntry).toHaveBeenCalledWith(moodData);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('updateMoodEntry', () => {
        it('should call the API client updateMoodEntry method', async () => {
            const date = '2025-01-21';
            const moodData = { mood_score: 8, energy_level: 6 };
            const mockResponse = { mood_date: date, ...moodData };
            mockApiClient.mood.updateMoodEntry.mockResolvedValue(mockResponse);

            const result = await moodApi.updateMoodEntry(date, moodData);

            expect(mockApiClient.mood.updateMoodEntry).toHaveBeenCalledWith(date, moodData);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('deleteMoodEntry', () => {
        it('should call the API client deleteMoodEntry method', async () => {
            const date = '2025-01-21';
            mockApiClient.mood.deleteMoodEntry.mockResolvedValue({ success: true });

            const result = await moodApi.deleteMoodEntry(date);

            expect(mockApiClient.mood.deleteMoodEntry).toHaveBeenCalledWith(date);
            expect(result).toEqual({ success: true });
        });
    });

    describe('getMoodEntryByDate', () => {
        it('should find entry by date', async () => {
            const date = '2025-01-21';
            const mockEntries = [
                { mood_score: 6, mood_date: '2025-01-20' },
                { mood_score: 7, mood_date: date }
            ];
            mockApiClient.mood.getMoodEntries.mockResolvedValue(mockEntries);

            const result = await moodApi.getMoodEntryByDate(date);

            expect(mockApiClient.mood.getMoodEntries).toHaveBeenCalledWith(date, date);
            expect(result).toEqual(mockEntries[1]);
        });

        it('should return undefined when entry not found', async () => {
            const date = '2025-01-21';
            mockApiClient.mood.getMoodEntries.mockResolvedValue([]);

            const result = await moodApi.getMoodEntryByDate(date);

            expect(result).toBeUndefined();
        });
    });

    describe('getMoodStats', () => {
        it('should call with default days when not provided', async () => {
            const mockStats = { average_mood: 7.5, total_entries: 10 };
            mockApiClient.mood.getMoodStats.mockResolvedValue(mockStats);

            const result = await moodApi.getMoodStats();

            expect(mockApiClient.mood.getMoodStats).toHaveBeenCalledWith(30);
            expect(result).toEqual(mockStats);
        });

        it('should call with custom days when provided', async () => {
            const mockStats = { average_mood: 8.0, total_entries: 5 };
            mockApiClient.mood.getMoodStats.mockResolvedValue(mockStats);

            const result = await moodApi.getMoodStats(7);

            expect(mockApiClient.mood.getMoodStats).toHaveBeenCalledWith(7);
            expect(result).toEqual(mockStats);
        });
    });
});

