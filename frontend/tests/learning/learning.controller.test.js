/**
 * Learning Controller Tests
 * Tests the LearningController class functionality
 */

import { LearningController } from '../../js/modules/learning/learning.controller.js';
import { LearningApi } from '../../js/modules/learning/learning.api.js';

// Mock the LearningApi
jest.mock('../../js/modules/learning/learning.api.js', () => ({
    LearningApi: jest.fn().mockImplementation(() => ({
        getLearningStats: jest.fn(),
        getLearningPaths: jest.fn(),
        getSkillGapsAnalysis: jest.fn(),
        getLearningProgressTrends: jest.fn(),
        getPersonalizedRecommendations: jest.fn(),
        createLearningPath: jest.fn(),
        updateLearningPath: jest.fn(),
        deleteLearningPath: jest.fn(),
        getLearningPath: jest.fn(),
        updateLearningProgress: jest.fn(),
        getLearningPathsByStatus: jest.fn(),
        getLearningPathsBySkill: jest.fn(),
        getLearningPathsByDifficulty: jest.fn(),
        getLearningStats: jest.fn(),
        getSkillGapsAnalysis: jest.fn(),
        getLearningProgressTrends: jest.fn(),
        calculateLearningStats: jest.fn()
    }))
}));

// Mock the LearningUI
jest.mock('../../js/modules/learning/learning.ui.js', () => ({
    LearningUI: jest.fn().mockImplementation(() => ({
        showLoading: jest.fn(),
        hideLoading: jest.fn(),
        showError: jest.fn(),
        showSuccess: jest.fn(),
        renderLearningStats: jest.fn(),
        renderLearningPaths: jest.fn(),
        renderSkillProgressChart: jest.fn(),
        renderLearningTrendsChart: jest.fn(),
        renderDifficultyDistributionChart: jest.fn(),
        renderLearningRecommendations: jest.fn(),
        showLearningPaths: jest.fn(),
        showNewLearningPathModal: jest.fn(),
        showProgressUpdateModal: jest.fn(),
        bindNavigationEvents: jest.fn(),
        cleanup: jest.fn(),
        elements: {}
    }))
}));

