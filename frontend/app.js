// API Configuration - Prefer same-origin to support HTTPS/mobiles; fall back for localhost dev
const getApiBaseUrl = () => {
    const currentHost = window.location.hostname;
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return 'http://localhost:3060/api';
    }
    // Same-origin relative path lets HTTPS reverse proxy handle API
    return '/api';
};

const API_BASE_URL = getApiBaseUrl();

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
    recordVoiceBtn: document.getElementById('recordVoiceBtn'),
    recordStatus: document.getElementById('recordStatus'),
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
    
    // Timelines
    timelinesProjectSelector: document.getElementById('timelinesProjectSelector'),
    timelineZoom: document.getElementById('timelineZoom'),
    estimateTimelineBtn: document.getElementById('estimateTimelineBtn'),
    exportTimelineBtn: document.getElementById('exportTimelineBtn'),
    newMilestoneBtn: document.getElementById('newMilestoneBtn'),
    timelineContainer: document.getElementById('timelineContainer'),
    
    // Milestone Modal
    milestoneModal: document.getElementById('milestoneModal'),
    milestoneForm: document.getElementById('milestoneForm'),
    milestoneTitle: document.getElementById('milestoneTitle'),
    milestoneDescription: document.getElementById('milestoneDescription'),
    milestoneTargetDate: document.getElementById('milestoneTargetDate'),
    milestoneStatus: document.getElementById('milestoneStatus'),
    
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
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
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
                let message = `Request failed (${response.status})`;
                try {
                    const errorBody = await response.json();
                    if (errorBody) {
                        message = errorBody.error || message;
                        if (Array.isArray(errorBody.details) && errorBody.details.length) {
                            const detailsText = errorBody.details.map(d => d.message).join(', ');
                            if (detailsText) message = `${message}: ${detailsText}`;
                        }
                    }
                } catch {
                    // ignore JSON parse errors and keep default message
                }
                const err = new Error(message);
                err.name = 'ApiError';
                throw err;
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
    generateWeeklyReport: (data) => api.request('/reports/weekly', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    testEmail: (data) => api.request('/reports/test-email', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getSchedulerStatus: () => api.request('/reports/scheduler/status'),
    triggerWeeklyReport: () => api.request('/reports/scheduler/trigger', { method: 'POST' }),
    deleteReport: (id) => api.request(`/reports/${id}`, { method: 'DELETE' }),

    // Settings
    getSettings: () => api.request('/settings'),
    getEmailSettings: () => api.request('/settings/email'),
    getProfiles: () => api.request('/settings/profiles'),
    saveProfiles: (profiles) => api.request('/settings/profiles', { method: 'PUT', body: JSON.stringify(profiles) }),
    updateSettings: (data) => api.request('/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    updateEmailSettings: (data) => api.request('/settings/email/quick', {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    // Timelines
    getTimeline: (projectId) => api.request(`/timelines?project_id=${projectId}`),
    createMilestone: (data) => api.request('/timelines/milestones', { method: 'POST', body: JSON.stringify(data) }),
    updateMilestone: (id, data) => api.request(`/timelines/milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteMilestone: (id) => api.request(`/timelines/milestones/${id}`, { method: 'DELETE' }),
    estimateTimeline: (projectId) => api.request('/timelines/estimate', { method: 'POST', body: JSON.stringify({ project_id: projectId }) })
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
        case 'timelines':
            console.log('🏷️ TAB DEBUG: Loading timelines tab');
            await loadProjectSelectors();
            if (currentProject) await loadTimeline(currentProject);
            bindTimelineEvents();
            break;
        case 'settings':
            console.log('🏷️ TAB DEBUG: Loading settings tab');
            await loadSettings();
            break;
        case 'skills':
            console.log('🏷️ TAB DEBUG: Loading skills tab');
            await loadSkills();
            break;
        case 'achievements':
            console.log('🏷️ TAB DEBUG: Loading achievements tab');
            await loadAchievements();
            break;
        case 'reflections':
            console.log('🏷️ TAB DEBUG: Loading reflections tab');
            await loadReflections();
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
        elements.reportsProjectSelector,
        elements.timelinesProjectSelector
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

// Timelines
function bindTimelineEvents() {
    if (elements.timelinesProjectSelector) {
        elements.timelinesProjectSelector.onchange = async (e) => {
            currentProject = e.target.value || null;
            if (currentProject) await loadTimeline(currentProject);
        };
    }
    
    if (elements.timelineZoom) {
        elements.timelineZoom.onchange = async () => {
            if (currentProject) await loadTimeline(currentProject);
        };
    }
    
    if (elements.estimateTimelineBtn) {
        elements.estimateTimelineBtn.onclick = async () => {
            if (!currentProject) { showError('Please select a project'); return; }
            try {
                showLoading();
                const res = await api.estimateTimeline(currentProject);
                try {
                    const data = JSON.parse(res.data || '{}');
                    renderTimelineSuggestion(data);
                } catch {
                    // If backend already parsed to object
                    renderTimelineSuggestion(res.data);
                }
            } catch (err) {
                showError('Failed to estimate timeline');
            } finally {
                hideLoading();
            }
        };
    }
    
    if (elements.exportTimelineBtn) {
        elements.exportTimelineBtn.onclick = async () => {
            if (!currentProject) { 
                showError('Please select a project'); 
                return; 
            }
            await exportTimeline();
        };
    }
    
    if (elements.newMilestoneBtn) {
        elements.newMilestoneBtn.onclick = () => {
            if (!currentProject) { 
                showError('Please select a project'); 
                return; 
            }
            openMilestoneModal();
        };
    }
}

// Export Timeline
async function exportTimeline() {
    try {
        showLoading();
        
        // Get current project and timeline data
        const project = projects.find(p => p.id === currentProject);
        if (!project) {
            showError('Project not found');
            return;
        }
        
        const data = await api.getTimeline(currentProject);
        const zoomFilter = elements.timelineZoom?.value || 'all';
        
        // Prepare timeline items
        const allItems = [
            ...data.milestones.map(m => ({
                type: 'milestone',
                date: m.target_date,
                title: m.title,
                description: m.description,
                status: m.status
            })),
            ...data.todos.map(t => ({
                type: 'todo',
                date: t.due_date,
                title: t.title,
                description: t.description,
                status: t.status
            }))
        ].filter(i => i.date);
        
        const items = filterTimelineItems(allItems, zoomFilter);
        
        // Create export content
        const exportContent = generateTimelineExport(project, items, zoomFilter);
        
        // Show export options
        showExportOptions(exportContent, `${project.name}_timeline`);
        
    } catch (error) {
        showError('Failed to export timeline');
    } finally {
        hideLoading();
    }
}

function generateTimelineExport(project, items, filter) {
    const filterLabel = getZoomFilterLabel(filter);
    const date = new Date().toLocaleDateString();
    
    let content = `PROJECT TIMELINE EXPORT\n`;
    content += `========================\n\n`;
    content += `Project: ${project.name}\n`;
    content += `Description: ${project.description || 'No description'}\n`;
    content += `Filter: ${filterLabel}\n`;
    content += `Export Date: ${date}\n`;
    content += `Total Items: ${items.length}\n\n`;
    
    if (items.length === 0) {
        content += `No timeline items found for ${filterLabel}.\n`;
        return content;
    }
    
    // Group by type
    const milestones = items.filter(i => i.type === 'milestone');
    const todos = items.filter(i => i.type === 'todo');
    
    if (milestones.length > 0) {
        content += `MILESTONES\n`;
        content += `==========\n`;
        milestones.forEach(item => {
            content += `• ${item.title}\n`;
            content += `  Date: ${item.date}\n`;
            content += `  Status: ${item.status || 'planned'}\n`;
            if (item.description) {
                content += `  Description: ${item.description}\n`;
            }
            content += `\n`;
        });
    }
    
    if (todos.length > 0) {
        content += `TASKS\n`;
        content += `=====\n`;
        todos.forEach(item => {
            content += `• ${item.title}\n`;
            content += `  Due Date: ${item.date}\n`;
            content += `  Status: ${item.status || 'pending'}\n`;
            if (item.description) {
                content += `  Description: ${item.description}\n`;
            }
            content += `\n`;
        });
    }
    
    return content;
}

function showExportOptions(content, filename) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Export Timeline</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Choose export format:</p>
                <div class="export-options" style="display: flex; gap: 12px; margin: 16px 0;">
                    <button class="btn btn-primary" id="exportTxt">
                        <i class="fas fa-file-text"></i> Text File
                    </button>
                    <button class="btn btn-secondary" id="exportClipboard">
                        <i class="fas fa-clipboard"></i> Copy to Clipboard
                    </button>
                    <button class="btn btn-secondary" id="exportPrint">
                        <i class="fas fa-print"></i> Print
                    </button>
                </div>
                <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 0.9rem;">${content}</textarea>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="closeExportModal">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Export handlers
    modal.querySelector('#exportTxt').onclick = () => {
        downloadAsFile(content, `${filename}.txt`, 'text/plain');
        document.body.removeChild(modal);
    };
    
    modal.querySelector('#exportClipboard').onclick = async () => {
        try {
            await navigator.clipboard.writeText(content);
            showSuccess('Timeline copied to clipboard');
            document.body.removeChild(modal);
        } catch (error) {
            showError('Failed to copy to clipboard');
        }
    };
    
    modal.querySelector('#exportPrint').onclick = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>${filename}</title>
                    <style>
                        body { font-family: monospace; margin: 40px; line-height: 1.5; }
                        h1 { color: #333; }
                        pre { white-space: pre-wrap; }
                    </style>
                </head>
                <body>
                    <pre>${content}</pre>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        document.body.removeChild(modal);
    };
    
    modal.querySelector('.modal-close').onclick = () => {
        document.body.removeChild(modal);
    };
    
    modal.querySelector('#closeExportModal').onclick = () => {
        document.body.removeChild(modal);
    };
}

function downloadAsFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Milestone Modal Functions
function openMilestoneModal(milestoneData = null) {
    if (milestoneData) {
        // Edit mode
        document.getElementById('milestoneModalTitle').textContent = 'Edit Milestone';
        elements.milestoneTitle.value = milestoneData.title || '';
        elements.milestoneDescription.value = milestoneData.description || '';
        elements.milestoneTargetDate.value = milestoneData.target_date || '';
        elements.milestoneStatus.value = milestoneData.status || 'planned';
        elements.milestoneForm.dataset.editId = milestoneData.id;
    } else {
        // Create mode
        document.getElementById('milestoneModalTitle').textContent = 'New Milestone';
        elements.milestoneForm.reset();
        delete elements.milestoneForm.dataset.editId;
    }
    showModal(elements.milestoneModal);
}

async function saveMilestone(data) {
    const editId = elements.milestoneForm.dataset.editId;
    
    try {
        showLoading();
        if (editId) {
            await api.updateMilestone(editId, data);
        } else {
            await api.createMilestone({ ...data, project_id: currentProject });
        }
        await loadTimeline(currentProject);
        hideModal(elements.milestoneModal);
        showSuccess(editId ? 'Milestone updated' : 'Milestone created');
    } catch (error) {
        showError(editId ? 'Failed to update milestone' : 'Failed to create milestone');
    } finally {
        hideLoading();
    }
}

async function loadTimeline(projectId) {
    if (!projectId) {
        elements.timelineContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-stream"></i>
                <h3>Select a Project</h3>
                <p>Choose a project to view timeline</p>
            </div>
        `;
        return;
    }
    try {
        const data = await api.getTimeline(projectId);
        renderTimeline(data);
    } catch (e) {
        console.error('Failed to load timeline', e);
        showError('Failed to load timeline');
    }
}

let currentTimelineData = null;

function renderTimeline(data) {
    currentTimelineData = data;
    const now = new Date();
    let allItems = [
        ...data.milestones.map(m => ({
            type: 'milestone',
            date: m.target_date,
            title: m.title,
            description: m.description,
            status: m.status,
            id: m.id
        })),
        ...data.todos.map(t => ({
            type: 'todo',
            date: t.due_date,
            title: t.title,
            description: t.description,
            status: t.status,
            id: t.id
        }))
    ].filter(i => i.date).map(item => {
        // Check for overdue items
        const itemDate = new Date(item.date);
        const isOverdue = itemDate < now && item.status !== 'completed' && item.status !== 'cancelled';
        return {
            ...item,
            isOverdue,
            statusClass: isOverdue ? 'overdue' : (item.status || 'pending').replace('_', '-')
        };
    }).sort((a,b) => new Date(a.date) - new Date(b.date));
    
    // Apply zoom filter
    const zoomFilter = elements.timelineZoom?.value || 'all';
    const items = filterTimelineItems(allItems, zoomFilter);
    const totalCount = allItems.length;

    if (items.length === 0) {
        const emptyMessage = totalCount === 0 
            ? 'No timeline items yet'
            : `No items for ${getZoomFilterLabel(zoomFilter)}`;
        const emptySubtext = totalCount === 0 
            ? 'Add due dates to todos or create milestones'
            : `${totalCount} total items available - try a different time range`;
            
        elements.timelineContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-stream"></i>
                <h3>${emptyMessage}</h3>
                <p>${emptySubtext}</p>
            </div>`;
        return;
    }

    const filterInfo = totalCount !== items.length 
        ? `<div class="timeline-filter-info">
            Showing <span class="filter-count">${items.length}</span> of ${totalCount} items for ${getZoomFilterLabel(zoomFilter)}
           </div>`
        : '';

    elements.timelineContainer.innerHTML = `
        ${filterInfo}
        <div class="timeline">
            ${items.map(it => `
                <div class="timeline-item ${it.type} status-${it.statusClass}" draggable="true" data-type="${it.type}" data-id="${it.id}" data-date="${it.date}">
                    <div class="timeline-date">${escapeHtml(it.date)}</div>
                    <div class="timeline-content">
                        <div class="timeline-title">${it.type === 'milestone' ? '<i class="fas fa-flag"></i>' : '<i class="fas fa-check-square"></i>'} ${escapeHtml(it.title)}</div>
                        ${it.description ? `<div class="timeline-desc">${escapeHtml(it.description)}</div>` : ''}
                        <div class="timeline-meta">
                            <span class="timeline-status-badge ${it.statusClass}">${it.isOverdue ? 'Overdue' : (it.status || 'pending').replace('_', ' ')}</span>
                            ${it.isOverdue ? '<i class="fas fa-exclamation-triangle" style="color: #dc2626; margin-left: 8px;" title="Overdue"></i>' : ''}
                        </div>
                        ${it.type === 'milestone' ? `<div class="timeline-actions">
                            <button class="btn btn-small" data-action="edit" data-id="${it.id}"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-small btn-danger" data-action="delete" data-id="${it.id}"><i class="fas fa-trash"></i></button>
                        </div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    elements.timelineContainer.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            if (!confirm('Delete milestone?')) return;
            try {
                showLoading();
                await api.deleteMilestone(id);
                await loadTimeline(currentProject);
            } catch {
                showError('Failed to delete milestone');
            } finally {
                hideLoading();
            }
        });
    });

    elements.timelineContainer.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            // Get milestone data from current timeline data instead of API call
            const milestoneData = currentTimelineData?.milestones?.find(m => m.id === id);
            if (milestoneData) {
                openMilestoneModal(milestoneData);
            } else {
                showError('Milestone not found');
            }
        });
    });

    // Drag & drop reschedule
    const itemsEls = elements.timelineContainer.querySelectorAll('.timeline-item');
    itemsEls.forEach(el => {
        el.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                id: el.getAttribute('data-id'),
                type: el.getAttribute('data-type'),
                date: el.getAttribute('data-date')
            }));
        });
    });
    elements.timelineContainer.addEventListener('dragover', e => {
        e.preventDefault();
    });
    elements.timelineContainer.addEventListener('drop', async e => {
        e.preventDefault();
        const payload = e.dataTransfer.getData('text/plain');
        if (!payload) return;
        let dataObj; try { dataObj = JSON.parse(payload); } catch { return; }
        const newDate = prompt('New date (YYYY-MM-DD):', dataObj.date || '');
        if (!newDate) return;
        try {
            showLoading();
            if (dataObj.type === 'milestone') {
                await api.updateMilestone(dataObj.id, { target_date: newDate });
            } else {
                await api.updateTodo(dataObj.id, { due_date: newDate });
            }
            await loadTimeline(currentProject);
        } catch (err) {
            showError('Failed to reschedule item');
        } finally {
            hideLoading();
        }
    });
}

