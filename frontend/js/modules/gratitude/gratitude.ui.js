// DOMUtils, ModalUtils, LoadingUtils, MessageUtils are available globally via window
// TextUtils is available globally via window

class GratitudeUI {
    constructor() {
        this.elements = this.initializeElements();
        this.currentSection = 'overview';
        this.chartInstances = {};
    }

    // Initialize DOM elements
    initializeElements() {
        return {
            // Navigation buttons
            newGratitudeEntryBtn: DOMUtils.getElement('#newGratitudeEntryBtn'),
            gratitudePromptsBtn: DOMUtils.getElement('#gratitudePromptsBtn'),
            gratitudeStatsBtn: DOMUtils.getElement('#gratitudeStatsBtn'),

            // Content containers
            todayGratitudeCard: DOMUtils.getElement('#todayGratitudeCard'),
            todayGratitudeContent: DOMUtils.getElement('#todayGratitudeContent'),
            gratitudePromptsSection: DOMUtils.getElement('#gratitudePromptsSection'),
            gratitudePromptsContent: DOMUtils.getElement('#gratitudePromptsContent'),
            achievementGratitudeSection: DOMUtils.getElement('#achievementGratitudeSection'),
            achievementGratitudeContent: DOMUtils.getElement('#achievementGratitudeContent'),
            gratitudeEntries: DOMUtils.getElement('#gratitudeEntries'),

            // Modal elements
            gratitudeModal: DOMUtils.getElement('#gratitudeModal'),
            gratitudeForm: DOMUtils.getElement('#gratitudeForm'),
            closeGratitudeModal: DOMUtils.getElement('#closeGratitudeModal'),
            cancelGratitudeModal: DOMUtils.getElement('#cancelGratitudeModal'),
            gratitudeDate: DOMUtils.getElement('#gratitudeDate'),
            gratitudeCategory: DOMUtils.getElement('#gratitudeCategory'),
            gratitudePrompt: DOMUtils.getElement('#gratitudePrompt'),
            gratitudeResponse: DOMUtils.getElement('#gratitudeResponse'),
            gratitudeMoodBefore: DOMUtils.getElement('#gratitudeMoodBefore'),
            gratitudeMoodBeforeValue: DOMUtils.getElement('#gratitudeMoodBeforeValue'),
            gratitudeMoodAfter: DOMUtils.getElement('#gratitudeMoodAfter'),
            gratitudeMoodAfterValue: DOMUtils.getElement('#gratitudeMoodAfterValue'),
            gratitudeTags: DOMUtils.getElement('#gratitudeTags'),

            // Chart containers
            gratitudeTrendsChart: DOMUtils.getElement('#gratitudeTrendsChart'),
            moodProgressChart: DOMUtils.getElement('#moodProgressChart'),
            categoryDistributionChart: DOMUtils.getElement('#categoryDistributionChart'),
            consistencyChart: DOMUtils.getElement('#consistencyChart'),

            // Loading overlay
            loadingOverlay: DOMUtils.getElement('#loadingOverlay')
        };
    }

