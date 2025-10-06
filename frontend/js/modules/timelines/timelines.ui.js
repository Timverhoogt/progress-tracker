// DOMUtils, ModalUtils, LoadingUtils, MessageUtils are available globally via window
// TextUtils is available globally via window

class TimelinesUI {
    constructor() {
        this.elements = this.initializeElements();
        this.currentTimelineData = null;
        this.currentProject = null;
        this.events = {};
    }

    // Initialize DOM elements
    initializeElements() {
        return {
            // Navigation and controls
            timelinesProjectSelector: DOMUtils.getElement('#timelinesProjectSelector'),
            timelineZoom: DOMUtils.getElement('#timelineZoom'),
            estimateTimelineBtn: DOMUtils.getElement('#estimateTimelineBtn'),
            exportTimelineBtn: DOMUtils.getElement('#exportTimelineBtn'),

            // Content containers
            timelineContainer: DOMUtils.getElement('#timelineContainer'),

            // Loading overlay
            loadingOverlay: DOMUtils.getElement('#loadingOverlay')
        };
    }

    // Set current project
    setCurrentProject(project) {
        this.currentProject = project || null;
        if (this.elements.timelinesProjectSelector) {
            this.elements.timelinesProjectSelector.value = project?.id ?? '';
        }
    }

    // Render timeline for a project
    renderTimeline(timelineData, project) {
        this.currentTimelineData = timelineData;
        this.currentProject = project;

        const zoomFilter = this.elements.timelineZoom?.value || 'all';
        const filteredItems = this.filterTimelineItems(timelineData, zoomFilter);

        const html = this.generateTimelineHTML(filteredItems, zoomFilter);
        DOMUtils.setHTML(this.elements.timelineContainer, html);

        this.bindTimelineItemEvents();
        this.bindDragAndDrop();
    }

    // Generate timeline HTML
    generateTimelineHTML(items, filter) {
        const { todos = [], milestones = [] } = items;
        const allItems = this.combineAndSortItems(todos, milestones);

        if (allItems.length === 0) {
            const filterLabel = this.getFilterLabel(filter);
            return `
                <div class="timeline-empty">
                    <div class="timeline-empty-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <h3>No timeline items found</h3>
                    <p>No todos or milestones with dates found for ${filterLabel}.</p>
                    <button class="btn btn-primary" onclick="window.timelinesController?.showMilestoneModal()">
                        <i class="fas fa-plus"></i> Add Milestone
                    </button>
                </div>
            `;
        }

        const filterInfo = filter !== 'all' ? `
            <div class="timeline-filter-info">
                <i class="fas fa-info-circle"></i>
                Showing items for: <strong>${this.getFilterLabel(filter)}</strong>
                <button class="btn-link" onclick="window.timelinesController?.clearFilter()">
                    <i class="fas fa-times"></i> Clear Filter
                </button>
            </div>
        ` : '';

        return `
            ${filterInfo}
            <div class="timeline">
                ${allItems.map(item => this.generateTimelineItemHTML(item)).join('')}
            </div>
        `;
    }