function renderTimelineSuggestion(suggestion) {
    if (!suggestion || !suggestion.proposed_milestones) {
        showError('No suggestion received');
        return;
    }
    const html = `
        <div class="timeline-suggestion">
            <h3><i class="fas fa-lightbulb"></i> AI Proposed Timeline</h3>
            <ol>
                ${suggestion.proposed_milestones.map(m => `<li><strong>${escapeHtml(m.title)}</strong> — ${escapeHtml(m.target_date || '')}<br><small>${escapeHtml(m.reason || '')}</small></li>`).join('')}
            </ol>
            ${suggestion.timeline_summary ? `<p>${escapeHtml(suggestion.timeline_summary)}</p>` : ''}
            ${suggestion.risks?.length ? `<div class="timeline-risks"><strong>Risks:</strong> ${suggestion.risks.map(escapeHtml).join(', ')}</div>` : ''}
            <div class="form-actions" style="margin-top:8px;">
                <button class="btn btn-primary" id="applySuggestionBtn"><i class="fas fa-check"></i> Apply as milestones</button>
            </div>
        </div>`;
    elements.timelineContainer.insertAdjacentHTML('afterbegin', html);
    const applyBtn = document.getElementById('applySuggestionBtn');
    if (applyBtn) {
        applyBtn.onclick = async () => {
            try {
                showLoading();
                for (const m of suggestion.proposed_milestones) {
                    await api.createMilestone({ project_id: currentProject, title: m.title, target_date: m.target_date });
                }
                await loadTimeline(currentProject);
            } catch {
                showError('Failed to apply milestones');
            } finally {
                hideLoading();
            }
        };
    }
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

// Voice Notes (Speech-to-Text)
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recognition = null;
let isDeviceSttActive = false;
let deviceSttFinalText = '';

async function toggleVoiceRecording() {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const deviceSttSupported = !!SpeechRecognition && location.protocol === 'https:';

        if (!isRecording && !isDeviceSttActive) {
            if (deviceSttSupported) {
                startDeviceStt(SpeechRecognition);
                return;
            }
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showError('Microphone not supported in this browser');
                console.warn('MediaDevices/getUserMedia not available');
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream, { mimeType: getSupportedAudioMimeType() });
            mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.onstop = async () => {
                const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
                await uploadForTranscription(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            mediaRecorder.start();
            isRecording = true;
            updateRecordUI(true);
        } else {
            if (isDeviceSttActive) {
                stopDeviceStt();
            } else {
                mediaRecorder?.stop();
                isRecording = false;
                updateRecordUI(false);
            }
        }
    } catch (e) {
        showError('Failed to access microphone');
        updateRecordUI(false);
    }
}

function startDeviceStt(SpeechRecognitionCtor) {
    try {
        recognition = new SpeechRecognitionCtor();
        recognition.lang = navigator.language || 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;
        isDeviceSttActive = true;
        deviceSttFinalText = '';
        updateRecordUI(true);
        elements.recordStatus.textContent = 'Listening… click to stop';

        const startingNoteValue = elements.noteInput.value;

        recognition.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const res = event.results[i];
                if (res.isFinal) {
                    const t = res[0].transcript.trim();
                    if (t) deviceSttFinalText += (deviceSttFinalText ? ' ' : '') + t;
                } else {
                    interim += res[0].transcript;
                }
            }
            const parts = [];
            if (startingNoteValue) parts.push(startingNoteValue);
            if (deviceSttFinalText) parts.push(deviceSttFinalText);
            if (interim.trim()) parts.push(interim.trim());
            elements.noteInput.value = parts.join('\n');
        };

        recognition.onerror = () => {
            showError('Device speech recognition error');
            stopDeviceStt();
        };

        recognition.onend = () => {
            if (isDeviceSttActive) {
                elements.recordStatus.textContent = '';
                updateRecordUI(false);
                isDeviceSttActive = false;
            }
        };

        recognition.start();
    } catch (err) {
        showError('Device speech recognition unavailable');
        isDeviceSttActive = false;
        updateRecordUI(false);
    }
}

