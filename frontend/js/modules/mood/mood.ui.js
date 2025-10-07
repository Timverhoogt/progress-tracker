// DOMUtils, ModalUtils, LoadingUtils, MessageUtils are available globally via window
// TextUtils is available globally via window

class MoodUI {
    constructor() {
        this.elements = this.initializeElements();
        this.events = {};
    }

    // Initialize DOM elements
    initializeElements() {
        return {
            // Navigation buttons
            moodStatsBtn: DOMUtils.getElement('#moodStatsBtn'),
            moodPatternsBtn: DOMUtils.getElement('#moodPatternsBtn'),
            moodAIAnalysisBtn: DOMUtils.getElement('#moodAIAnalysisBtn'),
            newMoodEntryBtn: DOMUtils.getElement('#newMoodEntryBtn'),

            // Content containers
            todayMoodContent: DOMUtils.getElement('#todayMoodContent'),
            moodEntries: DOMUtils.getElement('#moodEntries'),
            moodInsightsSection: DOMUtils.getElement('#moodInsightsSection'),
            moodInsightsContent: DOMUtils.getElement('#moodInsightsContent'),

            // Modal elements
            moodModal: DOMUtils.getElement('#moodModal'),
            moodForm: DOMUtils.getElement('#moodForm'),
            moodDate: DOMUtils.getElement('#moodDate'),
            moodScore: DOMUtils.getElement('#moodScore'),
            moodScoreValue: DOMUtils.getElement('#moodScoreValue'),
            moodEnergyLevel: DOMUtils.getElement('#moodEnergyLevel'),
            moodStressLevel: DOMUtils.getElement('#moodStressLevel'),
            moodMotivationLevel: DOMUtils.getElement('#moodMotivationLevel'),
            moodTags: DOMUtils.getElement('#moodTags'),
            moodNotes: DOMUtils.getElement('#moodNotes'),
            moodTriggers: DOMUtils.getElement('#moodTriggers'),

            // Loading overlay
            loadingOverlay: DOMUtils.getElement('#loadingOverlay')
        };
    }

    // Render today's mood
    renderTodayMood(moodEntry) {
        const content = this.elements.todayMoodContent;

        if (!moodEntry) {
            const html = `
                <div class="today-mood-content no-entry">
                    <p class="mood-checkin-prompt">How are you feeling today?</p>
                    <button class="mood-checkin-cta" onclick="window.moodController?.showMoodModal()">
                        <i class="fas fa-plus"></i> Log Your Mood
                    </button>
                </div>
            `;
            DOMUtils.setHTML(content, html);
            return;
        }

        const moodEmoji = this.getMoodEmoji(moodEntry.mood_score);
        const moodColor = this.getMoodColor(moodEntry.mood_score);

        const html = `
            <div class="today-mood-content has-entry">
                <div class="flex justify-between items-center">
                    <h4>Today's Mood</h4>
                    <div class="mood-score">
                        <span style="font-size: 2rem;">${moodEmoji}</span>
                        <span class="mood-score-value" style="background: ${moodColor};">${moodEntry.mood_score}/10</span>
                    </div>
                </div>
                <div class="metrics-grid">
                    <div class="metric">
                        <div class="metric-label">Energy</div>
                        <div class="metric-value">${moodEntry.energy_level || 'N/A'}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Stress</div>
                        <div class="metric-value">${moodEntry.stress_level || 'N/A'}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Motivation</div>
                        <div class="metric-value">${moodEntry.motivation_level || 'N/A'}</div>
                    </div>
                </div>
                ${moodEntry.notes ? `<div class="mood-notes">${TextUtils.escapeHtml(moodEntry.notes)}</div>` : ''}
                <div class="flex gap-2">
                    <button class="btn btn-primary" onclick="window.moodController?.editMoodEntry('${moodEntry.mood_date}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
        `;
        DOMUtils.setHTML(content, html);
    }

