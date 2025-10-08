// TodosApi and TodosUI are available globally via window

class TodosController {
    constructor(apiClient, appState, ui = null, api = null, options = {}) {
        this.api = api || new TodosApi(apiClient);
        this.state = appState || window.state || {
            getState: () => null,
            setState: () => {},
            subscribe: () => {}
        };
        this.ui = ui || new TodosUI();

        this.currentProjectId = null;
        this.currentTodos = [];

        this._eventsBound = false;
        this._subscriptionsBound = false;
        this._isInitializing = false;
        this._initializationPromise = null;
        this.hasGlobalState = Boolean(this.state && typeof this.state.subscribe === 'function');

        if (this._shouldAutoInitialize(options.autoInitialize)) {
            this.initialize().catch(error => {
                console.error('TodosController auto-initialization failed:', error);
            });
        }
    }

    async initialize() {
        if (this._isInitializing) {
            return this._initializationPromise;
        }

        this._isInitializing = true;
        const initialization = (async () => {
            if (!this._eventsBound) {
                this.bindUIEvents();
                this._eventsBound = true;
            }

            if (!this._subscriptionsBound) {
                this.subscribeToState();
                this._subscriptionsBound = true;
            }

            this.currentProjectId = this.state.getState('currentProject');
            if (this.currentProjectId) {
                await this.loadTodos(this.currentProjectId);
            } else {
                this.ui.renderEmptyState();
            }
        })();

        this._initializationPromise = initialization;

        try {
            await initialization;
        } finally {
            this._isInitializing = false;
            this._initializationPromise = null;
        }

        return initialization;
    }

    bindUIEvents() {
        if (this._eventsBound) {
            return;
        }

        this.ui.bindProjectSelection(async (projectId) => {
            if (this.hasGlobalState) {
                this.state.setState('currentProject', projectId);
            } else {
                this.currentProjectId = projectId || null;
            }

            if (projectId) {
                await this.loadTodos(projectId);
            } else {
                this.ui.renderEmptyState();
            }
        });

        this.ui.bindGenerateTodos(() => this.handleGenerateTodos());
        this.ui.bindNewTodo(() => this.ui.showTodoModal());
        this.ui.bindFormSubmission((todoData, editId) => this.handleSaveTodo(todoData, editId));
        this.ui.bindTodoActions(
            (todoId, completed) => this.toggleTodo(todoId, completed),
            (todoId) => this.editTodo(todoId),
            (todoId) => this.deleteTodo(todoId)
        );
        this.ui.bindBulkActions(
            async (ids) => await this.completeTodos(ids),
            async (ids) => await this.deleteTodos(ids)
        );
    }

    subscribeToState() {
        if (!this.hasGlobalState || this._subscriptionsBound) {
            return;
        }

        this._subscriptionsBound = true;

        this.state.subscribe('currentProject', async (projectId) => {
            if (!projectId) {
                this.currentProjectId = null;
                this.ui.renderEmptyState();
                return;
            }

            this.currentProjectId = projectId;
            await this.loadTodos(projectId);
        });

        this.state.subscribe('projects', (projects) => {
            this.ui.populateProjectSelector(projects || [], this.currentProjectId);
        });
    }

    async loadTodos(projectId) {
        if (!projectId) {
            this.ui.renderEmptyState();
            return;
        }

        try {
            this.ui.showLoading();
            const todos = await this.api.getAll(projectId);
            this.currentTodos = todos;
            if (!todos || todos.length === 0) {
                this.ui.renderEmptyState();
            } else {
                this.ui.renderTodos(todos);
            }
        } catch (error) {
            console.error('Failed to load todos:', error);
            this.ui.showError('Failed to load todos');
        } finally {
            this.ui.hideLoading();
        }
    }

