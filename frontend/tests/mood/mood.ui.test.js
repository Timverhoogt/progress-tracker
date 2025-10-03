/**
 * Mood UI Tests
 * Tests the MoodUI class functionality
 */

import { MoodUI } from '../../js/modules/mood/mood.ui.js';
import { TextUtils } from '../../js/utils/format.js';
import { DOMUtils, ModalUtils, LoadingUtils, MessageUtils } from '../../js/utils/dom.js';

// Mock the utility modules
jest.mock('../../js/utils/format.js', () => ({
    TextUtils: {
        escapeHtml: jest.fn((str) => str)
    }
}));

jest.mock('../../js/utils/dom.js', () => ({
    DOMUtils: {
        getElement: jest.fn(),
        getAllElements: jest.fn(),
        setHTML: jest.fn(),
        setText: jest.fn(),
        on: jest.fn(),
        createElement: jest.fn()
    },
    ModalUtils: {
        show: jest.fn(),
        hide: jest.fn()
    },
    LoadingUtils: {
        show: jest.fn(),
        hide: jest.fn()
    },
    MessageUtils: {
        showError: jest.fn(),
        showSuccess: jest.fn()
    }
}));

describe('MoodUI', () => {
    let moodUI;
    let mockElements;

    beforeEach(() => {
        // Mock DOM elements
        mockElements = {
            moodModal: { value: '' },
            moodForm: { reset: jest.fn(), dataset: {} },
            moodDate: { value: '' },
            moodScore: { value: 7 },
            moodScoreValue: { textContent: '7' },
            moodEnergyLevel: { value: 5 },
            moodStressLevel: { value: 5 },
            moodMotivationLevel: { value: 5 },
            moodTags: { value: '' },
            moodNotes: { value: '' },
            moodTriggers: { value: '' },
            loadingOverlay: {}
        };

        DOMUtils.getElement.mockImplementation((selector) => mockElements[selector.replace('#', '')]);
        DOMUtils.getAllElements.mockReturnValue([]);
        DOMUtils.setHTML.mockImplementation(() => {});
        DOMUtils.setText.mockImplementation(() => {});
        DOMUtils.on.mockImplementation(() => {});

        moodUI = new MoodUI();
        jest.clearAllMocks();
    });

    describe('initializeElements', () => {
        it('should initialize all DOM elements', () => {
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodStatsBtn');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodPatternsBtn');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodAIAnalysisBtn');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#newMoodEntryBtn');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#todayMoodContent');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodEntries');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodInsightsSection');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodInsightsContent');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodModal');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodForm');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodDate');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodScore');
            expect(DOMUtils.getElement).toHaveBeenCalledWith('#moodScoreValue');
        });
    });

    describe('getMoodEmoji', () => {
        it('should return appropriate emoji for different mood scores', () => {
            expect(moodUI.getMoodEmoji(10)).toBe('😄');
            expect(moodUI.getMoodEmoji(9)).toBe('😄');
            expect(moodUI.getMoodEmoji(8)).toBe('😊');
            expect(moodUI.getMoodEmoji(7)).toBe('🙂');
            expect(moodUI.getMoodEmoji(6)).toBe('😐');
            expect(moodUI.getMoodEmoji(5)).toBe('😕');
            expect(moodUI.getMoodEmoji(4)).toBe('😞');
            expect(moodUI.getMoodEmoji(3)).toBe('😢');
            expect(moodUI.getMoodEmoji(2)).toBe('😭');
            expect(moodUI.getMoodEmoji(1)).toBe('😠');
        });
    });

    describe('getMoodColor', () => {
        it('should return appropriate color for different mood scores', () => {
            expect(moodUI.getMoodColor(10)).toBe('#10b981'); // green
            expect(moodUI.getMoodColor(8)).toBe('#10b981'); // green
            expect(moodUI.getMoodColor(7)).toBe('#f59e0b'); // yellow
            expect(moodUI.getMoodColor(6)).toBe('#f59e0b'); // yellow
            expect(moodUI.getMoodColor(5)).toBe('#f97316'); // orange
            expect(moodUI.getMoodColor(4)).toBe('#f97316'); // orange
            expect(moodUI.getMoodColor(3)).toBe('#ef4444'); // red
            expect(moodUI.getMoodColor(1)).toBe('#ef4444'); // red
        });
    });

    describe('renderTodayMood', () => {
        it('should render no entry state when moodEntry is null', () => {
            moodUI.renderTodayMood(null);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(
                mockElements.todayMoodContent,
                expect.stringContaining('How are you feeling today?')
            );
        });

        it('should render mood entry when moodEntry is provided', () => {
            const moodEntry = {
                mood_score: 8,
                energy_level: 6,
                stress_level: 3,
                motivation_level: 7,
                notes: 'Feeling great today!'
            };

            moodUI.renderTodayMood(moodEntry);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(
                mockElements.todayMoodContent,
                expect.stringContaining('Today\'s Mood')
            );
            expect(DOMUtils.setHTML).toHaveBeenCalledWith(
                mockElements.todayMoodContent,
                expect.stringContaining('😊')
            );
            expect(DOMUtils.setHTML).toHaveBeenCalledWith(
                mockElements.todayMoodContent,
                expect.stringContaining('8/10')
            );
        });
    });

    describe('renderMoodEntries', () => {
        it('should render empty state when no entries', () => {
            moodUI.renderMoodEntries([]);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(
                mockElements.moodEntries,
                expect.stringContaining('No mood entries yet')
            );
        });

        it('should render mood entries list', () => {
            const entries = [
                {
                    mood_score: 7,
                    mood_date: '2025-01-21',
                    energy_level: 5,
                    stress_level: 3,
                    mood_tags: 'happy,productive',
                    notes: 'Good day overall'
                }
            ];

            moodUI.renderMoodEntries(entries);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(
                mockElements.moodEntries,
                expect.stringContaining('2025-01-21')
            );
            expect(DOMUtils.setHTML).toHaveBeenCalledWith(
                mockElements.moodEntries,
                expect.stringContaining('🙂')
            );
        });
    });

    describe('showMoodModal', () => {
        it('should set form values and show modal', () => {
            moodUI.showMoodModal();

            expect(mockElements.moodDate.value).toBe(new Date().toISOString().split('T')[0]);
            expect(mockElements.moodScore.value).toBe(7);
            expect(mockElements.moodScoreValue.textContent).toBe('7');
            expect(ModalUtils.show).toHaveBeenCalledWith(mockElements.moodModal);
        });

        it('should set edit date when provided', () => {
            const editDate = '2025-01-20';
            moodUI.showMoodModal(editDate);

            expect(mockElements.moodDate.value).toBe(editDate);
            expect(ModalUtils.show).toHaveBeenCalledWith(mockElements.moodModal);
        });
    });

    describe('hideMoodModal', () => {
        it('should hide modal and clear form', () => {
            moodUI.hideMoodModal();

            expect(ModalUtils.hide).toHaveBeenCalledWith(mockElements.moodModal);
            expect(mockElements.moodForm.reset).toHaveBeenCalled();
        });
    });

    describe('getFormData', () => {
        it('should return form data as object', () => {
            mockElements.moodScore.value = '8';
            mockElements.moodEnergyLevel.value = '6';
            mockElements.moodStressLevel.value = '4';
            mockElements.moodMotivationLevel.value = '7';
            mockElements.moodTags.value = 'happy,energetic';
            mockElements.moodNotes.value = 'Great day!';
            mockElements.moodTriggers.value = 'caffeine';

            const result = moodUI.getFormData();

            expect(result).toEqual({
                mood_score: 8,
                energy_level: 6,
                stress_level: 4,
                motivation_level: 7,
                mood_tags: 'happy,energetic',
                notes: 'Great day!',
                triggers: 'caffeine'
            });
        });
    });

    describe('setFormData', () => {
        it('should set form values from entry data', () => {
            const entry = {
                mood_date: '2025-01-21',
                mood_score: 9,
                energy_level: 7,
                stress_level: 2,
                motivation_level: 8,
                mood_tags: 'excellent,happy',
                notes: 'Amazing day!',
                triggers: 'good sleep'
            };

            moodUI.setFormData(entry);

            expect(mockElements.moodDate.value).toBe('2025-01-21');
            expect(mockElements.moodScore.value).toBe(9);
            expect(mockElements.moodScoreValue.textContent).toBe('9');
            expect(mockElements.moodEnergyLevel.value).toBe(7);
            expect(mockElements.moodStressLevel.value).toBe(2);
            expect(mockElements.moodMotivationLevel.value).toBe(8);
            expect(mockElements.moodTags.value).toBe('excellent,happy');
            expect(mockElements.moodNotes.value).toBe('Amazing day!');
            expect(mockElements.moodTriggers.value).toBe('good sleep');
            expect(mockElements.moodForm.dataset.editDate).toBe('2025-01-21');
        });
    });

    describe('event system', () => {
        it('should register event handlers', () => {
            const handler = jest.fn();
            moodUI.on('test:event', handler);

            expect(moodUI.events['test:event']).toContain(handler);
        });

        it('should emit events to registered handlers', () => {
            const handler = jest.fn();
            moodUI.on('test:event', handler);

            moodUI.emit('test:event', { data: 'test' });

            expect(handler).toHaveBeenCalledWith({ data: 'test' });
        });

        it('should not call handlers for unregistered events', () => {
            const handler = jest.fn();
            moodUI.on('test:event', handler);

            moodUI.emit('other:event', { data: 'test' });

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('error and success messages', () => {
        it('should show error messages', () => {
            const message = 'Test error message';
            moodUI.showError(message);

            expect(MessageUtils.showError).toHaveBeenCalledWith(message);
        });

        it('should show success messages', () => {
            const message = 'Test success message';
            moodUI.showSuccess(message);

            expect(MessageUtils.showSuccess).toHaveBeenCalledWith(message);
        });
    });
});