function stopDeviceStt() {
    try { if (recognition && recognition.stop) recognition.stop(); } catch {}
    isDeviceSttActive = false;
    updateRecordUI(false);
    elements.recordStatus.textContent = '';
}

function getSupportedAudioMimeType() {
    const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg'
    ];
    for (const t of candidates) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) return t;
    }
    return 'audio/webm';
}

function updateRecordUI(active) {
    const btn = elements.recordVoiceBtn;
    const status = elements.recordStatus;
    if (!btn) return;
    if (active) {
        btn.classList.add('recording');
        status.textContent = 'Recording... click to stop';
    } else {
        btn.classList.remove('recording');
        status.textContent = '';
    }
}

async function uploadForTranscription(blob) {
    try {
        // Use inline mic status instead of global overlay
        elements.recordVoiceBtn?.classList.add('transcribing');
        elements.recordStatus.textContent = 'Transcribing audio…';
        const form = new FormData();
        const filename = `voice-note-${Date.now()}.${blob.type.includes('ogg') ? 'ogg' : 'webm'}`;
        form.append('audio', blob, filename);
        const res = await fetch(`${API_BASE_URL}/notes/transcribe`, {
            method: 'POST',
            body: form
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || 'Transcription failed');
        }
        const data = await res.json();
        if (data?.transcript) {
            const existing = elements.noteInput.value;
            elements.noteInput.value = existing ? `${existing}\n${data.transcript}` : data.transcript;
        } else {
            showError('No transcript returned');
        }
    } catch (e) {
        showError('Failed to transcribe audio');
    } finally {
        elements.recordVoiceBtn?.classList.remove('transcribing');
        if (!isRecording) elements.recordStatus.textContent = '';
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

// Settings
async function loadSettings() {
    try {
        await loadEmailSettings();
        await loadSchedulerStatus();
        await loadProfiles();
        await loadLlmSettings();
        initCoaching();
    } catch (error) {
        console.error('Failed to load settings:', error);
        showError('Failed to load settings');
    }
}

async function loadEmailSettings() {
    try {
        const emailSettings = await api.getEmailSettings();
        
        document.getElementById('weeklyReportEmail').value = emailSettings.data.weekly_report_email || '';
        document.getElementById('weeklyReportRecipients').value = (emailSettings.data.weekly_report_recipients || []).join(', ');
        document.getElementById('weeklyReportsEnabled').checked = emailSettings.data.weekly_reports_enabled || false;
        document.getElementById('reportSchedule').value = emailSettings.data.weekly_report_schedule || '0 9 * * 1';
        const primarySelect = document.getElementById('primaryProject');
        // Ensure we have projects loaded for the selector
        if (primarySelect) {
            if (!projects || projects.length === 0) {
                try {
                    projects = await api.getProjects();
                } catch (e) {
                    console.warn('Could not load projects for primary project selector');
                }
            }
            primarySelect.innerHTML = '<option value="">Select project for AI status...</option>' +
                projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
            primarySelect.value = emailSettings.data.primary_project_id || '';
        }
        const useAi = document.getElementById('useAiStatus');
        if (useAi) useAi.checked = !!emailSettings.data.weekly_use_ai_status;
        const narrativeOnly = document.getElementById('narrativeOnly');
        if (narrativeOnly) narrativeOnly.checked = !!emailSettings.data.weekly_narrative_only;
    } catch (error) {
        console.error('Failed to load email settings:', error);
    }
}

// Profiles UI
function renderProfiles(profiles) {
    const container = document.getElementById('profilesList');
    if (!container) return;
    if (!Array.isArray(profiles) || profiles.length === 0) {
        container.innerHTML = '<p>No groups yet. Click "Add Group" to create one.</p>';
        return;
    }
    container.innerHTML = profiles.map((p, idx) => `
        <div class="profile-row" data-index="${idx}" style="display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap;">
            <input type="text" class="profile-name" value="${escapeHtml(p.name)}" placeholder="Group name" style="flex:1; min-width:160px;" />
            <select class="profile-template">
                <option value="self" ${p.template === 'self' ? 'selected' : ''}>Self</option>
                <option value="manager" ${p.template === 'manager' ? 'selected' : ''}>Manager</option>
                <option value="company" ${p.template === 'company' ? 'selected' : ''}>Company</option>
            </select>
            <input type="text" class="profile-cron" value="${escapeHtml(p.cron)}" placeholder="Cron (e.g., 0 9 * * 1)" style="width:160px;" />
            <input type="text" class="profile-recipients" value="${escapeHtml((p.recipients||[]).join(', '))}" placeholder="Emails (comma)" style="flex:2; min-width:220px;" />
            <label class="checkbox-label" style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" class="profile-enabled" ${p.enabled ? 'checked' : ''} /> Enabled
            </label>
            <button type="button" class="btn btn-danger btn-small remove-profile">Remove</button>
        </div>
    `).join('');

    // Wire remove buttons
    container.querySelectorAll('.remove-profile').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.profile-row');
            row.remove();
        });
    });
}

async function loadProfiles() {
    try {
        const res = await api.getProfiles();
        renderProfiles(res.data || []);
    } catch (e) {
        console.warn('Failed to load profiles');
    }
}

function collectProfilesFromUI() {
    const container = document.getElementById('profilesList');
    const rows = Array.from(container?.querySelectorAll('.profile-row') || []);
    return rows.map((row, idx) => {
        const name = row.querySelector('.profile-name').value.trim();
        const template = row.querySelector('.profile-template').value;
        const cron = row.querySelector('.profile-cron').value.trim() || '0 9 * * 1';
        const recipients = row.querySelector('.profile-recipients').value.split(',').map(e => e.trim()).filter(Boolean);
        const enabled = row.querySelector('.profile-enabled').checked;
        return { id: `profile-${idx}`, name, template, cron, recipients, enabled };
    });
}

async function loadSchedulerStatus() {
    try {
        const status = await api.getSchedulerStatus();

        const data = status.data || status; // backward compatibility
        // Update status indicators
        document.getElementById('reportsStatusValue').textContent =
            data.scheduler.isRunning ? 'Active' : 'Disabled';
        document.getElementById('reportsStatusValue').className =
            `status-value ${data.scheduler.isRunning ? 'status-active' : 'status-disabled'}`;

        document.getElementById('nextReportTime').textContent =
            data.scheduler.nextRun ? new Date(data.scheduler.nextRun).toLocaleString() : 'Not scheduled';

        document.getElementById('sendgridStatus').textContent =
            data.environment.sendgridConfigured ? 'Configured' : 'Not configured';
        document.getElementById('sendgridStatus').className =
            `status-value ${data.environment.sendgridConfigured ? 'status-active' : 'status-disabled'}`;

        // Hide SendGrid configuration section if already configured
        const sendgridSection = document.getElementById('sendgridConfigSection');
        if (sendgridSection) {
            if (data.environment.sendgridConfigured) {
                sendgridSection.style.display = 'none';
            } else {
                sendgridSection.style.display = '';
            }
        }
    } catch (error) {
        console.error('Failed to load scheduler status:', error);
        document.getElementById('reportsStatusValue').textContent = 'Error loading status';
    }
}

