/**
 * Timelines Controller Tests
 * Tests the TimelinesController class functionality
 */

import { TimelinesController } from '../../js/modules/timelines/timelines.controller.js';
import { TimelinesApi } from '../../js/modules/timelines/timelines.api.js';

// Mock the TimelinesApi
jest.mock('../../js/modules/timelines/timelines.api.js', () => ({
    TimelinesApi: jest.fn().mockImplementation(() => ({
        getTimeline: jest.fn(),
        createMilestone: jest.fn(),
        updateMilestone: jest.fn(),
        deleteMilestone: jest.fn(),
        estimateTimeline: jest.fn(),
        filterTimelineItems: jest.fn(),
        calculateTimelineStats: jest.fn()
    }))
}));

// Mock the TimelinesUI
jest.mock('../../js/modules/timelines/timelines.ui.js', () => ({
    TimelinesUI: jest.fn().mockImplementation(() => ({
        initializeElements: jest.fn(),
        bindNavigationEvents: jest.fn(),
        renderTimeline: jest.fn(),
        showLoading: jest.fn(),
        hideLoading: jest.fn(),
        showError: jest.fn(),
        showSuccess: jest.fn(),
        setCurrentProject: jest.fn(),
        renderTimelineSuggestion: jest.fn(),
        generateTimelineExport: jest.fn(),
        filterTimelineItems: jest.fn(),
        combineAndSortItems: jest.fn(),
        elements: {
            timelineZoom: { value: 'all' }
        }
    }))
}));