    async handleGenerateTodos() {
        if (!this.currentProjectId) {
            this.ui.showError('Please select a project first');
            return;
        }

        try {
            this.ui.showLoading();
            await this.api.generate(this.currentProjectId);
            this.ui.showSuccess('AI-generated todos added');
            await this.loadTodos(this.currentProjectId);
        } catch (error) {
            console.error('Failed to generate todos:', error);
            this.ui.showError('Failed to generate todos');
        } finally {
            this.ui.hideLoading();
        }
    }

    editTodo(todoId) {
        const todo = this.currentTodos.find((item) => String(item.id) === String(todoId));
        if (!todo) {
            this.ui.showError('Todo not found');
            return;
        }
        this.ui.showTodoModal(todo);
    }

    async handleSaveTodo(todoData, editId) {
        if (!this.currentProjectId) {
            this.ui.showError('Please select a project first');
            return;
        }

        if (!todoData.title) {
            this.ui.showError('Todo title is required');
            return;
        }

        const payload = {
            ...todoData,
            project_id: this.currentProjectId
        };

        try {
            this.ui.showLoading();

            if (editId) {
                await this.api.update(editId, payload);
                this.ui.showSuccess('Todo updated');
            } else {
                await this.api.create(payload);
                this.ui.showSuccess('Todo created');
            }

            this.ui.hideTodoModal();
            await this.loadTodos(this.currentProjectId);
        } catch (error) {
            console.error('Failed to save todo:', error);
            this.ui.showError('Failed to save todo');
        } finally {
            this.ui.hideLoading();
        }
    }

    async toggleTodo(todoId, completed) {
        try {
            await this.api.update(todoId, { status: completed ? 'completed' : 'pending' });
            await this.loadTodos(this.currentProjectId);
        } catch (error) {
            console.error('Failed to update todo status:', error);
            this.ui.showError('Failed to update todo');
        }
    }

    async completeTodos(todoIds) {
        try {
            this.ui.showLoading();
            await this.api.bulkUpdate(todoIds, { status: 'completed' });
            this.ui.showSuccess('Todos marked as completed');
            await this.loadTodos(this.currentProjectId);
            this.ui.clearSelection();
            if (this.hasGlobalState) {
                this.state.setState('todos.selected', []);
            }
        } catch (error) {
            console.error('Failed to complete todos:', error);
            this.ui.showError('Failed to complete selected todos');
        } finally {
            this.ui.hideLoading();
        }
    }

    async deleteTodo(todoId) {
        if (!confirm('Are you sure you want to delete this todo?')) {
            return;
        }

        try {
            this.ui.showLoading();
            await this.api.delete(todoId);
            this.ui.showSuccess('Todo deleted');
            await this.loadTodos(this.currentProjectId);
        } catch (error) {
            console.error('Failed to delete todo:', error);
            this.ui.showError('Failed to delete todo');
        } finally {
            this.ui.hideLoading();
        }
    }

    async deleteTodos(todoIds) {
        if (!confirm('Delete selected todos?')) {
            return;
        }

        try {
            this.ui.showLoading();
            await this.api.bulkDelete(todoIds);
            this.ui.showSuccess('Selected todos deleted');
            await this.loadTodos(this.currentProjectId);
            this.ui.clearSelection();
            if (this.hasGlobalState) {
                this.state.setState('todos.selected', []);
            }
        } catch (error) {
            console.error('Failed to delete selected todos:', error);
            this.ui.showError('Failed to delete selected todos');
        } finally {
            this.ui.hideLoading();
        }
    }

    _shouldAutoInitialize(autoInitializePreference) {
        if (typeof autoInitializePreference === 'boolean') {
            return autoInitializePreference;
        }

        const env = typeof process !== 'undefined' && process.env
            ? process.env.NODE_ENV
            : undefined;

        return env !== 'test';
    }

    getSelectedTodoIds() {
        return this.ui.getSelectedTodoIds();
    }
}

// TodosController is available globally via window.TodosController
if (typeof window !== 'undefined') {
    window.TodosController = TodosController;
}
