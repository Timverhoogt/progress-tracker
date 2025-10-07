// MessageUtils, LoadingUtils, ModalUtils, TextUtils are available globally via window

class TodosUI {
    constructor() {
        this.elements = this.initializeElements();
    }

    initializeElements() {
        return {
            projectSelector: document.getElementById('todosProjectSelector'),
            todosItems: document.getElementById('todosItems'),
            todosHeader: document.querySelector('#todosList .todos-header'),
            todosSummary: document.getElementById('todosSummary'),
            selectAllCheckbox: document.getElementById('selectAllTodos'),
            newTodoBtn: document.getElementById('newTodoBtn'),
            generateTodosBtn: document.getElementById('generateTodosBtn'),
            bulkCompleteBtn: document.getElementById('bulkCompleteTodosBtn'),
            bulkDeleteBtn: document.getElementById('bulkDeleteTodosBtn'),
            todoModal: document.getElementById('todoModal'),
            todoForm: document.getElementById('todoForm'),
            todoTitle: document.getElementById('todoTitle'),
            todoDescription: document.getElementById('todoDescription'),
            todoPriority: document.getElementById('todoPriority'),
            todoDueDate: document.getElementById('todoDueDate'),
            todoStatus: document.getElementById('todoStatus'),
            loadingOverlay: document.getElementById('loadingOverlay')
        };
    }

    showLoading() {
        LoadingUtils.show(this.elements.loadingOverlay);
    }

    hideLoading() {
        LoadingUtils.hide(this.elements.loadingOverlay);
    }

    showError(message) {
        MessageUtils.showError(message);
    }

    showSuccess(message) {
        MessageUtils.showSuccess(message);
    }