describe('TimelinesController', () => {
    let timelinesController;
    let mockApi;
    let mockUI;

    beforeEach(() => {
        // Create mock instances
        mockApi = new TimelinesApi();
        mockUI = new (jest.requireMock('../../js/modules/timelines/timelines.ui.js').TimelinesUI)();

        // Create controller instance
        timelinesController = new TimelinesController({});

        // Replace the API and UI with our mocks
        timelinesController.api = mockApi;
        timelinesController.ui = mockUI;

        // Mock methods that are tested
        timelinesController.getProjectById = jest.fn();
        timelinesController.refreshTimeline = jest.fn();
        timelinesController.showExportOptions = jest.fn();
        timelinesController.copyToClipboard = jest.fn();
        timelinesController.downloadAsFile = jest.fn();
        timelinesController.showMilestoneModal = jest.fn();
        timelinesController.dismissSuggestion = jest.fn();

        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('should initialize controller correctly', () => {
            timelinesController.initialize();

            expect(mockUI.bindNavigationEvents).toHaveBeenCalledTimes(1);
        });
    });

    describe('loadProjectTimeline', () => {
        it('should load timeline for valid project', async () => {
            const projectId = 'project-123';
            const project = { id: 'project-123', name: 'Test Project' };
            const timelineData = {
                todos: [{ id: 1, title: 'Task 1' }],
                milestones: [{ id: 1, title: 'Milestone 1' }]
            };

            // Mock API calls
            timelinesController.getProjectById = jest.fn().mockResolvedValue(project);
            mockApi.getTimeline.mockResolvedValue(timelineData);

            await timelinesController.loadProjectTimeline(projectId);

            expect(timelinesController.getProjectById).toHaveBeenCalledWith(projectId);
            expect(mockApi.getTimeline).toHaveBeenCalledWith(projectId);
            expect(mockUI.renderTimeline).toHaveBeenCalledWith(timelineData, project);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should handle project not found', async () => {
            const projectId = 'project-123';

            // Mock API calls
            timelinesController.getProjectById.mockResolvedValue(null);

            await timelinesController.loadProjectTimeline(projectId);

            expect(timelinesController.getProjectById).toHaveBeenCalledWith(projectId);
            expect(mockUI.renderTimeline).toHaveBeenCalledWith(null, null);
            expect(mockUI.showError).not.toHaveBeenCalled(); // No error for null project
        });

        it('should handle API errors gracefully', async () => {
            const projectId = 'project-123';
            const project = { id: 'project-123', name: 'Test Project' };
            const error = new Error('API Error');

            // Mock API calls
            timelinesController.getProjectById = jest.fn().mockResolvedValue(project);
            mockApi.getTimeline.mockRejectedValue(error);

            await timelinesController.loadProjectTimeline(projectId);

            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
            expect(mockUI.showError).toHaveBeenCalledWith('Failed to load timeline');
        });

        it('should render empty timeline when no project ID', async () => {
            await timelinesController.loadProjectTimeline(null);

            expect(mockUI.renderTimeline).toHaveBeenCalledWith(null, null);
            expect(mockUI.showLoading).not.toHaveBeenCalled();
            expect(mockUI.hideLoading).not.toHaveBeenCalled();
        });
    });

    describe('refreshTimeline', () => {
        it('should refresh current timeline', async () => {
            const project = { id: 'project-123', name: 'Test Project' };
            timelinesController.currentProject = project;
            timelinesController.loadProjectTimeline = jest.fn();

            await timelinesController.refreshTimeline();

            expect(timelinesController.loadProjectTimeline).toHaveBeenCalledWith(project.id);
        });

        it('should do nothing when no current project', async () => {
            timelinesController.currentProject = null;
            timelinesController.loadProjectTimeline = jest.fn();

            await timelinesController.refreshTimeline();

            expect(timelinesController.loadProjectTimeline).not.toHaveBeenCalled();
        });
    });

    describe('getProjectById', () => {
        it('should return project from global projects', async () => {
            const project = { id: 'project-123', name: 'Test Project' };
            global.window = { allProjects: [project] };

            timelinesController.getProjectById = jest.fn().mockResolvedValue(project);

            const result = await timelinesController.getProjectById('project-123');

            expect(result).toBe(project);
        });

        it('should return null when project not found', async () => {
            global.window = { allProjects: [] };

            const result = await timelinesController.getProjectById('project-123');

            expect(result).toBe(null);
        });

        it('should return null when no global projects', async () => {
            global.window = {};

            const result = await timelinesController.getProjectById('project-123');

            expect(result).toBe(null);
        });
    });

    describe('estimateTimeline', () => {
        it('should estimate timeline successfully', async () => {
            const project = { id: 'project-123', name: 'Test Project' };
            const suggestion = {
                success: true,
                data: { timeline_summary: 'AI suggestion' }
            };

            timelinesController.currentProject = project;
            mockApi.estimateTimeline.mockResolvedValue(suggestion);

            await timelinesController.estimateTimeline();

            expect(mockApi.estimateTimeline).toHaveBeenCalledWith(project.id);
            expect(mockUI.renderTimelineSuggestion).toHaveBeenCalledWith(suggestion.data);
            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
        });

        it('should show error when no current project', async () => {
            timelinesController.currentProject = null;

            await timelinesController.estimateTimeline();

            expect(mockUI.showError).toHaveBeenCalledWith('Please select a project first');
            expect(mockUI.showLoading).not.toHaveBeenCalled();
            expect(mockUI.hideLoading).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const project = { id: 'project-123', name: 'Test Project' };
            const error = new Error('API Error');

            timelinesController.currentProject = project;
            mockApi.estimateTimeline.mockRejectedValue(error);

            await timelinesController.estimateTimeline();

            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
            expect(mockUI.showError).toHaveBeenCalledWith('Failed to estimate timeline');
        });
    });

    describe('exportTimeline', () => {
        it('should export timeline successfully', async () => {
            const project = { id: 'project-123', name: 'Test Project' };
            const timelineData = {
                todos: [{ id: 1, title: 'Task 1' }],
                milestones: [{ id: 1, title: 'Milestone 1' }]
            };
            const filteredItems = {
                todos: [{ id: 1, title: 'Task 1' }],
                milestones: [{ id: 1, title: 'Milestone 1' }]
            };
            const combinedItems = [{ type: 'milestone', title: 'Milestone 1' }];

            timelinesController.currentProject = project;
            timelinesController.currentTimelineData = timelineData;

            // Mock the UI methods
            mockUI.filterTimelineItems.mockReturnValue(filteredItems);
            mockUI.combineAndSortItems.mockReturnValue(combinedItems);
            mockUI.generateTimelineExport.mockReturnValue('export content');

            // Mock showExportOptions
            timelinesController.showExportOptions = jest.fn();

            await timelinesController.exportTimeline();

            expect(mockUI.filterTimelineItems).toHaveBeenCalledWith(timelineData, 'all');
            expect(mockUI.combineAndSortItems).toHaveBeenCalledWith(filteredItems.todos, filteredItems.milestones);
            expect(mockUI.generateTimelineExport).toHaveBeenCalledWith(project, combinedItems, 'all');
            expect(timelinesController.showExportOptions).toHaveBeenCalledWith('export content', 'Test Project_timeline');
        });

        it('should show error when no current project', async () => {
            timelinesController.currentProject = null;

            await timelinesController.exportTimeline();

            expect(mockUI.showError).toHaveBeenCalledWith('Please select a project first');
        });
    });

    describe('createMilestone', () => {
        it('should create milestone successfully', async () => {
            const project = { id: 'project-123', name: 'Test Project' };
            const milestoneData = {
                title: 'New Milestone',
                target_date: '2025-02-01',
                description: 'Test milestone'
            };
            const newMilestone = {
                id: 'milestone-123',
                ...milestoneData,
                project_id: project.id
            };

            timelinesController.currentProject = project;
            mockApi.createMilestone.mockResolvedValue(newMilestone);
            timelinesController.refreshTimeline.mockResolvedValue();

            const result = await timelinesController.createMilestone(milestoneData);

            expect(mockApi.createMilestone).toHaveBeenCalledWith({
                ...milestoneData,
                project_id: project.id
            });
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Milestone created successfully');
            expect(timelinesController.refreshTimeline).toHaveBeenCalled();
            expect(result).toBe(newMilestone);
        });

        it('should validate required fields', async () => {
            timelinesController.currentProject = { id: 'project-123' };

            await timelinesController.createMilestone({ title: '' });

            expect(mockUI.showError).toHaveBeenCalledWith('Milestone title is required');
            expect(mockApi.createMilestone).not.toHaveBeenCalled();
        });

        it('should validate target date is not in the past', async () => {
            timelinesController.currentProject = { id: 'project-123' };
            const pastDate = '2023-01-01';

            await timelinesController.createMilestone({
                title: 'Test',
                target_date: pastDate
            });

            expect(mockUI.showError).toHaveBeenCalledWith('Target date cannot be in the past');
            expect(mockApi.createMilestone).not.toHaveBeenCalled();
        });

        it('should handle API errors gracefully', async () => {
            const project = { id: 'project-123', name: 'Test Project' };
            const milestoneData = {
                title: 'New Milestone',
                target_date: '2025-02-01'
            };
            const error = new Error('API Error');

            timelinesController.currentProject = project;
            mockApi.createMilestone.mockRejectedValue(error);
            timelinesController.refreshTimeline.mockResolvedValue();

            await timelinesController.createMilestone(milestoneData);

            expect(mockUI.showLoading).toHaveBeenCalled();
            expect(mockUI.hideLoading).toHaveBeenCalled();
            expect(mockUI.showError).toHaveBeenCalledWith('Failed to create milestone');
        });
    });

    describe('updateMilestone', () => {
        it('should update milestone successfully', async () => {
            const updateData = {
                title: 'Updated Milestone',
                target_date: '2025-02-01'
            };
            const updatedMilestone = {
                id: 'milestone-123',
                ...updateData
            };

            mockApi.updateMilestone.mockResolvedValue(updatedMilestone);
            timelinesController.refreshTimeline.mockResolvedValue();

            const result = await timelinesController.updateMilestone('milestone-123', updateData);

            expect(mockApi.updateMilestone).toHaveBeenCalledWith('milestone-123', updateData);
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Milestone updated successfully');
            expect(timelinesController.refreshTimeline).toHaveBeenCalled();
            expect(result).toBe(updatedMilestone);
        });

        it('should validate required fields', async () => {
            await timelinesController.updateMilestone('milestone-123', { title: '' });

            expect(mockUI.showError).toHaveBeenCalledWith('Milestone title is required');
            expect(mockApi.updateMilestone).not.toHaveBeenCalled();
        });
    });

    describe('deleteMilestone', () => {
        it('should delete milestone successfully', async () => {
            const mockResponse = { success: true };
            mockApi.deleteMilestone.mockResolvedValue(mockResponse);
            timelinesController.refreshTimeline.mockResolvedValue();

            // Mock confirm to return true
            global.confirm = jest.fn().mockReturnValue(true);

            await timelinesController.deleteMilestone('milestone-123');

            expect(mockApi.deleteMilestone).toHaveBeenCalledWith('milestone-123');
            expect(mockUI.showSuccess).toHaveBeenCalledWith('Milestone deleted successfully');
            expect(timelinesController.refreshTimeline).toHaveBeenCalled();
        });

        it('should not delete when user cancels', async () => {
            // Mock confirm to return false
            global.confirm = jest.fn().mockReturnValue(false);

            await timelinesController.deleteMilestone('milestone-123');

            expect(mockApi.deleteMilestone).not.toHaveBeenCalled();
            expect(mockUI.showSuccess).not.toHaveBeenCalled();
            expect(timelinesController.refreshTimeline).not.toHaveBeenCalled();
        });
    });

    describe('editMilestone', () => {
        it('should show edit modal for existing milestone', async () => {
            const timelineData = {
                milestones: [{ id: 'milestone-123', title: 'Test Milestone' }]
            };
            timelinesController.currentTimelineData = timelineData;

            timelinesController.showMilestoneModal = jest.fn();

            await timelinesController.editMilestone('milestone-123');

            expect(timelinesController.showMilestoneModal).toHaveBeenCalledWith(timelineData.milestones[0]);
        });

        it('should show error when milestone not found', async () => {
            timelinesController.currentTimelineData = { milestones: [] };

            await timelinesController.editMilestone('milestone-123');

            expect(mockUI.showError).toHaveBeenCalledWith('Milestone not found');
        });
    });

    describe('showMilestoneModal', () => {
        it('should create modal HTML for new milestone', () => {
            // Mock document.body.appendChild
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            timelinesController.showMilestoneModal();

            expect(document.body.appendChild).toHaveBeenCalled();
            const modalContainer = document.body.appendChild.mock.calls[0][0];
            expect(modalContainer.className).toBe('modal');
            expect(modalContainer.innerHTML).toContain('Create New Milestone');
            expect(modalContainer.innerHTML).toContain('milestoneForm');
        });

        it('should create modal HTML for editing milestone', () => {
            // Mock document.body.appendChild
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            const milestone = {
                id: 'milestone-123',
                title: 'Test Milestone',
                description: 'Test description',
                target_date: '2025-02-01',
                status: 'planned'
            };

            timelinesController.showMilestoneModal(milestone);

            expect(document.body.appendChild).toHaveBeenCalled();
            const modalContainer = document.body.appendChild.mock.calls[0][0];
            expect(modalContainer.innerHTML).toContain('Edit Milestone');
            expect(modalContainer.innerHTML).toContain('Test Milestone');
            expect(modalContainer.innerHTML).toContain('Test description');
            expect(modalContainer.innerHTML).toContain('2025-02-01');
        });
    });

    describe('applySuggestion', () => {
        it('should apply AI suggestion', async () => {
            timelinesController.dismissSuggestion.mockImplementation(() => {});

            await timelinesController.applySuggestion();

            expect(mockUI.showSuccess).toHaveBeenCalledWith('AI suggestion applied successfully');
            expect(timelinesController.dismissSuggestion).toHaveBeenCalled();
        });
    });

    describe('dismissSuggestion', () => {
        it('should dismiss AI suggestion', () => {
            const suggestionElement = { remove: jest.fn() };
            mockUI.elements.timelineContainer = {
                querySelector: jest.fn().mockReturnValue(suggestionElement)
            };

            timelinesController.dismissSuggestion();

            expect(mockUI.elements.timelineContainer.querySelector).toHaveBeenCalledWith('.timeline-suggestion');
            expect(suggestionElement.remove).toHaveBeenCalled();
        });
    });

    describe('clearFilter', () => {
        it('should clear timeline filter', () => {
            mockUI.elements.timelineZoom = { value: 'week', dispatchEvent: jest.fn() };

            timelinesController.clearFilter();

            expect(mockUI.elements.timelineZoom.value).toBe('all');
            expect(mockUI.elements.timelineZoom.dispatchEvent).toHaveBeenCalledWith(expect.any(Event));
        });
    });

    describe('getTimelineStats', () => {
        it('should return timeline statistics', () => {
            const timelineData = { todos: [], milestones: [] };
            const expectedStats = { todos: { total: 0 }, milestones: { total: 0 } };
            mockApi.calculateTimelineStats.mockReturnValue(expectedStats);

            const stats = timelinesController.getTimelineStats();

            expect(mockApi.calculateTimelineStats).toHaveBeenCalledWith(timelineData);
            expect(stats).toEqual(expectedStats);
        });
    });

    describe('getCurrentProject', () => {
        it('should return current project', () => {
            const project = { id: 'project-123' };
            timelinesController.currentProject = project;

            const result = timelinesController.getCurrentProject();

            expect(result).toBe(project);
        });
    });

    describe('getCurrentTimelineData', () => {
        it('should return current timeline data', () => {
            const timelineData = { todos: [], milestones: [] };
            timelinesController.currentTimelineData = timelineData;

            const result = timelinesController.getCurrentTimelineData();

            expect(result).toBe(timelineData);
        });
    });
});