// LLM Settings
async function loadLlmSettings() {
    try {
        const all = await api.getSettings();
        const data = all.data || all;
        
        // Load all the new settings
        const elements = {
            preset: document.getElementById('llmPresetTemplate'),
            tone: document.getElementById('llmTone'),
            detail: document.getElementById('llmDetailLevel'),
            language: document.getElementById('llmLanguage'),
            prompt: document.getElementById('llmSystemPrompt'),
            promptModeGenerated: document.getElementById('llmPromptModeGenerated'),
            promptModeCustom: document.getElementById('llmPromptModeCustom')
        };
        
        if (elements.preset) elements.preset.value = data.llm_preset_template || 'default';
        if (elements.tone) elements.tone.value = data.llm_tone || 'professional';
        if (elements.detail) elements.detail.value = data.llm_detail_level || 'balanced';
        if (elements.language) elements.language.value = data.llm_language || 'auto';
        if (elements.prompt) elements.prompt.value = data.llm_system_prompt || '';
        
        // Set system prompt mode
        const promptMode = data.llm_system_prompt_mode || 'generated';
        if (elements.promptModeGenerated && elements.promptModeCustom) {
            if (promptMode === 'generated') {
                elements.promptModeGenerated.checked = true;
            } else {
                elements.promptModeCustom.checked = true;
            }
        }
        
        // Load generated prompt preview
        await loadGeneratedPromptPreview();
        
        // Update prompt sections visibility
        updatePromptSections();
        
        // Update the preview
        updateLlmPreview();
        
        // Add change listeners for live preview
        Object.values(elements).forEach(el => {
            if (el) {
                if (el.type === 'radio') {
                    el.addEventListener('change', handlePromptModeChange);
                } else {
                    el.addEventListener('change', updateLlmPreview);
                    if (el.tagName === 'TEXTAREA') el.addEventListener('input', updateLlmPreview);
                }
            }
        });
        
    } catch (e) {
        console.warn('Failed to load AI settings');
    }
}

async function loadGeneratedPromptPreview() {
    try {
        const response = await api.request('/llm/generated-prompt');
        const generatedPromptText = document.getElementById('generatedPromptText');
        if (generatedPromptText && response.success) {
            generatedPromptText.textContent = response.data;
        }
    } catch (e) {
        console.warn('Failed to load generated prompt preview');
    }
}

function handlePromptModeChange() {
    updatePromptSections();
    updateLlmPreview();
}

function updatePromptSections() {
    const promptModeGenerated = document.getElementById('llmPromptModeGenerated');
    const generatedSection = document.getElementById('generatedPromptPreview');
    const customSection = document.getElementById('customPromptSection');
    
    if (promptModeGenerated && promptModeGenerated.checked) {
        // Show generated prompt preview, hide custom section
        if (generatedSection) generatedSection.style.display = 'block';
        if (customSection) customSection.style.display = 'none';
    } else {
        // Hide generated prompt preview, show custom section
        if (generatedSection) generatedSection.style.display = 'none';
        if (customSection) customSection.style.display = 'block';
    }
}

function updateLlmPreview() {
    const elements = {
        preset: document.getElementById('llmPresetTemplate'),
        tone: document.getElementById('llmTone'),
        detail: document.getElementById('llmDetailLevel'),
        language: document.getElementById('llmLanguage'),
        prompt: document.getElementById('llmSystemPrompt')
    };
    
    const values = {
        preset: elements.preset?.value || 'default',
        tone: elements.tone?.value || 'professional',
        detail: elements.detail?.value || 'balanced',
        language: elements.language?.value || 'auto',
        prompt: elements.prompt?.value || ''
    };
    
    // Build preview text
    const previewParts = [];
    
    // Role context
    const roleDescriptions = {
        'default': 'Tim\'s AI assistant for continuous improvement at Evos Amsterdam',
        'consultant': 'Management consultant focused on process improvement and strategic recommendations',
        'analyst': 'Business analyst emphasizing data-driven insights and systematic evaluation',
        'manager': 'Project manager focusing on execution, timelines, and stakeholder coordination',
        'technical': 'Technical expert emphasizing implementation details and best practices',
        'creative': 'Creative strategist encouraging innovative approaches and out-of-the-box thinking'
    };
    previewParts.push(`Role: ${roleDescriptions[values.preset]}`);
    
    // Communication style
    const toneDescriptions = {
        'professional': 'Professional, clear, business-appropriate language',
        'friendly': 'Warm, approachable, and supportive communication',
        'formal': 'Strict formality and professional business language',
        'concise': 'Direct, brief, eliminate unnecessary words',
        'enthusiastic': 'Positive energy and excitement about the work',
        'analytical': 'Data-focused, logical, and structured approach',
        'creative': 'Innovative thinking and creative solutions'
    };
    previewParts.push(`Style: ${toneDescriptions[values.tone]}`);
    
    // Detail level
    const detailDescriptions = {
        'brief': 'Essential information only, very concise',
        'balanced': 'Adequate detail without being verbose',
        'detailed': 'Comprehensive explanations and analysis',
        'comprehensive': 'Exhaustive coverage with examples and context'
    };
    previewParts.push(`Detail: ${detailDescriptions[values.detail]}`);
    
    // Language
    if (values.language !== 'auto') {
        const languageMap = {
            'english': 'English',
            'dutch': 'Dutch (Nederlands)',
            'german': 'German (Deutsch)',
            'french': 'French (Français)',
            'spanish': 'Spanish (Español)'
        };
        previewParts.push(`Language: ${languageMap[values.language]}`);
    }
    
    // Custom instructions
    if (values.prompt.trim()) {
        previewParts.push(`\nCustom Instructions:\n"${values.prompt.trim()}"`);
    }
    
    const previewEl = document.getElementById('previewText');
    if (previewEl) {
        previewEl.textContent = previewParts.join('\n');
    }
}

async function saveLlmSettings(event) {
    event.preventDefault();
    
    // Get system prompt mode
    const promptModeGenerated = document.getElementById('llmPromptModeGenerated');
    const systemPromptMode = promptModeGenerated?.checked ? 'generated' : 'custom';
    
    const settings = {
        llm_preset_template: document.getElementById('llmPresetTemplate')?.value || 'default',
        llm_tone: document.getElementById('llmTone')?.value || 'professional',
        llm_detail_level: document.getElementById('llmDetailLevel')?.value || 'balanced',
        llm_language: document.getElementById('llmLanguage')?.value || 'auto',
        llm_system_prompt_mode: systemPromptMode,
        llm_system_prompt: document.getElementById('llmSystemPrompt')?.value || ''
    };
    
    try {
        showLoading();
        await api.updateSettings(settings);
        showSuccess('AI configuration saved successfully!');
    } catch (e) {
        showError('Failed to save AI configuration');
    } finally {
        hideLoading();
    }
}

function resetLlmDefaults() {
    if (!confirm('Reset all AI settings to defaults? This will lose your current configuration.')) {
        return;
    }
    
    const elements = {
        preset: document.getElementById('llmPresetTemplate'),
        tone: document.getElementById('llmTone'),
        detail: document.getElementById('llmDetailLevel'),
        language: document.getElementById('llmLanguage'),
        prompt: document.getElementById('llmSystemPrompt')
    };
    
    if (elements.preset) elements.preset.value = 'default';
    if (elements.tone) elements.tone.value = 'professional';
    if (elements.detail) elements.detail.value = 'balanced';
    if (elements.language) elements.language.value = 'auto';
    if (elements.prompt) elements.prompt.value = '';
    
    updateLlmPreview();
}



async function saveEmailSettings(event) {
    event.preventDefault();
    
    const email = document.getElementById('weeklyReportEmail').value;
    const enabled = document.getElementById('weeklyReportsEnabled').checked;
    const schedule = document.getElementById('reportSchedule').value;
    const primaryProjectId = document.getElementById('primaryProject')?.value || '';
    const useAiStatus = document.getElementById('useAiStatus')?.checked || false;
    const narrativeOnly = document.getElementById('narrativeOnly')?.checked || false;
    
    if (!email) {
        showError('Please enter an email address');
        return;
    }
    
    try {
        showLoading();
        
        // Update email settings
        const recipients = document.getElementById('weeklyReportRecipients').value
            .split(',')
            .map(e => e.trim())
            .filter(e => e.length);
        await api.updateEmailSettings({
            email: email,
            enabled: enabled,
            recipients: recipients,
            weekly_use_ai_status: useAiStatus,
            weekly_narrative_only: narrativeOnly
        });
        
        // Update schedule if provided
        if (schedule) {
            await api.updateSettings({
                weekly_report_schedule: schedule,
                primary_project_id: primaryProjectId
            });
        }
        
        showSuccess('Settings saved successfully!');
        await loadSchedulerStatus();
    } catch (error) {
        console.error('Failed to save settings:', error);
        showError('Failed to save settings');
    } finally {
        hideLoading();
    }
}

async function sendTestEmail() {
    const email = document.getElementById('weeklyReportEmail').value;
    
    if (!email) {
        showError('Please enter an email address first');
        return;
    }
    
    try {
        showLoading();
        const result = await api.testEmail({ recipient: email });
        
        if (result.success) {
            showSuccess(`Test email sent successfully to ${email}!`);
        } else {
            showError('Failed to send test email: ' + result.error);
        }
    } catch (error) {
        console.error('Failed to send test email:', error);
        showError('Failed to send test email');
    } finally {
        hideLoading();
    }
}

