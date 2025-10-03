import { TodosController } from '../../js/modules/todos/todos.controller.js';

jest.mock('../../js/modules/todos/todos.api.js');
jest.mock('../../js/modules/todos/todos.ui.js');

describe('TodosController', () => {
    let api;
    let appState;
    let ui;
    let controller;

    beforeEach(() => {
        api = {
            getAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            generate: jest.fn(),
            bulkUpdate: jest.fn(),
            bulkDelete: jest.fn()
        };

        appState = {
            getState: jest.fn().mockReturnValue(null),
            subscribe: jest.fn(),
            setState: jest.fn()
        };

        ui = {
            bindProjectSelection: jest.fn(),
            bindGenerateTodos: jest.fn(),
            bindNewTodo: jest.fn(),
            bindFormSubmission: jest.fn(),
            bindTodoActions: jest.fn(),
            bindBulkActions: jest.fn(),
            renderEmptyState: jest.fn(),
            showLoading: jest.fn(),
            hideLoading: jest.fn(),
            renderTodos: jest.fn(),
            showSuccess: jest.fn(),
            showError: jest.fn(),
            showTodoModal: jest.fn(),
            hideTodoModal: jest.fn(),
            clearSelection: jest.fn(),
            getSelectedTodoIds: jest.fn().mockReturnValue([]),
            updateSummary: jest.fn(),
            populateProjectSelector: jest.fn()
        };

        controller = new TodosController({}, appState, ui, api);
    });

    it('binds UI events on initialization', () => {
        expect(ui.bindProjectSelection).toHaveBeenCalled();
        expect(ui.bindGenerateTodos).toHaveBeenCalled();
        expect(ui.bindNewTodo).toHaveBeenCalled();
        expect(ui.bindFormSubmission).toHaveBeenCalled();
        expect(ui.bindTodoActions).toHaveBeenCalled();
        expect(ui.bindBulkActions).toHaveBeenCalled();
        expect(appState.subscribe).toHaveBeenCalledWith('currentProject', expect.any(Function));
    });

    it('loads todos when project selected', async () => {
        const handler = appState.subscribe.mock.calls.find(call => call[0] === 'currentProject')[1];
        api.getAll.mockResolvedValue([{ id: '1' }]);

        await handler('project-1');

        expect(api.getAll).toHaveBeenCalledWith('project-1');
        expect(ui.renderTodos).toHaveBeenCalledWith([{ id: '1' }]);
    });

    it('renders empty state when no todos', async () => {
        const handler = appState.subscribe.mock.calls.find(call => call[0] === 'currentProject')[1];
        api.getAll.mockResolvedValue([]);

        await handler('project-1');

        expect(ui.renderEmptyState).toHaveBeenCalled();
    });

    it('creates new todo', async () => {
        const formHandler = ui.bindFormSubmission.mock.calls[0][0];
        const payload = { title: 'Test' };
        appState.getState.mockReturnValue('project-1');
        api.create.mockResolvedValue({});
        api.getAll.mockResolvedValue([{ id: 'created' }]);
        controller.currentProjectId = 'project-1';

        await formHandler(payload, null);

        expect(api.create).toHaveBeenCalledWith({ ...payload, project_id: 'project-1' });
        expect(ui.showSuccess).toHaveBeenCalledWith('Todo created');
        expect(ui.hideTodoModal).toHaveBeenCalled();
    });

    it('updates existing todo', async () => {
        const formHandler = ui.bindFormSubmission.mock.calls[0][0];
        const payload = { title: 'Updated' };
        appState.getState.mockReturnValue('project-1');
        api.update.mockResolvedValue({});
        api.getAll.mockResolvedValue([{ id: 'todo-1' }]);
        controller.currentProjectId = 'project-1';

        await formHandler(payload, 'todo-1');

        expect(api.update).toHaveBeenCalledWith('todo-1', { ...payload, project_id: 'project-1' });
        expect(ui.showSuccess).toHaveBeenCalledWith('Todo updated');
    });

    it('handles bulk completion', async () => {
        const bulkHandler = ui.bindBulkActions.mock.calls[0][0];
        api.bulkUpdate.mockResolvedValue({});
        api.getAll.mockResolvedValue([]);

        await bulkHandler(['todo-1', 'todo-2']);

        expect(api.bulkUpdate).toHaveBeenCalledWith(['todo-1', 'todo-2'], { status: 'completed' });
        expect(ui.clearSelection).toHaveBeenCalled();
        expect(appState.setState).toHaveBeenCalledWith('todos.selected', []);
    });

    it('handles bulk deletion', async () => {
        global.confirm = jest.fn(() => true);
        const bulkHandler = ui.bindBulkActions.mock.calls[0][1];
        api.bulkDelete.mockResolvedValue({});
        api.getAll.mockResolvedValue([]);

        await bulkHandler(['todo-1']);

        expect(api.bulkDelete).toHaveBeenCalledWith(['todo-1']);
        expect(ui.clearSelection).toHaveBeenCalled();
    });

    it('toggles todo status', async () => {
        api.update.mockResolvedValue({});
        api.getAll.mockResolvedValue([]);
        controller.currentProjectId = 'project-1';

        await controller.toggleTodo('todo-1', true);

        expect(api.update).toHaveBeenCalledWith('todo-1', { status: 'completed' });
    });
});