    renderTodos(todos) {
        this.updateSummary(todos);

        if (!todos || todos.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.elements.todosHeader?.classList.toggle('has-items', todos.length > 0);
        this.elements.todosItems.innerHTML = todos.map(todo => `
            <div class="card todo-card ${todo.status === 'completed' ? 'todo-completed' : ''}" data-id="${todo.id}">
                <input type="checkbox" class="todo-select" data-id="${todo.id}">
                <input type="checkbox" class="todo-checkbox" ${todo.status === 'completed' ? 'checked' : ''} data-id="${todo.id}">
                <div class="todo-content">
                    <div class="todo-title">${TextUtils.escapeHtml(todo.title)}</div>
                    ${todo.description ? `<div class="todo-description">${TextUtils.escapeHtml(todo.description)}</div>` : ''}
                    <div class="todo-meta">
                        <span class="priority-${todo.priority}">${todo.priority} priority</span>
                        ${todo.due_date ? `<span><i class="fas fa-calendar"></i> ${this.formatDate(todo.due_date)}</span>` : ''}
                        <span>${todo.status}</span>
                        ${todo.llm_generated ? '<span class="ai-generated"><i class="fas fa-robot"></i> AI Generated</span>' : ''}
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-secondary btn-small edit-todo-btn" data-id="${todo.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small delete-todo-btn" data-id="${todo.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderEmptyState() {
        this.updateSummary([]);
        this.elements.todosHeader?.classList.remove('has-items');
        this.elements.todosItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No Tasks Yet</h3>
                <p>Add tasks manually or use AI suggestions</p>
            </div>
        `;
    }

    bindProjectSelection(handler) {
        this.elements.projectSelector?.addEventListener('change', (event) => {
            handler(event.target.value || null);
        });
    }

    bindGenerateTodos(handler) {
        this.elements.generateTodosBtn?.addEventListener('click', handler);
    }

    bindNewTodo(handler) {
        this.elements.newTodoBtn?.addEventListener('click', handler);
    }

    bindBulkActions(onComplete, onDelete) {
        this.elements.bulkCompleteBtn?.addEventListener('click', () => {
            const selectedIds = this.getSelectedTodoIds();
            if (selectedIds.length === 0) {
                this.showError('Select at least one todo');
                return;
            }
            onComplete(selectedIds);
        });

        this.elements.bulkDeleteBtn?.addEventListener('click', () => {
            const selectedIds = this.getSelectedTodoIds();
            if (selectedIds.length === 0) {
                this.showError('Select at least one todo');
                return;
            }
            onDelete(selectedIds);
        });

        this.elements.selectAllCheckbox?.addEventListener('change', (event) => {
            const isChecked = event.target.checked;
            this.elements.todosItems?.querySelectorAll('.todo-select').forEach((checkbox) => {
                checkbox.checked = isChecked;
                checkbox.closest('.todo-card')?.classList.toggle('todo-selected', isChecked);
            });
        });
    }

    bindFormSubmission(handler) {
        this.elements.todoForm?.addEventListener('submit', (event) => {
            event.preventDefault();

            const todoData = {
                title: this.elements.todoTitle.value.trim(),
                description: this.elements.todoDescription.value.trim(),
                priority: this.elements.todoPriority.value,
                due_date: this.elements.todoDueDate.value,
                status: this.elements.todoStatus.value
            };

            const editId = this.elements.todoForm.dataset.editId || null;
            handler(todoData, editId);
        });
    }

    bindTodoActions(onToggle, onEdit, onDelete) {
        this.elements.todosItems?.addEventListener('click', (event) => {
            const selectCheckbox = event.target.closest('.todo-select');
            if (selectCheckbox) {
                selectCheckbox.closest('.todo-card')?.classList.toggle('todo-selected', selectCheckbox.checked);
                return;
            }

            const checkbox = event.target.closest('.todo-checkbox');
            if (checkbox) {
                onToggle(checkbox.dataset.id, checkbox.checked);
                return;
            }

            const editBtn = event.target.closest('.edit-todo-btn');
            if (editBtn) {
                onEdit(editBtn.dataset.id);
                return;
            }

            const deleteBtn = event.target.closest('.delete-todo-btn');
            if (deleteBtn) {
                onDelete(deleteBtn.dataset.id);
            }
        });
    }

    showTodoModal(todo = null) {
        if (!this.elements.todoModal) return;

        if (todo) {
            this.elements.todoTitle.value = todo.title || '';
            this.elements.todoDescription.value = todo.description || '';
            this.elements.todoPriority.value = todo.priority || 'medium';
            this.elements.todoDueDate.value = todo.due_date ? todo.due_date.split('T')[0] : '';
            this.elements.todoStatus.value = todo.status || 'pending';
            this.elements.todoForm.dataset.editId = todo.id;
        } else {
            this.clearForm();
        }

        ModalUtils.show(this.elements.todoModal);
    }

    hideTodoModal() {
        if (!this.elements.todoModal) return;
        ModalUtils.hide(this.elements.todoModal);
        this.clearForm();
    }

    clearForm() {
        if (!this.elements.todoForm) return;
        this.elements.todoForm.reset();
        delete this.elements.todoForm.dataset.editId;
        if (this.elements.todoStatus) {
            this.elements.todoStatus.value = 'pending';
        }
    }

    getSelectedTodoIds() {
        const selected = Array.from(this.elements.todosItems?.querySelectorAll('.todo-select:checked') || []);
        return selected.map(checkbox => checkbox.dataset.id);
    }

    clearSelection() {
        if (this.elements.selectAllCheckbox) {
            this.elements.selectAllCheckbox.checked = false;
        }
        this.elements.todosItems?.querySelectorAll('.todo-select').forEach((checkbox) => {
            checkbox.checked = false;
            checkbox.closest('.todo-card')?.classList.remove('todo-selected');
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    }

    populateProjectSelector(projects, currentProjectId) {
        if (!this.elements.projectSelector) return;

        const currentValue = this.elements.projectSelector.value;
        this.elements.projectSelector.innerHTML = '<option value="">Select a project...</option>' +
            projects.map(project => `
                <option value="${project.id}" ${project.id === currentProjectId ? 'selected' : ''}>
                    ${TextUtils.escapeHtml(project.name)}
                </option>
            `).join('');

        if (currentProjectId) {
            this.elements.projectSelector.value = currentProjectId;
        } else if (currentValue) {
            this.elements.projectSelector.value = currentValue;
        }
    }

    updateSummary(todos) {
        if (!this.elements.todosSummary) return;
        if (!todos || todos.length === 0) {
            this.elements.todosSummary.textContent = 'No todos found';
            return;
        }

        const total = todos.length;
        const completed = todos.filter(todo => todo.status === 'completed').length;
        const pending = todos.filter(todo => todo.status !== 'completed').length;
        this.elements.todosSummary.textContent = `${completed}/${total} completed • ${pending} pending`;
    }
}

// TodosUI is available globally via window.TodosUI
if (typeof window !== 'undefined') {
    window.TodosUI = TodosUI;
}