    // Render mood entries list
    renderMoodEntries(entries) {
        const container = this.elements.moodEntries;

        if (!entries || entries.length === 0) {
            const html = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No mood entries yet. Start tracking your mood to see your history here.</p>';
            DOMUtils.setHTML(container, html);
            return;
        }

        const html = entries.map(entry => {
            const moodEmoji = this.getMoodEmoji(entry.mood_score);
            const moodColor = this.getMoodColor(entry.mood_score);
            const date = new Date(entry.mood_date).toLocaleDateString();

            return `
                <div class="card mood-entry">
                    <div class="flex justify-between items-center">
                        <div class="mood-date">${date}</div>
                        <div class="mood-score">
                            <span style="font-size: 1.5rem;">${moodEmoji}</span>
                            <span class="mood-score-value" style="background: ${moodColor};">${entry.mood_score}/10</span>
                        </div>
                    </div>
                    <div class="metrics-grid">
                        <div class="metric">
                            <div class="metric-label">Energy</div>
                            <div class="metric-value">${entry.energy_level || 'N/A'}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Stress</div>
                            <div class="metric-value">${entry.stress_level || 'N/A'}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Motivation</div>
                            <div class="metric-value">${moodEntry.motivation_level || 'N/A'}</div>
                        </div>
                    </div>
                    ${entry.mood_tags ? `
                        <div class="mood-tags">
                            ${entry.mood_tags.split(',').map(tag => `<span class="mood-tag">${TextUtils.escapeHtml(tag.trim())}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${entry.notes ? `<div class="mood-notes">${TextUtils.escapeHtml(entry.notes)}</div>` : ''}
                    ${entry.triggers ? `<div class="mood-triggers"><strong>Triggers:</strong> ${TextUtils.escapeHtml(entry.triggers)}</div>` : ''}
                    ${entry.coping_strategies_used ? `<div class="mood-coping"><strong>Coping:</strong> ${TextUtils.escapeHtml(entry.coping_strategies_used)}</div>` : ''}
                    <div class="flex gap-2">
                        <button class="btn btn-secondary btn-sm edit-mood-btn" data-date="${entry.mood_date}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-sm delete-mood-btn" data-date="${entry.mood_date}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        DOMUtils.setHTML(container, html);
        this.bindMoodEntryEvents();
    }

    // Render mood statistics
    renderMoodStats(stats) {
        const container = this.elements.moodInsightsContent;
        const html = `
            <div class="mood-stats">
                <h3>Mood Statistics (Last 30 days)</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${stats.average_mood || 'N/A'}</div>
                        <div class="stat-label">Average Mood</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.total_entries || 0}</div>
                        <div class="stat-label">Total Entries</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.best_day || 'N/A'}</div>
                        <div class="stat-label">Best Day</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.worst_day || 'N/A'}</div>
                        <div class="stat-label">Worst Day</div>
                    </div>
                </div>
            </div>
        `;
        DOMUtils.setHTML(container, html);
    }

    // Render mood patterns
    renderMoodPatterns(patterns) {
        const container = this.elements.moodInsightsContent;
        const html = `
            <div class="mood-patterns">
                <h3>Mood Patterns</h3>
                <div class="patterns-list">
                    ${patterns.map(pattern => `
                        <div class="pattern-item">
                            <div class="pattern-title">${pattern.title}</div>
                            <div class="pattern-description">${pattern.description}</div>
                            <div class="pattern-confidence">Confidence: ${pattern.confidence}%</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        DOMUtils.setHTML(container, html);
    }

    // Render AI analysis
    renderMoodAIAnalysis(analysis) {
        const container = this.elements.moodInsightsContent;
        const html = `
            <div class="mood-ai-analysis">
                <h3>AI Mood Analysis</h3>
                <div class="analysis-content">
                    <div class="analysis-section">
                        <h4>Summary</h4>
                        <p>${analysis.summary || 'No analysis available'}</p>
                    </div>
                    <div class="analysis-section">
                        <h4>Recommendations</h4>
                        <ul>
                            ${analysis.recommendations?.map(rec => `<li>${rec}</li>`).join('') || '<li>No recommendations available</li>'}
                        </ul>
                    </div>
                    <div class="analysis-section">
                        <h4>Trends</h4>
                        <p>${analysis.trends || 'No trend analysis available'}</p>
                    </div>
                </div>
            </div>
        `;
        DOMUtils.setHTML(container, html);
    }

    // Get mood emoji based on score
    getMoodEmoji(score) {
        if (score >= 9) return '😄';
        if (score >= 8) return '😊';
        if (score >= 7) return '🙂';
        if (score >= 6) return '😐';
        if (score >= 5) return '😕';
        if (score >= 4) return '😞';
        if (score >= 3) return '😢';
        if (score >= 2) return '😭';
        return '😠';
    }

    // Get mood color based on score
    getMoodColor(score) {
        if (score >= 8) return '#10b981'; // green
        if (score >= 6) return '#f59e0b'; // yellow
        if (score >= 4) return '#f97316'; // orange
        return '#ef4444'; // red
    }

    // Show mood modal
    showMoodModal(editDate = null) {
        const modal = this.elements.moodModal;
        const form = this.elements.moodForm;

        // Set date
        const today = new Date().toISOString().split('T')[0];
        this.elements.moodDate.value = editDate || today;

        // Reset form values
        this.elements.moodScore.value = 7;
        this.elements.moodScoreValue.textContent = '7';
        this.elements.moodEnergyLevel.value = 5;
        this.elements.moodStressLevel.value = 5;
        this.elements.moodMotivationLevel.value = 5;
        this.elements.moodTags.value = '';
        this.elements.moodNotes.value = '';
        this.elements.moodTriggers.value = '';

        // Update modal title
        const title = DOMUtils.getElement('#moodModalTitle');
        DOMUtils.setText(title, editDate ? 'Edit Mood Entry' : 'Log Mood Entry');

        ModalUtils.show(modal);
    }

    // Hide mood modal
    hideMoodModal() {
        ModalUtils.hide(this.elements.moodModal);
        this.clearForm();
    }

    // Clear form data
    clearForm() {
        this.elements.moodForm.reset();
        delete this.elements.moodForm.dataset.editDate;
    }

    // Set form data for editing
    setFormData(entry) {
        this.elements.moodDate.value = entry.mood_date;
        this.elements.moodScore.value = entry.mood_score || 7;
        this.elements.moodScoreValue.textContent = (entry.mood_score || 7).toString();
        this.elements.moodEnergyLevel.value = entry.energy_level || 5;
        this.elements.moodStressLevel.value = entry.stress_level || 5;
        this.elements.moodMotivationLevel.value = entry.motivation_level || 5;
        this.elements.moodTags.value = entry.mood_tags || '';
        this.elements.moodNotes.value = entry.notes || '';
        this.elements.moodTriggers.value = entry.triggers || '';
        this.elements.moodForm.dataset.editDate = entry.mood_date;
    }

    // Get form data
    getFormData() {
        return {
            mood_score: parseInt(this.elements.moodScore.value),
            energy_level: parseInt(this.elements.moodEnergyLevel.value),
            stress_level: parseInt(this.elements.moodStressLevel.value),
            motivation_level: parseInt(this.elements.moodMotivationLevel.value),
            mood_tags: this.elements.moodTags.value.trim(),
            notes: this.elements.moodNotes.value.trim(),
            triggers: this.elements.moodTriggers.value.trim()
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

    // Bind mood entry events
    bindMoodEntryEvents() {
        // Edit mood events
        DOMUtils.getAllElements('.edit-mood-btn').forEach(btn => {
            DOMUtils.on(btn, 'click', (e) => {
                const date = e.target.closest('button').dataset.date;
                this.emit('mood:edit', date);
            });
        });

        // Delete mood events
        DOMUtils.getAllElements('.delete-mood-btn').forEach(btn => {
            DOMUtils.on(btn, 'click', (e) => {
                const date = e.target.closest('button').dataset.date;
                this.emit('mood:delete', date);
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
        DOMUtils.on(this.elements.moodForm, 'submit', (e) => {
            e.preventDefault();
            const formData = this.getFormData();
            const editDate = this.elements.moodForm.dataset.editDate;
            handler(formData, editDate);
        });
    }

    // Bind mood score slider updates
    bindMoodScoreUpdates(handler) {
        DOMUtils.on(this.elements.moodScore, 'input', (e) => {
            this.elements.moodScoreValue.textContent = e.target.value;
            if (handler) handler(e.target.value);
        });
    }

    // Bind navigation button events
    bindNavigationEvents() {
        // Stats button
        if (this.elements.moodStatsBtn) {
            DOMUtils.on(this.elements.moodStatsBtn, 'click', () => {
                this.emit('mood:stats');
            });
        }

        // Patterns button
        if (this.elements.moodPatternsBtn) {
            DOMUtils.on(this.elements.moodPatternsBtn, 'click', () => {
                this.emit('mood:patterns');
            });
        }

        // AI Analysis button
        if (this.elements.moodAIAnalysisBtn) {
            DOMUtils.on(this.elements.moodAIAnalysisBtn, 'click', () => {
                this.emit('mood:ai-analysis');
            });
        }

        // New mood entry button
        if (this.elements.newMoodEntryBtn) {
            DOMUtils.on(this.elements.newMoodEntryBtn, 'click', () => {
                this.emit('mood:new');
            });
        }
    }
}

// MoodUI is available globally via window.MoodUI
if (typeof window !== 'undefined') {
    window.MoodUI = MoodUI;
}