    // Render today's gratitude entry
    renderTodayGratitude(entry) {
        const content = this.elements.todayGratitudeContent;

        if (!entry) {
            const html = `
                <div class="gratitude-today-empty">
                    <div class="empty-state-icon">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h4>No gratitude entry for today</h4>
                    <p>Start your day with gratitude practice</p>
                    <button class="btn btn-primary" onclick="window.gratitudeController?.showGratitudeModal()">
                        <i class="fas fa-plus"></i> Add Gratitude Entry
                    </button>
                </div>
            `;
            DOMUtils.setHTML(content, html);
            return;
        }

        const moodImprovement = entry.mood_after && entry.mood_before
            ? entry.mood_after - entry.mood_before
            : 0;

        const html = `
            <div class="card gratitude-entry-card today">
                <div class="flex-between mb-4">
                    <h4>${entry.category ? entry.category.charAt(0).toUpperCase() + entry.category.slice(1) : 'General'} Gratitude</h4>
                    <span class="gratitude-date">${new Date(entry.gratitude_date).toLocaleDateString()}</span>
                </div>
                ${entry.prompt ? `
                    <div class="gratitude-prompt">
                        <strong>Prompt:</strong> ${TextUtils.escapeHtml(entry.prompt)}
                    </div>
                ` : ''}
                <div class="gratitude-response">
                    <strong>Response:</strong> ${TextUtils.escapeHtml(entry.response)}
                </div>
                ${entry.mood_before && entry.mood_after ? `
                    <div class="gratitude-mood">
                        <div class="mood-comparison">
                            <div class="mood-before">
                                <span class="mood-label">Before</span>
                                <span class="mood-value">${entry.mood_before}/10</span>
                            </div>
                            <div class="mood-arrow">
                                <i class="fas fa-arrow-right"></i>
                                ${moodImprovement > 0 ? `<span class="mood-improvement positive">+${moodImprovement}</span>` : ''}
                            </div>
                            <div class="mood-after">
                                <span class="mood-label">After</span>
                                <span class="mood-value">${entry.mood_after}/10</span>
                            </div>
                        </div>
                    </div>
                ` : ''}
                ${entry.tags ? `
                    <div class="gratitude-tags">
                        <strong>Tags:</strong> ${entry.tags.split(',').map(tag => `<span class="tag">${TextUtils.escapeHtml(tag.trim())}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="gratitude-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.gratitudeController?.editGratitudeEntry('${entry.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="window.gratitudeController?.showGratitudeModal('${entry.id}')">
                        <i class="fas fa-plus"></i> Add Another
                    </button>
                </div>
            </div>
        `;

        DOMUtils.setHTML(content, html);
    }

    // Render gratitude entries history
    renderGratitudeEntries(entries) {
        const container = this.elements.gratitudeEntries;

        if (!entries || entries.length === 0) {
            const html = `
                <div class="gratitude-entries-empty">
                    <div class="empty-state-icon">
                        <i class="fas fa-book-open"></i>
                    </div>
                    <h4>No gratitude entries yet</h4>
                    <p>Start practicing gratitude to see your history here</p>
                    <button class="btn btn-primary" onclick="window.gratitudeController?.showGratitudeModal()">
                        <i class="fas fa-plus"></i> Create First Entry
                    </button>
                </div>
            `;
            DOMUtils.setHTML(container, html);
            return;
        }

        const entriesHtml = entries.map(entry => `
            <div class="gratitude-entry-item">
                <div class="gratitude-entry-header">
                    <h5>${entry.category ? entry.category.charAt(0).toUpperCase() + entry.category.slice(1) : 'General'} Gratitude</h5>
                    <span class="gratitude-date">${new Date(entry.gratitude_date).toLocaleDateString()}</span>
                </div>
                <div class="gratitude-entry-content">
                    ${entry.prompt ? `
                        <div class="gratitude-prompt">
                            <strong>Prompt:</strong> ${TextUtils.escapeHtml(entry.prompt)}
                        </div>
                    ` : ''}
                    <div class="gratitude-response">
                        ${TextUtils.escapeHtml(entry.response).length > 150
                            ? TextUtils.escapeHtml(entry.response).substring(0, 150) + '...'
                            : TextUtils.escapeHtml(entry.response)
                        }
                    </div>
                    ${entry.mood_before && entry.mood_after ? `
                        <div class="gratitude-mood">
                            <div class="mood-comparison compact">
                                <span class="mood-value">${entry.mood_before}</span>
                                <i class="fas fa-arrow-right"></i>
                                <span class="mood-value">${entry.mood_after}</span>
                                ${entry.mood_after > entry.mood_before ? `<span class="mood-improvement positive">+${entry.mood_after - entry.mood_before}</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="gratitude-entry-actions">
                    <button class="btn btn-sm btn-secondary" onclick="window.gratitudeController?.editGratitudeEntry('${entry.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.gratitudeController?.deleteGratitudeEntry('${entry.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        DOMUtils.setHTML(container, entriesHtml);
    }

    // Render gratitude prompts
    renderGratitudePrompts(prompts) {
        const container = this.elements.gratitudePromptsContent;

        if (!prompts || prompts.length === 0) {
            const html = `
                <div class="no-prompts">
                    <div class="empty-state-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <h4>No Prompts Available</h4>
                    <p>Try refreshing or check back later for new gratitude prompts</p>
                </div>
            `;
            DOMUtils.setHTML(container, html);
            return;
        }

        const promptsHtml = prompts.map(prompt => `
            <div class="card card-sm card-gray gratitude-prompt-card">
                <div class="prompt-content">
                    <div class="prompt-text">
                        ${TextUtils.escapeHtml(prompt.prompt)}
                    </div>
                    ${prompt.category ? `
                        <div class="prompt-category">
                            <span class="category-badge">${TextUtils.escapeHtml(prompt.category)}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="prompt-actions">
                    <button class="btn btn-primary btn-sm" onclick="window.gratitudeController?.useGratitudePrompt('${TextUtils.escapeHtml(prompt.prompt)}')">
                        <i class="fas fa-play"></i> Use Prompt
                    </button>
                </div>
            </div>
        `).join('');

        const html = `
            <div class="gratitude-prompts">
                <div class="prompts-header">
                    <p>Choose a prompt to inspire your gratitude practice</p>
                    <button class="btn btn-secondary btn-sm" onclick="window.gratitudeController?.refreshPrompts()">
                        <i class="fas fa-refresh"></i> Refresh
                    </button>
                </div>
                <div class="prompts-grid">
                    ${promptsHtml}
                </div>
            </div>
        `;

        DOMUtils.setHTML(container, html);
    }

    // Render achievement-based gratitude prompts
    renderAchievementGratitudePrompts(prompts) {
        const container = this.elements.achievementGratitudeContent;

        if (!prompts || prompts.length === 0) {
            const html = `
                <div class="no-achievement-prompts">
                    <div class="empty-state-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h4>No Achievement Prompts</h4>
                    <p>Complete some tasks or achievements to see gratitude prompts based on your progress</p>
                </div>
            `;
            DOMUtils.setHTML(container, html);
            return;
        }

        const promptsHtml = prompts.map(prompt => `
            <div class="card card-sm card-gray achievement-gratitude-card">
                <div class="flex-between mb-4">
                    <h4><i class="fas fa-trophy"></i> Achievement-Based Gratitude</h4>
                    <div class="achievement-context">
                        <strong>Context:</strong> ${prompt.context || 'Recent achievement'}
                    </div>
                </div>
                <div class="gratitude-prompt">
                    <strong>Prompt:</strong> ${TextUtils.escapeHtml(prompt.prompt)}
                </div>
                ${prompt.gratitude_angle ? `
                    <div class="gratitude-angle">
                        <strong>Future Perspective:</strong> ${TextUtils.escapeHtml(prompt.gratitude_angle)}
                    </div>
                ` : ''}
                <div class="prompt-actions">
                    <button class="btn btn-primary btn-sm" onclick="window.gratitudeController?.useGratitudePrompt('${TextUtils.escapeHtml(prompt.prompt)}')">
                        <i class="fas fa-heart"></i> Use This Prompt
                    </button>
                </div>
            </div>
        `).join('');

        DOMUtils.setHTML(container, promptsHtml);
    }

    // Render gratitude statistics
    renderGratitudeStats(stats) {
        // Update summary statistics
        if (stats.days_with_gratitude !== undefined) {
            const consistencyRate = stats.total_entries > 0 ? (stats.days_with_gratitude / Math.min(30, stats.total_entries)) * 100 : 0;

            // This would update various stat elements in the UI
            console.log(`Gratitude Stats: ${stats.days_with_gratitude} days with gratitude, ${Math.round(consistencyRate)}% consistency rate`);
        }

        // Render charts if data is available
        if (stats.mood_progression && stats.mood_progression.length > 0) {
            this.renderMoodProgressChart(stats.mood_progression);
        }

        if (stats.weekly_patterns) {
            this.renderConsistencyChart(stats.weekly_patterns);
        }

        if (stats.category_patterns) {
            this.renderCategoryDistributionChart(stats.category_patterns);
        }
    }

    // Render mood progress chart
    renderMoodProgressChart(moodData) {
        if (!this.elements.moodProgressChart || typeof Chart === 'undefined') {
            return;
        }

        const ctx = this.elements.moodProgressChart.getContext('2d');

        // Destroy existing chart if it exists
        if (this.chartInstances.moodProgress) {
            this.chartInstances.moodProgress.destroy();
        }

        const data = {
            labels: moodData.map(week => new Date(week.week).toLocaleDateString()),
            datasets: [
                {
                    label: 'Mood Before',
                    data: moodData.map(week => week.avg_mood_before),
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Mood After',
                    data: moodData.map(week => week.avg_mood_after),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4
                }
            ]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: 'Mood (1-10)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        };

        this.chartInstances.moodProgress = new Chart(ctx, config);
    }

    // Render consistency chart
    renderConsistencyChart(weeklyData) {
        if (!this.elements.consistencyChart || typeof Chart === 'undefined') {
            return;
        }

        const ctx = this.elements.consistencyChart.getContext('2d');

        // Destroy existing chart if it exists
        if (this.chartInstances.consistency) {
            this.chartInstances.consistency.destroy();
        }

        const data = {
            labels: Object.keys(weeklyData),
            datasets: [{
                label: 'Consistency Rate (%)',
                data: Object.values(weeklyData).map(day => day.consistency_rate),
                backgroundColor: Object.values(weeklyData).map(day =>
                    day.consistency_rate > 75 ? 'rgba(75, 192, 192, 0.6)' :
                    day.consistency_rate > 50 ? 'rgba(255, 205, 86, 0.6)' :
                    'rgba(255, 99, 132, 0.6)'
                ),
                borderColor: Object.values(weeklyData).map(day =>
                    day.consistency_rate > 75 ? 'rgba(75, 192, 192, 1)' :
                    day.consistency_rate > 50 ? 'rgba(255, 205, 86, 1)' :
                    'rgba(255, 99, 132, 1)'
                ),
                borderWidth: 1
            }]
        };

        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Consistency %'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y}% consistency`;
                            }
                        }
                    }
                }
            }
        };

