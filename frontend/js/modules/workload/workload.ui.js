// DOMUtils, ModalUtils, LoadingUtils, MessageUtils are available globally via window
// TextUtils is available globally via window

class WorkloadUI {
    constructor() {
        this.elements = this.initializeElements();
        this.events = {};
    }

    // Initialize DOM elements
    initializeElements() {
        return {
            // Navigation buttons
            workloadStatsBtn: DOMUtils.getElement('#workloadStatsBtn'),
            workloadPatternsBtn: DOMUtils.getElement('#workloadPatternsBtn'),
            workloadBalanceBtn: DOMUtils.getElement('#workloadBalanceBtn'),
            newWorkloadEntryBtn: DOMUtils.getElement('#newWorkloadEntryBtn'),

            // Content containers
            todayWorkloadContent: DOMUtils.getElement('#todayWorkloadContent'),
            workloadEntries: DOMUtils.getElement('#workloadEntries'),
            workloadInsightsSection: DOMUtils.getElement('#workloadInsightsSection'),
            workloadInsightsContent: DOMUtils.getElement('#workloadInsightsContent'),

            // Modal elements
            workloadModal: DOMUtils.getElement('#workloadModal'),
            workloadForm: DOMUtils.getElement('#workloadForm'),
            workloadDate: DOMUtils.getElement('#workloadDate'),
            workloadStartTime: DOMUtils.getElement('#workloadStartTime'),
            workloadEndTime: DOMUtils.getElement('#workloadEndTime'),
            workloadBreakDuration: DOMUtils.getElement('#workloadBreakDuration'),
            workloadWorkType: DOMUtils.getElement('#workloadWorkType'),
            workloadIntensityLevel: DOMUtils.getElement('#workloadIntensityLevel'),
            workloadFocusLevel: DOMUtils.getElement('#workloadFocusLevel'),
            workloadProductivityScore: DOMUtils.getElement('#workloadProductivityScore'),
            workloadTasksCompleted: DOMUtils.getElement('#workloadTasksCompleted'),
            workloadLocation: DOMUtils.getElement('#workloadLocation'),
            workloadNotes: DOMUtils.getElement('#workloadNotes'),

            // Loading overlay
            loadingOverlay: DOMUtils.getElement('#loadingOverlay')
        };
    }

