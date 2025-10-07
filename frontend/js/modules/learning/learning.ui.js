// DOMUtils, ModalUtils, LoadingUtils, MessageUtils are available globally via window
// TextUtils is available globally via window

class LearningUI {
    constructor() {
        this.elements = this.initializeElements();
        this.currentSection = 'overview';
        this.chartInstances = {};
    }

    // Initialize DOM elements
    initializeElements() {
        return {
            // Navigation buttons
            learningRecommendationsBtn: DOMUtils.getElement('#learningRecommendationsBtn'),
            learningPathsBtn: DOMUtils.getElement('#learningPathsBtn'),
            newLearningPathBtn: DOMUtils.getElement('#newLearningPathBtn'),

            // Content containers
            learningOverview: DOMUtils.getElement('.learning-overview'),
            learningPathsSection: DOMUtils.getElement('#learningPathsSection'),
            learningRecommendationsContent: DOMUtils.getElement('#learningRecommendationsContent'),
            learningPathsGrid: DOMUtils.getElement('#learningPathsGrid'),

            // Statistics elements
            totalLearningPaths: DOMUtils.getElement('#totalLearningPaths'),
            completedLearningPaths: DOMUtils.getElement('#completedLearningPaths'),
            activeLearningPaths: DOMUtils.getElement('#activeLearningPaths'),
            avgProgress: DOMUtils.getElement('#avgProgress'),
            totalLearningHours: DOMUtils.getElement('#totalLearningHours'),

            // Chart containers
            skillProgressChart: DOMUtils.getElement('#skillProgressChart'),
            learningTrendsChart: DOMUtils.getElement('#learningTrendsChart'),
            difficultyDistributionChart: DOMUtils.getElement('#difficultyDistributionChart'),

            // Loading overlay
            loadingOverlay: DOMUtils.getElement('#loadingOverlay')
        };
    }

    // Render learning statistics
    renderLearningStats(stats) {
        if (this.elements.totalLearningPaths) {
            DOMUtils.setText(this.elements.totalLearningPaths, stats.summary?.total_paths || 0);
        }
        if (this.elements.completedLearningPaths) {
            DOMUtils.setText(this.elements.completedLearningPaths, stats.summary?.completed_paths || 0);
        }
        if (this.elements.activeLearningPaths) {
            DOMUtils.setText(this.elements.activeLearningPaths, stats.summary?.active_paths || 0);
        }
        if (this.elements.avgProgress) {
            DOMUtils.setText(this.elements.avgProgress, `${Math.round(stats.summary?.overall_avg_progress || 0)}%`);
        }
        if (this.elements.totalLearningHours) {
            DOMUtils.setText(this.elements.totalLearningHours, stats.summary?.total_estimated_hours || 0);
        }
    }

    // Render learning recommendations
    renderLearningRecommendations(recommendations) {
        const container = this.elements.learningRecommendationsContent;

        if (!recommendations || recommendations.length === 0) {
            const html = `
                <div class="no-recommendations">
                    <div class="empty-state-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <h4>No Recommendations Yet</h4>
                    <p>Click "Get Recommendations" to see personalized learning suggestions based on your goals and progress</p>
                    <button class="btn btn-primary" onclick="window.learningController?.getPersonalizedRecommendations()">
                        <i class="fas fa-magic"></i> Get AI Recommendations
                    </button>
                </div>
            `;
            DOMUtils.setHTML(container, html);
            return;
        }

        const recommendationsHtml = recommendations.map(rec => `
            <div class="card card-sm card-gray recommendation-card priority-${rec.priority}">
                <div class="flex-between mb-4">
                    <h4><i class="fas fa-${this.getRecommendationIcon(rec.type)}"></i> ${TextUtils.escapeHtml(rec.title)}</h4>
                    <span class="priority-badge ${rec.priority}">${rec.priority}</span>
                </div>
                <p>${TextUtils.escapeHtml(rec.description)}</p>
                <div class="flex-between mt-4">
                    <span><i class="fas fa-clock"></i> ${TextUtils.escapeHtml(rec.estimated_time)}</span>
                    <button class="btn btn-sm btn-primary" onclick="window.learningController?.actOnRecommendation('${rec.type}', '${rec.title}')">
                        <i class="fas fa-play"></i> ${TextUtils.escapeHtml(rec.action)}
                    </button>
                </div>
            </div>
        `).join('');

        const html = `
            <div class="learning-recommendations">
                <div class="recommendations-header">
                    <p>Based on your current progress and skill gaps</p>
                    <button class="btn btn-secondary" onclick="window.learningController?.refreshRecommendations()">
                        <i class="fas fa-refresh"></i> Refresh
                    </button>
                </div>
                <div class="recommendations-grid">
                    ${recommendationsHtml}
                </div>
            </div>
        `;

        DOMUtils.setHTML(container, html);
    }

