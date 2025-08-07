// API Configuration
const API_BASE_URL = 'http://localhost:3060/api';

// Global state
let currentProject = null;
let projects = [];

// DOM Elements
const elements = {
    // Navigation
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Projects
    projectsGrid: document.getElementById('projectsGrid'),
    newProjectBtn: document.getElementById('newProjectBtn'),
    projectModal: document.getElementById('projectModal'),
    projectForm: document.getElementById('projectForm'),
    projectName: document.getElementById('projectName'),
    projectDescription: document.getElementById('projectDescription'),
    
    // Notes
    notesProjectSelector: document.getElementById('notesProjectSelector'),
    noteInput: document.getElementById('noteInput'),
    addNoteBtn: document.getElementById('addNoteBtn'),
    notesList: document.getElementById('notesList'),
    
    // Todos
    todosProjectSelector: document.getElementById('todosProjectSelector'),
    generateTodosBtn: document.getElementById('generateTodosBtn'),
    newTodoBtn: document.getElementById('newTodoBtn'),
    todosList: document.getElementById('todosList'),
    todoModal: document.getElementById('todoModal'),
    todoForm: document.getElementById('todoForm'),
    
    // Reports
    reportsProjectSelector: document.getElementById('reportsProjectSelector'),
    generateReportBtn: document.getElementById('generateReportBtn'),
    reportsList: document.getElementById('reportsList'),
    reportModal: document.getElementById('reportModal'),
    reportForm: document.getElementById('reportForm'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Utility Functions
const showLoading = () => elements.loadingOverlay.classList.add('active');
const hideLoading = () => elements.loadingOverlay.classList.remove('active');

const showModal = (modal) => modal.classList.add('active');
const hideModal = (modal) => modal.classList.remove('active');

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// API Functions
const api = {
    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Projects
    getProjects: () => api.request('/projects'),
    createProject: (data) => api.request('/projects', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateProject: (id, data) => api.request(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteProject: (id) => api.request(`/projects/${id}`, { method: 'DELETE' }),

    // Notes
    getNotes: (projectId) => api.request(`/notes?project_id=${projectId}`),
    createNote: (data) => api.request('/notes', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    deleteNote: (id) => api.request(`/notes/${id}`, { method: 'DELETE' }),

    // Todos
    getTodos: (projectId) => api.request(`/todos?project_id=${projectId}`),
    createTodo: (data) => api.request('/todos', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateTodo: (id, data) => api.request(`/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    generateTodos: (projectId) => api.request('/todos/generate', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId })
    }),
    deleteTodo: (id) => api.request(`/todos/${id}`, { method: 'DELETE' }),

    // Reports
    getReports: (projectId) => api.request(`/reports?project_id=${projectId}`),
    generateReport: (data) => api.request('/reports/generate', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    deleteReport: (id) => api.request(`/reports/${id}`, { method: 'DELETE' })
};

// Navigation
function initNavigation() {
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active states
            elements.navTabs.forEach(t => t.classList.remove('active'));
            elements.tabContents.forEach(content => content.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Load content for active tab
            loadTabContent(targetTab);
        });
    });
}

async function loadTabContent(tab) {
    console.log('🏷️ TAB DEBUG: loadTabContent() called for tab:', tab);
    switch(tab) {
        case 'projects':
            console.log('🏷️ TAB DEBUG: Loading projects tab');
            await loadProjects();
            break;
        case 'notes':
            console.log('🏷️ TAB DEBUG: Loading notes tab');
            await loadProjectSelectors();
            if (currentProject) await loadNotes(currentProject);
            break;
        case 'todos':
            console.log('🏷️ TAB DEBUG: Loading todos tab');
            await loadProjectSelectors();
            if (currentProject) await loadTodos(currentProject);
            break;
        case 'reports':
            console.log('🏷️ TAB DEBUG: Loading reports tab');
            await loadProjectSelectors();
            if (currentProject) await loadReports(currentProject);
            break;
    }
    console.log('🏷️ TAB DEBUG: Tab content loaded for:', tab);
}

// Projects
async function loadProjects() {
    console.log('📁 PROJECT DEBUG: loadProjects() called');
    try {
        console.log('📁 PROJECT DEBUG: Fetching projects from API...');
        projects = await api.getProjects();
        console.log('📁 PROJECT DEBUG: Projects loaded:', projects.length);
        
        console.log('📁 PROJECT DEBUG: Rendering projects...');
        renderProjects();
        console.log('📁 PROJECT DEBUG: Projects rendered successfully');
    } catch (error) {
        console.error('Failed to load projects:', error);
        showError('Failed to load projects');
    }
}

function renderProjects() {
    if (projects.length === 0) {
        elements.projectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Projects Yet</h3>
                <p>Create your first project to start tracking progress</p>
            </div>
        `;
        return;
    }

    elements.projectsGrid.innerHTML = projects.map(project => `
        <div class="project-card" data-id="${project.id}">
            <h3>${escapeHtml(project.name)}</h3>
            <p>${escapeHtml(project.description || 'No description')}</p>
            <div class="project-status status-${project.status}">${project.status.replace('_', ' ')}</div>
            <div class="project-actions">
                <button class="btn btn-primary select-project-btn" data-id="${project.id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-secondary edit-project-btn" data-id="${project.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger delete-project-btn" data-id="${project.id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.select-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.target.closest('button').dataset.id;
            selectProject(projectId);
        });
    });

    document.querySelectorAll('.edit-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.target.closest('button').dataset.id;
            editProject(projectId);
        });
    });

    document.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.target.closest('button').dataset.id;
            deleteProject(projectId);
        });
    });
}

function selectProject(projectId) {
    currentProject = projectId;
    updateProjectSelectors();
    
    // Switch to notes tab
    document.querySelector('[data-tab="notes"]').click();
}

async function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    elements.projectName.value = project.name;
    elements.projectDescription.value = project.description || '';
    elements.projectForm.dataset.editId = projectId;
    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    
    showModal(elements.projectModal);
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated notes, todos, and reports.')) {
        return;
    }

    try {
        showLoading();
        await api.deleteProject(projectId);
        await loadProjects();
        if (currentProject === projectId) {
            currentProject = null;
            updateProjectSelectors();
        }
    } catch (error) {
        showError('Failed to delete project');
    } finally {
        hideLoading();
    }
}

// Project Selectors
async function loadProjectSelectors() {
    if (projects.length === 0) {
        await loadProjects();
    }
    updateProjectSelectors();
}

function updateProjectSelectors() {
    const selectors = [
        elements.notesProjectSelector,
        elements.todosProjectSelector, 
        elements.reportsProjectSelector
    ];

    selectors.forEach(selector => {
        if (!selector) return;
        
        const currentValue = selector.value;
        selector.innerHTML = '<option value="">Select a project...</option>' +
            projects.map(project => 
                `<option value="${project.id}" ${project.id === currentProject ? 'selected' : ''}>
                    ${escapeHtml(project.name)}
                </option>`
            ).join('');
            
        if (currentProject) {
            selector.value = currentProject;
        }
    });
}

// Notes
async function loadNotes(projectId) {
    if (!projectId) {
        elements.notesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h3>Select a Project</h3>
                <p>Choose a project to view and add notes</p>
            </div>
        `;
        return;
    }

    try {
        const notes = await api.getNotes(projectId);
        renderNotes(notes);
    } catch (error) {
        console.error('Failed to load notes:', error);
        showError('Failed to load notes');
    }
}

function renderNotes(notes) {
    if (notes.length === 0) {
        elements.notesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h3>No Notes Yet</h3>
                <p>Add your first note above to get started</p>
            </div>
        `;
        return;
    }

    elements.notesList.innerHTML = notes.map(note => {
        const structuredData = note.structured_data;
        let enhancedSection = '';
        
        if (note.enhanced_content && structuredData) {
            enhancedSection = `
                <div class="note-enhanced">
                    <div class="note-enhanced-header">
                        <i class="fas fa-magic"></i> AI Enhanced
                    </div>
                    <div class="enhanced-content">${escapeHtml(note.enhanced_content)}</div>
                    ${structuredData.key_insights ? `
                        <div class="note-insights">
                            ${structuredData.key_insights.map(insight => 
                                `<span class="insight-tag">${escapeHtml(insight)}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        return `
            <div class="note-card">
                <div class="note-header">
                    <span class="note-date">${formatDate(note.created_at)}</span>
                    <button class="btn btn-danger btn-small delete-note-btn" data-id="${note.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="note-content">${escapeHtml(note.content).replace(/\n/g, '<br>')}</div>
                ${enhancedSection}
            </div>
        `;
    }).join('');

    // Add delete event listeners
    document.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const noteId = e.target.closest('button').dataset.id;
            await deleteNote(noteId);
        });
    });
}

async function addNote() {
    const content = elements.noteInput.value.trim();
    if (!content || !currentProject) {
        showError('Please select a project and enter note content');
        return;
    }

    try {
        showLoading();
        await api.createNote({
            project_id: currentProject,
            content: content
        });
        
        elements.noteInput.value = '';
        await loadNotes(currentProject);
    } catch (error) {
        console.error('Failed to add note:', error);
        showError('Failed to add note');
    } finally {
        hideLoading();
    }
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
        showLoading();
        await api.deleteNote(noteId);
        await loadNotes(currentProject);
    } catch (error) {
        showError('Failed to delete note');
    } finally {
        hideLoading();
    }
}

// Todos
async function loadTodos(projectId) {
    if (!projectId) {
        elements.todosList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>Select a Project</h3>
                <p>Choose a project to view and manage todos</p>
            </div>
        `;
        return;
    }

    try {
        const todos = await api.getTodos(projectId);
        renderTodos(todos);
    } catch (error) {
        console.error('Failed to load todos:', error);
        showError('Failed to load todos');
    }
}

function renderTodos(todos) {
    if (todos.length === 0) {
        elements.todosList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No Tasks Yet</h3>
                <p>Add tasks manually or use AI suggestions</p>
            </div>
        `;
        return;
    }

    elements.todosList.innerHTML = todos.map(todo => `
        <div class="todo-card ${todo.status === 'completed' ? 'todo-completed' : ''}">
            <input type="checkbox" class="todo-checkbox" 
                   ${todo.status === 'completed' ? 'checked' : ''}
                   data-id="${todo.id}">
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
                <div class="todo-meta">
                    <span class="priority-${todo.priority}">${todo.priority} priority</span>
                    ${todo.due_date ? `<span><i class="fas fa-calendar"></i> ${formatDate(todo.due_date)}</span>` : ''}
                    <span>${todo.status}</span>
                    ${todo.llm_generated ? '<span class="ai-generated"><i class="fas fa-robot"></i> AI Generated</span>' : ''}
                </div>
            </div>
            <button class="btn btn-danger btn-small delete-todo-btn" data-id="${todo.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const todoId = e.target.dataset.id;
            const completed = e.target.checked;
            await toggleTodo(todoId, completed);
        });
    });

    document.querySelectorAll('.delete-todo-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const todoId = e.target.closest('button').dataset.id;
            await deleteTodo(todoId);
        });
    });
}

async function toggleTodo(todoId, completed) {
    try {
        await api.updateTodo(todoId, {
            status: completed ? 'completed' : 'pending'
        });
    } catch (error) {
        showError('Failed to update todo');
        // Revert checkbox state
        document.querySelector(`[data-id="${todoId}"]`).checked = !completed;
    }
}

async function generateTodos() {
    if (!currentProject) {
        showError('Please select a project first');
        return;
    }

    try {
        showLoading();
        await api.generateTodos(currentProject);
        await loadTodos(currentProject);
    } catch (error) {
        console.error('Failed to generate todos:', error);
        showError('Failed to generate AI todo suggestions');
    } finally {
        hideLoading();
    }
}

async function deleteTodo(todoId) {
    if (!confirm('Are you sure you want to delete this todo?')) return;

    try {
        await api.deleteTodo(todoId);
        await loadTodos(currentProject);
    } catch (error) {
        showError('Failed to delete todo');
    }
}

// Reports
async function loadReports(projectId) {
    if (!projectId) {
        elements.reportsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>Select a Project</h3>
                <p>Choose a project to view and generate reports</p>
            </div>
        `;
        return;
    }

    try {
        const reports = await api.getReports(projectId);
        renderReports(reports);
    } catch (error) {
        console.error('Failed to load reports:', error);
        showError('Failed to load reports');
    }
}

function renderReports(reports) {
    if (reports.length === 0) {
        elements.reportsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>No Reports Yet</h3>
                <p>Generate your first AI-powered report</p>
            </div>
        `;
        return;
    }

    elements.reportsList.innerHTML = reports.map(report => `
        <div class="report-card">
            <div class="report-header">
                <div class="report-title">${escapeHtml(report.title)}</div>
                <button class="btn btn-danger btn-small delete-report-btn" data-id="${report.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="report-meta">
                <span class="report-type">${report.report_type}</span>
                <span><i class="fas fa-calendar"></i> ${formatDate(report.created_at)}</span>
                ${report.recipient ? `<span><i class="fas fa-user"></i> ${escapeHtml(report.recipient)}</span>` : ''}
            </div>
            <div class="report-content">${escapeHtml(report.content)}</div>
        </div>
    `).join('');

    // Add delete event listeners
    document.querySelectorAll('.delete-report-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const reportId = e.target.closest('button').dataset.id;
            await deleteReport(reportId);
        });
    });
}

async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
        await api.deleteReport(reportId);
        await loadReports(currentProject);
    } catch (error) {
        showError('Failed to delete report');
    }
}

// Modal Handlers
function initModals() {
    // Project Modal
    elements.newProjectBtn.addEventListener('click', () => {
        elements.projectForm.reset();
        delete elements.projectForm.dataset.editId;
        document.getElementById('projectModalTitle').textContent = 'New Project';
        showModal(elements.projectModal);
    });

    elements.projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = elements.projectForm.dataset.editId;
        
        const data = {
            name: elements.projectName.value,
            description: elements.projectDescription.value
        };

        try {
            showLoading();
            if (editId) {
                await api.updateProject(editId, data);
            } else {
                await api.createProject(data);
            }
            
            hideModal(elements.projectModal);
            await loadProjects();
        } catch (error) {
            showError(`Failed to ${editId ? 'update' : 'create'} project`);
        } finally {
            hideLoading();
        }
    });

    // Todo Modal
    if (elements.newTodoBtn) {
        elements.newTodoBtn.addEventListener('click', () => {
            if (!currentProject) {
                showError('Please select a project first');
                return;
            }
            elements.todoForm.reset();
            showModal(elements.todoModal);
        });
    }

    if (elements.todoForm) {
        elements.todoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentProject) {
                showError('Please select a project first');
                return;
            }

            const data = {
                project_id: currentProject,
                title: document.getElementById('todoTitle').value,
                description: document.getElementById('todoDescription').value,
                priority: document.getElementById('todoPriority').value,
                due_date: document.getElementById('todoDueDate').value || null
            };

            try {
                showLoading();
                await api.createTodo(data);
                hideModal(elements.todoModal);
                await loadTodos(currentProject);
            } catch (error) {
                showError('Failed to create todo');
            } finally {
                hideLoading();
            }
        });
    }

    // Report Modal
    if (elements.generateReportBtn) {
        elements.generateReportBtn.addEventListener('click', () => {
            if (!currentProject) {
                showError('Please select a project first');
                return;
            }
            showModal(elements.reportModal);
        });
    }

    if (elements.reportForm) {
        elements.reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!currentProject) {
                showError('Please select a project first');
                return;
            }

            const data = {
                project_id: currentProject,
                report_type: document.getElementById('reportType').value,
                recipient: document.getElementById('reportRecipient').value || null
            };

            try {
                showLoading();
                await api.generateReport(data);
                hideModal(elements.reportModal);
                await loadReports(currentProject);
            } catch (error) {
                showError('Failed to generate report');
            } finally {
                hideLoading();
            }
        });
    }

    // Close modal handlers
    document.querySelectorAll('.modal-close, [id$="Modal"] .btn-secondary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal);
        });
    });

    // Close modal on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal(modal);
            }
        });
    });
}

// Event Handlers
function initEventHandlers() {
    // Notes
    elements.addNoteBtn?.addEventListener('click', addNote);
    elements.noteInput?.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            addNote();
        }
    });

    // Project selectors
    elements.notesProjectSelector?.addEventListener('change', (e) => {
        currentProject = e.target.value;
        loadNotes(currentProject);
    });

    elements.todosProjectSelector?.addEventListener('change', (e) => {
        currentProject = e.target.value;
        loadTodos(currentProject);
    });

    elements.reportsProjectSelector?.addEventListener('change', (e) => {
        currentProject = e.target.value;
        loadReports(currentProject);
    });

    // Todos
    elements.generateTodosBtn?.addEventListener('click', generateTodos);
}

// Utility Functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

function showError(message) {
    // Simple error display - could be enhanced with a toast system
    alert(message);
}

// Initialize Application
async function init() {
    console.log('📱 APP DEBUG: init() function called');
    console.log('📱 APP DEBUG: Document readyState:', document.readyState);
    console.log('📱 APP DEBUG: Current URL:', window.location.href);
    
    console.log('📱 APP DEBUG: Initializing navigation...');
    initNavigation();
    
    console.log('📱 APP DEBUG: Initializing modals...');
    initModals();
    
    console.log('📱 APP DEBUG: Initializing event handlers...');
    initEventHandlers();
    
    console.log('📱 APP DEBUG: Loading initial projects...');
    // Load initial data
    await loadProjects();
    
    console.log('🚀 Progress Tracker initialized successfully!');
}

// Logout function
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expiration');
    window.location.href = '/';
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