    // Render today's workload
    renderTodayWorkload(workloadEntry) {
        const content = this.elements.todayWorkloadContent;

        if (!workloadEntry) {
            const html = `
                <div class="today-workload-content no-entry">
                    <p class="workload-checkin-prompt">Ready to log your work session?</p>
                    <button class="btn btn-primary" onclick="window.workloadController?.showWorkloadModal()">
                        <i class="fas fa-plus"></i> Log Work Session
                    </button>
                </div>
            `;
            DOMUtils.setHTML(content, html);
            return;
        }

        const workHours = this.calculateWorkHours(
            workloadEntry.start_time,
            workloadEntry.end_time,
            workloadEntry.break_duration || 0
        );

        const html = `
            <div class="today-workload-content">
                <div class="workload-summary">
                    <div class="workload-hours">
                        <div class="workload-hours-value">${workHours.toFixed(1)}h</div>
                        <div class="workload-hours-label">Today's Work</div>
                    </div>
                    <div class="workload-details">
                        <div class="workload-time">
                            <i class="fas fa-clock"></i>
                            ${workloadEntry.start_time} - ${workloadEntry.end_time}
                        </div>
                        ${workloadEntry.work_type ? `
                            <div class="workload-type">
                                <i class="fas fa-briefcase"></i>
                                ${TextUtils.escapeHtml(workloadEntry.work_type.replace('_', ' '))}
                            </div>
                        ` : ''}
                        ${workloadEntry.location ? `
                            <div class="workload-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${TextUtils.escapeHtml(workloadEntry.location)}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="workload-metrics">
                    <div class="workload-metric">
                        <div class="workload-metric-label">Intensity</div>
                        <div class="workload-metric-value">${workloadEntry.intensity_level}/10</div>
                    </div>
                    <div class="workload-metric">
                        <div class="workload-metric-label">Focus</div>
                        <div class="workload-metric-value">${workloadEntry.focus_level || 'N/A'}/10</div>
                    </div>
                    <div class="workload-metric">
                        <div class="workload-metric-label">Productivity</div>
                        <div class="workload-metric-value">${workloadEntry.productivity_score || 'N/A'}/10</div>
                    </div>
                    <div class="workload-metric">
                        <div class="workload-metric-label">Tasks</div>
                        <div class="workload-metric-value">${workloadEntry.tasks_completed || 0}</div>
                    </div>
                </div>
                ${workloadEntry.notes ? `
                    <div class="workload-notes">
                        <strong>Notes:</strong> ${TextUtils.escapeHtml(workloadEntry.notes)}
                    </div>
                ` : ''}
                <div class="workload-actions">
                    <button class="btn btn-primary" onclick="window.workloadController?.editWorkloadEntry('${workloadEntry.work_date}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-secondary" onclick="window.workloadController?.showWorkloadModal()">
                        <i class="fas fa-plus"></i> New Session
                    </button>
                </div>
            </div>
        `;
        DOMUtils.setHTML(content, html);
    }

    // Render workload entries list
    renderWorkloadEntries(entries) {
        const container = this.elements.workloadEntries;

        if (!entries || entries.length === 0) {
            const html = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No work sessions logged yet. Start tracking your workload to see your history here.</p>';
            DOMUtils.setHTML(container, html);
            return;
        }

        const html = entries.map(entry => {
            const workHours = this.calculateWorkHours(
                entry.start_time,
                entry.end_time,
                entry.break_duration || 0
            );
            const date = new Date(entry.work_date).toLocaleDateString();

            return `
                <div class="card card-sm workload-entry-card">
                    <div class="flex-between mb-4">
                        <span class="workload-entry-date">${date}</span>
                        <span class="workload-entry-hours">${workHours.toFixed(1)}h</span>
                    </div>
                    <div class="metrics-grid mb-4">
                        <div class="metric">
                            <div class="metric-label">Intensity</div>
                            <div class="metric-value">${entry.intensity_level}/10</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Focus</div>
                            <div class="metric-value">${entry.focus_level || 'N/A'}/10</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Productivity</div>
                            <div class="metric-value">${entry.productivity_score || 'N/A'}/10</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Tasks</div>
                            <div class="metric-value">${entry.tasks_completed || 0}</div>
                        </div>
                    </div>
                    <div class="workload-entry-details">
                        ${entry.work_type ? `<span class="workload-type">${TextUtils.escapeHtml(entry.work_type.replace('_', ' '))}</span>` : ''}
                        ${entry.location ? `<span class="workload-location">📍 ${TextUtils.escapeHtml(entry.location)}</span>` : ''}
                    </div>
                    ${entry.notes ? `
                        <div class="workload-notes">
                            <strong>Notes:</strong> ${TextUtils.escapeHtml(entry.notes)}
                        </div>
                    ` : ''}
                    <div class="workload-entry-actions">
                        <button class="btn btn-secondary btn-sm edit-workload-btn" data-date="${entry.work_date}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-workload-btn" data-date="${entry.work_date}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        DOMUtils.setHTML(container, html);
        this.bindWorkloadEntryEvents();
    }

    // Render workload statistics
    renderWorkloadStats(stats) {
        const container = this.elements.workloadInsightsContent;
        const html = `
            <div class="workload-stats">
                <h3>Workload Statistics (Last ${stats.period_days || 30} days)</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${stats.average_work_hours?.toFixed(1) || 'N/A'}</div>
                        <div class="stat-label">Avg Hours/Day</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.total_work_hours?.toFixed(1) || 'N/A'}</div>
                        <div class="stat-label">Total Hours</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.total_entries || 0}</div>
                        <div class="stat-label">Sessions Logged</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.average_productivity?.toFixed(1) || 'N/A'}</div>
                        <div class="stat-label">Avg Productivity</div>
                    </div>
                </div>
                ${stats.workload_balance ? `
                    <div class="workload-balance-indicator">
                        <h4>Work-Life Balance</h4>
                        <div class="balance-score" style="background: ${this.getBalanceColor(stats.workload_balance.score)}">
                            ${stats.workload_balance.score}/10
                        </div>
                        <p>${stats.workload_balance.recommendation || 'Balance looks good!'}</p>
                    </div>
                ` : ''}
            </div>
        `;
        DOMUtils.setHTML(container, html);
    }