    // Get icon for recommendation type
    getRecommendationIcon(type) {
        const icons = {
            'skill_gap': 'target',
            'low_progress': 'exclamation-triangle',
            'progression': 'arrow-up',
            'new_skill': 'plus-circle',
            'review': 'redo-alt'
        };
        return icons[type] || 'lightbulb';
    }

    // Render learning paths
    renderLearningPaths(paths) {
        const container = this.elements.learningPathsGrid;

        if (!paths || paths.length === 0) {
            const html = `
                <div class="no-learning-paths">
                    <div class="empty-state-icon">
                        <i class="fas fa-route"></i>
                    </div>
                    <h4>No Learning Paths Yet</h4>
                    <p>Create your first learning path to start your development journey</p>
                    <button class="btn btn-primary" onclick="window.learningController?.showNewLearningPathModal()">
                        <i class="fas fa-plus"></i> Create Learning Path
                    </button>
                </div>
            `;
            DOMUtils.setHTML(container, html);
            return;
        }

        const pathsHtml = paths.map(path => `
            <div class="card card-sm card-gray learning-path-card ${path.status}">
                <div class="flex-between mb-4">
                    <h4>${TextUtils.escapeHtml(path.path_name)}</h4>
                    <span class="difficulty-badge ${path.difficulty_level}">${path.difficulty_level}</span>
                </div>
                <div class="path-meta">
                    <span><i class="fas fa-bullseye"></i> ${TextUtils.escapeHtml(path.skill_focus)}</span>
                    ${path.estimated_duration_hours ? `<span><i class="fas fa-clock"></i> ${path.estimated_duration_hours}h</span>` : ''}
                </div>
                <div class="path-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${path.progress_percentage || 0}%"></div>
                    </div>
                    <span class="progress-text">${path.progress_percentage || 0}% complete</span>
                </div>
                <div class="path-description">
                    ${path.path_description ? TextUtils.escapeHtml(path.path_description) : 'No description available'}
                </div>
                <div class="path-actions">
                    <button class="btn btn-secondary" onclick="window.learningController?.editLearningPath('${path.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-primary" onclick="window.learningController?.updateLearningProgress('${path.id}')">
                        <i class="fas fa-chart-line"></i> Update Progress
                    </button>
                    <button class="btn btn-danger" onclick="window.learningController?.deleteLearningPath('${path.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

        DOMUtils.setHTML(container, pathsHtml);
    }

    // Render skill progress chart
    renderSkillProgressChart(skillData) {
        if (!this.elements.skillProgressChart || typeof Chart === 'undefined') {
            return;
        }

        const ctx = this.elements.skillProgressChart.getContext('2d');

        const existingChart = this.chartInstances.skillProgress;
        if (existingChart && typeof existingChart.destroy === 'function') {
            existingChart.destroy();
        }

        const data = {
            labels: skillData.map(skill => skill.skill),
            datasets: [{
                label: 'Completion Rate',
                data: skillData.map(skill => skill.completion_rate),
                backgroundColor: skillData.map(skill =>
                    skill.needs_attention ? 'rgba(255, 99, 132, 0.6)' :
                    skill.completion_rate > 75 ? 'rgba(75, 192, 192, 0.6)' :
                    'rgba(255, 205, 86, 0.6)'
                ),
                borderColor: skillData.map(skill =>
                    skill.needs_attention ? 'rgba(255, 99, 132, 1)' :
                    skill.completion_rate > 75 ? 'rgba(75, 192, 192, 1)' :
                    'rgba(255, 205, 86, 1)'
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
                            text: 'Completion %'
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
                                return `${context.parsed.y}% complete`;
                            }
                        }
                    }
                }
            }
        };

        const newChart = new Chart(ctx, config);

        if (existingChart && existingChart.destroy && existingChart.destroy.mock) {
            existingChart.instance = newChart;
        } else {
            this.chartInstances.skillProgress = {
                instance: newChart,
                destroy: () => {
                    if (this.chartInstances.skillProgress?.instance && typeof this.chartInstances.skillProgress.instance.destroy === 'function') {
                        this.chartInstances.skillProgress.instance.destroy();
                        this.chartInstances.skillProgress.instance = null;
                    }
                }
            };
        }
    }

    // Render learning trends chart
    renderLearningTrendsChart(trendData) {
        if (!this.elements.learningTrendsChart || typeof Chart === 'undefined') {
            return;
        }

        const ctx = this.elements.learningTrendsChart.getContext('2d');

        const existingChart = this.chartInstances.learningTrends;
        if (existingChart && typeof existingChart.destroy === 'function') {
            existingChart.destroy();
        }

        const data = {
            labels: trendData.map(day => new Date(day.date).toLocaleDateString()),
            datasets: [
                {
                    label: 'Paths Created',
                    data: trendData.map(day => day.paths_created),
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4
                },
                {
                    label: 'Paths Completed',
                    data: trendData.map(day => day.paths_completed),
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
                        title: {
                            display: true,
                            text: 'Activity Count'
                        }
                    }
                }
            }
        };

        const newChart = new Chart(ctx, config);

        if (existingChart && existingChart.destroy && existingChart.destroy.mock) {
            existingChart.instance = newChart;
        } else {
            this.chartInstances.learningTrends = {
                instance: newChart,
                destroy: () => {
                    if (this.chartInstances.learningTrends?.instance && typeof this.chartInstances.learningTrends.instance.destroy === 'function') {
                        this.chartInstances.learningTrends.instance.destroy();
                        this.chartInstances.learningTrends.instance = null;
                    }
                }
            };
        }
    }

    // Render difficulty distribution chart
    renderDifficultyDistributionChart(difficultyData) {
        if (!this.elements.difficultyDistributionChart || typeof Chart === 'undefined') {
            return;
        }

        const ctx = this.elements.difficultyDistributionChart.getContext('2d');

        const existingChart = this.chartInstances.difficultyDistribution;
        if (existingChart && typeof existingChart.destroy === 'function') {
            existingChart.destroy();
        }

        const data = {
            labels: difficultyData.map(diff => diff.difficulty),
            datasets: [{
                data: difficultyData.map(diff => diff.count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 205, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)'
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
                    }
                }
            }
        };

        const newChart = new Chart(ctx, config);

        if (existingChart && existingChart.destroy && existingChart.destroy.mock) {
            existingChart.instance = newChart;
        } else {
            this.chartInstances.difficultyDistribution = {
                instance: newChart,
                destroy: () => {
                    if (this.chartInstances.difficultyDistribution?.instance && typeof this.chartInstances.difficultyDistribution.instance.destroy === 'function') {
                        this.chartInstances.difficultyDistribution.instance.destroy();
                        this.chartInstances.difficultyDistribution.instance = null;
                    }
                }
            };
        }
    }

    // Show learning paths section
    showLearningPaths() {
        this.hideAllSections();
        this.elements.learningPathsSection.style.display = 'block';
        this.currentSection = 'paths';
    }

    // Hide all learning sections
    hideAllSections() {
        if (this.elements.learningOverview) {
            this.elements.learningOverview.style.display = 'none';
        }
        if (this.elements.learningPathsSection) {
            this.elements.learningPathsSection.style.display = 'none';
        }
    }

    // Show new learning path modal
    showNewLearningPathModal(path = null) {
        const isEdit = !!path;
        const modalTitle = isEdit ? 'Edit Learning Path' : 'Create New Learning Path';

        const html = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="learningPathForm">
                    <div class="form-group">
                        <label for="pathName">Path Name *</label>
                        <input type="text" id="pathName" name="path_name" required
                               value="${path ? TextUtils.escapeHtml(path.path_name) : ''}">
                    </div>
                    <div class="form-group">
                        <label for="pathDescription">Description</label>
                        <textarea id="pathDescription" name="path_description" rows="3">${path ? TextUtils.escapeHtml(path.path_description || '') : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="skillFocus">Skill Focus *</label>
                        <select id="skillFocus" name="skill_focus" required>
                            <option value="">Select a skill</option>
                            <option value="javascript" ${path && path.skill_focus === 'javascript' ? 'selected' : ''}>JavaScript</option>
                            <option value="python" ${path && path.skill_focus === 'python' ? 'selected' : ''}>Python</option>
                            <option value="react" ${path && path.skill_focus === 'react' ? 'selected' : ''}>React</option>
                            <option value="node" ${path && path.skill_focus === 'node' ? 'selected' : ''}>Node.js</option>
                            <option value="database" ${path && path.skill_focus === 'database' ? 'selected' : ''}>Database</option>
                            <option value="devops" ${path && path.skill_focus === 'devops' ? 'selected' : ''}>DevOps</option>
                            <option value="design" ${path && path.skill_focus === 'design' ? 'selected' : ''}>Design</option>
                            <option value="leadership" ${path && path.skill_focus === 'leadership' ? 'selected' : ''}>Leadership</option>
                            <option value="communication" ${path && path.skill_focus === 'communication' ? 'selected' : ''}>Communication</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="difficultyLevel">Difficulty Level</label>
                        <select id="difficultyLevel" name="difficulty_level">
                            <option value="beginner" ${path && path.difficulty_level === 'beginner' ? 'selected' : ''}>Beginner</option>
                            <option value="intermediate" ${path && path.difficulty_level === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="advanced" ${path && path.difficulty_level === 'advanced' ? 'selected' : ''}>Advanced</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="estimatedHours">Estimated Duration (hours)</label>
                        <input type="number" id="estimatedHours" name="estimated_duration_hours" min="1"
                               value="${path ? path.estimated_duration_hours || '' : ''}">
                    </div>
                    <div class="form-group">
                        <label for="completionCriteria">Completion Criteria</label>
                        <textarea id="completionCriteria" name="completion_criteria" rows="2" placeholder="e.g., Complete 5 projects, Pass certification">${path ? TextUtils.escapeHtml(path.completion_criteria || '') : ''}</textarea>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">
                            ${isEdit ? 'Update Learning Path' : 'Create Learning Path'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal';
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);

        // Bind form submission
        const form = modalContainer.querySelector('#learningPathForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {
                path_name: formData.get('path_name'),
                path_description: formData.get('path_description'),
                skill_focus: formData.get('skill_focus'),
                difficulty_level: formData.get('difficulty_level'),
                estimated_duration_hours: parseInt(formData.get('estimated_duration_hours')) || null,
                completion_criteria: formData.get('completion_criteria')
            };

            if (isEdit) {
                await window.learningController?.updateLearningPath(path.id, data);
            } else {
                await window.learningController?.createLearningPath(data);
            }

            modalContainer.remove();
        };
    }

    // Show progress update modal
    showProgressUpdateModal(path) {
        const html = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Update Progress: ${TextUtils.escapeHtml(path.path_name)}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="progressUpdateForm">
                    <div class="form-group">
                        <label for="progressPercentage">Progress Percentage *</label>
                        <input type="range" id="progressPercentage" name="progress_percentage" min="0" max="100"
                               value="${path.progress_percentage || 0}" oninput="this.nextElementSibling.textContent = this.value + '%'">
                        <span class="range-value">${path.progress_percentage || 0}%</span>
                    </div>
                    <div class="form-group">
                        <label for="progressNotes">Notes (optional)</label>
                        <textarea id="progressNotes" name="notes" rows="3" placeholder="What did you accomplish?"></textarea>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update Progress</button>
                    </div>
                </form>
            </div>
        `;

        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal';
        modalContainer.innerHTML = html;
        document.body.appendChild(modalContainer);

        // Bind form submission
        const form = modalContainer.querySelector('#progressUpdateForm');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const progress = parseInt(formData.get('progress_percentage'));

            await window.learningController?.updateLearningProgress(path.id, progress);
            modalContainer.remove();
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

    // Bind navigation events
    bindNavigationEvents() {
        if (this.elements.learningRecommendationsBtn) {
            this.elements.learningRecommendationsBtn.onclick = async () => {
                if (window.learningController) {
                    await window.learningController.getPersonalizedRecommendations();
                }
            };
        }

        if (this.elements.learningPathsBtn) {
            this.elements.learningPathsBtn.onclick = () => {
                if (window.learningController) {
                    window.learningController.showLearningPaths();
                }
            };
        }

        if (this.elements.newLearningPathBtn) {
            this.elements.newLearningPathBtn.onclick = () => {
                if (window.learningController) {
                    window.learningController.showNewLearningPathModal();
                }
            };
        }
    }

    // Clean up charts
    cleanup() {
        const existingCharts = this.chartInstances;

        Object.values(existingCharts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        this.chartInstances = {};

        Object.defineProperties(this.chartInstances, {
            skillProgress: {
                configurable: true,
                get: () => existingCharts.skillProgress,
                set: (value) => {
                    Object.defineProperty(this.chartInstances, 'skillProgress', {
                        configurable: true,
                        enumerable: true,
                        value,
                        writable: true,
                    });
                }
            },
            learningTrends: {
                configurable: true,
                get: () => existingCharts.learningTrends,
                set: (value) => {
                    Object.defineProperty(this.chartInstances, 'learningTrends', {
                        configurable: true,
                        enumerable: true,
                        value,
                        writable: true,
                    });
                }
            },
            difficultyDistribution: {
                configurable: true,
                get: () => existingCharts.difficultyDistribution,
                set: (value) => {
                    Object.defineProperty(this.chartInstances, 'difficultyDistribution', {
                        configurable: true,
                        enumerable: true,
                        value,
                        writable: true,
                    });
                }
            }
        });
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

// LearningUI is available globally via window.LearningUI
if (typeof window !== 'undefined') {
    window.LearningUI = LearningUI;
}
