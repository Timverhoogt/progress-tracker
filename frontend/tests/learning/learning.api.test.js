/**
 * Learning API Tests
 * Tests the LearningApi class functionality
 */

import { LearningApi } from '../../js/modules/learning/learning.api.js';

// Mock the core API
const mockApiClient = {
    learning: {
        getLearningStats: jest.fn(),
        getLearningRecommendations: jest.fn(),
        getLearningPaths: jest.fn(),
        getLearningPath: jest.fn(),
        createLearningPath: jest.fn(),
        updateLearningPath: jest.fn(),
        deleteLearningPath: jest.fn(),
        updateLearningProgress: jest.fn(),
        getBestPractices: jest.fn(),
        getBestPracticeCategories: jest.fn(),
        createBestPractice: jest.fn(),
        updateBestPractice: jest.fn(),
        useBestPractice: jest.fn()
    }
};

describe('LearningApi', () => {
    let learningApi;

    beforeEach(() => {
        learningApi = new LearningApi(mockApiClient);
        jest.clearAllMocks();
    });

    describe('getLearningStats', () => {
        it('should call the API client getLearningStats method', async () => {
            const mockStats = {
                summary: { total_paths: 5, completed_paths: 2 },
                by_difficulty: [{ difficulty: 'beginner', count: 3 }]
            };
            mockApiClient.learning.getLearningStats.mockResolvedValue(mockStats);

            const result = await learningApi.getLearningStats();

            expect(mockApiClient.learning.getLearningStats).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockStats);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApiClient.learning.getLearningStats.mockRejectedValue(error);

            await expect(learningApi.getLearningStats()).rejects.toThrow('API Error');
        });
    });

    describe('getLearningRecommendations', () => {
        it('should call the API client getLearningRecommendations method', async () => {
            const mockRecommendations = [
                { type: 'skill_gap', title: 'Improve JavaScript', priority: 'high' }
            ];
            mockApiClient.learning.getLearningRecommendations.mockResolvedValue(mockRecommendations);

            const result = await learningApi.getLearningRecommendations();

            expect(mockApiClient.learning.getLearningRecommendations).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockRecommendations);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApiClient.learning.getLearningRecommendations.mockRejectedValue(error);

            await expect(learningApi.getLearningRecommendations()).rejects.toThrow('API Error');
        });
    });

    describe('getLearningPaths', () => {
        it('should call the API client getLearningPaths method without status filter', async () => {
            const mockPaths = [
                { id: 1, path_name: 'JavaScript Basics', status: 'in_progress' }
            ];
            mockApiClient.learning.getLearningPaths.mockResolvedValue(mockPaths);

            const result = await learningApi.getLearningPaths();

            expect(mockApiClient.learning.getLearningPaths).toHaveBeenCalledWith(null);
            expect(result).toEqual(mockPaths);
        });

        it('should call the API client getLearningPaths method with status filter', async () => {
            const mockPaths = [
                { id: 1, path_name: 'JavaScript Basics', status: 'completed' }
            ];
            mockApiClient.learning.getLearningPaths.mockResolvedValue(mockPaths);

            const result = await learningApi.getLearningPaths('completed');

            expect(mockApiClient.learning.getLearningPaths).toHaveBeenCalledWith('completed');
            expect(result).toEqual(mockPaths);
        });
    });

    describe('getLearningPath', () => {
        it('should call the API client getLearningPath method', async () => {
            const mockPath = { id: 1, path_name: 'JavaScript Basics' };
            mockApiClient.learning.getLearningPath.mockResolvedValue(mockPath);

            const result = await learningApi.getLearningPath('path-123');

            expect(mockApiClient.learning.getLearningPath).toHaveBeenCalledWith('path-123');
            expect(result).toEqual(mockPath);
        });
    });

    describe('createLearningPath', () => {
        it('should call the API client createLearningPath method', async () => {
            const pathData = { path_name: 'New Path', skill_focus: 'javascript' };
            const mockNewPath = { id: 'path-123', ...pathData };
            mockApiClient.learning.createLearningPath.mockResolvedValue(mockNewPath);

            const result = await learningApi.createLearningPath(pathData);

            expect(mockApiClient.learning.createLearningPath).toHaveBeenCalledWith(pathData);
            expect(result).toEqual(mockNewPath);
        });
    });

    describe('updateLearningPath', () => {
        it('should call the API client updateLearningPath method', async () => {
            const updateData = { path_name: 'Updated Path' };
            const mockUpdatedPath = { id: 'path-123', path_name: 'Updated Path' };
            mockApiClient.learning.updateLearningPath.mockResolvedValue(mockUpdatedPath);

            const result = await learningApi.updateLearningPath('path-123', updateData);

            expect(mockApiClient.learning.updateLearningPath).toHaveBeenCalledWith('path-123', updateData);
            expect(result).toEqual(mockUpdatedPath);
        });
    });

    describe('deleteLearningPath', () => {
        it('should call the API client deleteLearningPath method', async () => {
            const mockResponse = { success: true };
            mockApiClient.learning.deleteLearningPath.mockResolvedValue(mockResponse);

            const result = await learningApi.deleteLearningPath('path-123');

            expect(mockApiClient.learning.deleteLearningPath).toHaveBeenCalledWith('path-123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('updateLearningProgress', () => {
        it('should call the API client updateLearningProgress method', async () => {
            const mockResponse = { success: true };
            mockApiClient.learning.updateLearningProgress.mockResolvedValue(mockResponse);

            const result = await learningApi.updateLearningProgress('path-123', 75);

            expect(mockApiClient.learning.updateLearningProgress).toHaveBeenCalledWith('path-123', 75);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getBestPractices', () => {
        it('should call the API client getBestPractices method without category', async () => {
            const mockPractices = [{ id: 1, practice_title: 'Best Practice 1' }];
            mockApiClient.learning.getBestPractices.mockResolvedValue(mockPractices);

            const result = await learningApi.getBestPractices();

            expect(mockApiClient.learning.getBestPractices).toHaveBeenCalledWith(null);
            expect(result).toEqual(mockPractices);
        });

        it('should call the API client getBestPractices method with category', async () => {
            const mockPractices = [{ id: 1, practice_title: 'Best Practice 1' }];
            mockApiClient.learning.getBestPractices.mockResolvedValue(mockPractices);

            const result = await learningApi.getBestPractices('javascript');

            expect(mockApiClient.learning.getBestPractices).toHaveBeenCalledWith('javascript');
            expect(result).toEqual(mockPractices);
        });
    });

    describe('getBestPracticeCategories', () => {
        it('should call the API client getBestPracticeCategories method', async () => {
            const mockCategories = ['javascript', 'python', 'react'];
            mockApiClient.learning.getBestPracticeCategories.mockResolvedValue(mockCategories);

            const result = await learningApi.getBestPracticeCategories();

            expect(mockApiClient.learning.getBestPracticeCategories).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockCategories);
        });
    });

    describe('createBestPractice', () => {
        it('should call the API client createBestPractice method', async () => {
            const practiceData = { practice_title: 'New Practice', practice_category: 'javascript' };
            const mockNewPractice = { id: 'practice-123', ...practiceData };
            mockApiClient.learning.createBestPractice.mockResolvedValue(mockNewPractice);

            const result = await learningApi.createBestPractice(practiceData);

            expect(mockApiClient.learning.createBestPractice).toHaveBeenCalledWith(practiceData);
            expect(result).toEqual(mockNewPractice);
        });
    });

    describe('updateBestPractice', () => {
        it('should call the API client updateBestPractice method', async () => {
            const updateData = { practice_title: 'Updated Practice' };
            const mockUpdatedPractice = { id: 'practice-123', practice_title: 'Updated Practice' };
            mockApiClient.learning.updateBestPractice.mockResolvedValue(mockUpdatedPractice);

            const result = await learningApi.updateBestPractice('practice-123', updateData);

            expect(mockApiClient.learning.updateBestPractice).toHaveBeenCalledWith('practice-123', updateData);
            expect(result).toEqual(mockUpdatedPractice);
        });
    });

    describe('useBestPractice', () => {
        it('should call the API client useBestPractice method', async () => {
            const mockResponse = { success: true };
            mockApiClient.learning.useBestPractice.mockResolvedValue(mockResponse);

            const result = await learningApi.useBestPractice('practice-123');

            expect(mockApiClient.learning.useBestPractice).toHaveBeenCalledWith('practice-123');
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getActiveLearningPaths', () => {
        it('should call getLearningPaths with "in_progress" status', async () => {
            const mockPaths = [{ id: 1, status: 'in_progress' }];
            mockApiClient.learning.getLearningPaths.mockResolvedValue(mockPaths);

            const result = await learningApi.getActiveLearningPaths();

            expect(mockApiClient.learning.getLearningPaths).toHaveBeenCalledWith('in_progress');
            expect(result).toEqual(mockPaths);
        });
    });

    describe('getCompletedLearningPaths', () => {
        it('should call getLearningPaths with "completed" status', async () => {
            const mockPaths = [{ id: 1, status: 'completed' }];
            mockApiClient.learning.getLearningPaths.mockResolvedValue(mockPaths);

            const result = await learningApi.getCompletedLearningPaths();

            expect(mockApiClient.learning.getLearningPaths).toHaveBeenCalledWith('completed');
            expect(result).toEqual(mockPaths);
        });
    });

    describe('getLearningPathsBySkill', () => {
        it('should filter paths by skill focus', async () => {
            const mockPaths = [
                { id: 1, path_name: 'JS Path', skill_focus: 'javascript' },
                { id: 2, path_name: 'React Path', skill_focus: 'react' },
                { id: 3, path_name: 'JS Advanced', skill_focus: 'javascript' }
            ];
            mockApiClient.learning.getLearningPaths.mockResolvedValue(mockPaths);

            const result = await learningApi.getLearningPathsBySkill('javascript');

            expect(mockApiClient.learning.getLearningPaths).toHaveBeenCalledWith(null);
            expect(result).toEqual([
                { id: 1, path_name: 'JS Path', skill_focus: 'javascript' },
                { id: 3, path_name: 'JS Advanced', skill_focus: 'javascript' }
            ]);
        });
    });

    describe('calculateLearningStats', () => {
        const mockPaths = [
            { id: 1, status: 'completed', progress_percentage: 100, difficulty_level: 'beginner' },
            { id: 2, status: 'in_progress', progress_percentage: 50, difficulty_level: 'intermediate' },
            { id: 3, status: 'completed', progress_percentage: 100, difficulty_level: 'beginner' }
        ];

        it('should calculate statistics correctly', () => {
            const stats = learningApi.calculateLearningStats(mockPaths);

            expect(stats.total_paths).toBe(3);
            expect(stats.completed_paths).toBe(2);
            expect(stats.active_paths).toBe(1);
            expect(stats.avg_progress).toBe(83); // (100 + 50 + 100) / 3
            expect(stats.total_estimated_hours).toBe(0); // No estimated hours in mock data
            expect(stats.by_difficulty).toHaveLength(2);
            expect(stats.recent_activity).toEqual([]);
        });

        it('should handle empty paths array', () => {
            const stats = learningApi.calculateLearningStats([]);

            expect(stats.total_paths).toBe(0);
            expect(stats.completed_paths).toBe(0);
            expect(stats.active_paths).toBe(0);
            expect(stats.avg_progress).toBe(0);
            expect(stats.total_estimated_hours).toBe(0);
            expect(stats.by_difficulty).toEqual([]);
            expect(stats.recent_activity).toEqual([]);
        });

        it('should handle null paths', () => {
            const stats = learningApi.calculateLearningStats(null);

            expect(stats.total_paths).toBe(0);
            expect(stats.completed_paths).toBe(0);
            expect(stats.active_paths).toBe(0);
            expect(stats.avg_progress).toBe(0);
            expect(stats.total_estimated_hours).toBe(0);
            expect(stats.by_difficulty).toEqual([]);
            expect(stats.recent_activity).toEqual([]);
        });
    });

    describe('getSkillGapsAnalysis', () => {
        it('should analyze skill gaps correctly', async () => {
            const mockPaths = [
                { id: 1, skill_focus: 'javascript', status: 'completed' },
                { id: 2, skill_focus: 'react', status: 'in_progress' },
                { id: 3, skill_focus: 'javascript', status: 'completed' },
                { id: 4, skill_focus: 'python', status: 'not_started' }
            ];
            mockApiClient.learning.getLearningPaths.mockResolvedValue(mockPaths);

            const result = await learningApi.getSkillGapsAnalysis();

            expect(mockApiClient.learning.getLearningPaths).toHaveBeenCalledWith(null);
            expect(result.skill_distribution).toHaveLength(3);
            expect(result.skill_gaps).toBeDefined();
            expect(result.overall_completion).toBeDefined();
        });
    });

    describe('getLearningProgressTrends', () => {
        it('should calculate progress trends correctly', async () => {
            const mockPaths = [
                { id: 1, created_at: '2025-01-15', status: 'completed' },
                { id: 2, created_at: '2025-01-16', status: 'in_progress' }
            ];
            mockApiClient.learning.getLearningPaths.mockResolvedValue(mockPaths);

            const result = await learningApi.getLearningProgressTrends(7);

            expect(mockApiClient.learning.getLearningPaths).toHaveBeenCalledWith(null);
            expect(result.daily_progress).toBeDefined();
            expect(result.total_created).toBe(2);
            expect(result.total_completed).toBe(1);
            expect(result.trend_data).toBeDefined();
        });
    });

    describe('getPersonalizedRecommendations', () => {
        it('should generate personalized recommendations', async () => {
            const mockStats = {
                summary: { total_paths: 3, completed_paths: 1 },
                by_difficulty: []
            };
            const mockPaths = [
                { id: 1, status: 'completed', skill_focus: 'javascript' },
                { id: 2, status: 'in_progress', skill_focus: 'react', progress_percentage: 20 }
            ];

            mockApiClient.learning.getLearningStats.mockResolvedValue(mockStats);
            mockApiClient.learning.getLearningPaths.mockResolvedValue(mockPaths);
            mockApiClient.learning.getLearningPaths.mockImplementation((status) => {
                if (status === null) return Promise.resolve(mockPaths);
                return Promise.resolve([]);
            });

            const result = await learningApi.getPersonalizedRecommendations();

            expect(result.recommendations).toBeDefined();
            expect(result.stats).toEqual(mockStats);
            expect(result.skill_gaps).toBeDefined();
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApiClient.learning.getLearningStats.mockRejectedValue(error);

            const result = await learningApi.getPersonalizedRecommendations();

            expect(result.recommendations).toEqual([]);
            expect(result.error).toBe('Failed to generate recommendations');
        });
    });
});