async function generateWeeklyReportNow() {
    const email = document.getElementById('weeklyReportEmail').value;
    
    if (!email) {
        showError('Please configure an email address first');
        return;
    }
    
    try {
        showLoading();
        const result = await api.generateWeeklyReport({
            recipient: email,
            send_email: true
        });
        
        if (result.success) {
            showSuccess('Weekly report generated and sent successfully!');
        } else {
            showError('Failed to generate weekly report: ' + result.error);
        }
    } catch (error) {
        console.error('Failed to generate weekly report:', error);
        showError('Failed to generate weekly report');
    } finally {
        hideLoading();
    }
}

async function refreshStatus() {
    try {
        showLoading();
        await loadSchedulerStatus();
        showSuccess('Status refreshed');
    } catch (error) {
        showError('Failed to refresh status');
    } finally {
        hideLoading();
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

            const title = document.getElementById('todoTitle').value.trim();
            if (!title) {
                showError('Please enter a task title');
                return;
            }

            const data = {
                project_id: currentProject,
                title,
                description: document.getElementById('todoDescription').value,
                priority: document.getElementById('todoPriority').value
            };

            const dueDateValue = document.getElementById('todoDueDate').value;
            if (dueDateValue) {
                data.due_date = dueDateValue;
            }

            try {
                showLoading();
                await api.createTodo(data);
                hideModal(elements.todoModal);
                await loadTodos(currentProject);
            } catch (error) {
                showError(error?.message || 'Failed to create todo');
            } finally {
                hideLoading();
            }
        });
    }

    // Milestone Modal
    if (elements.milestoneForm) {
        elements.milestoneForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!currentProject) {
                showError('Please select a project first');
                return;
            }

            const title = elements.milestoneTitle.value.trim();
            if (!title) {
                showError('Please enter a milestone title');
                return;
            }

            const data = {
                title,
                description: elements.milestoneDescription.value.trim() || null,
                target_date: elements.milestoneTargetDate.value || null,
                status: elements.milestoneStatus.value
            };

            await saveMilestone(data);
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

    // Preview modal specific close buttons
    document.getElementById('closePreviewModal')?.addEventListener('click', () => hideModal(document.getElementById('previewModal')));
    document.getElementById('closePreviewBtn')?.addEventListener('click', () => hideModal(document.getElementById('previewModal')));
}

// Event Handlers
function initEventHandlers() {
    // Notes
    elements.addNoteBtn?.addEventListener('click', addNote);
    elements.recordVoiceBtn?.addEventListener('click', toggleVoiceRecording);
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
    
    // Settings
    document.getElementById('emailSettingsForm')?.addEventListener('submit', saveEmailSettings);
    document.getElementById('testEmailBtn')?.addEventListener('click', sendTestEmail);
    document.getElementById('generateWeeklyBtn')?.addEventListener('click', generateWeeklyReportNow);
    document.getElementById('refreshStatusBtn')?.addEventListener('click', refreshStatus);
    document.getElementById('restartSchedulerBtn')?.addEventListener('click', async () => {
        try {
            showLoading();
            await api.request('/reports/scheduler/restart', { method: 'POST' });
            await loadSchedulerStatus();
            showSuccess('Scheduler restarted');
        } catch (e) {
            showError('Failed to restart scheduler');
        } finally {
            hideLoading();
        }
    });
    // AI settings
    document.getElementById('llmSettingsForm')?.addEventListener('submit', saveLlmSettings);
    document.getElementById('resetLlmDefaults')?.addEventListener('click', resetLlmDefaults);
    // Preview chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });
    document.getElementById('previewWeeklyBtn')?.addEventListener('click', async () => {
        try {
            const email = document.getElementById('weeklyReportEmail').value;
            if (!email) { showError('Please configure an email address first'); return; }
            const activeChip = document.querySelector('.chip.active');
            const template = activeChip ? activeChip.getAttribute('data-template') : 'self';
            const includeNotes = document.getElementById('includeNotes').checked;
            const includeTodos = document.getElementById('includeTodos').checked;
            const useAiStatus = document.getElementById('useAiStatus').checked;
            const narrativeOnly = document.getElementById('narrativeOnly')?.checked || false;
            const projectId = document.getElementById('primaryProject')?.value || currentProject || '';
            showLoading();
            const preview = await api.request('/reports/weekly/preview', {
                method: 'POST',
                body: JSON.stringify({ template, sections: { includeNotes, includeTodos }, narrativeOnly, project_id: projectId || undefined })
            });
            const frame = document.getElementById('previewFrame');
            frame.srcdoc = preview.html || '<p>No preview available</p>';
            showModal(document.getElementById('previewModal'));
        } catch (e) {
            showError('Failed to preview weekly report');
        } finally {
            hideLoading();
        }
    });
    document.getElementById('addProfileBtn')?.addEventListener('click', () => {
        const list = document.getElementById('profilesList');
        if (!list) return;
        const idx = (list.querySelectorAll('.profile-row') || []).length;
        const div = document.createElement('div');
        div.className = 'profile-row';
        div.dataset.index = String(idx);
        div.style.cssText = 'display:flex; gap:8px; align-items:center; margin-bottom:8px; flex-wrap:wrap;';
        div.innerHTML = `
            <input type="text" class="profile-name" value="" placeholder="Group name" style="flex:1; min-width:160px;" />
            <select class="profile-template">
                <option value="self">Self</option>
                <option value="manager">Manager</option>
                <option value="company">Company</option>
            </select>
            <input type="text" class="profile-cron" value="0 9 * * 1" placeholder="Cron (e.g., 0 9 * * 1)" style="width:160px;" />
            <input type="text" class="profile-recipients" value="" placeholder="Emails (comma)" style="flex:2; min-width:220px;" />
            <label class="checkbox-label" style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" class="profile-enabled" checked /> Enabled
            </label>
            <button type="button" class="btn btn-danger btn-small remove-profile">Remove</button>
        `;
        list.appendChild(div);
        div.querySelector('.remove-profile').addEventListener('click', () => div.remove());
    });
    document.getElementById('saveProfilesBtn')?.addEventListener('click', async () => {
        try {
            showLoading();
            const profiles = collectProfilesFromUI();
            await api.saveProfiles(profiles);
            showSuccess('Groups saved');
            await api.request('/reports/scheduler/restart', { method: 'POST' });
            await loadSchedulerStatus();
        } catch (e) {
            showError('Failed to save groups');
        } finally {
            hideLoading();
        }
    });
}

// Timeline Filter Functions
function filterTimelineItems(items, filter) {
    if (filter === 'all') return items;
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 0);
    
    return items.filter(item => {
        const itemDate = new Date(item.date);
        if (isNaN(itemDate.getTime())) return false; // Skip invalid dates
        
        switch (filter) {
            case 'week':
                return itemDate >= startOfWeek && itemDate <= endOfWeek;
            case 'month':
                return itemDate >= startOfMonth && itemDate <= endOfMonth;
            case 'quarter':
                return itemDate >= startOfQuarter && itemDate <= endOfQuarter;
            case 'year':
                return itemDate >= startOfYear && itemDate <= endOfYear;
            default:
                return true;
        }
    });
}

function getZoomFilterLabel(filter) {
    const labels = {
        all: 'all time',
        week: 'this week',
        month: 'this month',
        quarter: 'this quarter',
        year: 'this year'
    };
    return labels[filter] || 'selected period';
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
    alert('Error: ' + message);
}

function showSuccess(message) {
    // Simple success display - could be enhanced with a toast system
    alert('Success: ' + message);
}

// Coaching Functions
let coachingConversation = [];

function startConversation(topic) {
    const topicMessages = {
        motivation: "I notice you might need some motivation today. That's completely natural - even the most dedicated professionals have moments when they need a boost. What's been weighing on your mind lately?",
        challenge: "Challenges are growth opportunities in disguise, and you've tackled many before successfully. Tell me about what you're facing right now - I'm here to help you work through it.",
        growth: "Your commitment to continuous improvement shows your dedication to excellence. What aspects of your professional development are you thinking about? Let's explore how you can take the next step forward.",
        confidence: "Confidence comes from recognizing your achievements and trusting your capabilities. You're skilled and intelligent - sometimes we just need to remind ourselves of that. What situation is making you feel uncertain?"
    };

    const message = topicMessages[topic] || "I'm here to support you. What would you like to talk about today?";
    
    // Clear previous conversation and start fresh
    coachingConversation = [];
    showCoachingChat();
    addCoachMessage(message);
}

// Make functions globally available for HTML onclick handlers
window.startConversation = startConversation;

function showCoachingChat() {
    document.getElementById('coachingWelcome').style.display = 'none';
    document.getElementById('coachingChat').style.display = 'flex';
    document.getElementById('coachingInput').focus();
}

function showWelcome() {
    document.getElementById('coachingWelcome').style.display = 'flex';
    document.getElementById('coachingChat').style.display = 'none';
}

function clearConversation() {
    coachingConversation = [];
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('coachingInput').value = '';
    updateDailyInsight();
}

// Add more functions to global scope
window.showWelcome = showWelcome;
window.clearConversation = clearConversation;

function addUserMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        ${escapeHtml(message)}
        <div class="message-time">${formatTime(new Date())}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to conversation history
    coachingConversation.push({ role: 'user', content: message, timestamp: new Date() });
}

