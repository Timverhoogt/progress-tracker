/**
 * Gratitude Controller Tests
 * Tests the GratitudeController class functionality
 */

import { GratitudeController } from '../../js/modules/gratitude/gratitude.controller.js';
import { GratitudeApi } from '../../js/modules/gratitude/gratitude.api.js';

// Mock the GratitudeApi
jest.mock('../../js/modules/gratitude/gratitude.api.js', () => ({
    GratitudeApi: jest.fn().mockImplementation(() => ({
        getGratitudeEntries: jest.fn(),
        getTodayGratitude: jest.fn(),
        createGratitudeEntry: jest.fn(),
        updateGratitudeEntry: jest.fn(),
        deleteGratitudeEntry: jest.fn(),
        getGratitudePrompts: jest.fn(),
        getAchievementBasedPrompts: jest.fn(),
        getPositiveReframing: jest.fn(),
        getEncouragement: jest.fn(),
        getGratitudeStats: jest.fn(),
        getGratitudeEntriesByDateRange: jest.fn(),
        getGratitudeEntriesByCategory: jest.fn(),
        getGratitudeEntriesByMoodRange: jest.fn(),
        getRecentGratitudeEntries: jest.fn(),
        getGratitudeInsights: jest.fn(),
        calculateGratitudeStats: jest.fn()
    }))
}));

// Mock the GratitudeUI
jest.mock('../../js/modules/gratitude/gratitude.ui.js', () => ({
    GratitudeUI: jest.fn().mockImplementation(() => ({
        showLoading: jest.fn(),
        hideLoading: jest.fn(),
        showError: jest.fn(),
        showSuccess: jest.fn(),
        renderTodayGratitude: jest.fn(),
        renderGratitudeEntries: jest.fn(),
        renderGratitudePrompts: jest.fn(),
        renderGratitudeStats: jest.fn(),
        showGratitudeModal: jest.fn(),
        hideGratitudeModal: jest.fn(),
        setGratitudeFormData: jest.fn(),
        getGratitudeFormData: jest.fn(),
        bindNavigationEvents: jest.fn(),
        cleanup: jest.fn(),
        elements: {}
    }))
}));