    // Render workload patterns
    renderWorkloadPatterns(patterns) {
        const container = this.elements.workloadInsightsContent;
        const html = `
            <div class="workload-patterns">
                <h3>Workload Patterns</h3>
                <div class="patterns-list">
                    ${patterns.map(pattern => `
                        <div class="pattern-item">
                            <div class="pattern-title">${pattern.title}</div>
                            <div class="pattern-description">${pattern.description}</div>
                            <div class="pattern-confidence">Confidence: ${pattern.confidence}%</div>
                            ${pattern.recommendation ? `<div class="pattern-recommendation">💡 ${pattern.recommendation}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        DOMUtils.setHTML(container, html);
    }

    // Render workload balance analysis
    renderWorkloadBalance(balance) {
        const container = this.elements.workloadInsightsContent;
        const html = `
            <div class="workload-balance-analysis">
                <h3>Workload Balance Analysis</h3>
                <div class="balance-overview">
                    <div class="balance-score-large" style="background: ${this.getBalanceColor(balance.overall_score)}">
                        ${balance.overall_score}/10
                    </div>
                    <div class="balance-status">
                        ${balance.status || 'Balanced'}
                    </div>
                </div>
                <div class="balance-details">
                    <div class="balance-metric">
                        <div class="balance-metric-label">Work Hours</div>
                        <div class="balance-metric-value">${balance.average_work_hours?.toFixed(1) || 'N/A'}h/day</div>
                    </div>
                    <div class="balance-metric">
                        <div class="balance-metric-label">Stress Level</div>
                        <div class="balance-metric-value">${balance.average_stress_level || 'N/A'}/10</div>
                    </div>
                    <div class="balance-metric">
                        <div class="balance-metric-label">Recovery Time</div>
                        <div class="balance-metric-value">${balance.recovery_score || 'N/A'}/10</div>
                    </div>
                </div>
                ${balance.recommendations?.length ? `
                    <div class="balance-recommendations">
                        <h4>Recommendations</h4>
                        <ul>
                            ${balance.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
        DOMUtils.setHTML(container, html);
    }

    // Get balance color based on score
    getBalanceColor(score) {
        if (score >= 8) return '#10b981'; // green - good balance
        if (score >= 6) return '#f59e0b'; // yellow - moderate balance
        if (score >= 4) return '#f97316'; // orange - concerning balance
        return '#ef4444'; // red - poor balance
    }

    // Calculate work hours
    calculateWorkHours(startTime, endTime, breakDuration = 0) {
        if (!startTime || !endTime) return 0;

        const start = new Date(`1970-01-01T${startTime}`);
        const end = new Date(`1970-01-01T${endTime}`);
        const diffMs = end - start - (breakDuration * 60000);
        return Math.max(0, diffMs / (1000 * 60 * 60));
    }

    // Show workload modal
    showWorkloadModal(editDate = null) {
        const modal = this.elements.workloadModal;
        const form = this.elements.workloadForm;

        // Set date
        const today = new Date().toISOString().split('T')[0];
        this.elements.workloadDate.value = editDate || today;

        // Reset form values
        this.elements.workloadStartTime.value = '09:00';
        this.elements.workloadEndTime.value = '17:00';
        this.elements.workloadBreakDuration.value = '60';
        this.elements.workloadWorkType.value = 'focused_work';
        this.elements.workloadIntensityLevel.value = '7';
        this.elements.workloadFocusLevel.value = '7';
        this.elements.workloadProductivityScore.value = '7';
        this.elements.workloadTasksCompleted.value = '0';
        this.elements.workloadLocation.value = '';
        this.elements.workloadNotes.value = '';

        // Update modal title
        const title = DOMUtils.getElement('#workloadModalTitle');
        DOMUtils.setText(title, editDate ? 'Edit Work Session' : 'Log Work Session');

        ModalUtils.show(modal);
    }

    // Hide workload modal
    hideWorkloadModal() {
        ModalUtils.hide(this.elements.workloadModal);
        this.clearForm();
    }

    // Clear form data
    clearForm() {
        this.elements.workloadForm.reset();
        delete this.elements.workloadForm.dataset.editDate;
    }

    // Set form data for editing
    setFormData(entry) {
        this.elements.workloadDate.value = entry.work_date;
        this.elements.workloadStartTime.value = entry.start_time || '09:00';
        this.elements.workloadEndTime.value = entry.end_time || '17:00';
        this.elements.workloadBreakDuration.value = entry.break_duration || '60';
        this.elements.workloadWorkType.value = entry.work_type || 'focused_work';
        this.elements.workloadIntensityLevel.value = entry.intensity_level || '7';
        this.elements.workloadFocusLevel.value = entry.focus_level || '7';
        this.elements.workloadProductivityScore.value = entry.productivity_score || '7';
        this.elements.workloadTasksCompleted.value = entry.tasks_completed || '0';
        this.elements.workloadLocation.value = entry.location || '';
        this.elements.workloadNotes.value = entry.notes || '';
        this.elements.workloadForm.dataset.editDate = entry.work_date;
    }

    // Get form data
    getFormData() {
        return {
            work_date: this.elements.workloadDate.value,
            start_time: this.elements.workloadStartTime.value,
            end_time: this.elements.workloadEndTime.value,
            break_duration: parseInt(this.elements.workloadBreakDuration.value) || 0,
            work_type: this.elements.workloadWorkType.value,
            intensity_level: parseInt(this.elements.workloadIntensityLevel.value),
            focus_level: parseInt(this.elements.workloadFocusLevel.value),
            productivity_score: parseInt(this.elements.workloadProductivityScore.value),
            tasks_completed: parseInt(this.elements.workloadTasksCompleted.value) || 0,
            location: this.elements.workloadLocation.value.trim(),
            notes: this.elements.workloadNotes.value.trim()
        };
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

    // Bind workload entry events
    bindWorkloadEntryEvents() {
        // Edit workload events
        DOMUtils.getAllElements('.edit-workload-btn').forEach(btn => {
            DOMUtils.on(btn, 'click', (e) => {
                const date = e.target.closest('button').dataset.date;
                this.emit('workload:edit', date);
            });
        });

        // Delete workload events
        DOMUtils.getAllElements('.delete-workload-btn').forEach(btn => {
            DOMUtils.on(btn, 'click', (e) => {
                const date = e.target.closest('button').dataset.date;
                this.emit('workload:delete', date);
            });
        });
    }

    // Event system
    on(event, handler) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(handler);
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(handler => handler(data));
        }
    }

    // Bind form submission
    bindFormSubmission(handler) {
        DOMUtils.on(this.elements.workloadForm, 'submit', (e) => {
            e.preventDefault();
            const formData = this.getFormData();
            const editDate = this.elements.workloadForm.dataset.editDate;
            handler(formData, editDate);
        });
    }

    // Bind navigation button events
    bindNavigationEvents() {
        // Stats button
        if (this.elements.workloadStatsBtn) {
            DOMUtils.on(this.elements.workloadStatsBtn, 'click', () => {
                this.emit('workload:stats');
            });
        }

        // Patterns button
        if (this.elements.workloadPatternsBtn) {
            DOMUtils.on(this.elements.workloadPatternsBtn, 'click', () => {
                this.emit('workload:patterns');
            });
        }

        // Balance button
        if (this.elements.workloadBalanceBtn) {
            DOMUtils.on(this.elements.workloadBalanceBtn, 'click', () => {
                this.emit('workload:balance');
            });
        }

        // New workload entry button
        if (this.elements.newWorkloadEntryBtn) {
            DOMUtils.on(this.elements.newWorkloadEntryBtn, 'click', () => {
                this.emit('workload:new');
            });
        }
    }
}

// WorkloadUI is available globally via window.WorkloadUI
if (typeof window !== 'undefined') {
    window.WorkloadUI = WorkloadUI;
}