function addCoachMessage(message) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message coach';
    messageDiv.innerHTML = `
        ${escapeHtml(message)}
        <div class="message-time">${formatTime(new Date())}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to conversation history
    coachingConversation.push({ role: 'coach', content: message, timestamp: new Date() });
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

async function sendCoachingMessage(message) {
    if (!message.trim()) return;
    
    // Add user message to UI
    addUserMessage(message);
    
    // Clear input
    document.getElementById('coachingInput').value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Get comprehensive work context for more personalized coaching
        const projectContext = await getWorkContext();
        
        const response = await api.request('/llm/coaching', {
            method: 'POST',
            body: JSON.stringify({
                message: message,
                conversation: coachingConversation.slice(-10), // Last 10 messages for context
                projectContext: projectContext
            })
        });
        
        hideTypingIndicator();
        
        if (response.success) {
            addCoachMessage(response.data);
            updateDailyInsight();
        } else {
            addCoachMessage("I'm sorry, I'm having trouble connecting right now. Your feelings and concerns are still valid, and I encourage you to try again or talk to someone you trust.");
        }
    } catch (error) {
        hideTypingIndicator();
        console.error('Coaching error:', error);
        addCoachMessage("I'm experiencing some technical difficulties, but that doesn't diminish what you're going through. Please try again in a moment, or consider reaching out to a colleague or friend.");
    }
}

async function getWorkContext() {
    try {
        // Get comprehensive context across ALL projects for better coaching
        const [projectsResponse, allNotesResponse, allTodosResponse] = await Promise.all([
            api.request('/projects'),
            api.request('/notes?limit=10'), // Recent notes across all projects
            api.request('/todos?limit=15')  // Recent todos across all projects
        ]);
        
        const projects = projectsResponse.success ? projectsResponse.data : [];
        const recentNotes = allNotesResponse.success ? allNotesResponse.data.slice(0, 10) : [];
        const allTodos = allTodosResponse.success ? allTodosResponse.data : [];
        
        // Calculate overall workload and progress
        const totalTodos = allTodos.length;
        const completedTodos = allTodos.filter(todo => todo.status === 'completed').length;
        const pendingTodos = allTodos.filter(todo => todo.status === 'pending').length;
        const highPriorityPending = allTodos.filter(todo => todo.status === 'pending' && todo.priority === 'high').length;
        
        // Get project-specific summaries
        const projectSummaries = projects.map(project => {
            const projectTodos = allTodos.filter(todo => todo.project_id === project.id);
            const projectNotes = recentNotes.filter(note => note.project_id === project.id).slice(0, 2);
            return {
                name: project.name,
                status: project.status,
                pendingTasks: projectTodos.filter(t => t.status === 'pending').length,
                completedTasks: projectTodos.filter(t => t.status === 'completed').length,
                recentActivity: projectNotes.length > 0 ? 'active' : 'quiet'
            };
        });
        
        // Recent work context across all projects
        const recentWorkNotes = recentNotes.slice(0, 5).map(note => {
            const project = projects.find(p => p.id === note.project_id);
            return `[${project?.name || 'Unknown'}] ${note.enhanced_content || note.content}`;
        }).filter(Boolean);
        
        return {
            // Overall portfolio
            totalProjects: projects.length,
            activeProjects: projects.filter(p => p.status === 'active').length,
            
            // Workload overview
            totalTodos,
            completedTodos,
            pendingTodos,
            highPriorityPending,
            completionRate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
            
            // Recent work across all projects
            recentWorkNotes,
            
            // Project-specific insights
            projectSummaries,
            
            // Current focus (if a project is selected)
            currentFocus: currentProject ? {
                projectName: window.currentProjectName || 'Selected Project',
                isActive: true
            } : null
        };
    } catch (error) {
        console.warn('Could not gather work context for coaching:', error);
        return null;
    }
}

function updateDailyInsight() {
    const insights = [
        "Your ability to recognize when you need support shows emotional intelligence and strength.",
        "Every expert was once a beginner who kept going despite uncertainty.",
        "Your work in continuous improvement makes a real difference at Evos Amsterdam.",
        "Confidence grows through action, not through waiting for certainty.",
        "Your analytical skills and dedication are valuable assets to your team.",
        "Progress isn't always linear - setbacks often lead to breakthroughs.",
        "Your willingness to seek guidance demonstrates wisdom and growth mindset.",
        "Remember: you've successfully navigated challenges before, and you will again.",
        "Your contributions to operational excellence create lasting positive impact.",
        "Trust in your abilities - they brought you this far and will take you further."
    ];
    
    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    const insightElement = document.getElementById('dailyInsight');
    if (insightElement) {
        insightElement.innerHTML = `<p><em>${randomInsight}</em></p>`;
    }
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
}

// Initialize coaching functionality
function initCoaching() {
    // Set up form submission
    const coachingForm = document.getElementById('coachingForm');
    if (coachingForm) {
        coachingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('coachingInput');
            const message = input.value.trim();
            if (message) {
                await sendCoachingMessage(message);
            }
        });
    }
    
    // Handle textarea enter key (without shift)
    const coachingInput = document.getElementById('coachingInput');
    if (coachingInput) {
        coachingInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = e.target.value.trim();
                if (message) {
                    sendCoachingMessage(message);
                }
            }
        });
    }
    
    // Initialize with a random insight
    updateDailyInsight();
}

// Keyboard Shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only trigger when not in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }
        
        // Check if we're on the timeline tab
        const timelineTab = document.querySelector('[data-tab="timelines"]');
        const isTimelineActive = timelineTab?.classList.contains('active');
        
        if (!isTimelineActive) return;
        
        // Timeline keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    if (elements.timelineZoom) {
                        elements.timelineZoom.value = 'week';
                        elements.timelineZoom.dispatchEvent(new Event('change'));
                    }
                    break;
                case '2':
                    e.preventDefault();
                    if (elements.timelineZoom) {
                        elements.timelineZoom.value = 'month';
                        elements.timelineZoom.dispatchEvent(new Event('change'));
                    }
                    break;
                case '3':
                    e.preventDefault();
                    if (elements.timelineZoom) {
                        elements.timelineZoom.value = 'quarter';
                        elements.timelineZoom.dispatchEvent(new Event('change'));
                    }
                    break;
                case '4':
                    e.preventDefault();
                    if (elements.timelineZoom) {
                        elements.timelineZoom.value = 'year';
                        elements.timelineZoom.dispatchEvent(new Event('change'));
                    }
                    break;
                case '0':
                    e.preventDefault();
                    if (elements.timelineZoom) {
                        elements.timelineZoom.value = 'all';
                        elements.timelineZoom.dispatchEvent(new Event('change'));
                    }
                    break;
                case 'm':
                    e.preventDefault();
                    if (elements.newMilestoneBtn && currentProject) {
                        elements.newMilestoneBtn.click();
                    }
                    break;
                case 'e':
                    e.preventDefault();
                    if (elements.estimateTimelineBtn && currentProject) {
                        elements.estimateTimelineBtn.click();
                    }
                    break;
            }
        }
    });
}

// ========================================
// Phase 2: AI-Powered Personal Development
// ========================================

// Global state for Phase 2 features
let skills = [];
let achievements = [];
let reflections = [];
let reflectionTemplates = [];

// Additional DOM Elements for Phase 2
const phase2Elements = {
    // Skills
    skillsGrid: document.getElementById('skillsGrid'),
    skillsCategoryFilter: document.getElementById('skillsCategoryFilter'),
    skillsViewMode: document.getElementById('skillsViewMode'),
    skillsProgressView: document.getElementById('skillsProgressView'),
    skillsGapsView: document.getElementById('skillsGapsView'),
    skillsGridView: document.getElementById('skillsGridView'),
    newSkillBtn: document.getElementById('newSkillBtn'),
    skillModal: document.getElementById('skillModal'),
    skillForm: document.getElementById('skillForm'),
    
    // Achievements
    achievementsGrid: document.getElementById('achievementsGrid'),
    achievementsStatusFilter: document.getElementById('achievementsStatusFilter'),
    achievementsTypeFilter: document.getElementById('achievementsTypeFilter'),
    newAchievementBtn: document.getElementById('newAchievementBtn'),
    achievementModal: document.getElementById('achievementModal'),
    achievementForm: document.getElementById('achievementForm'),
    
    // Reflections
    reflectionsList: document.getElementById('reflectionsList'),
    templatesGrid: document.getElementById('templatesGrid'),
    insightsDashboard: document.getElementById('insightsDashboard'),
    newReflectionBtn: document.getElementById('newReflectionBtn'),
    reflectionModal: document.getElementById('reflectionModal'),
    reflectionForm: document.getElementById('reflectionForm'),
    viewTabs: document.querySelectorAll('.view-tab'),
    reflectionViews: document.querySelectorAll('.reflection-view')
};

// Phase 2 API Functions
const phase2Api = {
    // Skills API
    async getSkills(filters = {}) {
        const params = new URLSearchParams(filters);
        return await api.request(`/skills?${params}`);
    },
    
    async createSkill(skillData) {
        return await api.request('/skills', {
            method: 'POST',
            body: JSON.stringify(skillData)
        });
    },
    
    async updateSkill(id, updates) {
        return await api.request(`/skills/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },
    
    async deleteSkill(id) {
        return await api.request(`/skills/${id}`, {
            method: 'DELETE'
        });
    },
    
    async getSkillsProgress() {
        return await api.request('/skills/progress');
    },
    
    async getSkillsGaps() {
        return await api.request('/skills/gaps');
    },
    
    // Achievements API
    async getAchievements(filters = {}) {
        const params = new URLSearchParams(filters);
        return await api.request(`/achievements?${params}`);
    },
    
    async createAchievement(achievementData) {
        return await api.request('/achievements', {
            method: 'POST',
            body: JSON.stringify(achievementData)
        });
    },
    
    async updateAchievement(id, updates) {
        return await api.request(`/achievements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    },
    
    async updateAchievementProgress(id, progressData) {
        return await api.request(`/achievements/${id}/progress`, {
            method: 'POST',
            body: JSON.stringify(progressData)
        });
    },
    
    async completeAchievement(id) {
        return await api.request(`/achievements/${id}/complete`, {
            method: 'POST'
        });
    },
    
    // Reflections API
    async getReflectionTemplates() {
        return await api.request('/reflections/templates');
    },
    
    async getReflections(filters = {}) {
        const params = new URLSearchParams(filters);
        return await api.request(`/reflections/responses?${params}`);
    },
    
    async createReflection(reflectionData) {
        return await api.request('/reflections/responses', {
            method: 'POST',
            body: JSON.stringify(reflectionData)
        });
    },
    
    async getReflectionInsights(days = 30) {
        return await api.request(`/reflections/insights?days=${days}`);
    }
};

// Skills Functions
async function loadSkills() {
    try {
        showLoading();
        const filters = {
            category: phase2Elements.skillsCategoryFilter?.value || ''
        };
        skills = await phase2Api.getSkills(filters);
        renderSkills();
    } catch (error) {
        console.error('Error loading skills:', error);
        showMessage('Failed to load skills', 'error');
    } finally {
        hideLoading();
    }
}

function renderSkills() {
    if (!phase2Elements.skillsGrid) return;
    
    if (skills.length === 0) {
        phase2Elements.skillsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-brain" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Skills Added</h3>
                <p>Start building your skills profile by adding your first skill assessment.</p>
                <button class="btn btn-primary" onclick="showSkillModal()">
                    <i class="fas fa-plus"></i> Add Your First Skill
                </button>
            </div>
        `;
        return;
    }
    
    phase2Elements.skillsGrid.innerHTML = skills.map(skill => `
        <div class="skill-card" data-skill-id="${skill.id}">
            <div class="skill-header">
                <div>
                    <div class="skill-name">${skill.skill_name}</div>
                    <span class="skill-category">${skill.skill_category}</span>
                </div>
            </div>
            
            <div class="skill-levels">
                <div class="skill-level">
                    <span class="skill-level-label">Current</span>
                    <div class="skill-level-bar">
                        <div class="skill-level-progress skill-level-current" style="width: ${skill.current_level * 10}%"></div>
                    </div>
                    <span class="skill-level-value">${skill.current_level}</span>
                </div>
                <div class="skill-level">
                    <span class="skill-level-label">Target</span>
                    <div class="skill-level-bar">
                        <div class="skill-level-progress skill-level-target" style="width: ${skill.target_level * 10}%"></div>
                    </div>
                    <span class="skill-level-value">${skill.target_level}</span>
                </div>
            </div>
            
            ${skill.current_level < skill.target_level ? `
                <div class="skill-gap">
                    <i class="fas fa-arrow-up skill-gap-icon"></i>
                    <span class="skill-gap-text">Gap: ${skill.target_level - skill.current_level} levels to target</span>
                </div>
            ` : skill.current_level >= skill.target_level ? `
                <div class="skill-gap positive">
                    <i class="fas fa-check skill-gap-icon"></i>
                    <span class="skill-gap-text">Target achieved!</span>
                </div>
            ` : ''}
            
            <div class="skill-actions">
                <button class="skill-action-btn" onclick="editSkill('${skill.id}')">
                    <i class="fas fa-edit"></i> Update
                </button>
                <button class="skill-action-btn primary" onclick="assessSkill('${skill.id}')">
                    <i class="fas fa-chart-line"></i> Assess
                </button>
            </div>
        </div>
    `).join('');
}

