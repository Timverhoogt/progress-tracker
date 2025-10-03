/**
 * Gratitude UI Tests
 * Tests the GratitudeUI class functionality
 */

import { GratitudeUI } from '../../js/modules/gratitude/gratitude.ui.js';
import { DOMUtils } from '../../js/utils/dom.js';

// Mock DOMUtils
jest.mock('../../js/utils/dom.js', () => ({
    DOMUtils: {
        getElement: jest.fn(),
        setText: jest.fn(),
        setHTML: jest.fn(),
        getValue: jest.fn(),
        setValue: jest.fn()
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

describe('GratitudeUI', () => {
    let gratitudeUI;
    let mockElements;

    beforeEach(() => {
        // Mock DOM elements
        mockElements = {
            newGratitudeEntryBtn: { onclick: null },
            gratitudePromptsBtn: { onclick: null },
            gratitudeStatsBtn: { onclick: null },
            todayGratitudeCard: { innerHTML: '' },
            todayGratitudeContent: { innerHTML: '' },
            gratitudePromptsSection: { style: {} },
            gratitudePromptsContent: { innerHTML: '' },
            achievementGratitudeSection: { style: {} },
            achievementGratitudeContent: { innerHTML: '' },
            gratitudeEntries: { innerHTML: '' },
            gratitudeModal: { style: {} },
            gratitudeForm: { elements: {} },
            gratitudeDate: { value: '' },
            gratitudeCategory: { value: '' },
            gratitudePrompt: { value: '' },
            gratitudeResponse: { value: '' },
            gratitudeMoodBefore: { value: '', oninput: null },
            gratitudeMoodBeforeValue: { textContent: '' },
            gratitudeMoodAfter: { value: '', oninput: null },
            gratitudeMoodAfterValue: { textContent: '' },
            gratitudeTags: { value: '' },
            gratitudeTrendsChart: { getContext: jest.fn().mockReturnValue({}) },
            moodProgressChart: { getContext: jest.fn().mockReturnValue({}) },
            categoryDistributionChart: { getContext: jest.fn().mockReturnValue({}) },
            consistencyChart: { getContext: jest.fn().mockReturnValue({}) },
            loadingOverlay: { style: {} }
        };

        // Mock DOMUtils.getElement to return mock elements
        DOMUtils.getElement.mockImplementation((selector) => {
            switch (selector) {
                case '#newGratitudeEntryBtn': return mockElements.newGratitudeEntryBtn;
                case '#gratitudePromptsBtn': return mockElements.gratitudePromptsBtn;
                case '#gratitudeStatsBtn': return mockElements.gratitudeStatsBtn;
                case '#todayGratitudeCard': return mockElements.todayGratitudeCard;
                case '#todayGratitudeContent': return mockElements.todayGratitudeContent;
                case '#gratitudePromptsSection': return mockElements.gratitudePromptsSection;
                case '#gratitudePromptsContent': return mockElements.gratitudePromptsContent;
                case '#achievementGratitudeSection': return mockElements.achievementGratitudeSection;
                case '#achievementGratitudeContent': return mockElements.achievementGratitudeContent;
                case '#gratitudeEntries': return mockElements.gratitudeEntries;
                case '#gratitudeModal': return mockElements.gratitudeModal;
                case '#gratitudeForm': return mockElements.gratitudeForm;
                case '#gratitudeDate': return mockElements.gratitudeDate;
                case '#gratitudeCategory': return mockElements.gratitudeCategory;
                case '#gratitudePrompt': return mockElements.gratitudePrompt;
                case '#gratitudeResponse': return mockElements.gratitudeResponse;
                case '#gratitudeMoodBefore': return mockElements.gratitudeMoodBefore;
                case '#gratitudeMoodBeforeValue': return mockElements.gratitudeMoodBeforeValue;
                case '#gratitudeMoodAfter': return mockElements.gratitudeMoodAfter;
                case '#gratitudeMoodAfterValue': return mockElements.gratitudeMoodAfterValue;
                case '#gratitudeTags': return mockElements.gratitudeTags;
                case '#gratitudeTrendsChart': return mockElements.gratitudeTrendsChart;
                case '#moodProgressChart': return mockElements.moodProgressChart;
                case '#categoryDistributionChart': return mockElements.categoryDistributionChart;
                case '#consistencyChart': return mockElements.consistencyChart;
                case '#loadingOverlay': return mockElements.loadingOverlay;
                default: return null;
            }
        });

        // Mock Chart constructor
        global.Chart = jest.fn().mockImplementation(() => ({
            destroy: jest.fn()
        }));

        gratitudeUI = new GratitudeUI();
        jest.clearAllMocks();
    });

    describe('initializeElements', () => {
        it('should initialize all DOM elements correctly', () => {
            expect(gratitudeUI.elements.newGratitudeEntryBtn).toBe(mockElements.newGratitudeEntryBtn);
            expect(gratitudeUI.elements.gratitudePromptsBtn).toBe(mockElements.gratitudePromptsBtn);
            expect(gratitudeUI.elements.gratitudeStatsBtn).toBe(mockElements.gratitudeStatsBtn);
            expect(gratitudeUI.elements.todayGratitudeCard).toBe(mockElements.todayGratitudeCard);
            expect(gratitudeUI.elements.todayGratitudeContent).toBe(mockElements.todayGratitudeContent);
            expect(gratitudeUI.elements.gratitudePromptsSection).toBe(mockElements.gratitudePromptsSection);
            expect(gratitudeUI.elements.gratitudePromptsContent).toBe(mockElements.gratitudePromptsContent);
            expect(gratitudeUI.elements.achievementGratitudeSection).toBe(mockElements.achievementGratitudeSection);
            expect(gratitudeUI.elements.achievementGratitudeContent).toBe(mockElements.achievementGratitudeContent);
            expect(gratitudeUI.elements.gratitudeEntries).toBe(mockElements.gratitudeEntries);
            expect(gratitudeUI.elements.gratitudeModal).toBe(mockElements.gratitudeModal);
        });
    });

    describe('renderTodayGratitude', () => {
        it('should render today\'s gratitude entry', () => {
            const entry = {
                id: 'entry-123',
                gratitude_date: '2025-01-15',
                category: 'personal',
                prompt: 'What are you grateful for today?',
                response: 'I am grateful for my health and family',
                mood_before: 6,
                mood_after: 8,
                tags: 'health,family'
            };

            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            gratitudeUI.renderTodayGratitude(entry);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.todayGratitudeContent, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('Personal Gratitude');
            expect(html).toContain('What are you grateful for today?');
            expect(html).toContain('I am grateful for my health and family');
            expect(html).toContain('6');
            expect(html).toContain('8');
            expect(html).toContain('+2');
            expect(html).toContain('health,family');
        });

        it('should render empty state when no entry for today', () => {
            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            gratitudeUI.renderTodayGratitude(null);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.todayGratitudeContent, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('No gratitude entry for today');
            expect(html).toContain('Start your day with gratitude practice');
            expect(html).toContain('Add Gratitude Entry');
        });
    });

    describe('renderGratitudeEntries', () => {
        it('should render gratitude entries history', () => {
            const entries = [
                {
                    id: 'entry-123',
                    gratitude_date: '2025-01-15',
                    category: 'personal',
                    prompt: 'What are you grateful for today?',
                    response: 'I am grateful for my health and family. This is a long response that should be truncated when displayed in the list view.',
                    mood_before: 6,
                    mood_after: 8
                }
            ];

            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            gratitudeUI.renderGratitudeEntries(entries);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.gratitudeEntries, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('Personal Gratitude');
            expect(html).toContain('2025-01-15');
            expect(html).toContain('What are you grateful for today?');
            expect(html).toContain('I am grateful for my health and family. This is a long response that should be truncated...');
            expect(html).toContain('6');
            expect(html).toContain('8');
            expect(html).toContain('+2');
        });

        it('should render empty state when no entries', () => {
            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            gratitudeUI.renderGratitudeEntries([]);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.gratitudeEntries, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('No gratitude entries yet');
            expect(html).toContain('Start practicing gratitude to see your history here');
            expect(html).toContain('Create First Entry');
        });
    });

    describe('renderGratitudePrompts', () => {
        it('should render gratitude prompts grid', () => {
            const prompts = [
                {
                    prompt: 'What are you grateful for today?',
                    category: 'daily'
                },
                {
                    prompt: 'What relationships are you thankful for?',
                    category: 'relationships'
                }
            ];

            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            gratitudeUI.renderGratitudePrompts(prompts);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.gratitudePromptsContent, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('What are you grateful for today?');
            expect(html).toContain('What relationships are you thankful for?');
            expect(html).toContain('daily');
            expect(html).toContain('relationships');
            expect(html).toContain('Use Prompt');
        });

        it('should render empty state when no prompts', () => {
            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            gratitudeUI.renderGratitudePrompts([]);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.gratitudePromptsContent, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('No Prompts Available');
            expect(html).toContain('Try refreshing or check back later');
        });
    });

    describe('renderAchievementGratitudePrompts', () => {
        it('should render achievement-based gratitude prompts', () => {
            const prompts = [
                {
                    prompt: 'What achievement from this week are you grateful for?',
                    context: 'Weekly accomplishments',
                    gratitude_angle: 'This achievement shows your growth and dedication'
                }
            ];

            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            gratitudeUI.renderAchievementGratitudePrompts(prompts);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.achievementGratitudeContent, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('What achievement from this week are you grateful for?');
            expect(html).toContain('Weekly accomplishments');
            expect(html).toContain('Future Perspective:');
            expect(html).toContain('This achievement shows your growth and dedication');
        });

        it('should render empty state when no achievement prompts', () => {
            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            gratitudeUI.renderAchievementGratitudePrompts([]);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.achievementGratitudeContent, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('No Achievement Prompts');
            expect(html).toContain('Complete some tasks or achievements to see gratitude prompts');
        });
    });

    describe('showGratitudeModal', () => {
        it('should show gratitude modal', () => {
            gratitudeUI.showGratitudeModal();

            expect(mockElements.gratitudeModal.style.display).toBe('block');
        });
    });

    describe('hideGratitudeModal', () => {
        it('should hide gratitude modal', () => {
            gratitudeUI.hideGratitudeModal();

            expect(mockElements.gratitudeModal.style.display).toBe('none');
        });
    });

    describe('getGratitudeFormData', () => {
        it('should get form data from gratitude form elements', () => {
            // Mock form data
            const mockFormData = {
                get: jest.fn().mockImplementation((key) => {
                    switch (key) {
                        case 'gratitude_date': return '2025-01-15';
                        case 'category': return 'personal';
                        case 'prompt': return 'Test prompt';
                        case 'response': return 'Test response';
                        case 'mood_before': return '6';
                        case 'mood_after': return '8';
                        case 'tags': return 'test,gratitude';
                        default: return null;
                    }
                })
            };

            // Mock FormData constructor
            global.FormData = jest.fn().mockReturnValue(mockFormData);
            gratitudeUI.elements.gratitudeForm = mockFormData;

            const result = gratitudeUI.getGratitudeFormData();

            expect(result).toEqual({
                gratitude_date: '2025-01-15',
                category: 'personal',
                prompt: 'Test prompt',
                response: 'Test response',
                mood_before: 6,
                mood_after: 8,
                tags: 'test,gratitude'
            });
        });
    });

    describe('setGratitudeFormData', () => {
        it('should set form data for editing', () => {
            const entry = {
                gratitude_date: '2025-01-15',
                category: 'personal',
                prompt: 'Test prompt',
                response: 'Test response',
                mood_before: 6,
                mood_after: 8,
                tags: 'test,gratitude'
            };

            gratitudeUI.setGratitudeFormData(entry);

            expect(mockElements.gratitudeDate.value).toBe('2025-01-15');
            expect(mockElements.gratitudeCategory.value).toBe('personal');
            expect(mockElements.gratitudePrompt.value).toBe('Test prompt');
            expect(mockElements.gratitudeResponse.value).toBe('Test response');
            expect(mockElements.gratitudeMoodBefore.value).toBe(6);
            expect(mockElements.gratitudeMoodBeforeValue.textContent).toBe('6');
            expect(mockElements.gratitudeMoodAfter.value).toBe(8);
            expect(mockElements.gratitudeMoodAfterValue.textContent).toBe('8');
            expect(mockElements.gratitudeTags.value).toBe('test,gratitude');
        });
    });

    describe('bindNavigationEvents', () => {
        it('should bind all navigation events', () => {
            gratitudeUI.bindNavigationEvents();

            expect(typeof mockElements.newGratitudeEntryBtn.onclick).toBe('function');
            expect(typeof mockElements.gratitudePromptsBtn.onclick).toBe('function');
            expect(typeof mockElements.gratitudeStatsBtn.onclick).toBe('function');
        });

        it('should bind modal close handlers', () => {
            gratitudeUI.bindNavigationEvents();

            expect(typeof mockElements.gratitudeModal.onclick).toBe('function');
        });

        it('should bind mood slider handlers', () => {
            gratitudeUI.bindNavigationEvents();

            expect(typeof mockElements.gratitudeMoodBefore.oninput).toBe('function');
            expect(typeof mockElements.gratitudeMoodAfter.oninput).toBe('function');
        });
    });

    describe('cleanup', () => {
        it('should destroy all chart instances', () => {
            gratitudeUI.chartInstances = {
                gratitudeTrends: { destroy: jest.fn() },
                moodProgress: { destroy: jest.fn() },
                categoryDistribution: { destroy: jest.fn() },
                consistency: { destroy: jest.fn() }
            };

            gratitudeUI.cleanup();

            expect(gratitudeUI.chartInstances.gratitudeTrends.destroy).toHaveBeenCalled();
            expect(gratitudeUI.chartInstances.moodProgress.destroy).toHaveBeenCalled();
            expect(gratitudeUI.chartInstances.categoryDistribution.destroy).toHaveBeenCalled();
            expect(gratitudeUI.chartInstances.consistency.destroy).toHaveBeenCalled();
            expect(gratitudeUI.chartInstances).toEqual({});
        });
    });

    describe('getCurrentSection', () => {
        it('should return current section', () => {
            gratitudeUI.currentSection = 'overview';
            expect(gratitudeUI.getCurrentSection()).toBe('overview');
        });
    });

    describe('setCurrentSection', () => {
        it('should set current section', () => {
            gratitudeUI.setCurrentSection('prompts');
            expect(gratitudeUI.currentSection).toBe('prompts');
        });
    });
});


