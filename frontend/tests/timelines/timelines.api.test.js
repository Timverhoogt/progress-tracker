/**
 * Timelines API Tests
 * Tests the TimelinesApi class functionality
 */

import { TimelinesApi } from '../../js/modules/timelines/timelines.api.js';

// Mock the core API
const mockApiClient = {
    getTimeline: jest.fn(),
    createMilestone: jest.fn(),
    updateMilestone: jest.fn(),
    deleteMilestone: jest.fn(),
    estimateTimeline: jest.fn()
};

describe('TimelinesApi', () => {
    let timelinesApi;

    beforeEach(() => {
        timelinesApi = new TimelinesApi(mockApiClient);
        jest.clearAllMocks();
    });

    describe('getTimeline', () => {
        it('should call the API client getTimeline method', async () => {
            const mockTimelineData = {
                todos: [{ id: 1, title: 'Task 1', due_date: '2025-01-25' }],
                milestones: [{ id: 1, title: 'Milestone 1', target_date: '2025-01-30' }]
            };
            mockApiClient.getTimeline.mockResolvedValue(mockTimelineData);

            const result = await timelinesApi.getTimeline('project-123');

            expect(mockApiClient.getTimeline).toHaveBeenCalledWith('project-123');
            expect(mockApiClient.getTimeline).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockTimelineData);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApiClient.getTimeline.mockRejectedValue(error);

            await expect(timelinesApi.getTimeline('project-123')).rejects.toThrow('API Error');
        });
    });

    describe('createMilestone', () => {
        it('should call the API client createMilestone method', async () => {
            const mockMilestone = {
                id: 'milestone-123',
                title: 'New Milestone',
                target_date: '2025-01-30'
            };
            const milestoneData = {
                title: 'New Milestone',
                target_date: '2025-01-30',
                description: 'Test milestone'
            };
            mockApiClient.createMilestone.mockResolvedValue(mockMilestone);

            const result = await timelinesApi.createMilestone(milestoneData);

            expect(mockApiClient.createMilestone).toHaveBeenCalledWith(milestoneData);
            expect(mockApiClient.createMilestone).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockMilestone);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            const milestoneData = { title: 'New Milestone' };
            mockApiClient.createMilestone.mockRejectedValue(error);

            await expect(timelinesApi.createMilestone(milestoneData)).rejects.toThrow('API Error');
        });
    });

    describe('updateMilestone', () => {
        it('should call the API client updateMilestone method', async () => {
            const mockUpdatedMilestone = {
                id: 'milestone-123',
                title: 'Updated Milestone',
                target_date: '2025-02-01'
            };
            const updateData = {
                title: 'Updated Milestone',
                target_date: '2025-02-01'
            };
            mockApiClient.updateMilestone.mockResolvedValue(mockUpdatedMilestone);

            const result = await timelinesApi.updateMilestone('milestone-123', updateData);

            expect(mockApiClient.updateMilestone).toHaveBeenCalledWith('milestone-123', updateData);
            expect(mockApiClient.updateMilestone).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockUpdatedMilestone);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            const updateData = { title: 'Updated Milestone' };
            mockApiClient.updateMilestone.mockRejectedValue(error);

            await expect(timelinesApi.updateMilestone('milestone-123', updateData)).rejects.toThrow('API Error');
        });
    });

    describe('deleteMilestone', () => {
        it('should call the API client deleteMilestone method', async () => {
            const mockResponse = { success: true };
            mockApiClient.deleteMilestone.mockResolvedValue(mockResponse);

            const result = await timelinesApi.deleteMilestone('milestone-123');

            expect(mockApiClient.deleteMilestone).toHaveBeenCalledWith('milestone-123');
            expect(mockApiClient.deleteMilestone).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockResponse);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApiClient.deleteMilestone.mockRejectedValue(error);

            await expect(timelinesApi.deleteMilestone('milestone-123')).rejects.toThrow('API Error');
        });
    });

    describe('estimateTimeline', () => {
        it('should call the API client estimateTimeline method', async () => {
            const mockSuggestion = {
                success: true,
                data: {
                    timeline_summary: 'AI generated timeline',
                    milestones: []
                }
            };
            mockApiClient.estimateTimeline.mockResolvedValue(mockSuggestion);

            const result = await timelinesApi.estimateTimeline('project-123');

            expect(mockApiClient.estimateTimeline).toHaveBeenCalledWith('project-123');
            expect(mockApiClient.estimateTimeline).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockSuggestion);
        });

        it('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApiClient.estimateTimeline.mockRejectedValue(error);

            await expect(timelinesApi.estimateTimeline('project-123')).rejects.toThrow('API Error');
        });
    });

    describe('getTimelineItems', () => {
        it('should filter timeline items by time period', async () => {
            const mockTimelineData = {
                todos: [
                    { id: 1, title: 'Task 1', due_date: '2025-01-25', status: 'pending' },
                    { id: 2, title: 'Task 2', due_date: '2025-02-01', status: 'completed' }
                ],
                milestones: [
                    { id: 1, title: 'Milestone 1', target_date: '2025-01-30', status: 'planned' },
                    { id: 2, title: 'Milestone 2', target_date: '2025-02-15', status: 'in_progress' }
                ]
            };
            mockApiClient.getTimeline.mockResolvedValue(mockTimelineData);

            // Mock the filterTimelineItems method to test filtering logic
            const filteredResult = await timelinesApi.getTimelineItems('project-123', 'month');

            expect(mockApiClient.getTimeline).toHaveBeenCalledWith('project-123');
            expect(filteredResult).toHaveProperty('todos');
            expect(filteredResult).toHaveProperty('milestones');
        });
    });

    describe('getMilestones', () => {
        it('should return only milestones from timeline data', async () => {
            const mockTimelineData = {
                todos: [{ id: 1, title: 'Task 1' }],
                milestones: [
                    { id: 1, title: 'Milestone 1', target_date: '2025-01-30' },
                    { id: 2, title: 'Milestone 2', target_date: '2025-02-15' }
                ]
            };
            mockApiClient.getTimeline.mockResolvedValue(mockTimelineData);

            const result = await timelinesApi.getMilestones('project-123');

            expect(mockApiClient.getTimeline).toHaveBeenCalledWith('project-123');
            expect(result).toEqual(mockTimelineData.milestones);
        });
    });

    describe('getTodos', () => {
        it('should return only todos from timeline data', async () => {
            const mockTimelineData = {
                todos: [
                    { id: 1, title: 'Task 1', due_date: '2025-01-25' },
                    { id: 2, title: 'Task 2', due_date: '2025-02-01' }
                ],
                milestones: [{ id: 1, title: 'Milestone 1' }]
            };
            mockApiClient.getTimeline.mockResolvedValue(mockTimelineData);

            const result = await timelinesApi.getTodos('project-123');

            expect(mockApiClient.getTimeline).toHaveBeenCalledWith('project-123');
            expect(result).toEqual(mockTimelineData.todos);
        });
    });

    describe('filterTimelineItems', () => {
        const mockTimelineData = {
            todos: [
                { id: 1, title: 'Task 1', due_date: '2025-01-25', status: 'pending' },
                { id: 2, title: 'Task 2', due_date: '2025-02-01', status: 'completed' },
                { id: 3, title: 'Overdue Task', due_date: '2025-01-10', status: 'pending' }
            ],
            milestones: [
                { id: 1, title: 'Milestone 1', target_date: '2025-01-30', status: 'planned' },
                { id: 2, title: 'Completed Milestone', target_date: '2025-01-15', status: 'completed' },
                { id: 3, title: 'Overdue Milestone', target_date: '2025-01-10', status: 'in_progress' }
            ]
        };

        it('should return all items when filter is "all"', () => {
            const result = timelinesApi.filterTimelineItems(mockTimelineData, 'all');

            expect(result.todos).toHaveLength(3);
            expect(result.milestones).toHaveLength(3);
        });

        it('should filter items by week', () => {
            // Mock current date to be 2025-01-20
            const originalDate = Date;
            global.Date = class extends Date {
                constructor(...args) {
                    if (args.length === 0) {
                        super('2025-01-20T12:00:00');
                    } else {
                        super(...args);
                    }
                }
                static now() {
                    return new Date('2025-01-20T12:00:00').getTime();
                }
            };

            const result = timelinesApi.filterTimelineItems(mockTimelineData, 'week');

            expect(result.todos).toHaveLength(1); // Task 1 (Jan 25)
            expect(result.milestones).toHaveLength(1); // Milestone 1 (Jan 30)
            if (result.todos.length > 0) {
                expect(result.todos[0].title).toBe('Task 1');
            }
            if (result.milestones.length > 0) {
                expect(result.milestones[0].title).toBe('Milestone 1');
            }

            // Restore original Date
            global.Date = originalDate;
        });

        it('should filter overdue items', () => {
            // Mock current date to be 2025-01-20
            const originalDate = Date;
            global.Date = class extends Date {
                constructor(...args) {
                    if (args.length === 0) {
                        super('2025-01-20T12:00:00');
                    } else {
                        super(...args);
                    }
                }
            };

            const result = timelinesApi.filterTimelineItems(mockTimelineData, 'overdue');

            expect(result.todos).toHaveLength(1); // Overdue Task
            expect(result.milestones).toHaveLength(1); // Overdue Milestone

            // Restore original Date
            global.Date = originalDate;
        });

        it('should handle empty timeline data', () => {
            const result = timelinesApi.filterTimelineItems(null, 'all');

            expect(result).toEqual({ todos: [], milestones: [] });
        });
    });

    describe('calculateTimelineStats', () => {
        const mockTimelineData = {
            todos: [
                { id: 1, title: 'Task 1', due_date: '2025-01-25', status: 'completed' },
                { id: 2, title: 'Task 2', due_date: '2025-02-01', status: 'pending' },
                { id: 3, title: 'Overdue Task', due_date: '2025-01-10', status: 'pending' }
            ],
            milestones: [
                { id: 1, title: 'Milestone 1', target_date: '2025-01-30', status: 'completed' },
                { id: 2, title: 'Milestone 2', target_date: '2025-02-15', status: 'in_progress' },
                { id: 3, title: 'Overdue Milestone', target_date: '2025-01-10', status: 'planned' }
            ]
        };

        it('should calculate statistics correctly', () => {
            // Mock current date to be 2025-01-20
            const originalDate = Date;
            global.Date = class extends Date {
                constructor(...args) {
                    if (args.length === 0) {
                        super('2025-01-20T12:00:00');
                    } else {
                        super(...args);
                    }
                }
            };

            const stats = timelinesApi.calculateTimelineStats(mockTimelineData);

            expect(stats.todos.total).toBe(3);
            expect(stats.todos.completed).toBe(1);
            expect(stats.todos.overdue).toBe(1);
            expect(stats.todos.completionRate).toBe(33);

            expect(stats.milestones.total).toBe(3);
            expect(stats.milestones.completed).toBe(1);
            expect(stats.milestones.overdue).toBe(1);
            expect(stats.milestones.completionRate).toBe(33);

            // Restore original Date
            global.Date = originalDate;
        });

        it('should handle empty data', () => {
            const stats = timelinesApi.calculateTimelineStats(null);

            expect(stats).toEqual({});
        });

        it('should handle data with no items', () => {
            const stats = timelinesApi.calculateTimelineStats({ todos: [], milestones: [] });

            expect(stats.todos.total).toBe(0);
            expect(stats.todos.completed).toBe(0);
            expect(stats.todos.overdue).toBe(0);
            expect(stats.todos.completionRate).toBe(0);

            expect(stats.milestones.total).toBe(0);
            expect(stats.milestones.completed).toBe(0);
            expect(stats.milestones.overdue).toBe(0);
            expect(stats.milestones.completionRate).toBe(0);
        });
    });
});
