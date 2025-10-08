class AchievementsUI {
    constructor () {
        this.elements = {
            achievementsGrid: document.getElementById('achievementsGrid'),
            statusFilter: document.getElementById('achievementsStatusFilter'),
            typeFilter: document.getElementById('achievementsTypeFilter'),
            statsBtn: document.getElementById('achievementsStatsBtn'),
            suggestBtn: document.getElementById('achievementsSuggestBtn'),
            newAchievementBtn: document.getElementById('newAchievementBtn'),
            achievementModal: document.getElementById('achievementModal'),
            achievementForm: document.getElementById('achievementForm'),
            closeAchievementModal: document.getElementById('closeAchievementModal'),
            cancelAchievementModal: document.getElementById('cancelAchievementModal')
        };
    }

    renderAchievements (achievements) {
        if (!this.elements.achievementsGrid) return;

        if (achievements.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.elements.achievementsGrid.innerHTML = achievements.map(achievement =>
            this.createAchievementCard(achievement)
        ).join('');
    }

    createAchievementCard (achievement) {
        const progressPercentage = achievement.target_value > 0
            ? Math.min(100, (achievement.current_value / achievement.target_value) * 100)
            : 0;

        const progressHtml = achievement.target_value > 0 ? `
            <div class="achievement-progress">
                <div class="achievement-progress-header">
                    <span class="achievement-progress-label">Progress</span>
                    <span class="achievement-progress-percentage">${Math.round(progressPercentage)}%</span>
                </div>
                <div class="achievement-progress-bar">
                    <div class="achievement-progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
        ` : '';

        const actionsHtml = achievement.status !== 'completed' ? `
            <button class="achievement-action-btn" data-action="edit" data-achievement-id="${achievement.id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="achievement-action-btn complete" data-action="complete" data-achievement-id="${achievement.id}">
                <i class="fas fa-check"></i> Complete
            </button>
        ` : `
            <div class="achievement-completed">
                <i class="fas fa-trophy"></i> Completed!
            </div>
        `;

        return `
            <div class="card achievement-card ${achievement.status}" data-achievement-id="${achievement.id}">
                <div class="flex justify-between items-center">
                    <div class="achievement-name">${this.escapeHtml(achievement.achievement_name)}</div>
                    <span class="achievement-type ${achievement.achievement_type}">${achievement.achievement_type}</span>
                </div>
                
                ${achievement.description ? `
                    <div class="achievement-description">${this.escapeHtml(achievement.description)}</div>
                ` : ''}
                
                ${progressHtml}
                
                <span class="achievement-priority ${achievement.priority_level}">${achievement.priority_level} priority</span>
                
                <div class="flex gap-2">
                    ${actionsHtml}
                </div>
            </div>
        `;
    }

    renderEmptyState () {
        if (!this.elements.achievementsGrid) return;

        this.elements.achievementsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Achievements Set</h3>
                <p>Define your goals and track your progress towards meaningful achievements.</p>
                <button class="btn btn-primary" id="addFirstAchievement">
                    <i class="fas fa-plus"></i> Set Your First Goal
                </button>
            </div>
        `;
    }

    showModal (achievementData = null) {
        if (!this.elements.achievementModal) return;

        if (achievementData) {
            this.populateForm(achievementData);
        } else {
            this.resetForm();
        }

        ModalUtils.show(this.elements.achievementModal);
    }

    hideModal () {
        if (!this.elements.achievementModal) return;

        ModalUtils.hide(this.elements.achievementModal);
    }

    bindModalControls () {
        ModalUtils.bindCloseTriggers(
            this.elements.achievementModal,
            [this.elements.closeAchievementModal, this.elements.cancelAchievementModal]
        );
    }

    populateForm (achievement) {
        const fields = {
            achievementName: achievement.achievement_name,
            achievementType: achievement.achievement_type,
            achievementDescription: achievement.description || '',
            achievementCriteria: achievement.criteria || '',
            targetValue: achievement.target_value || '',
            currentValue: achievement.current_value || 0,
            priorityLevel: achievement.priority_level,
            celebrationMessage: achievement.celebration_message || ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
    }

    resetForm () {
        const form = this.elements.achievementForm;
        if (!form) return;

        form.reset();
    }

    getFormData () {
        return {
            achievement_name: document.getElementById('achievementName')?.value,
            achievement_type: document.getElementById('achievementType')?.value,
            description: document.getElementById('achievementDescription')?.value,
            criteria: document.getElementById('achievementCriteria')?.value,
            target_value: document.getElementById('targetValue')?.value ?
                parseInt(document.getElementById('targetValue')?.value) : null,
            current_value: parseInt(document.getElementById('currentValue')?.value) || 0,
            priority_level: document.getElementById('priorityLevel')?.value,
            celebration_message: document.getElementById('celebrationMessage')?.value
        };
    }

    bindNewAchievementButton (callback) {
        if (this.elements.newAchievementBtn) {
            this.elements.newAchievementBtn.addEventListener('click', callback);
        }

        // Also bind the empty state button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'addFirstAchievement') {
                callback();
            }
        });
    }

    bindFormSubmit (callback) {
        if (this.elements.achievementForm) {
            this.elements.achievementForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = this.getFormData();
                await callback(data);
            });
        }
    }

    bindAchievementActions (onEdit, onComplete) {
        if (!this.elements.achievementsGrid) return;

        this.elements.achievementsGrid.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const achievementId = button.dataset.achievementId;

            if (action === 'edit') {
                onEdit(achievementId);
            } else if (action === 'complete') {
                onComplete(achievementId);
            }
        });
    }

    bindStatusFilter (callback) {
        if (this.elements.statusFilter) {
            this.elements.statusFilter.addEventListener('change', callback);
        }
    }

    bindTypeFilter (callback) {
        if (this.elements.typeFilter) {
            this.elements.typeFilter.addEventListener('change', callback);
        }
    }

    bindStatsButton (callback) {
        if (this.elements.statsBtn) {
            this.elements.statsBtn.addEventListener('click', callback);
        }
    }

    bindSuggestButton (callback) {
        if (this.elements.suggestBtn) {
            this.elements.suggestBtn.addEventListener('click', callback);
        }
    }

    showLoading () {
        if (window.showLoading) {
            window.showLoading();
        }
    }

    hideLoading () {
        if (window.hideLoading) {
            window.hideLoading();
        }
    }

    showMessage (message, type = 'info') {
        if (window.showMessage) {
            window.showMessage(message, type);
        }
    }

    escapeHtml (text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make AchievementsUI available globally
if (typeof window !== 'undefined') {
    window.AchievementsUI = AchievementsUI;
}
