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
            newMilestoneBtn: DOMUtils.getElement('#newMilestoneBtn'),

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

        // Generate statistics dashboard
        const statsHTML = this.generateTimelineStats(timelineData);

        // Generate timeline with period grouping
        const timelineHTML = this.generateTimelineHTML(filteredItems, zoomFilter);

        // Combine stats and timeline
        const html = statsHTML + timelineHTML;

        DOMUtils.setHTML(this.elements.timelineContainer, html);

        this.bindTimelineItemEvents();
        this.bindDragAndDrop();
    }

    // Generate timeline statistics dashboard
    generateTimelineStats(timelineData) {
        if (!timelineData || (!timelineData.todos?.length && !timelineData.milestones?.length)) {
            return '';
        }

        const stats = this.calculateStats(timelineData);

        return `
            <div class="timeline-stats-grid">
                <div class="stat-card">
                    <i class="fas fa-flag stat-icon"></i>
                    <div class="stat-content">
                        <div class="stat-value">${stats.milestones.total}</div>
                        <div class="stat-label">Milestones</div>
                    </div>
                </div>
                <div class="stat-card success">
                    <i class="fas fa-check-circle stat-icon"></i>
                    <div class="stat-content">
                        <div class="stat-value">${stats.milestones.completed}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                </div>
                <div class="stat-card ${stats.milestones.overdue > 0 || stats.todos.overdue > 0 ? 'danger' : 'warning'}">
                    <i class="fas fa-exclamation-triangle stat-icon"></i>
                    <div class="stat-content">
                        <div class="stat-value">${stats.milestones.overdue + stats.todos.overdue}</div>
                        <div class="stat-label">Overdue Items</div>
                    </div>
                </div>
                <div class="stat-card info">
                    <i class="fas fa-chart-line stat-icon"></i>
                    <div class="stat-content">
                        <div class="stat-value">${stats.milestones.completionRate}%</div>
                        <div class="stat-label">On Track</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Calculate timeline statistics
    calculateStats(timelineData) {
        const { todos = [], milestones = [] } = timelineData;
        const now = new Date();

        const totalMilestones = milestones.length;
        const completedMilestones = milestones.filter(m => m.status === 'completed').length;
        const overdueMilestones = milestones.filter(m => {
            const targetDate = new Date(m.target_date);
            return targetDate < now && m.status !== 'completed';
        }).length;

        const totalTodos = todos.length;
        const completedTodos = todos.filter(t => t.status === 'completed').length;
        const overdueTodos = todos.filter(t => {
            const dueDate = new Date(t.due_date);
            return dueDate < now && t.status !== 'completed';
        }).length;

        const completionRate = totalMilestones > 0
            ? Math.round((completedMilestones / totalMilestones) * 100)
            : 0;

        return {
            milestones: {
                total: totalMilestones,
                completed: completedMilestones,
                overdue: overdueMilestones,
                completionRate
            },
            todos: {
                total: totalTodos,
                completed: completedTodos,
                overdue: overdueTodos
            }
        };
    }

    // Generate timeline HTML
    generateTimelineHTML(items, filter) {
        const { todos = [], milestones = [] } = items;
        const allItems = this.combineAndSortItems(todos, milestones);

        if (allItems.length === 0) {
            return this.generateEnhancedEmptyState(filter);
        }

        // Group items by time period
        const groupedItems = this.groupItemsByPeriod(allItems);

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
                ${this.generateTimelinePeriodsHTML(groupedItems)}
            </div>
        `;
    }

    // Generate enhanced empty state
    generateEnhancedEmptyState(filter) {
        const filterLabel = this.getFilterLabel(filter);
        const hasFilter = filter !== 'all';

        return `
            <div class="timeline-empty-enhanced">
                <div class="empty-state-icon">
                    <i class="fas fa-calendar-plus fa-4x"></i>
                </div>
                <h3>${hasFilter ? `No items found for ${filterLabel}` : "Let's build your project timeline"}</h3>
                <p>${hasFilter ? 'Try adjusting your filter or add new items.' : 'Add milestones to track important dates and deliverables'}</p>

                <div class="empty-state-actions">
                    <button class="btn btn-primary" onclick="window.timelinesController?.showMilestoneModal()">
                        <i class="fas fa-flag"></i> Add Milestone
                    </button>
                    <button class="btn btn-secondary" onclick="window.timelinesController?.estimateTimeline()">
                        <i class="fas fa-robot"></i> AI Suggestions
                    </button>
                    ${hasFilter ? `
                        <button class="btn btn-secondary" onclick="window.timelinesController?.clearFilter()">
                            <i class="fas fa-times"></i> Clear Filter
                        </button>
                    ` : ''}
                </div>

                ${!hasFilter ? `
                    <div class="empty-state-tips">
                        <h4>Quick Tips:</h4>
                        <ul>
                            <li>Set dates for your todos to see them in the timeline</li>
                            <li>Use milestones for major project deliverables</li>
                            <li>Try the AI estimate feature for smart suggestions</li>
                            <li>Filter by time period to focus on specific deadlines</li>
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Group items by time period
    groupItemsByPeriod(items) {
        const groups = {
            overdue: [],
            thisWeek: [],
            nextWeek: [],
            thisMonth: [],
            later: []
        };

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const nextWeekEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        items.forEach(item => {
            const itemDate = new Date(item.date);
            itemDate.setHours(0, 0, 0, 0);

            if (itemDate < now && item.status !== 'completed' && item.status !== 'cancelled') {
                groups.overdue.push(item);
            } else if (itemDate <= weekEnd) {
                groups.thisWeek.push(item);
            } else if (itemDate <= nextWeekEnd) {
                groups.nextWeek.push(item);
            } else if (itemDate <= monthEnd) {
                groups.thisMonth.push(item);
            } else {
                groups.later.push(item);
            }
        });

        return groups;
    }

    // Generate HTML for timeline periods
    generateTimelinePeriodsHTML(groupedItems) {
        let html = '';

        const periods = [
            { key: 'overdue', label: 'Overdue', class: 'overdue' },
            { key: 'thisWeek', label: 'This Week', class: '' },
            { key: 'nextWeek', label: 'Next Week', class: '' },
            { key: 'thisMonth', label: 'Later This Month', class: '' },
            { key: 'later', label: 'Future', class: '' }
        ];

        periods.forEach(period => {
            const items = groupedItems[period.key];
            if (items && items.length > 0) {
                html += this.generatePeriodSection(period.label, items, period.class);
            }
        });

        return html || '<p>No timeline items to display.</p>';
    }

    // Generate a single period section
    generatePeriodSection(label, items, className) {
        const count = items.length;
        const dateRange = this.getPeriodDateRange(label);

        return `
            <div class="timeline-period ${className}">
                <div class="timeline-period-header ${className}">
                    <div>
                        <span class="period-label">${label}</span>
                        <span class="period-count">${count} item${count !== 1 ? 's' : ''}</span>
                    </div>
                    ${dateRange ? `<span class="period-date">${dateRange}</span>` : ''}
                </div>
                <div class="timeline-period-items">
                    ${items.map(item => this.generateTimelineItemHTML(item)).join('')}
                </div>
            </div>
        `;
    }

    // Get date range for period label
    getPeriodDateRange(label) {
        const now = new Date();
        const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        switch (label) {
            case 'This Week': {
                const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return `${formatDate(now)} - ${formatDate(weekEnd)}`;
            }
            case 'Next Week': {
                const nextWeekStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const nextWeekEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
                return `${formatDate(nextWeekStart)} - ${formatDate(nextWeekEnd)}`;
            }
            case 'Later This Month': {
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return `Through ${formatDate(monthEnd)}`;
            }
            default:
                return '';
        }
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
                            <div class="flex gap-2">
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
        let draggedItemData = null;

        items.forEach(item => {
            // Only allow dragging milestones (not todos)
            const itemType = item.getAttribute('data-type');
            if (itemType !== 'milestone') {
                item.removeAttribute('draggable');
                return;
            }

            item.addEventListener('dragstart', (e) => {
                const itemId = item.getAttribute('data-id');
                const itemType = item.getAttribute('data-type');
                const itemDate = item.getAttribute('data-date');

                draggedItemData = { id: itemId, type: itemType, originalDate: itemDate };

                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', itemId);

                item.classList.add('dragging');
                item.style.opacity = '0.5';

                // Add visual feedback
                setTimeout(() => {
                    item.style.display = 'none';
                }, 0);
            });

            item.addEventListener('dragend', async (e) => {
                item.classList.remove('dragging');
                item.style.opacity = '';
                item.style.display = '';

                // Reset all drop zones
                document.querySelectorAll('.timeline-item').forEach(el => {
                    el.classList.remove('drag-over');
                });
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                if (!item.classList.contains('dragging')) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', (e) => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                item.classList.remove('drag-over');

                if (!draggedItemData) return;

                const targetDate = item.getAttribute('data-date');
                const targetId = item.getAttribute('data-id');

                // Don't drop on itself
                if (draggedItemData.id === targetId) return;

                // Calculate new date (use target item's date)
                const newDate = targetDate;

                if (newDate && newDate !== draggedItemData.originalDate) {
                    await this.handleDateChange(draggedItemData.id, draggedItemData.type, newDate);
                }

                draggedItemData = null;
            });
        });

        // Allow dropping in empty spaces within periods
        const periods = this.elements.timelineContainer.querySelectorAll('.timeline-period-items');
        periods.forEach(period => {
            period.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            period.addEventListener('drop', async (e) => {
                e.preventDefault();

                if (!draggedItemData) return;

                // Get the period's date range from header
                const periodHeader = period.previousElementSibling;
                if (periodHeader && periodHeader.classList.contains('timeline-period-header')) {
                    const periodLabel = periodHeader.querySelector('.period-label')?.textContent;
                    const suggestedDate = this.getDefaultDateForPeriod(periodLabel);

                    if (suggestedDate) {
                        await this.handleDateChange(draggedItemData.id, draggedItemData.type, suggestedDate);
                    }
                }

                draggedItemData = null;
            });
        });
    }

    // Handle date change from drag and drop
    async handleDateChange(itemId, itemType, newDate) {
        try {
            if (itemType === 'milestone' && window.timelinesController) {
                this.showLoading();

                // Update the milestone date
                await window.timelinesController.api.updateMilestone(itemId, {
                    target_date: newDate
                });

                this.showSuccess(`Milestone date updated to ${newDate}`);

                // Refresh the timeline
                if (window.timelinesController.refreshTimeline) {
                    await window.timelinesController.refreshTimeline();
                }
            }
        } catch (error) {
            console.error('Error updating milestone date:', error);
            this.showError('Failed to update milestone date');
        } finally {
            this.hideLoading();
        }
    }

    // Get default date for a period
    getDefaultDateForPeriod(periodLabel) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        switch (periodLabel) {
            case 'This Week': {
                // Middle of this week
                const mid = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
                return mid.toISOString().split('T')[0];
            }
            case 'Next Week': {
                // Middle of next week
                const mid = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
                return mid.toISOString().split('T')[0];
            }
            case 'Later This Month': {
                // End of month
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return monthEnd.toISOString().split('T')[0];
            }
            case 'Future': {
                // Next month
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
                return nextMonth.toISOString().split('T')[0];
            }
            default:
                return now.toISOString().split('T')[0];
        }
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

        if (this.elements.newMilestoneBtn) {
            this.elements.newMilestoneBtn.onclick = () => {
                if (window.timelinesController) {
                    window.timelinesController.showMilestoneModal();
                } else {
                    console.error('TimelinesController not available');
                }
            };
        }
    }
}

// TimelinesUI is available globally via window.TimelinesUI
if (typeof window !== 'undefined') {
    window.TimelinesUI = TimelinesUI;
}
