/**
 * Mood Controller Tests
 * Tests the MoodController class functionality
 */

import { MoodController } from '../../js/modules/mood/mood.controller.js';

// Mock the MoodApi and MoodUI classes
jest.mock('../../js/modules/mood/mood.api.js', () => {
    return {
        MoodApi: jest.fn().mockImplementation(() => ({
            getTodayMood: jest.fn(),
            getMoodEntries: jest.fn(),
            createMoodEntry: jest.fn(),
            updateMoodEntry: jest.fn(),
            deleteMoodEntry: jest.fn(),
            getMoodEntryByDate: jest.fn(),
            getMoodStats: jest.fn(),
            getMoodPatterns: jest.fn(),
            getMoodAIAnalysis: jest.fn()
        }))
    };
});

jest.mock('../../js/modules/mood/mood.ui.js', () => {
    return {
        MoodUI: jest.fn().mockImplementation(() => ({
            showLoading: jest.fn(),
            hideLoading: jest.fn(),
            showError: jest.fn(),
            showSuccess: jest.fn(),
            renderTodayMood: jest.fn(),
            renderMoodEntries: jest.fn(),
            showMoodModal: jest.fn(),
            hideMoodModal: jest.fn(),
            setFormData: jest.fn(),
            on: jest.fn(),
            emit: jest.fn(),
            bindNavigationEvents: jest.fn(),
            bindMoodScoreUpdates: jest.fn()
        }))
    };
});

