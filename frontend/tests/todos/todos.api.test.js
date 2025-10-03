import { TodosApi } from '../../js/modules/todos/todos.api.js';

describe('TodosApi', () => {
    let apiClient;
    let todosApi;

    beforeEach(() => {
        apiClient = {
            todos: {
                getAll: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                generate: jest.fn(),
                bulkUpdate: jest.fn(),
                bulkDelete: jest.fn()
            }
        };

        todosApi = new TodosApi(apiClient);
    });

    it('gets all todos for project', async () => {
        const projectId = 'project-1';
        const data = [{ id: 'todo-1' }];
        apiClient.todos.getAll.mockResolvedValue(data);

        const result = await todosApi.getAll(projectId);

        expect(apiClient.todos.getAll).toHaveBeenCalledWith(projectId);
        expect(result).toEqual(data);
    });

    it('creates a todo', async () => {
        const payload = { title: 'Test' };
        const created = { id: 'todo-1', ...payload };
        apiClient.todos.create.mockResolvedValue(created);

        const result = await todosApi.create(payload);

        expect(apiClient.todos.create).toHaveBeenCalledWith(payload);
        expect(result).toEqual(created);
    });

    it('updates a todo', async () => {
        const id = 'todo-1';
        const payload = { status: 'completed' };
        const updated = { id, status: 'completed' };
        apiClient.todos.update.mockResolvedValue(updated);

        const result = await todosApi.update(id, payload);

        expect(apiClient.todos.update).toHaveBeenCalledWith(id, payload);
        expect(result).toEqual(updated);
    });

    it('deletes a todo', async () => {
        const id = 'todo-1';
        apiClient.todos.delete.mockResolvedValue({ success: true });

        const result = await todosApi.delete(id);

        expect(apiClient.todos.delete).toHaveBeenCalledWith(id);
        expect(result).toEqual({ success: true });
    });

    it('generates todos', async () => {
        const projectId = 'project-1';
        const generated = [{ id: 'todo-1' }];
        apiClient.todos.generate.mockResolvedValue(generated);

        const result = await todosApi.generate(projectId);

        expect(apiClient.todos.generate).toHaveBeenCalledWith(projectId);
        expect(result).toEqual(generated);
    });

    it('bulk updates todos', async () => {
        const ids = ['todo-1', 'todo-2'];
        const payload = { status: 'completed' };
        apiClient.todos.bulkUpdate.mockResolvedValue({ success: true });

        const result = await todosApi.bulkUpdate(ids, payload);

        expect(apiClient.todos.bulkUpdate).toHaveBeenCalledWith(ids, payload);
        expect(result).toEqual({ success: true });
    });

    it('bulk deletes todos', async () => {
        const ids = ['todo-1', 'todo-2'];
        apiClient.todos.bulkDelete.mockResolvedValue({ success: true });

        const result = await todosApi.bulkDelete(ids);

        expect(apiClient.todos.bulkDelete).toHaveBeenCalledWith(ids);
        expect(result).toEqual({ success: true });
    });
});