describe('LearningController', () => {
    let learningController;
    let mockApi;
    let mockUI;

    beforeEach(() => {
        // Create mock instances
        mockApi = new LearningApi();
        mockUI = new (jest.requireMock('../../js/modules/learning/learning.ui.js').LearningUI)();

        // Create controller instance
        learningController = new LearningController({});

        // Replace the API and UI with our mocks
        learningController.api = mockApi;
        learningController.ui = mockUI;

        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('should initialize controller correctly', async () => {
            const mockStats = { summary: { total_paths: 5 } };
            const mockPaths = [{ id: 1, path_name: 'Test Path' }];
            const mockSkillGaps = { skill_distribution: [] };
            const mockTrends = { daily_progress: [] };
            const mockDifficultyData = [];

            mockApi.getLearningStats.mockResolvedValue(mockStats);
            mockApi.getLearningPaths.mockResolvedValue(mockPaths);
            mockApi.getSkillGapsAnalysis.mockResolvedValue(mockSkillGaps);
            mockApi.getLearningProgressTrends.mockResolvedValue(mockTrends);

            await learningController.initialize();

            expect(mockApi.getLearningStats).toHaveBeenCalledTimes(1);
            expect(mockApi.getLearningPaths).toHaveBeenCalledTimes(1);
            expect(mockUI.renderLearningStats).toHaveBeenCalledWith(mockStats);
            expect(mockUI.renderLearningPaths).toHaveBeenCalledWith(mockPaths);
            expect(mockUI.renderSkillProgressChart).toHaveBeenCalledWith(mockSkillGaps.skill_distribution);
            expect(mockUI.renderLearningTrendsChart).toHaveBeenCalledWith(mockTrends.daily_progress);
            expect(mockUI.renderDifficultyDistributionChart).toHaveBeenCalledWith(mockDifficultyData);
            expect(mockUI.bindNavigationEvents).toHaveBeenCalledTimes(1);
        });

        it('should handle initialization errors gracefully', async () => {
            const error = new Error('Initialization Error');
            mockApi.getLearningStats.mockRejectedValue(error);

            await learningController.initialize();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load learning data');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('getPersonalizedRecommendations', () => {
        it('should get and render personalized recommendations', async () => {
            const mockRecommendations = {
                recommendations: [
                    { type: 'skill_gap', title: 'Improve JS', priority: 'high' }
                ]
            };
            mockApi.getPersonalizedRecommendations.mockResolvedValue(mockRecommendations);

            await learningController.getPersonalizedRecommendations();

            expect(mockApi.getPersonalizedRecommendations).toHaveBeenCalledTimes(1);
            expect(mockUI.renderLearningRecommendations).toHaveBeenCalledWith(mockRecommendations.recommendations);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should handle recommendation errors gracefully', async () => {
            const error = new Error('Recommendation Error');
            mockApi.getPersonalizedRecommendations.mockRejectedValue(error);

            await learningController.getPersonalizedRecommendations();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to get learning recommendations');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('refreshRecommendations', () => {
        it('should refresh recommendations', async () => {
            learningController.getPersonalizedRecommendations = jest.fn();

            await learningController.refreshRecommendations();

            expect(learningController.getPersonalizedRecommendations).toHaveBeenCalledTimes(1);
        });
    });

    describe('showLearningPaths', () => {
        it('should show learning paths section', async () => {
            const mockPaths = [{ id: 1, path_name: 'Test Path' }];
            mockApi.getLearningPaths.mockResolvedValue(mockPaths);

            await learningController.showLearningPaths();

            expect(mockApi.getLearningPaths).toHaveBeenCalledTimes(1);
            expect(mockUI.renderLearningPaths).toHaveBeenCalledWith(mockPaths);
            expect(mockUI.showLearningPaths).toHaveBeenCalledTimes(1);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should handle errors when showing learning paths', async () => {
            const error = new Error('Load Error');
            mockApi.getLearningPaths.mockRejectedValue(error);

            await learningController.showLearningPaths();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load learning paths');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('createLearningPath', () => {
        it('should create learning path successfully', async () => {
            const pathData = {
                path_name: 'New Path',
                skill_focus: 'javascript',
                path_description: 'Test path'
            };
            const mockNewPath = { id: 'path-123', ...pathData };
            mockApi.createLearningPath.mockResolvedValue(mockNewPath);
            learningController.loadLearningData = jest.fn();

            const result = await learningController.createLearningPath(pathData);

            expect(mockApi.createLearningPath).toHaveBeenCalledWith(pathData);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Learning path created successfully');
            expect(learningController.loadLearningData).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockNewPath);
        });

        it('should validate required fields', async () => {
            await learningController.createLearningPath({ path_name: '' });

            expect(mockUI.showError).toHaveBeenCalledWith('Learning path name is required');
            expect(mockApi.createLearningPath).not.toHaveBeenCalled();
        });

        it('should validate skill focus', async () => {
            await learningController.createLearningPath({ path_name: 'Test Path' });

            expect(mockUI.showError).toHaveBeenCalledWith('Skill focus is required');
            expect(mockApi.createLearningPath).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const pathData = {
                path_name: 'New Path',
                skill_focus: 'javascript'
            };
            const error = new Error('API Error');
            mockApi.createLearningPath.mockRejectedValue(error);
            learningController.loadLearningData = jest.fn();

            await learningController.createLearningPath(pathData);

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to create learning path');
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('updateLearningPath', () => {
        it('should update learning path successfully', async () => {
            const updateData = {
                path_name: 'Updated Path',
                skill_focus: 'javascript'
            };
            const mockUpdatedPath = { id: 'path-123', ...updateData };
            mockApi.updateLearningPath.mockResolvedValue(mockUpdatedPath);
            learningController.loadLearningData = jest.fn();

            const result = await learningController.updateLearningPath('path-123', updateData);

            expect(mockApi.updateLearningPath).toHaveBeenCalledWith('path-123', updateData);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Learning path updated successfully');
            expect(learningController.loadLearningData).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockUpdatedPath);
        });

        it('should validate required fields', async () => {
            await learningController.updateLearningPath('path-123', { path_name: '' });

            expect(mockUI.showError).toHaveBeenCalledWith('Learning path name is required');
            expect(mockApi.updateLearningPath).not.toHaveBeenCalled();
        });
    });

    describe('deleteLearningPath', () => {
        it('should delete learning path successfully', async () => {
            const mockResponse = { success: true };
            mockApi.deleteLearningPath.mockResolvedValue(mockResponse);
            learningController.loadLearningData = jest.fn();

            // Mock confirm to return true
            global.confirm = jest.fn().mockReturnValue(true);

            await learningController.deleteLearningPath('path-123');

            expect(mockApi.deleteLearningPath).toHaveBeenCalledWith('path-123');
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Learning path deleted successfully');
            expect(learningController.loadLearningData).toHaveBeenCalledTimes(1);
        });

        it('should not delete when user cancels', async () => {
            // Mock confirm to return false
            global.confirm = jest.fn().mockReturnValue(false);

            await learningController.deleteLearningPath('path-123');

            expect(mockApi.deleteLearningPath).not.toHaveBeenCalled();
            expect(mockUI.showSuccess).not.toHaveBeenCalled();
            expect(learningController.loadLearningData).not.toHaveBeenCalled();
        });
    });

    describe('editLearningPath', () => {
        it('should show edit modal for existing path', async () => {
            const mockPath = { id: 'path-123', path_name: 'Test Path' };
            mockApi.getLearningPath.mockResolvedValue(mockPath);

            await learningController.editLearningPath('path-123');

            expect(mockApi.getLearningPath).toHaveBeenCalledWith('path-123');
            expect(mockUI.showNewLearningPathModal).toHaveBeenCalledWith(mockPath);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should show error when path not found', async () => {
            mockApi.getLearningPath.mockResolvedValue(null);

            await learningController.editLearningPath('path-123');

            expect(mockUI.showError).toHaveBeenCalledWith('Learning path not found');
        });
    });

    describe('updateLearningProgress', () => {
        it('should show progress update modal for existing path', async () => {
            const mockPath = { id: 'path-123', path_name: 'Test Path' };
            mockApi.getLearningPath.mockResolvedValue(mockPath);

            await learningController.updateLearningProgress('path-123');

            expect(mockApi.getLearningPath).toHaveBeenCalledWith('path-123');
            expect(mockUI.showProgressUpdateModal).toHaveBeenCalledWith(mockPath);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });
    });

    describe('updateLearningProgressValue', () => {
        it('should update progress successfully', async () => {
            const mockUpdatedPath = { id: 'path-123', progress_percentage: 75 };
            mockApi.updateLearningProgress.mockResolvedValue(mockUpdatedPath);
            learningController.loadLearningData = jest.fn();

            const result = await learningController.updateLearningProgressValue('path-123', 75);

            expect(mockApi.updateLearningProgress).toHaveBeenCalledWith('path-123', 75);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Progress updated successfully');
            expect(learningController.loadLearningData).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockUpdatedPath);
        });

        it('should validate progress range', async () => {
            await learningController.updateLearningProgressValue('path-123', 150);

            expect(mockUI.showError).toHaveBeenCalledWith('Progress must be between 0 and 100');
            expect(mockApi.updateLearningProgress).not.toHaveBeenCalled();
        });
    });

    describe('createLearningPathForSkill', () => {
        it('should create learning path for skill gap', async () => {
            const pathData = {
                path_name: 'javascript Improvement Path',
                path_description: 'Focused learning path to improve javascript skills',
                skill_focus: 'javascript',
                difficulty_level: 'beginner',
                estimated_duration_hours: 20,
                completion_criteria: 'Complete 1 levels of javascript practice'
            };
            learningController.createLearningPath = jest.fn();

            await learningController.createLearningPathForSkill('javascript', 1);

            expect(learningController.createLearningPath).toHaveBeenCalledWith(pathData);
        });
    });

    describe('createLearningPathFromRecommendation', () => {
        it('should create learning path from recommendation', async () => {
            const pathData = {
                path_name: 'JS Advanced',
                path_description: 'Advanced JS concepts',
                skill_focus: 'javascript',
                difficulty_level: 'intermediate',
                estimated_duration_hours: 40,
                completion_criteria: 'Complete all JS Advanced learning objectives'
            };
            learningController.createLearningPath = jest.fn();

            await learningController.createLearningPathFromRecommendation('javascript', 'JS Advanced', 'Advanced JS concepts', 40);

            expect(learningController.createLearningPath).toHaveBeenCalledWith(pathData);
        });
    });

    describe('actOnRecommendation', () => {
        it('should handle skill_gap recommendation', async () => {
            learningController.createLearningPathForSkill = jest.fn();

            await learningController.actOnRecommendation('skill_gap', 'Improve JavaScript');

            expect(learningController.createLearningPathForSkill).toHaveBeenCalledWith('JavaScript', 1);
        });

        it('should handle low_progress recommendation', async () => {
            learningController.actOnRecommendation('low_progress', 'Resume React Path');

            expect(mockUI.showSuccess).toHaveBeenCalledWith('Opening React Path for progress update');
        });

        it('should handle progression recommendation', async () => {
            const pathData = {
                path_name: 'Intermediate Skills Challenge',
                path_description: 'Take your learning to the next level with intermediate challenges',
                skill_focus: 'general',
                difficulty_level: 'intermediate',
                estimated_duration_hours: 40,
                completion_criteria: 'Complete 3 intermediate-level projects'
            };
            learningController.createLearningPath = jest.fn();

            await learningController.actOnRecommendation('progression', 'Level up learning');

            expect(learningController.createLearningPath).toHaveBeenCalledWith(pathData);
        });

        it('should handle unknown recommendation type', async () => {
            await learningController.actOnRecommendation('unknown', 'Test recommendation');

            expect(mockUI.showSuccess).toHaveBeenCalledWith('Recommendation acknowledged');
        });
    });

    describe('getLearningPathsByStatus', () => {
        it('should get learning paths by status', async () => {
            const mockPaths = [{ id: 1, status: 'completed' }];
            mockApi.getLearningPaths.mockResolvedValue(mockPaths);

            const result = await learningController.getLearningPathsByStatus('completed');

            expect(mockApi.getLearningPaths).toHaveBeenCalledWith('completed');
            expect(result).toEqual(mockPaths);
        });
    });

    describe('getLearningPathsBySkill', () => {
        it('should get learning paths by skill', async () => {
            const mockPaths = [{ id: 1, skill_focus: 'javascript' }];
            mockApi.getLearningPathsBySkill.mockResolvedValue(mockPaths);

            const result = await learningController.getLearningPathsBySkill('javascript');

            expect(mockApi.getLearningPathsBySkill).toHaveBeenCalledWith('javascript');
            expect(result).toEqual(mockPaths);
        });
    });

    describe('getLearningPathsByDifficulty', () => {
        it('should get learning paths by difficulty', async () => {
            const mockPaths = [{ id: 1, difficulty_level: 'intermediate' }];
            mockApi.getLearningPathsByDifficulty.mockResolvedValue(mockPaths);

            const result = await learningController.getLearningPathsByDifficulty('intermediate');

            expect(mockApi.getLearningPathsByDifficulty).toHaveBeenCalledWith('intermediate');
            expect(result).toEqual(mockPaths);
        });
    });

    describe('showNewLearningPathModal', () => {
        it('should show new learning path modal', () => {
            learningController.showNewLearningPathModal();

            expect(mockUI.showNewLearningPathModal).toHaveBeenCalledTimes(1);
        });
    });

    describe('getLearningStats', () => {
        it('should get learning statistics', async () => {
            const mockStats = { summary: { total_paths: 5 } };
            mockApi.getLearningStats.mockResolvedValue(mockStats);

            const result = await learningController.getLearningStats();

            expect(mockApi.getLearningStats).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockStats);
        });
    });

    describe('getSkillGapsAnalysis', () => {
        it('should get skill gaps analysis', async () => {
            const mockAnalysis = { skill_distribution: [] };
            mockApi.getSkillGapsAnalysis.mockResolvedValue(mockAnalysis);

            const result = await learningController.getSkillGapsAnalysis();

            expect(mockApi.getSkillGapsAnalysis).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockAnalysis);
        });
    });

    describe('getLearningProgressTrends', () => {
        it('should get learning progress trends', async () => {
            const mockTrends = { daily_progress: [] };
            mockApi.getLearningProgressTrends.mockResolvedValue(mockTrends);

            const result = await learningController.getLearningProgressTrends(30);

            expect(mockApi.getLearningProgressTrends).toHaveBeenCalledWith(30);
            expect(result).toEqual(mockTrends);
        });
    });

    describe('cleanup', () => {
        it('should cleanup UI resources', () => {
            learningController.cleanup();

            expect(mockUI.cleanup).toHaveBeenCalledTimes(1);
        });
    });

    describe('exportLearningData', () => {
        it('should export learning data successfully', async () => {
            const mockStats = { summary: { total_paths: 5 } };
            const mockPaths = [{ id: 1, path_name: 'Test' }];
            const mockSkillGaps = { skill_distribution: [] };

            mockApi.getLearningStats.mockResolvedValue(mockStats);
            mockApi.getLearningPaths.mockResolvedValue(mockPaths);
            mockApi.getSkillGapsAnalysis.mockResolvedValue(mockSkillGaps);

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

            await learningController.exportLearningData();

            expect(mockUI.showSuccess).toHaveBeenCalledWith('Learning data exported successfully');
        });

        it('should handle export errors gracefully', async () => {
            const error = new Error('Export Error');
            mockApi.getLearningStats.mockRejectedValue(error);

            await learningController.exportLearningData();

            expect(mockUI.showError).toHaveBeenCalledWith('Failed to export learning data');
        });
    });
});