function showSkillModal(skillId = null) {
    const modal = phase2Elements.skillModal;
    if (!modal) return;
    
    if (skillId) {
        const skill = skills.find(s => s.id === skillId);
        if (skill) {
            document.getElementById('skillName').value = skill.skill_name;
            document.getElementById('skillCategory').value = skill.skill_category;
            document.getElementById('currentLevel').value = skill.current_level;
            document.getElementById('targetLevel').value = skill.target_level;
            document.getElementById('selfAssessmentScore').value = skill.self_assessment_score || 5;
            document.getElementById('assessmentNotes').value = skill.assessment_notes || '';
            
            // Update range value displays
            updateRangeValue('currentLevel', skill.current_level);
            updateRangeValue('targetLevel', skill.target_level);
            updateRangeValue('selfAssessmentScore', skill.self_assessment_score || 5);
        }
    } else {
        phase2Elements.skillForm.reset();
        updateRangeValue('currentLevel', 5);
        updateRangeValue('targetLevel', 8);
        updateRangeValue('selfAssessmentScore', 5);
    }
    
    showModal(modal);
}

// Achievements Functions
async function loadAchievements() {
    try {
        showLoading();
        const filters = {
            status: phase2Elements.achievementsStatusFilter?.value || '',
            type: phase2Elements.achievementsTypeFilter?.value || ''
        };
        achievements = await phase2Api.getAchievements(filters);
        renderAchievements();
    } catch (error) {
        console.error('Error loading achievements:', error);
        showMessage('Failed to load achievements', 'error');
    } finally {
        hideLoading();
    }
}

function renderAchievements() {
    if (!phase2Elements.achievementsGrid) return;
    
    if (achievements.length === 0) {
        phase2Elements.achievementsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Achievements Set</h3>
                <p>Define your goals and track your progress towards meaningful achievements.</p>
                <button class="btn btn-primary" onclick="showAchievementModal()">
                    <i class="fas fa-plus"></i> Set Your First Goal
                </button>
            </div>
        `;
        return;
    }
    
    phase2Elements.achievementsGrid.innerHTML = achievements.map(achievement => {
        const progressPercentage = achievement.target_value > 0 
            ? Math.min(100, (achievement.current_value / achievement.target_value) * 100)
            : 0;
        
        return `
            <div class="achievement-card ${achievement.status}" data-achievement-id="${achievement.id}">
                <div class="achievement-header">
                    <div class="achievement-name">${achievement.achievement_name}</div>
                    <span class="achievement-type ${achievement.achievement_type}">${achievement.achievement_type}</span>
                </div>
                
                ${achievement.description ? `
                    <div class="achievement-description">${achievement.description}</div>
                ` : ''}
                
                ${achievement.target_value > 0 ? `
                    <div class="achievement-progress">
                        <div class="achievement-progress-header">
                            <span class="achievement-progress-label">Progress</span>
                            <span class="achievement-progress-percentage">${Math.round(progressPercentage)}%</span>
                        </div>
                        <div class="achievement-progress-bar">
                            <div class="achievement-progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                ` : ''}
                
                <span class="achievement-priority ${achievement.priority_level}">${achievement.priority_level} priority</span>
                
                <div class="achievement-actions">
                    ${achievement.status !== 'completed' ? `
                        <button class="achievement-action-btn" onclick="editAchievement('${achievement.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="achievement-action-btn complete" onclick="completeAchievement('${achievement.id}')">
                            <i class="fas fa-check"></i> Complete
                        </button>
                    ` : `
                        <div class="achievement-completed">
                            <i class="fas fa-trophy"></i> Completed!
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

function showAchievementModal(achievementId = null) {
    const modal = phase2Elements.achievementModal;
    if (!modal) return;
    
    if (achievementId) {
        const achievement = achievements.find(a => a.id === achievementId);
        if (achievement) {
            document.getElementById('achievementName').value = achievement.achievement_name;
            document.getElementById('achievementType').value = achievement.achievement_type;
            document.getElementById('achievementDescription').value = achievement.description || '';
            document.getElementById('achievementCriteria').value = achievement.criteria || '';
            document.getElementById('targetValue').value = achievement.target_value || '';
            document.getElementById('currentValue').value = achievement.current_value || 0;
            document.getElementById('priorityLevel').value = achievement.priority_level;
            document.getElementById('celebrationMessage').value = achievement.celebration_message || '';
        }
    } else {
        phase2Elements.achievementForm.reset();
    }
    
    showModal(modal);
}

// Reflections Functions
async function loadReflections() {
    try {
        showLoading();
        reflectionTemplates = await phase2Api.getReflectionTemplates();
        reflections = await phase2Api.getReflections({ limit: 20 });
        renderReflections();
        renderTemplates();
    } catch (error) {
        console.error('Error loading reflections:', error);
        showMessage('Failed to load reflections', 'error');
    } finally {
        hideLoading();
    }
}

function renderReflections() {
    if (!phase2Elements.reflectionsList) return;
    
    if (reflections.length === 0) {
        phase2Elements.reflectionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-mirror" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Reflections Yet</h3>
                <p>Start your reflection journey to gain insights into your personal and professional growth.</p>
                <button class="btn btn-primary" onclick="showReflectionModal()">
                    <i class="fas fa-plus"></i> Start Your First Reflection
                </button>
            </div>
        `;
        return;
    }
    
    phase2Elements.reflectionsList.innerHTML = reflections.map(reflection => `
        <div class="reflection-card" data-reflection-id="${reflection.id}">
            <div class="reflection-header">
                <div>
                    <div class="reflection-template-name">${reflection.template_name}</div>
                    <div class="reflection-date">${formatDate(reflection.reflection_date)}</div>
                </div>
                ${reflection.mood_at_reflection ? `
                    <div class="reflection-mood">
                        <i class="fas fa-smile"></i> Mood: ${reflection.mood_at_reflection}/10
                    </div>
                ` : ''}
            </div>
            <div class="reflection-summary">
                ${Object.values(reflection.responses)[0]?.substring(0, 200) + '...' || 'No response provided'}
            </div>
        </div>
    `).join('');
}

function renderTemplates() {
    if (!phase2Elements.templatesGrid) return;
    
    phase2Elements.templatesGrid.innerHTML = reflectionTemplates.map(template => `
        <div class="template-card" onclick="useTemplate('${template.id}')">
            <div class="template-name">${template.template_name}</div>
            <span class="template-type">${template.template_type}</span>
            <div class="template-questions-count">
                ${template.prompt_questions.length} questions
            </div>
        </div>
    `).join('');
}

function showReflectionModal(templateId = null) {
    const modal = phase2Elements.reflectionModal;
    if (!modal) return;
    
    // Populate template selector
    const templateSelect = document.getElementById('reflectionTemplate');
    if (templateSelect) {
        templateSelect.innerHTML = `
            <option value="">Select template...</option>
            ${reflectionTemplates.map(template => `
                <option value="${template.id}" ${template.id === templateId ? 'selected' : ''}>
                    ${template.template_name}
                </option>
            `).join('')}
        `;
    }
    
    // Set default date to today
    const dateInput = document.getElementById('reflectionDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // If template is preselected, load questions
    if (templateId) {
        loadReflectionQuestions(templateId);
    }
    
    showModal(modal);
}

function loadReflectionQuestions(templateId) {
    const template = reflectionTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    const questionsContainer = document.getElementById('reflectionQuestions');
    if (!questionsContainer) return;
    
    questionsContainer.innerHTML = template.prompt_questions.map((question, index) => `
        <div class="reflection-question">
            <label for="question_${index}">${question}</label>
            <textarea id="question_${index}" name="question_${index}" placeholder="Share your thoughts..."></textarea>
        </div>
    `).join('');
}

// Utility Functions for Phase 2
function updateRangeValue(rangeId, value) {
    const valueSpan = document.getElementById(rangeId + 'Value');
    if (valueSpan) {
        valueSpan.textContent = value;
    }
}

function switchReflectionView(viewName) {
    // Update view tabs
    phase2Elements.viewTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewName);
    });
    
    // Update view content
    phase2Elements.reflectionViews.forEach(view => {
        view.classList.toggle('active', view.id === viewName + 'ReflectionsView' || view.id === viewName + 'View');
    });
}