    // Generate HTML for a single timeline item
    generateTimelineItemHTML(item) {
        const isOverdue = this.isItemOverdue(item);
        const statusClass = this.getStatusClass(item);
        const statusLabel = isOverdue ? 'Overdue' : (item.status || 'pending').replace('_', ' ');

        return `
            <div class="timeline-item ${item.type} status-${statusClass}" draggable="true" data-type="${item.type}" data-id="${item.id}" data-date="${item.date}">
                <div class="timeline-date">${TextUtils.escapeHtml(item.date)}</div>
                <div class="timeline-content">
                    <div class="timeline-title">
                        ${item.type === 'milestone' ?
                            '<i class="fas fa-flag"></i>' :
                            '<i class="fas fa-check-square"></i>'}
                        ${TextUtils.escapeHtml(item.title)}
                    </div>
                    ${item.description ? `<div class="timeline-desc">${TextUtils.escapeHtml(item.description)}</div>` : ''}
                    <div class="timeline-meta">
                        <span class="timeline-status-badge ${statusClass}">
                            ${TextUtils.escapeHtml(statusLabel)}
                        </span>
                        ${item.type === 'milestone' ? `
                            <div class="timeline-actions">
                                <button class="btn-icon" data-action="edit" data-id="${item.id}" title="Edit milestone">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-icon" data-action="delete" data-id="${item.id}" title="Delete milestone">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Combine and sort timeline items
    combineAndSortItems(todos, milestones) {
        const items = [];

        // Add todos
        todos.forEach(todo => {
            items.push({
                id: todo.id,
                type: 'todo',
                title: todo.title,
                description: todo.description,
                date: todo.due_date,
                status: todo.status,
                statusClass: this.getStatusClass(todo)
            });
        });

        // Add milestones
        milestones.forEach(milestone => {
            items.push({
                id: milestone.id,
                type: 'milestone',
                title: milestone.title,
                description: milestone.description,
                date: milestone.target_date,
                status: milestone.status,
                statusClass: this.getStatusClass(milestone)
            });
        });

        // Sort by date
        return items.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    normalizeDate(dateInput) {
        if (!dateInput) {
            return null;
        }

        const parsedDate = new Date(dateInput);
        if (Number.isNaN(parsedDate.getTime())) {
            return null;
        }

        return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    }

    // Filter timeline items
    filterTimelineItems(timelineData, filter = 'all') {
        if (!timelineData) {
            return { todos: [], milestones: [] };
        }

        const { todos = [], milestones = [] } = timelineData;
        const today = this.normalizeDate(new Date());

        const withinRange = (date, endDate) => {
            return date && date >= today && date <= endDate;
        };

        let filteredTodos = [...todos];
        let filteredMilestones = [...milestones];

        switch (filter) {
            case 'week': {
                const windowEnd = new Date(today.getTime());
                windowEnd.setDate(windowEnd.getDate() + 10);
                filteredTodos = todos.filter(todo => withinRange(this.normalizeDate(todo.due_date), windowEnd));
                filteredMilestones = milestones.filter(milestone => withinRange(this.normalizeDate(milestone.target_date), windowEnd));
                break;
            }

            case 'month': {
                const windowEnd = new Date(today.getTime());
                windowEnd.setMonth(windowEnd.getMonth() + 1);
                filteredTodos = todos.filter(todo => withinRange(this.normalizeDate(todo.due_date), windowEnd));
                filteredMilestones = milestones.filter(milestone => withinRange(this.normalizeDate(milestone.target_date), windowEnd));
                break;
            }

            case 'quarter': {
                const windowEnd = new Date(today.getTime());
                windowEnd.setMonth(windowEnd.getMonth() + 3);
                filteredTodos = todos.filter(todo => withinRange(this.normalizeDate(todo.due_date), windowEnd));
                filteredMilestones = milestones.filter(milestone => withinRange(this.normalizeDate(milestone.target_date), windowEnd));
                break;
            }

            case 'year': {
                const windowEnd = new Date(today.getTime());
                windowEnd.setFullYear(windowEnd.getFullYear() + 1);
                filteredTodos = todos.filter(todo => withinRange(this.normalizeDate(todo.due_date), windowEnd));
                filteredMilestones = milestones.filter(milestone => withinRange(this.normalizeDate(milestone.target_date), windowEnd));
                break;
            }

            case 'overdue': {
                filteredTodos = todos.filter(todo => this.isItemOverdue({ date: todo.due_date, status: todo.status }));
                filteredMilestones = milestones.filter(milestone => this.isItemOverdue({ date: milestone.target_date, status: milestone.status }));
                break;
            }

            default:
                break;
        }

        return { todos: filteredTodos, milestones: filteredMilestones };
    }

    // Get status class for styling
    getStatusClass(item) {
        const status = item.status || 'pending';
        const isOverdue = this.isItemOverdue(item);

        if (isOverdue) return 'overdue';
        if (status === 'completed') return 'completed';
        if (status === 'in_progress') return 'in-progress';
        if (status === 'cancelled') return 'cancelled';
        return 'planned';
    }

    // Check if item is overdue
    isItemOverdue(item) {
        const status = (item?.status || '').toLowerCase();
        const overdueEligibleStatuses = ['pending', 'in_progress', 'blocked', 'overdue'];

        if (!overdueEligibleStatuses.includes(status)) {
            return false;
        }

        const itemDate = this.normalizeDate(item?.date || item?.due_date || item?.target_date);
        if (!itemDate) {
            return false;
        }

        const today = this.normalizeDate(new Date());
        return itemDate < today;
    }

    // Get filter label for display
    getFilterLabel(filter) {
        const labels = {
            'week': 'this week',
            'month': 'this month',
            'quarter': 'this quarter',
            'year': 'this year',
            'overdue': 'overdue items',
            'all': 'all time'
        };
        return labels[filter] || filter;
    }

    // Bind events for timeline items
    bindTimelineItemEvents() {
        // Delete milestone buttons
        this.elements.timelineContainer.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (window.timelinesController) {
                    await window.timelinesController.deleteMilestone(id);
                }
            };
        });

