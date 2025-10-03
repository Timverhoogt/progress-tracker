/**
 * Learning UI Tests
 * Tests the LearningUI class functionality
 */

import { LearningUI } from '../../js/modules/learning/learning.ui.js';
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

describe('LearningUI', () => {
    let learningUI;
    let mockElements;

    beforeEach(() => {
        // Mock DOM elements
        mockElements = {
            learningRecommendationsBtn: { onclick: null },
            learningPathsBtn: { onclick: null },
            newLearningPathBtn: { onclick: null },
            learningOverview: { style: {} },
            learningPathsSection: { style: {} },
            learningRecommendationsContent: { innerHTML: '' },
            learningPathsGrid: { innerHTML: '' },
            totalLearningPaths: { textContent: '0' },
            completedLearningPaths: { textContent: '0' },
            activeLearningPaths: { textContent: '0' },
            avgProgress: { textContent: '0%' },
            totalLearningHours: { textContent: '0' },
            skillProgressChart: { getContext: jest.fn().mockReturnValue({}) },
            learningTrendsChart: { getContext: jest.fn().mockReturnValue({}) },
            difficultyDistributionChart: { getContext: jest.fn().mockReturnValue({}) },
            loadingOverlay: { style: {} }
        };

        // Mock DOMUtils.getElement to return mock elements
        DOMUtils.getElement.mockImplementation((selector) => {
            switch (selector) {
                case '#learningRecommendationsBtn': return mockElements.learningRecommendationsBtn;
                case '#learningPathsBtn': return mockElements.learningPathsBtn;
                case '#newLearningPathBtn': return mockElements.newLearningPathBtn;
                case '.learning-overview': return mockElements.learningOverview;
                case '#learningPathsSection': return mockElements.learningPathsSection;
                case '#learningRecommendationsContent': return mockElements.learningRecommendationsContent;
                case '#learningPathsGrid': return mockElements.learningPathsGrid;
                case '#totalLearningPaths': return mockElements.totalLearningPaths;
                case '#completedLearningPaths': return mockElements.completedLearningPaths;
                case '#activeLearningPaths': return mockElements.activeLearningPaths;
                case '#avgProgress': return mockElements.avgProgress;
                case '#totalLearningHours': return mockElements.totalLearningHours;
                case '#skillProgressChart': return mockElements.skillProgressChart;
                case '#learningTrendsChart': return mockElements.learningTrendsChart;
                case '#difficultyDistributionChart': return mockElements.difficultyDistributionChart;
                case '#loadingOverlay': return mockElements.loadingOverlay;
                default: return null;
            }
        });

        // Mock Chart constructor
        global.Chart = jest.fn().mockImplementation(() => ({
            destroy: jest.fn()
        }));

        learningUI = new LearningUI();
        jest.clearAllMocks();
    });

    describe('initializeElements', () => {
        it('should initialize all DOM elements correctly', () => {
            expect(learningUI.elements.learningRecommendationsBtn).toBe(mockElements.learningRecommendationsBtn);
            expect(learningUI.elements.learningPathsBtn).toBe(mockElements.learningPathsBtn);
            expect(learningUI.elements.newLearningPathBtn).toBe(mockElements.newLearningPathBtn);
            expect(learningUI.elements.learningOverview).toBe(mockElements.learningOverview);
            expect(learningUI.elements.learningPathsSection).toBe(mockElements.learningPathsSection);
            expect(learningUI.elements.learningRecommendationsContent).toBe(mockElements.learningRecommendationsContent);
            expect(learningUI.elements.learningPathsGrid).toBe(mockElements.learningPathsGrid);
            expect(learningUI.elements.totalLearningPaths).toBe(mockElements.totalLearningPaths);
            expect(learningUI.elements.completedLearningPaths).toBe(mockElements.completedLearningPaths);
            expect(learningUI.elements.activeLearningPaths).toBe(mockElements.activeLearningPaths);
            expect(learningUI.elements.avgProgress).toBe(mockElements.avgProgress);
            expect(learningUI.elements.totalLearningHours).toBe(mockElements.totalLearningHours);
        });
    });

    describe('renderLearningStats', () => {
        it('should update all statistics elements', () => {
            const stats = {
                summary: {
                    total_paths: 5,
                    completed_paths: 2,
                    active_paths: 3,
                    overall_avg_progress: 67
                }
            };

            learningUI.renderLearningStats(stats);

            expect(DOMUtils.setText).toHaveBeenCalledWith(mockElements.totalLearningPaths, 5);
            expect(DOMUtils.setText).toHaveBeenCalledWith(mockElements.completedLearningPaths, 2);
            expect(DOMUtils.setText).toHaveBeenCalledWith(mockElements.activeLearningPaths, 3);
            expect(DOMUtils.setText).toHaveBeenCalledWith(mockElements.avgProgress, '67%');
        });
    });

    describe('renderLearningRecommendations', () => {
        it('should render recommendations list', () => {
            const recommendations = [
                {
                    type: 'skill_gap',
                    priority: 'high',
                    title: 'Improve JavaScript',
                    description: 'Focus on JavaScript skills',
                    action: 'Create learning path',
                    estimated_time: '2 weeks'
                }
            ];

            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            learningUI.renderLearningRecommendations(recommendations);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.learningRecommendationsContent, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('Improve JavaScript');
            expect(html).toContain('skill_gap');
            expect(html).toContain('high');
        });

        it('should render empty state when no recommendations', () => {
            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            learningUI.renderLearningRecommendations([]);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.learningRecommendationsContent, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('No Recommendations Yet');
            expect(html).toContain('Get AI Recommendations');
        });
    });

    describe('getRecommendationIcon', () => {
        it('should return correct icons for different recommendation types', () => {
            expect(learningUI.getRecommendationIcon('skill_gap')).toBe('target');
            expect(learningUI.getRecommendationIcon('low_progress')).toBe('exclamation-triangle');
            expect(learningUI.getRecommendationIcon('progression')).toBe('arrow-up');
            expect(learningUI.getRecommendationIcon('new_skill')).toBe('plus-circle');
            expect(learningUI.getRecommendationIcon('review')).toBe('redo-alt');
            expect(learningUI.getRecommendationIcon('unknown')).toBe('lightbulb');
        });
    });

    describe('renderLearningPaths', () => {
        it('should render learning paths grid', () => {
            const paths = [
                {
                    id: 'path-123',
                    path_name: 'JavaScript Basics',
                    status: 'in_progress',
                    skill_focus: 'javascript',
                    difficulty_level: 'beginner',
                    progress_percentage: 75,
                    path_description: 'Learn JS fundamentals'
                }
            ];

            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            learningUI.renderLearningPaths(paths);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.learningPathsGrid, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('JavaScript Basics');
            expect(html).toContain('in_progress');
            expect(html).toContain('beginner');
            expect(html).toContain('75%');
        });

        it('should render empty state when no paths', () => {
            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            learningUI.renderLearningPaths([]);

            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.learningPathsGrid, expect.any(String));
            const html = DOMUtils.setHTML.mock.calls[0][1];
            expect(html).toContain('No Learning Paths Yet');
            expect(html).toContain('Create Learning Path');
        });
    });

    describe('renderSkillProgressChart', () => {
        it('should create and store chart instance', () => {
            const skillData = [
                { skill: 'JavaScript', completion_rate: 80, needs_attention: false },
                { skill: 'React', completion_rate: 40, needs_attention: true }
            ];

            learningUI.renderSkillProgressChart(skillData);

            expect(global.Chart).toHaveBeenCalledTimes(1);
            expect(learningUI.chartInstances.skillProgress).toBeDefined();
        });

        it('should destroy existing chart before creating new one', () => {
            const skillData = [
                { skill: 'JavaScript', completion_rate: 80, needs_attention: false }
            ];

            // Create first chart
            learningUI.chartInstances.skillProgress = { destroy: jest.fn() };
            learningUI.renderSkillProgressChart(skillData);

            expect(learningUI.chartInstances.skillProgress.destroy).toHaveBeenCalled();
            expect(global.Chart).toHaveBeenCalledTimes(1);
        });
    });

    describe('renderLearningTrendsChart', () => {
        it('should create and store trends chart instance', () => {
            const trendData = [
                { date: '2025-01-15', paths_created: 2, paths_completed: 1 }
            ];

            learningUI.renderLearningTrendsChart(trendData);

            expect(global.Chart).toHaveBeenCalledTimes(1);
            expect(learningUI.chartInstances.learningTrends).toBeDefined();
        });
    });

    describe('renderDifficultyDistributionChart', () => {
        it('should create and store difficulty chart instance', () => {
            const difficultyData = [
                { difficulty: 'beginner', count: 3 },
                { difficulty: 'intermediate', count: 2 }
            ];

            learningUI.renderDifficultyDistributionChart(difficultyData);

            expect(global.Chart).toHaveBeenCalledTimes(1);
            expect(learningUI.chartInstances.difficultyDistribution).toBeDefined();
        });
    });

    describe('showLearningPaths', () => {
        it('should show learning paths section and hide others', () => {
            learningUI.showLearningPaths();

            expect(mockElements.learningOverview.style.display).toBe('none');
            expect(mockElements.learningPathsSection.style.display).toBe('block');
            expect(learningUI.currentSection).toBe('paths');
        });
    });

    describe('hideAllSections', () => {
        it('should hide all sections', () => {
            learningUI.hideAllSections();

            expect(mockElements.learningOverview.style.display).toBe('none');
            expect(mockElements.learningPathsSection.style.display).toBe('none');
        });
    });

    describe('showNewLearningPathModal', () => {
        it('should create modal for new learning path', () => {
            // Mock document.body.appendChild
            document.body.appendChild = jest.fn();

            learningUI.showNewLearningPathModal();

            expect(document.body.appendChild).toHaveBeenCalled();
            const modalContainer = document.body.appendChild.mock.calls[0][0];
            expect(modalContainer.className).toBe('modal');
            expect(modalContainer.innerHTML).toContain('Create New Learning Path');
        });

        it('should create modal for editing learning path', () => {
            // Mock document.body.appendChild
            document.body.appendChild = jest.fn();

            const path = {
                id: 'path-123',
                path_name: 'Test Path',
                path_description: 'Test description',
                skill_focus: 'javascript',
                difficulty_level: 'intermediate',
                estimated_duration_hours: 40
            };

            learningUI.showNewLearningPathModal(path);

            expect(document.body.appendChild).toHaveBeenCalled();
            const modalContainer = document.body.appendChild.mock.calls[0][0];
            expect(modalContainer.innerHTML).toContain('Edit Learning Path');
            expect(modalContainer.innerHTML).toContain('Test Path');
            expect(modalContainer.innerHTML).toContain('Test description');
        });
    });

    describe('bindNavigationEvents', () => {
        it('should bind all navigation events', () => {
            learningUI.bindNavigationEvents();

            expect(typeof mockElements.learningRecommendationsBtn.onclick).toBe('function');
            expect(typeof mockElements.learningPathsBtn.onclick).toBe('function');
            expect(typeof mockElements.newLearningPathBtn.onclick).toBe('function');
        });
    });

    describe('cleanup', () => {
        it('should destroy all chart instances', () => {
            learningUI.chartInstances = {
                skillProgress: { destroy: jest.fn() },
                learningTrends: { destroy: jest.fn() },
                difficultyDistribution: { destroy: jest.fn() }
            };

            learningUI.cleanup();

            expect(learningUI.chartInstances.skillProgress.destroy).toHaveBeenCalled();
            expect(learningUI.chartInstances.learningTrends.destroy).toHaveBeenCalled();
            expect(learningUI.chartInstances.difficultyDistribution.destroy).toHaveBeenCalled();
            expect(learningUI.chartInstances).toEqual({});
        });
    });

    describe('getCurrentSection', () => {
        it('should return current section', () => {
            learningUI.currentSection = 'overview';
            expect(learningUI.getCurrentSection()).toBe('overview');
        });
    });

    describe('setCurrentSection', () => {
        it('should set current section', () => {
            learningUI.setCurrentSection('paths');
            expect(learningUI.currentSection).toBe('paths');
        });
    });
});