        this.chartInstances.consistency = new Chart(ctx, config);
    }

    // Render category distribution chart
    renderCategoryDistributionChart(categoryData) {
        if (!this.elements.categoryDistributionChart || typeof Chart === 'undefined') {
            return;
        }

        const ctx = this.elements.categoryDistributionChart.getContext('2d');

        // Destroy existing chart if it exists
        if (this.chartInstances.categoryDistribution) {
            this.chartInstances.categoryDistribution.destroy();
        }

        const categories = Object.keys(categoryData);
        const counts = Object.values(categoryData).map(cat => cat.count);

        const data = {
            labels: categories,
            datasets: [{
                data: counts,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderWidth: 2
            }]
        };

        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed} entries`;
                            }
                        }
                    }
                }
            }
        };

        this.chartInstances.categoryDistribution = new Chart(ctx, config);
    }

    // Show gratitude modal for creating/editing
    showGratitudeModal(entryId = null) {
        if (!entryId && this.elements.gratitudeForm) {
            this.elements.gratitudeForm.reset();
        }

        // Set today's date if creating new entry
        if (!entryId && this.elements.gratitudeDate) {
            const today = new Date().toISOString().split('T')[0];
            this.elements.gratitudeDate.value = today;
        }

        // Show the modal
        ModalUtils.show(this.elements.gratitudeModal);
    }

    // Hide gratitude modal
    hideGratitudeModal() {
        ModalUtils.hide(this.elements.gratitudeModal);
    }

    bindModalControls() {
        ModalUtils.bindCloseTriggers(
            this.elements.gratitudeModal,
            [this.elements.closeGratitudeModal, this.elements.cancelGratitudeModal]
        );
    }

    // Get form data from gratitude form
    getGratitudeFormData() {
        const formData = new FormData(this.elements.gratitudeForm);
        return {
            gratitude_date: formData.get('gratitude_date') || this.elements.gratitudeDate?.value,
            category: formData.get('category') || this.elements.gratitudeCategory?.value,
            prompt: formData.get('prompt') || this.elements.gratitudePrompt?.value,
            response: formData.get('response') || this.elements.gratitudeResponse?.value,
            mood_before: formData.get('mood_before') ? parseInt(formData.get('mood_before')) : null,
            mood_after: formData.get('mood_after') ? parseInt(formData.get('mood_after')) : null,
            tags: formData.get('tags') || this.elements.gratitudeTags?.value
        };
    }

    // Set form data for editing
    setGratitudeFormData(entry) {
        if (this.elements.gratitudeDate) {
            this.elements.gratitudeDate.value = entry.gratitude_date;
        }
        if (this.elements.gratitudeCategory) {
            this.elements.gratitudeCategory.value = entry.category || '';
        }
        if (this.elements.gratitudePrompt) {
            this.elements.gratitudePrompt.value = entry.prompt || '';
        }
        if (this.elements.gratitudeResponse) {
            this.elements.gratitudeResponse.value = entry.response || '';
        }
        if (this.elements.gratitudeMoodBefore && entry.mood_before) {
            this.elements.gratitudeMoodBefore.value = entry.mood_before;
            if (this.elements.gratitudeMoodBeforeValue) {
                this.elements.gratitudeMoodBeforeValue.textContent = entry.mood_before;
            }
        }
        if (this.elements.gratitudeMoodAfter && entry.mood_after) {
            this.elements.gratitudeMoodAfter.value = entry.mood_after;
            if (this.elements.gratitudeMoodAfterValue) {
                this.elements.gratitudeMoodAfterValue.textContent = entry.mood_after;
            }
        }
        if (this.elements.gratitudeTags) {
            this.elements.gratitudeTags.value = entry.tags || '';
        }
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

    // Bind navigation events
    bindNavigationEvents() {
        if (this.elements.newGratitudeEntryBtn) {
            this.elements.newGratitudeEntryBtn.onclick = () => {
                if (window.gratitudeController) {
                    window.gratitudeController.showGratitudeModal();
                }
            };
        }

        if (this.elements.gratitudePromptsBtn) {
            this.elements.gratitudePromptsBtn.onclick = () => {
                if (window.gratitudeController) {
                    window.gratitudeController.loadGratitudePrompts();
                }
            };
        }

        if (this.elements.gratitudeStatsBtn) {
            this.elements.gratitudeStatsBtn.onclick = () => {
                if (window.gratitudeController) {
                    window.gratitudeController.loadGratitudeStats();
                }
            };
        }

        // Modal close handlers
        if (this.elements.gratitudeModal) {
            this.elements.gratitudeModal.onclick = (e) => {
                if (e.target === this.elements.gratitudeModal) {
                    this.hideGratitudeModal();
                }
            };
        }

        // Mood slider handlers
        if (this.elements.gratitudeMoodBefore) {
            this.elements.gratitudeMoodBefore.oninput = (e) => {
                if (this.elements.gratitudeMoodBeforeValue) {
                    this.elements.gratitudeMoodBeforeValue.textContent = e.target.value;
                }
            };
        }

        if (this.elements.gratitudeMoodAfter) {
            this.elements.gratitudeMoodAfter.oninput = (e) => {
                if (this.elements.gratitudeMoodAfterValue) {
                    this.elements.gratitudeMoodAfterValue.textContent = e.target.value;
                }
            };
        }
    }

    // Clean up charts
    cleanup() {
        Object.values(this.chartInstances).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.chartInstances = {};
    }

    // Get current section
    getCurrentSection() {
        return this.currentSection;
    }

    // Set current section
    setCurrentSection(section) {
        this.currentSection = section;
    }
}

// GratitudeUI is available globally via window.GratitudeUI
if (typeof window !== 'undefined') {
    window.GratitudeUI = GratitudeUI;
}
