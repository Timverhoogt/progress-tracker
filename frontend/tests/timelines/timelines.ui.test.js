/**
 * Timelines UI Tests
 * Tests the TimelinesUI class functionality
 */

import { TimelinesUI } from '../../js/modules/timelines/timelines.ui.js';
import { DOMUtils } from '../../js/utils/dom.js';

// Mock DOMUtils
jest.mock('../../js/utils/dom.js', () => ({
    DOMUtils: {
        getElement: jest.fn(),
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

describe('TimelinesUI', () => {
    let timelinesUI;
    let mockElements;

    beforeEach(() => {
        // Mock DOM elements
        mockElements = {
            timelinesProjectSelector: { value: '', onchange: null },
            timelineZoom: { value: 'all', onchange: null },
            estimateTimelineBtn: { onclick: null },
            exportTimelineBtn: { onclick: null },
            timelineContainer: {
                innerHTML: '',
                insertAdjacentHTML: jest.fn(),
                querySelectorAll: jest.fn().mockReturnValue([]),
                querySelector: jest.fn().mockReturnValue(null),
                addEventListener: jest.fn(),
                getBoundingClientRect: jest.fn().mockReturnValue({ top: 0, height: 100 })
            },
            loadingOverlay: { style: {} }
        };

        // Mock DOMUtils.getElement to return mock elements
        DOMUtils.getElement.mockImplementation((selector) => {
            switch (selector) {
                case '#timelinesProjectSelector': return mockElements.timelinesProjectSelector;
                case '#timelineZoom': return mockElements.timelineZoom;
                case '#estimateTimelineBtn': return mockElements.estimateTimelineBtn;
                case '#exportTimelineBtn': return mockElements.exportTimelineBtn;
                case '#timelineContainer': return mockElements.timelineContainer;
                case '#loadingOverlay': return mockElements.loadingOverlay;
                default: return null;
            }
        });

        timelinesUI = new TimelinesUI();
        jest.clearAllMocks();
    });

    describe('initializeElements', () => {
        it('should initialize all DOM elements correctly', () => {
            expect(timelinesUI.elements.timelinesProjectSelector).toBe(mockElements.timelinesProjectSelector);
            expect(timelinesUI.elements.timelineZoom).toBe(mockElements.timelineZoom);
            expect(timelinesUI.elements.estimateTimelineBtn).toBe(mockElements.estimateTimelineBtn);
            expect(timelinesUI.elements.exportTimelineBtn).toBe(mockElements.exportTimelineBtn);
            expect(timelinesUI.elements.timelineContainer).toBe(mockElements.timelineContainer);
            expect(timelinesUI.elements.loadingOverlay).toBe(mockElements.loadingOverlay);
        });
    });

    describe('setCurrentProject', () => {
        it('should set current project and update project selector', () => {
            const project = { id: 'project-123', name: 'Test Project' };

            timelinesUI.setCurrentProject(project);

            expect(timelinesUI.currentProject).toBe(project);
            expect(mockElements.timelinesProjectSelector.value).toBe('project-123');
        });
    });

    describe('renderTimeline', () => {
        it('should render timeline with data', () => {
            const timelineData = {
                todos: [{ id: 1, title: 'Task 1', due_date: '2025-01-25', status: 'pending' }],
                milestones: [{ id: 1, title: 'Milestone 1', target_date: '2025-01-30', status: 'planned' }]
            };
            const project = { id: 'project-123', name: 'Test Project' };

            // Mock DOMUtils.setHTML
            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            timelinesUI.renderTimeline(timelineData, project);

            expect(timelinesUI.currentTimelineData).toBe(timelineData);
            expect(timelinesUI.currentProject).toBe(project);
            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.timelineContainer, expect.any(String));
        });

        it('should render empty timeline when no data', () => {
            const project = { id: 'project-123', name: 'Test Project' };

            DOMUtils.setHTML.mockImplementation((element, html) => {
                element.innerHTML = html;
            });

            timelinesUI.renderTimeline(null, project);

            expect(timelinesUI.currentTimelineData).toBe(null);
            expect(timelinesUI.currentProject).toBe(project);
            expect(DOMUtils.setHTML).toHaveBeenCalledWith(mockElements.timelineContainer, expect.any(String));
        });
    });

    describe('generateTimelineHTML', () => {
        it('should generate HTML for items with filter info', () => {
            const items = {
                todos: [{ id: 1, title: 'Task 1', due_date: '2025-01-25', status: 'pending' }],
                milestones: [{ id: 1, title: 'Milestone 1', target_date: '2025-01-30', status: 'planned' }]
            };

            const html = timelinesUI.generateTimelineHTML(items, 'week');

            expect(html).toContain('timeline-filter-info');
            expect(html).toContain('this week');
            expect(html).toContain('Clear Filter');
            expect(html).toContain('timeline-item');
        });

        it('should generate empty state HTML when no items', () => {
            const items = { todos: [], milestones: [] };

            const html = timelinesUI.generateTimelineHTML(items, 'week');

            expect(html).toContain('No timeline items found');
            expect(html).toContain('this week');
            expect(html).toContain('Add Milestone');
        });
    });

    describe('generateTimelineItemHTML', () => {
        it('should generate HTML for a milestone item', () => {
            const milestone = {
                id: 'milestone-123',
                type: 'milestone',
                title: 'Test Milestone',
                description: 'Test description',
                date: '2025-01-30',
                status: 'planned'
            };

            const html = timelinesUI.generateTimelineItemHTML(milestone);

            expect(html).toContain('milestone-123');
            expect(html).toContain('Test Milestone');
            expect(html).toContain('Test description');
            expect(html).toContain('planned');
            expect(html).toContain('data-action="edit"');
            expect(html).toContain('data-action="delete"');
        });

        it('should generate HTML for a todo item', () => {
            const todo = {
                id: 'todo-123',
                type: 'todo',
                title: 'Test Todo',
                description: 'Test description',
                date: '2025-01-25',
                status: 'completed'
            };

            const html = timelinesUI.generateTimelineItemHTML(todo);

            expect(html).toContain('todo-123');
            expect(html).toContain('Test Todo');
            expect(html).toContain('Test description');
            expect(html).toContain('completed');
            expect(html).not.toContain('data-action="edit"');
            expect(html).not.toContain('data-action="delete"');
        });

        it('should generate HTML for overdue item', () => {
            const item = {
                id: 'item-123',
                type: 'todo',
                title: 'Overdue Item',
                date: '2025-01-10',
                status: 'pending'
            };

            // Mock current date to make item overdue
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

            const html = timelinesUI.generateTimelineItemHTML(item);

            expect(html).toContain('status-overdue');
            expect(html).toContain('Overdue');

            // Restore original Date
            global.Date = originalDate;
        });
    });

    describe('combineAndSortItems', () => {
        it('should combine and sort todos and milestones by date', () => {
            const todos = [
                { id: 1, title: 'Task 1', due_date: '2025-01-25' },
                { id: 2, title: 'Task 2', due_date: '2025-01-15' }
            ];
            const milestones = [
                { id: 1, title: 'Milestone 1', target_date: '2025-01-20' }
            ];

            const result = timelinesUI.combineAndSortItems(todos, milestones);

            expect(result).toHaveLength(3);
            expect(result[0].title).toBe('Task 2'); // Jan 15
            expect(result[1].title).toBe('Milestone 1'); // Jan 20
            expect(result[2].title).toBe('Task 1'); // Jan 25
        });
    });

    describe('filterTimelineItems', () => {
        const timelineData = {
            todos: [
                { id: 1, title: 'Task 1', due_date: '2025-01-25', status: 'pending' },
                { id: 2, title: 'Task 2', due_date: '2025-02-01', status: 'completed' },
                { id: 3, title: 'Overdue Task', due_date: '2025-01-10', status: 'pending' }
            ],
            milestones: [
                { id: 1, title: 'Milestone 1', target_date: '2025-01-30', status: 'planned' },
                { id: 2, title: 'Completed Milestone', target_date: '2025-01-15', status: 'completed' }
            ]
        };

        it('should return all items when filter is "all"', () => {
            const result = timelinesUI.filterTimelineItems(timelineData, 'all');

            expect(result.todos).toHaveLength(3);
            expect(result.milestones).toHaveLength(2);
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
            };

            const result = timelinesUI.filterTimelineItems(timelineData, 'week');

            expect(result.todos).toHaveLength(1); // Task 1 (Jan 25)
            expect(result.milestones).toHaveLength(1); // Milestone 1 (Jan 30)
            expect(result.todos[0].title).toBe('Task 1');
            expect(result.milestones[0].title).toBe('Milestone 1');

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

            const result = timelinesUI.filterTimelineItems(timelineData, 'overdue');

            expect(result.todos).toHaveLength(1); // Overdue Task
            expect(result.milestones).toHaveLength(0); // No overdue milestones

            // Restore original Date
            global.Date = originalDate;
        });
    });

    describe('getStatusClass', () => {
        it('should return correct status classes', () => {
            expect(timelinesUI.getStatusClass({ status: 'completed' })).toBe('completed');
            expect(timelinesUI.getStatusClass({ status: 'in_progress' })).toBe('in-progress');
            expect(timelinesUI.getStatusClass({ status: 'planned' })).toBe('planned');
            expect(timelinesUI.getStatusClass({ status: 'cancelled' })).toBe('cancelled');

            // Mock current date to test overdue
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

            expect(timelinesUI.getStatusClass({
                status: 'pending',
                date: '2025-01-10'
            })).toBe('overdue');

            // Restore original Date
            global.Date = originalDate;
        });
    });

    describe('isItemOverdue', () => {
        it('should correctly identify overdue items', () => {
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

            expect(timelinesUI.isItemOverdue({
                date: '2025-01-10',
                status: 'pending'
            })).toBe(true);

            expect(timelinesUI.isItemOverdue({
                date: '2025-01-25',
                status: 'pending'
            })).toBe(false);

            expect(timelinesUI.isItemOverdue({
                date: '2025-01-10',
                status: 'completed'
            })).toBe(false);

            // Restore original Date
            global.Date = originalDate;
        });
    });

    describe('getFilterLabel', () => {
        it('should return correct filter labels', () => {
            expect(timelinesUI.getFilterLabel('week')).toBe('this week');
            expect(timelinesUI.getFilterLabel('month')).toBe('this month');
            expect(timelinesUI.getFilterLabel('quarter')).toBe('this quarter');
            expect(timelinesUI.getFilterLabel('year')).toBe('this year');
            expect(timelinesUI.getFilterLabel('overdue')).toBe('overdue items');
            expect(timelinesUI.getFilterLabel('all')).toBe('all time');
            expect(timelinesUI.getFilterLabel('unknown')).toBe('unknown');
        });
    });

    describe('renderTimelineSuggestion', () => {
        it('should render AI timeline suggestion', () => {
            const suggestion = {
                timeline_summary: 'AI generated timeline summary',
                milestones: [
                    { title: 'Suggested Milestone 1', target_date: '2025-02-01', description: 'Description 1' }
                ],
                risks: ['Risk 1', 'Risk 2']
            };

            timelinesUI.renderTimelineSuggestion(suggestion);

            expect(mockElements.timelineContainer.insertAdjacentHTML).toHaveBeenCalledWith('afterbegin', expect.any(String));
            const html = mockElements.timelineContainer.insertAdjacentHTML.mock.calls[0][1];
            expect(html).toContain('AI Proposed Timeline');
            expect(html).toContain('AI generated timeline summary');
            expect(html).toContain('Suggested Milestone 1');
            expect(html).toContain('Risk 1, Risk 2');
        });
    });

    describe('generateTimelineExport', () => {
        it('should generate export content correctly', () => {
            const project = { id: 'project-123', name: 'Test Project' };
            const items = [
                {
                    type: 'milestone',
                    title: 'Milestone 1',
                    description: 'Description 1',
                    date: '2025-01-30',
                    status: 'completed'
                },
                {
                    type: 'todo',
                    title: 'Task 1',
                    description: 'Description 2',
                    date: '2025-01-25',
                    status: 'pending'
                }
            ];

            const content = timelinesUI.generateTimelineExport(project, items, 'week');

            expect(content).toContain('Timeline Export - Test Project');
            expect(content).toContain('Generated:');
            expect(content).toContain('Filter: this week');
            expect(content).toContain('2025-01-25');
            expect(content).toContain('2025-01-30');
            expect(content).toContain('Milestone 1');
            expect(content).toContain('Task 1');
        });
    });

    describe('getStatusIcon', () => {
        it('should return correct status icons', () => {
            expect(timelinesUI.getStatusIcon('completed')).toBe('✓');
            expect(timelinesUI.getStatusIcon('in_progress')).toBe('→');
            expect(timelinesUI.getStatusIcon('planned')).toBe('○');
            expect(timelinesUI.getStatusIcon('cancelled')).toBe('✗');
            expect(timelinesUI.getStatusIcon('overdue')).toBe('⚠');
            expect(timelinesUI.getStatusIcon('unknown')).toBe('○');
        });
    });

    describe('bindNavigationEvents', () => {
        it('should bind all navigation events', () => {
            timelinesUI.bindNavigationEvents();

            expect(typeof mockElements.timelinesProjectSelector.onchange).toBe('function');
            expect(typeof mockElements.timelineZoom.onchange).toBe('function');
            expect(typeof mockElements.estimateTimelineBtn.onclick).toBe('function');
            expect(typeof mockElements.exportTimelineBtn.onclick).toBe('function');
        });
    });
});