describe('GratitudeController', () => {
    let gratitudeController;
    let mockApi;
    let mockUI;

    beforeEach(() => {
        // Create mock instances
        mockApi = new GratitudeApi();
        mockUI = new (jest.requireMock('../../js/modules/gratitude/gratitude.ui.js').GratitudeUI)();

        // Create controller instance
        gratitudeController = new GratitudeController({});

        // Replace the API and UI with our mocks
        gratitudeController.api = mockApi;
        gratitudeController.ui = mockUI;

        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('should initialize controller correctly', async () => {
            const mockTodayEntry = { id: 'entry-123', gratitude_date: '2025-01-15' };
            const mockEntries = [{ id: 'entry-456', gratitude_date: '2025-01-14' }];
            const mockInsights = { stats: { total_entries: 5 }, insights: {} };

            mockApi.getTodayGratitude.mockResolvedValue(mockTodayEntry);
            mockApi.getGratitudeEntries.mockResolvedValue(mockEntries);
            mockApi.getGratitudeInsights.mockResolvedValue(mockInsights);

            await gratitudeController.initialize();

            expect(mockApi.getTodayGratitude).toHaveBeenCalledTimes(1);
            expect(mockApi.getGratitudeEntries).toHaveBeenCalledTimes(1);
            expect(mockUI.renderTodayGratitude).toHaveBeenCalledWith(mockTodayEntry);
            expect(mockUI.renderGratitudeEntries).toHaveBeenCalledWith(mockEntries);
            expect(mockUI.renderGratitudeStats).toHaveBeenCalledWith(mockInsights);
            expect(mockUI.bindNavigationEvents).toHaveBeenCalledTimes(1);
        });

        it('should handle today\'s gratitude entry not found gracefully', async () => {
            const error = new Error('No gratitude entry for today');
            const mockEntries = [{ id: 'entry-456', gratitude_date: '2025-01-14' }];
            const mockInsights = { stats: { total_entries: 5 }, insights: {} };

            mockApi.getTodayGratitude.mockRejectedValue(error);
            mockApi.getGratitudeEntries.mockResolvedValue(mockEntries);
            mockApi.getGratitudeInsights.mockResolvedValue(mockInsights);

            await gratitudeController.initialize();

            expect(mockUI.renderTodayGratitude).toHaveBeenCalledWith(null);
            expect(mockUI.renderGratitudeEntries).toHaveBeenCalledWith(mockEntries);
            expect(mockUI.renderGratitudeStats).toHaveBeenCalledWith(mockInsights);
        });

        it('should handle initialization errors gracefully', async () => {
            const error = new Error('Initialization Error');
            mockApi.getTodayGratitude.mockRejectedValue(error);

            await gratitudeController.initialize();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load gratitude data');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('loadTodayGratitude', () => {
        it('should load today\'s gratitude entry', async () => {
            const mockEntry = { id: 'entry-123', gratitude_date: '2025-01-15' };
            mockApi.getTodayGratitude.mockResolvedValue(mockEntry);

            await gratitudeController.loadTodayGratitude();

            expect(mockApi.getTodayGratitude).toHaveBeenCalledTimes(1);
            expect(mockUI.renderTodayGratitude).toHaveBeenCalledWith(mockEntry);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should handle no entry for today gracefully', async () => {
            const error = new Error('No gratitude entry for today');
            mockApi.getTodayGratitude.mockRejectedValue(error);

            await gratitudeController.loadTodayGratitude();

            expect(mockUI.renderTodayGratitude).toHaveBeenCalledWith(null);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApi.getTodayGratitude.mockRejectedValue(error);

            await gratitudeController.loadTodayGratitude();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load today\'s gratitude');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('loadGratitudeEntries', () => {
        it('should load gratitude entries', async () => {
            const mockEntries = [{ id: 'entry-123', gratitude_date: '2025-01-15' }];
            mockApi.getGratitudeEntries.mockResolvedValue(mockEntries);

            await gratitudeController.loadGratitudeEntries('2025-01-10', '2025-01-20', 5);

            expect(mockApi.getGratitudeEntries).toHaveBeenCalledWith('2025-01-10', '2025-01-20', 5);
            expect(mockUI.renderGratitudeEntries).toHaveBeenCalledWith(mockEntries);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApi.getGratitudeEntries.mockRejectedValue(error);

            await gratitudeController.loadGratitudeEntries();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load gratitude entries');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('loadGratitudePrompts', () => {
        it('should load gratitude prompts', async () => {
            const mockPrompts = [{ prompt: 'Test prompt', category: 'daily' }];
            const mockAchievementPrompts = [{ prompt: 'Achievement prompt', context: 'Recent completion' }];

            mockApi.getGratitudePrompts.mockResolvedValue(mockPrompts);
            mockApi.getAchievementBasedPrompts.mockResolvedValue(mockAchievementPrompts);

            await gratitudeController.loadGratitudePrompts({ category: 'daily' });

            expect(mockApi.getGratitudePrompts).toHaveBeenCalledWith({ category: 'daily' });
            expect(mockApi.getAchievementBasedPrompts).toHaveBeenCalledTimes(1);
            expect(mockUI.renderGratitudePrompts).toHaveBeenCalledWith(mockPrompts);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApi.getGratitudePrompts.mockRejectedValue(error);

            await gratitudeController.loadGratitudePrompts();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load gratitude prompts');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('loadGratitudeStats', () => {
        it('should load gratitude statistics', async () => {
            const mockStats = { total_entries: 15, days_with_gratitude: 12 };
            mockApi.getGratitudeStats.mockResolvedValue(mockStats);

            await gratitudeController.loadGratitudeStats(30);

            expect(mockApi.getGratitudeStats).toHaveBeenCalledWith(30);
            expect(mockUI.renderGratitudeStats).toHaveBeenCalledWith(mockStats);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApi.getGratitudeStats.mockRejectedValue(error);

            await gratitudeController.loadGratitudeStats();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load gratitude statistics');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('createGratitudeEntry', () => {
        it('should create gratitude entry successfully', async () => {
            const entryData = {
                gratitude_date: '2025-01-15',
                response: 'Test response',
                category: 'personal',
                mood_before: 6,
                mood_after: 8
            };
            const mockNewEntry = { id: 'entry-123', ...entryData };
            mockApi.createGratitudeEntry.mockResolvedValue(mockNewEntry);
            gratitudeController.loadGratitudeData = jest.fn();

            const result = await gratitudeController.createGratitudeEntry(entryData);

            expect(mockApi.createGratitudeEntry).toHaveBeenCalledWith(entryData);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Gratitude entry created successfully');
            expect(mockUI.hideGratitudeModal).toHaveBeenCalledTimes(1);
            expect(gratitudeController.loadGratitudeData).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockNewEntry);
        });

        it('should validate required fields', async () => {
            await gratitudeController.createGratitudeEntry({});

            expect(mockUI.showError).toHaveBeenCalledWith('Date is required');
            expect(mockApi.createGratitudeEntry).not.toHaveBeenCalled();
        });

        it('should validate response is not empty', async () => {
            await gratitudeController.createGratitudeEntry({
                gratitude_date: '2025-01-15',
                response: ''
            });

            expect(mockUI.showError).toHaveBeenCalledWith('Gratitude response is required');
            expect(mockApi.createGratitudeEntry).not.toHaveBeenCalled();
        });

        it('should validate mood ranges', async () => {
            await gratitudeController.createGratitudeEntry({
                gratitude_date: '2025-01-15',
                response: 'Test response',
                mood_before: 15
            });

            expect(mockUI.showError).toHaveBeenCalledWith('Mood before must be between 1 and 10');
            expect(mockApi.createGratitudeEntry).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const entryData = {
                gratitude_date: '2025-01-15',
                response: 'Test response'
            };
            const error = new Error('API Error');
            mockApi.createGratitudeEntry.mockRejectedValue(error);
            gratitudeController.loadGratitudeData = jest.fn();

            await gratitudeController.createGratitudeEntry(entryData);

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to create gratitude entry');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('updateGratitudeEntry', () => {
        it('should update gratitude entry successfully', async () => {
            const updateData = {
                response: 'Updated response',
                mood_before: 7,
                mood_after: 9
            };
            const mockUpdatedEntry = { id: 'entry-123', ...updateData };
            mockApi.updateGratitudeEntry.mockResolvedValue(mockUpdatedEntry);
            gratitudeController.loadGratitudeData = jest.fn();

            const result = await gratitudeController.updateGratitudeEntry('entry-123', updateData);

            expect(mockApi.updateGratitudeEntry).toHaveBeenCalledWith('entry-123', updateData);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Gratitude entry updated successfully');
            expect(mockUI.hideGratitudeModal).toHaveBeenCalledTimes(1);
            expect(gratitudeController.loadGratitudeData).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockUpdatedEntry);
        });

        it('should validate required fields', async () => {
            await gratitudeController.updateGratitudeEntry('entry-123', { response: '' });

            expect(mockUI.showError).toHaveBeenCalledWith('Gratitude response is required');
            expect(mockApi.updateGratitudeEntry).not.toHaveBeenCalled();
        });
    });

    describe('deleteGratitudeEntry', () => {
        it('should delete gratitude entry successfully', async () => {
            const mockResponse = { success: true };
            mockApi.deleteGratitudeEntry.mockResolvedValue(mockResponse);
            gratitudeController.loadGratitudeData = jest.fn();

            // Mock confirm to return true
            global.confirm = jest.fn().mockReturnValue(true);

            await gratitudeController.deleteGratitudeEntry('entry-123');

            expect(mockApi.deleteGratitudeEntry).toHaveBeenCalledWith('entry-123');
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Gratitude entry deleted successfully');
            expect(gratitudeController.loadGratitudeData).toHaveBeenCalledTimes(1);
        });

        it('should not delete when user cancels', async () => {
            // Mock confirm to return false
            global.confirm = jest.fn().mockReturnValue(false);

            await gratitudeController.deleteGratitudeEntry('entry-123');

            expect(mockApi.deleteGratitudeEntry).not.toHaveBeenCalled();
            expect(mockUI.showSuccess).not.toHaveBeenCalled();
            expect(gratitudeController.loadGratitudeData).not.toHaveBeenCalled();
        });
    });

    describe('editGratitudeEntry', () => {
        it('should show edit modal for existing entry', async () => {
            const mockEntry = { id: 'entry-123', response: 'Test response' };
            mockApi.getGratitudeEntries.mockResolvedValue([mockEntry]);

            await gratitudeController.editGratitudeEntry('entry-123');

            expect(mockUI.setGratitudeFormData).toHaveBeenCalledWith(mockEntry);
            expect(mockUI.showGratitudeModal).toHaveBeenCalledWith('entry-123');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should show error when entry not found', async () => {
            mockApi.getGratitudeEntries.mockResolvedValue([]);

            await gratitudeController.editGratitudeEntry('entry-123');

            expect(mockUI.showError).toHaveBeenCalledWith('Gratitude entry not found');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('showGratitudeModal', () => {
        it('should show gratitude modal', () => {
            gratitudeController.showGratitudeModal('entry-123');

            expect(mockUI.showGratitudeModal).toHaveBeenCalledWith('entry-123');
        });
    });

    describe('getPositiveReframing', () => {
        it('should get positive reframing for challenge', async () => {
            const mockReframing = {
                original_challenge: 'Feeling overwhelmed',
                reframed_perspective: 'This is an opportunity to grow'
            };
            mockApi.getPositiveReframing.mockResolvedValue(mockReframing);

            const result = await gratitudeController.getPositiveReframing('Feeling overwhelmed');

            expect(mockApi.getPositiveReframing).toHaveBeenCalledWith('Feeling overwhelmed');
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Positive reframing generated');
            expect(result).toEqual(mockReframing);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApi.getPositiveReframing.mockRejectedValue(error);

            await gratitudeController.getPositiveReframing('Challenge');

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to generate positive reframing');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('getEncouragement', () => {
        it('should get personalized encouragement', async () => {
            const mockEncouragement = {
                message: 'You are doing great!',
                type: 'general'
            };
            mockApi.getEncouragement.mockResolvedValue(mockEncouragement);

            const result = await gratitudeController.getEncouragement();

            expect(mockApi.getEncouragement).toHaveBeenCalledTimes(1);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Encouragement received');
            expect(result).toEqual(mockEncouragement);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApi.getEncouragement.mockRejectedValue(error);

            await gratitudeController.getEncouragement();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to get encouragement');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('getGratitudeEntriesByCategory', () => {
        it('should get entries by category', async () => {
            const mockEntries = [{ id: 'entry-123', category: 'personal' }];
            mockApi.getGratitudeEntriesByCategory.mockResolvedValue(mockEntries);

            await gratitudeController.getGratitudeEntriesByCategory('personal');

            expect(mockApi.getGratitudeEntriesByCategory).toHaveBeenCalledWith('personal');
            expect(mockUI.renderGratitudeEntries).toHaveBeenCalledWith(mockEntries);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('getGratitudeEntriesByMoodRange', () => {
        it('should get entries by mood range', async () => {
            const mockEntries = [{ id: 'entry-123', mood_before: 6, mood_after: 8 }];
            mockApi.getGratitudeEntriesByMoodRange.mockResolvedValue(mockEntries);

            await gratitudeController.getGratitudeEntriesByMoodRange(5, 7);

            expect(mockApi.getGratitudeEntriesByMoodRange).toHaveBeenCalledWith(5, 7);
            expect(mockUI.renderGratitudeEntries).toHaveBeenCalledWith(mockEntries);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('getRecentGratitudeEntries', () => {
        it('should get recent entries', async () => {
            const mockEntries = [{ id: 'entry-123', gratitude_date: '2025-01-15' }];
            mockApi.getRecentGratitudeEntries.mockResolvedValue(mockEntries);

            await gratitudeController.getRecentGratitudeEntries(7);

            expect(mockApi.getRecentGratitudeEntries).toHaveBeenCalledWith(7);
            expect(mockUI.renderGratitudeEntries).toHaveBeenCalledWith(mockEntries);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('getGratitudeInsights', () => {
        it('should get gratitude insights', async () => {
            const mockInsights = {
                stats: { total_entries: 5 },
                insights: { consistency: { last_30_days_entries: 12 } }
            };
            mockApi.getGratitudeInsights.mockResolvedValue(mockInsights);

            const result = await gratitudeController.getGratitudeInsights();

            expect(mockApi.getGratitudeInsights).toHaveBeenCalledTimes(1);
            expect(mockUI.renderGratitudeStats).toHaveBeenCalledWith(mockInsights);
            expect(result).toEqual(mockInsights);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('exportGratitudeData', () => {
        it('should export gratitude data successfully', async () => {
            const mockEntries = [{ id: 'entry-123', gratitude_date: '2025-01-15' }];
            const mockInsights = {
                stats: { total_entries: 5 },
                insights: { consistency: { last_30_days_entries: 12 } }
            };

            mockApi.getGratitudeEntries.mockResolvedValue(mockEntries);
            mockApi.getGratitudeInsights.mockResolvedValue(mockInsights);

            // Mock URL.createObjectURL and related functions
            global.URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
            global.URL.revokeObjectURL = jest.fn();
            document.createElement = jest.fn().mockReturnValue({
                click: jest.fn(),
                href: '',
                download: ''
            });
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            await gratitudeController.exportGratitudeData();

            expect(mockUI.showSuccess).toHaveBeenCalledWith('Gratitude data exported successfully');
        });

        it('should handle export errors gracefully', async () => {
            const error = new Error('Export Error');
            mockApi.getGratitudeEntries.mockRejectedValue(error);

            await gratitudeController.exportGratitudeData();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to export gratitude data');
        });
    });

    describe('refreshData', () => {
        it('should refresh all gratitude data', async () => {
            gratitudeController.loadGratitudeData = jest.fn();

            await gratitudeController.refreshData();

            expect(gratitudeController.loadGratitudeData).toHaveBeenCalledTimes(1);
        });
    });

    describe('cleanup', () => {
        it('should cleanup UI resources', () => {
            gratitudeController.cleanup();

            expect(mockUI.cleanup).toHaveBeenCalledTimes(1);
        });
    });

    describe('getCurrentEntryId', () => {
        it('should return current entry ID', () => {
            gratitudeController.currentEntryId = 'entry-123';
            expect(gratitudeController.getCurrentEntryId()).toBe('entry-123');
        });
    });

    describe('setCurrentEntryId', () => {
        it('should set current entry ID', () => {
            gratitudeController.setCurrentEntryId('entry-456');
            expect(gratitudeController.currentEntryId).toBe('entry-456');
        });
    });
});