// Event Handlers for Phase 2
function initPhase2EventHandlers() {
    // Skills event handlers
    if (phase2Elements.newSkillBtn) {
        phase2Elements.newSkillBtn.addEventListener('click', () => showSkillModal());
    }
    
    if (phase2Elements.skillForm) {
        phase2Elements.skillForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const skillData = {
                    skill_name: document.getElementById('skillName').value,
                    skill_category: document.getElementById('skillCategory').value,
                    current_level: parseInt(document.getElementById('currentLevel').value),
                    target_level: parseInt(document.getElementById('targetLevel').value),
                    self_assessment_score: parseInt(document.getElementById('selfAssessmentScore').value),
                    assessment_notes: document.getElementById('assessmentNotes').value
                };
                
                await phase2Api.createSkill(skillData);
                hideModal(phase2Elements.skillModal);
                await loadSkills();
                showMessage('Skill added successfully!', 'success');
            } catch (error) {
                console.error('Error creating skill:', error);
                showMessage('Failed to add skill', 'error');
            }
        });
    }
    
    // Skills filter handlers
    if (phase2Elements.skillsCategoryFilter) {
        phase2Elements.skillsCategoryFilter.addEventListener('change', loadSkills);
    }
    
    if (phase2Elements.skillsViewMode) {
        phase2Elements.skillsViewMode.addEventListener('change', (e) => {
            const viewMode = e.target.value;
            
            // Hide all views
            phase2Elements.skillsGridView.style.display = 'none';
            phase2Elements.skillsProgressView.style.display = 'none';
            phase2Elements.skillsGapsView.style.display = 'none';
            
            // Show selected view
            switch (viewMode) {
                case 'grid':
                    phase2Elements.skillsGridView.style.display = 'block';
                    break;
                case 'progress':
                    phase2Elements.skillsProgressView.style.display = 'block';
                    // TODO: Load and render progress chart
                    break;
                case 'gaps':
                    phase2Elements.skillsGapsView.style.display = 'block';
                    // TODO: Load and render gaps analysis
                    break;
            }
        });
    }
    
    // Range input handlers for real-time updates
    ['currentLevel', 'targetLevel', 'selfAssessmentScore', 'moodAtReflection'].forEach(id => {
        const range = document.getElementById(id);
        if (range) {
            range.addEventListener('input', (e) => {
                updateRangeValue(id, e.target.value);
            });
        }
    });
    
    // Achievements event handlers
    if (phase2Elements.newAchievementBtn) {
        phase2Elements.newAchievementBtn.addEventListener('click', () => showAchievementModal());
    }
    
    if (phase2Elements.achievementForm) {
        phase2Elements.achievementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const achievementData = {
                    achievement_name: document.getElementById('achievementName').value,
                    achievement_type: document.getElementById('achievementType').value,
                    description: document.getElementById('achievementDescription').value,
                    criteria: document.getElementById('achievementCriteria').value,
                    target_value: document.getElementById('targetValue').value ? parseInt(document.getElementById('targetValue').value) : null,
                    current_value: parseInt(document.getElementById('currentValue').value) || 0,
                    priority_level: document.getElementById('priorityLevel').value,
                    celebration_message: document.getElementById('celebrationMessage').value
                };
                
                await phase2Api.createAchievement(achievementData);
                hideModal(phase2Elements.achievementModal);
                await loadAchievements();
                showMessage('Achievement added successfully!', 'success');
            } catch (error) {
                console.error('Error creating achievement:', error);
                showMessage('Failed to add achievement', 'error');
            }
        });
    }
    
    // Achievement filter handlers
    if (phase2Elements.achievementsStatusFilter) {
        phase2Elements.achievementsStatusFilter.addEventListener('change', loadAchievements);
    }
    
    if (phase2Elements.achievementsTypeFilter) {
        phase2Elements.achievementsTypeFilter.addEventListener('change', loadAchievements);
    }
    
    // Reflections event handlers
    if (phase2Elements.newReflectionBtn) {
        phase2Elements.newReflectionBtn.addEventListener('click', () => showReflectionModal());
    }
    
    if (phase2Elements.reflectionForm) {
        // Template change handler
        const templateSelect = document.getElementById('reflectionTemplate');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    loadReflectionQuestions(e.target.value);
                }
            });
        }
        
        phase2Elements.reflectionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const templateId = document.getElementById('reflectionTemplate').value;
                const template = reflectionTemplates.find(t => t.id === templateId);
                
                // Collect responses to questions
                const responses = {};
                template.prompt_questions.forEach((question, index) => {
                    const questionInput = document.getElementById(`question_${index}`);
                    responses[question] = questionInput ? questionInput.value : '';
                });
                
                const reflectionData = {
                    template_id: templateId,
                    reflection_date: document.getElementById('reflectionDate').value,
                    responses: JSON.stringify(responses),
                    mood_at_reflection: parseInt(document.getElementById('moodAtReflection').value)
                };
                
                await phase2Api.createReflection(reflectionData);
                hideModal(phase2Elements.reflectionModal);
                await loadReflections();
                showMessage('Reflection saved successfully!', 'success');
            } catch (error) {
                console.error('Error creating reflection:', error);
                showMessage('Failed to save reflection', 'error');
            }
        });
    }
    
    // Reflection view tabs
    phase2Elements.viewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchReflectionView(tab.dataset.view);
        });
    });
}

// Global functions for Phase 2 (called from HTML)
window.editSkill = (id) => showSkillModal(id);
window.assessSkill = (id) => showSkillModal(id);
window.editAchievement = (id) => showAchievementModal(id);
window.completeAchievement = async (id) => {
    try {
        await phase2Api.completeAchievement(id);
        await loadAchievements();
        showMessage('Achievement completed! 🎉', 'success');
    } catch (error) {
        console.error('Error completing achievement:', error);
        showMessage('Failed to complete achievement', 'error');
    }
};
window.useTemplate = (id) => showReflectionModal(id);

// Initialize Application
async function init() {
    console.log('📱 APP DEBUG: init() function called');
    console.log('📱 APP DEBUG: Document readyState:', document.readyState);
    console.log('📱 APP DEBUG: Current URL:', window.location.href);
    
    console.log('📱 APP DEBUG: Initializing navigation...');
    initNavigation();
    
    console.log('📱 APP DEBUG: Initializing modals...');
    initModals();
    
    console.log('📱 APP DEBUG: Initializing keyboard shortcuts...');
    initKeyboardShortcuts();
    
    console.log('📱 APP DEBUG: Initializing event handlers...');
    initEventHandlers();
    
    console.log('📱 APP DEBUG: Initializing Phase 2 event handlers...');
    initPhase2EventHandlers();
    
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