describe('MoodController', () => {
    let moodController;
    let mockApi;
    let mockUI;

    beforeEach(() => {
        // Create mock instances
        mockApi = {
            getTodayMood: jest.fn(),
            getMoodEntries: jest.fn(),
            createMoodEntry: jest.fn(),
            updateMoodEntry: jest.fn(),
            deleteMoodEntry: jest.fn(),
            getMoodEntryByDate: jest.fn(),
            getMoodStats: jest.fn(),
            getMoodPatterns: jest.fn(),
            getMoodAIAnalysis: jest.fn()
        };

        mockUI = {
            showLoading: jest.fn(),
            hideLoading: jest.fn(),
            showError: jest.fn(),
            showSuccess: jest.fn(),
            renderTodayMood: jest.fn(),
            renderMoodEntries: jest.fn(),
            showMoodModal: jest.fn(),
            hideMoodModal: jest.fn(),
            setFormData: jest.fn(),
            on: jest.fn(),
            emit: jest.fn(),
            bindNavigationEvents: jest.fn(),
            bindMoodScoreUpdates: jest.fn()
        };

        // Create controller instance
        moodController = new MoodController(mockApi);
        moodController.ui = mockUI;

        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('should initialize the controller with data loading and event binding', async () => {
            const todayMood = { mood_score: 7, mood_date: '2025-01-21' };
            const recentEntries = [{ mood_score: 8, mood_date: '2025-01-20' }];

            mockApi.getTodayMood.mockResolvedValue(todayMood);
            mockApi.getMoodEntries.mockResolvedValue(recentEntries);

            await moodController.initialize();

            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockApi.getTodayMood).toHaveBeenCalled();
            expect(mockApi.getMoodEntries).toHaveBeenCalledWith(null, null, 10);
            expect(mockUI.renderTodayMood).toHaveBeenCalledWith(todayMood);
            expect(mockUI.renderMoodEntries).toHaveBeenCalledWith(recentEntries);
            expect(mockUI.hideLoading).toHaveBeenCalled();
            expect(mockUI.bindNavigationEvents).toHaveBeenCalled();
            expect(mockUI.bindMoodScoreUpdates).toHaveBeenCalled();
        });

        it('should handle initialization errors', async () => {
            const error = new Error('API Error');
            mockApi.getTodayMood.mockRejectedValue(error);

            await expect(moodController.initialize()).rejects.toThrow('API Error');
            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load mood data');
        });
    });

    describe('createMoodEntry', () => {
        it('should validate mood score and create entry successfully', async () => {
            const moodData = {
                mood_score: 8,
                energy_level: 6,
                stress_level: 3,
                notes: 'Great day!'
            };
            const createdEntry = { id: 1, ...moodData };

            mockApi.createMoodEntry.mockResolvedValue(createdEntry);

            const result = await moodController.createMoodEntry(moodData);

            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockApi.createMoodEntry).toHaveBeenCalledWith(moodData);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Mood entry created successfully');
            expect(mockUI.hideMoodModal).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
            expect(result).toEqual(createdEntry);
        });

        it('should reject invalid mood scores', async () => {
            const moodData = {
                mood_score: 15, // Invalid score
                energy_level: 6,
                stress_level: 3
            };

            await moodController.createMoodEntry(moodData);

            expect(mockUI.showError).toHaveBeenCalledWith('Mood score must be between 1 and 10');
            expect(mockApi.createMoodEntry).not.toHaveBeenCalled();
        });

        it('should handle API errors during creation', async () => {
            const moodData = {
                mood_score: 7,
                energy_level: 5,
                stress_level: 4
            };
            const error = new Error('Create failed');

            mockApi.createMoodEntry.mockRejectedValue(error);

            await moodController.createMoodEntry(moodData);

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to create mood entry');
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('updateMoodEntry', () => {
        it('should update mood entry successfully', async () => {
            const date = '2025-01-21';
            const moodData = {
                mood_score: 9,
                energy_level: 7,
                stress_level: 2
            };
            const updatedEntry = { mood_date: date, ...moodData };

            mockApi.updateMoodEntry.mockResolvedValue(updatedEntry);

            const result = await moodController.updateMoodEntry(date, moodData);

            expect(mockApi.updateMoodEntry).toHaveBeenCalledWith(date, moodData);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Mood entry updated successfully');
            expect(mockUI.hideMoodModal).toHaveBeenCalled();
            expect(result).toEqual(updatedEntry);
        });

        it('should reject invalid mood scores during update', async () => {
            const date = '2025-01-21';
            const moodData = {
                mood_score: 0, // Invalid score
                energy_level: 6,
                stress_level: 3
            };

            await moodController.updateMoodEntry(date, moodData);

            expect(mockUI.showError).toHaveBeenCalledWith('Mood score must be between 1 and 10');
            expect(mockApi.updateMoodEntry).not.toHaveBeenCalled();
        });
    });

    describe('deleteMoodEntry', () => {
        it('should delete mood entry when confirmed', async () => {
            const date = '2025-01-21';
            global.confirm = jest.fn().mockReturnValue(true);

            mockApi.deleteMoodEntry.mockResolvedValue({ success: true });

            await moodController.deleteMoodEntry(date);

            expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete this mood entry? This action cannot be undone.');
            expect(mockApi.deleteMoodEntry).toHaveBeenCalledWith(date);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Mood entry deleted successfully');
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should not delete when not confirmed', async () => {
            const date = '2025-01-21';
            global.confirm = jest.fn().mockReturnValue(false);

            await moodController.deleteMoodEntry(date);

            expect(global.confirm).toHaveBeenCalled();
            expect(mockApi.deleteMoodEntry).not.toHaveBeenCalled();
        });
    });

    describe('editMoodEntry', () => {
        it('should load and show edit modal', async () => {
            const date = '2025-01-21';
            const entry = {
                mood_date: date,
                mood_score: 8,
                energy_level: 6,
                stress_level: 3
            };

            mockApi.getMoodEntryByDate.mockResolvedValue(entry);

            await moodController.editMoodEntry(date);

            expect(mockApi.getMoodEntryByDate).toHaveBeenCalledWith(date);
            expect(mockUI.setFormData).toHaveBeenCalledWith(entry);
            expect(mockUI.showMoodModal).toHaveBeenCalledWith(date);
        });

        it('should show error when entry not found', async () => {
            const date = '2025-01-21';

            mockApi.getMoodEntryByDate.mockResolvedValue(null);

            await moodController.editMoodEntry(date);

            expect(mockUI.showError).toHaveBeenCalledWith('Mood entry not found');
        });

        it('should handle API errors during edit', async () => {
            const date = '2025-01-21';
            const error = new Error('Load failed');

            mockApi.getMoodEntryByDate.mockRejectedValue(error);

            await moodController.editMoodEntry(date);

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load mood entry for editing');
        });
    });

    describe('handleStatsRequest', () => {
        it('should load and render mood statistics', async () => {
            const stats = {
                average_mood: 7.5,
                total_entries: 30,
                best_day: '2025-01-15',
                worst_day: '2025-01-10'
            };

            mockApi.getMoodStats.mockResolvedValue(stats);

            await moodController.handleStatsRequest();

            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockApi.getMoodStats).toHaveBeenCalledWith(30);
            expect(mockUI.renderMoodStats).toHaveBeenCalledWith(stats);
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('event binding', () => {
        it('should bind form submission handler', () => {
            const formData = { mood_score: 8, energy_level: 6 };
            const editDate = '2025-01-21';

            moodController.handleFormSubmission = jest.fn();

            // Simulate form submission event
            const mockHandler = jest.fn();
            mockUI.on.mockImplementation((event, handler) => {
                if (event === 'form:submit') {
                    mockHandler = handler;
                }
            });

            moodController.bindEvents();

            mockHandler(formData, editDate);

            expect(mockUI.on).toHaveBeenCalledWith('form:submit', expect.any(Function));
        });

        it('should bind navigation event handlers', () => {
            moodController.handleStatsRequest = jest.fn();

            const mockStatsHandler = jest.fn();
            const mockPatternsHandler = jest.fn();

            mockUI.on.mockImplementation((event, handler) => {
                if (event === 'mood:stats') {
                    mockStatsHandler = handler;
                } else if (event === 'mood:patterns') {
                    mockPatternsHandler = handler;
                }
            });

            moodController.bindEvents();

            mockStatsHandler();

            expect(mockUI.on).toHaveBeenCalledWith('mood:stats', expect.any(Function));
            expect(mockUI.on).toHaveBeenCalledWith('mood:patterns', expect.any(Function));
        });
    });

    describe('getCurrentMoodData', () => {
        it('should return current mood data', async () => {
            const todayMood = { mood_score: 7, mood_date: '2025-01-21' };
            const recentEntries = [{ mood_score: 8, mood_date: '2025-01-20' }];

            mockApi.getTodayMood.mockResolvedValue(todayMood);
            mockApi.getMoodEntries.mockResolvedValue(recentEntries);

            const result = await moodController.getCurrentMoodData();

            expect(result).toEqual({
                todayMood,
                recentEntries,
                lastUpdated: expect.any(Date)
            });
        });

        it('should handle API errors gracefully', async () => {
            mockApi.getTodayMood.mockRejectedValue(new Error('API Error'));

            const result = await moodController.getCurrentMoodData();

            expect(result).toBeNull();
        });
    });
});