        // Edit milestone buttons
        this.elements.timelineContainer.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (window.timelinesController) {
                    await window.timelinesController.editMilestone(id);
                }
            };
        });
    }

    // Bind drag and drop functionality
    bindDragAndDrop() {
        const items = this.elements.timelineContainer.querySelectorAll('.timeline-item');

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.getAttribute('data-id'));
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });
        });

        this.elements.timelineContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(this.elements.timelineContainer, e.clientY);
            const draggable = document.querySelector('.dragging');

            if (draggable) {
                if (afterElement == null) {
                    this.elements.timelineContainer.appendChild(draggable);
                } else {
                    this.elements.timelineContainer.insertBefore(draggable, afterElement);
                }
            }
        });
    }

    // Get element to insert dragged item after
    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.timeline-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Render timeline suggestion from AI
    renderTimelineSuggestion(suggestion) {
        const html = `
            <div class="timeline-suggestion">
                <h3><i class="fas fa-lightbulb"></i> AI Proposed Timeline</h3>
                ${suggestion.timeline_summary ? `<p>${TextUtils.escapeHtml(suggestion.timeline_summary)}</p>` : ''}
                ${suggestion.milestones && suggestion.milestones.length > 0 ? `
                    <div class="suggested-milestones">
                        <h4>Suggested Milestones:</h4>
                        <ul>
                            ${suggestion.milestones.map(milestone => `
                                <li>
                                    <strong>${TextUtils.escapeHtml(milestone.title)}</strong>
                                    ${milestone.target_date ? ` - ${TextUtils.escapeHtml(milestone.target_date)}` : ''}
                                    ${milestone.description ? `<br><span class="milestone-desc">${TextUtils.escapeHtml(milestone.description)}</span>` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${suggestion.risks && suggestion.risks.length > 0 ? `
                    <div class="timeline-risks">
                        <strong>Risks:</strong> ${suggestion.risks.map(risk => TextUtils.escapeHtml(risk)).join(', ')}
                    </div>
                ` : ''}
                <div class="timeline-suggestion-actions">
                    <button class="btn btn-primary" onclick="window.timelinesController?.applySuggestion()">
                        <i class="fas fa-check"></i> Apply Suggestion
                    </button>
                    <button class="btn btn-secondary" onclick="window.timelinesController?.dismissSuggestion()">
                        <i class="fas fa-times"></i> Dismiss
                    </button>
                </div>
            </div>
        `;

        this.elements.timelineContainer.insertAdjacentHTML('afterbegin', html);
    }

    // Generate export content
    generateTimelineExport(project, items, filter) {
        const filterLabel = this.getFilterLabel(filter);
        let content = `Timeline Export - ${project.name}\n`;
        content += `Generated: ${new Date().toLocaleDateString()}\n`;
        content += `Filter: ${filterLabel}\n\n`;

        if (items.length === 0) {
            content += `No timeline items found for ${filterLabel}.\n`;
            return content;
        }

        // Group items by date
        const itemsByDate = {};
        items.forEach(item => {
            const date = item.date || 'No Date';
            if (!itemsByDate[date]) itemsByDate[date] = [];
            itemsByDate[date].push(item);
        });

        // Sort dates
        const sortedDates = Object.keys(itemsByDate).sort((a, b) => new Date(a) - new Date(b));

        sortedDates.forEach(date => {
            content += `=== ${date} ===\n`;
            itemsByDate[date].forEach(item => {
                const typeIcon = item.type === 'milestone' ? '🏁' : '✅';
                const statusIcon = this.getStatusIcon(item.status);
                content += `${typeIcon} ${statusIcon} ${item.title}\n`;
                if (item.description) {
                    content += `   ${item.description}\n`;
                }
                content += '\n';
            });
        });

        return content;
    }

    // Get status icon for export
    getStatusIcon(status) {
        const icons = {
            'completed': '✓',
            'in_progress': '→',
            'planned': '○',
            'cancelled': '✗',
            'overdue': '⚠'
        };
        return icons[status] || '○';
    }

    // Show loading state
    showLoading() {
        LoadingUtils.show(this.elements.loadingOverlay);
    }

    // Hide loading state
    hideLoading() {
        LoadingUtils.hide(this.elements.loadingOverlay);
    }

    // Show error message
    showError(message) {
        MessageUtils.showError(message);
    }

    // Show success message
    showSuccess(message) {
        MessageUtils.showSuccess(message);
    }

    // Bind navigation events (called from controller)
    bindNavigationEvents() {
        if (this.elements.timelinesProjectSelector) {
            this.elements.timelinesProjectSelector.onchange = async (e) => {
                const projectId = e.target.value;
                if (projectId && window.timelinesController) {
                    await window.timelinesController.loadProjectTimeline(projectId);
                }
            };
        }

        if (this.elements.timelineZoom) {
            this.elements.timelineZoom.onchange = async () => {
                if (window.timelinesController && this.currentProject) {
                    await window.timelinesController.refreshTimeline();
                }
            };
        }

        if (this.elements.estimateTimelineBtn) {
            this.elements.estimateTimelineBtn.onclick = async () => {
                if (window.timelinesController && this.currentProject) {
                    await window.timelinesController.estimateTimeline();
                }
            };
        }

        if (this.elements.exportTimelineBtn) {
            this.elements.exportTimelineBtn.onclick = async () => {
                if (window.timelinesController && this.currentProject) {
                    await window.timelinesController.exportTimeline();
                }
            };
        }
    }
}

// TimelinesUI is available globally via window.TimelinesUI
if (typeof window !== 'undefined') {
    window.TimelinesUI = TimelinesUI;
}
