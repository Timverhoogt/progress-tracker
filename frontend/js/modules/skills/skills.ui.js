class SkillsUI {
    constructor () {
        this.elements = {
            skillsGrid: document.getElementById('skillsGrid'),
            categoryFilter: document.getElementById('skillsCategoryFilter'),
            viewMode: document.getElementById('skillsViewMode'),
            progressView: document.getElementById('skillsProgressView'),
            gapsView: document.getElementById('skillsGapsView'),
            gridView: document.getElementById('skillsGridView'),
            progressBtn: document.getElementById('skillsProgressBtn'),
            gapsBtn: document.getElementById('skillsGapsBtn'),
            newSkillBtn: document.getElementById('newSkillBtn'),
            skillModal: document.getElementById('skillModal'),
            skillForm: document.getElementById('skillForm'),
            skillModalTitle: document.getElementById('skillModalTitle'),
            closeSkillModal: document.getElementById('closeSkillModal'),
            cancelSkillModal: document.getElementById('cancelSkillModal'),
            libraryBtn: document.getElementById('skillsLibraryBtn'),
            libraryModal: document.getElementById('skillsLibraryModal'),
            libraryRoleSelect: document.getElementById('skillsLibraryRole'),
            libraryList: document.getElementById('skillsLibraryList'),
            libraryImportAllBtn: document.getElementById('skillsLibraryImportAll'),
            libraryCloseBtn: document.getElementById('closeSkillsLibraryModal'),
            libraryCancelBtn: document.getElementById('cancelSkillsLibrary')
        };

        this.library = null;
        this.libraryHandlers = {
            onSkillSelect: null,
            onImportRole: null
        };
    }

    renderSkills (skills) {
        if (!this.elements.skillsGrid) return;

        if (skills.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.elements.skillsGrid.innerHTML = skills.map(skill => this.createSkillCard(skill)).join('');
    }

    createSkillCard (skill) {
        const gapHtml = skill.current_level < skill.target_level
            ? `
                <div class="skill-gap">
                    <i class="fas fa-arrow-up skill-gap-icon"></i>
                    <span class="skill-gap-text">Gap: ${skill.target_level - skill.current_level} levels to target</span>
                </div>
            `
            : skill.current_level >= skill.target_level
                ? `
                <div class="skill-gap positive">
                    <i class="fas fa-check skill-gap-icon"></i>
                    <span class="skill-gap-text">Target achieved!</span>
                </div>
            `
                : '';

        return `
            <div class="card skill-card" data-skill-id="${skill.id}">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="skill-name">${this.escapeHtml(skill.skill_name)}</div>
                        <span class="skill-category">${this.escapeHtml(skill.skill_category)}</span>
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
                
                ${gapHtml}
                
                <div class="flex gap-2">
                    <button class="skill-action-btn" data-action="edit" data-skill-id="${skill.id}">
                        <i class="fas fa-edit"></i> Update
                    </button>
                    <button class="skill-action-btn primary" data-action="assess" data-skill-id="${skill.id}">
                        <i class="fas fa-chart-line"></i> Assess
                    </button>
                </div>
            </div>
        `;
    }

    renderEmptyState () {
        if (!this.elements.skillsGrid) return;

        this.elements.skillsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-brain" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Skills Added</h3>
                <p>Start building your skills profile by adding your first skill assessment.</p>
                <button class="btn btn-primary" id="addFirstSkill">
                    <i class="fas fa-plus"></i> Add Your First Skill
                </button>
            </div>
        `;
    }

    showModal (skillData = null) {
        if (!this.elements.skillModal) return;

        this.resetForm();
        const isEdit = Boolean(skillData?.id);
        this.setSkillModalTitle(isEdit ? 'Update Skill Assessment' : 'New Skill Assessment');

        if (skillData) {
            this.populateForm(skillData);
        }

        ModalUtils.show(this.elements.skillModal);
    }

    hideModal () {
        if (!this.elements.skillModal) return;

        ModalUtils.hide(this.elements.skillModal);
    }

    bindModalControls () {
        ModalUtils.bindCloseTriggers(
            this.elements.skillModal,
            [this.elements.closeSkillModal, this.elements.cancelSkillModal]
        );
    }

    populateForm (skill) {
        const form = this.elements.skillForm;
        if (!form) return;

        const fields = {
            skillName: skill.skill_name,
            skillCategory: skill.skill_category,
            currentLevel: skill.current_level,
            targetLevel: skill.target_level,
            selfAssessmentScore: skill.self_assessment_score,
            assessmentNotes: skill.assessment_notes
        };

        Object.entries(fields).forEach(([id, value]) => {
            if (value === undefined || value === null) return;
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
                if (element.type === 'range' && window.updateRangeValue) {
                    window.updateRangeValue(id, value);
                }
            }
        });
    }

    resetForm () {
        const form = this.elements.skillForm;
        if (!form) return;

        form.reset();
        this.setSkillModalTitle('New Skill Assessment');

        // Reset range displays
        if (window.updateRangeValue) {
            window.updateRangeValue('currentLevel', 5);
            window.updateRangeValue('targetLevel', 8);
            window.updateRangeValue('selfAssessmentScore', 5);
        }
    }

    getFormData () {
        return {
            skill_name: document.getElementById('skillName')?.value,
            skill_category: document.getElementById('skillCategory')?.value,
            current_level: parseInt(document.getElementById('currentLevel')?.value),
            target_level: parseInt(document.getElementById('targetLevel')?.value),
            self_assessment_score: parseInt(document.getElementById('selfAssessmentScore')?.value),
            assessment_notes: document.getElementById('assessmentNotes')?.value
        };
    }

    bindNewSkillButton (callback) {
        if (this.elements.newSkillBtn) {
            this.elements.newSkillBtn.addEventListener('click', callback);
        }

        // Also bind the empty state button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'addFirstSkill') {
                callback();
            }
        });
    }

    bindFormSubmit (callback) {
        if (this.elements.skillForm) {
            this.elements.skillForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = this.getFormData();
                await callback(data);
            });
        }
    }

    bindSkillActions (onEdit, onAssess) {
        if (!this.elements.skillsGrid) return;

        this.elements.skillsGrid.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const skillId = button.dataset.skillId;

            if (action === 'edit') {
                onEdit(skillId);
            } else if (action === 'assess') {
                onAssess(skillId);
            }
        });
    }

    bindCategoryFilter (callback) {
        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.addEventListener('change', callback);
        }
    }

    bindViewMode (callback) {
        if (this.elements.viewMode) {
            this.elements.viewMode.addEventListener('change', (e) => {
                callback(e.target.value);
            });
        }
    }

    bindProgressButton (callback) {
        if (this.elements.progressBtn) {
            this.elements.progressBtn.addEventListener('click', callback);
        }
    }

    bindGapsButton (callback) {
        if (this.elements.gapsBtn) {
            this.elements.gapsBtn.addEventListener('click', callback);
        }
    }

    switchView (view) {
        // Hide all views
        if (this.elements.gridView) this.elements.gridView.style.display = 'none';
        if (this.elements.progressView) this.elements.progressView.style.display = 'none';
        if (this.elements.gapsView) this.elements.gapsView.style.display = 'none';

        // Show selected view
        switch (view) {
            case 'grid':
                if (this.elements.gridView) this.elements.gridView.style.display = 'block';
                break;
            case 'progress':
                if (this.elements.progressView) this.elements.progressView.style.display = 'block';
                break;
            case 'gaps':
                if (this.elements.gapsView) this.elements.gapsView.style.display = 'block';
                break;
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

    escapeAttribute (text) {
        if (text === undefined || text === null) return '';
        return this.escapeHtml(String(text));
    }

    setSkillModalTitle (title) {
        if (this.elements.skillModalTitle) {
            this.elements.skillModalTitle.textContent = title;
        }
    }

    setupLibrary (library, handlers = {}) {
        this.library = library || null;
        this.libraryHandlers = {
            onSkillSelect: handlers.onSkillSelect || null,
            onImportRole: handlers.onImportRole || null
        };

        if (!this.library || !this.elements.libraryModal) return;

        if (this.elements.libraryBtn) {
            this.elements.libraryBtn.addEventListener('click', () => this.showLibrary());
        }

        [this.elements.libraryCloseBtn, this.elements.libraryCancelBtn].forEach((btn) => {
            if (btn) {
                btn.addEventListener('click', () => this.hideLibrary());
            }
        });

        if (this.elements.libraryRoleSelect) {
            this.populateLibraryRoles();
            this.elements.libraryRoleSelect.addEventListener('change', (e) => {
                this.renderLibrarySkills(e.target.value || '');
            });
        }

        if (this.elements.libraryImportAllBtn) {
            this.elements.libraryImportAllBtn.addEventListener('click', () => {
                const role = this.elements.libraryRoleSelect?.value;
                if (!role) return;
                if (typeof this.libraryHandlers.onImportRole === 'function') {
                    this.libraryHandlers.onImportRole(role);
                }
            });
        }

        if (this.elements.libraryList) {
            this.elements.libraryList.addEventListener('click', (e) => {
                const button = e.target.closest('[data-library-action="add"]');
                if (!button || typeof this.libraryHandlers.onSkillSelect !== 'function') return;

                const role = button.dataset.role;
                const skillName = button.dataset.skill;
                if (!role || !skillName) return;

                const competencies = this.library?.roles?.[role] || [];
                const competency = competencies.find((item) => item.name === skillName);
                if (!competency) return;

                this.libraryHandlers.onSkillSelect({
                    role,
                    skillName: competency.name,
                    suggestedCategory: competency.suggestedCategory
                });
            });
        }

        // Initial render
        this.renderLibrarySkills('');
    }

    populateLibraryRoles () {
        if (!this.library || !this.elements.libraryRoleSelect) return;

        const select = this.elements.libraryRoleSelect;
        select.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a role...';
        select.appendChild(placeholder);

        const roles = Object.keys(this.library.roles || {}).sort((a, b) => a.localeCompare(b));
        roles.forEach((role) => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            select.appendChild(option);
        });
    }

    renderLibrarySkills (role) {
        const container = this.elements.libraryList;
        if (!container) return;

        const competencies = role ? this.library?.roles?.[role] : null;
        if (!role || !competencies || competencies.length === 0) {
            container.innerHTML = `
                <div class="skills-library-empty">
                    <i class="fas fa-search"></i>
                    <h4>Select a role</h4>
                    <p>Choose a role to view the recommended competencies.</p>
                </div>
            `;
            this.toggleImportAllButton(false);
            return;
        }

        container.innerHTML = competencies.map((item) => `
            <div class="skills-library-item">
                <div class="skills-library-item-content">
                    <div class="skills-library-item-title">${this.escapeHtml(item.name)}</div>
                    <div class="skills-library-item-meta">
                        <span class="skills-library-category-tag">${this.escapeHtml(this.formatCategoryLabel(item.suggestedCategory))}</span>
                        <span class="skills-library-item-notes">Suggested category</span>
                    </div>
                </div>
                <div class="skills-library-item-actions">
                    <button
                        class="btn btn-primary"
                        data-library-action="add"
                        data-role="${this.escapeAttribute(role)}"
                        data-skill="${this.escapeAttribute(item.name)}"
                    >
                        <i class="fas fa-plus-circle"></i> Use Skill
                    </button>
                </div>
            </div>
        `).join('');

        this.toggleImportAllButton(true);
    }

    formatCategoryLabel (category) {
        if (!category) return 'General';
        return category.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    }

    toggleImportAllButton (enabled) {
        if (this.elements.libraryImportAllBtn) {
            this.elements.libraryImportAllBtn.disabled = !enabled;
        }
    }

    showLibrary () {
        if (!this.elements.libraryModal) return;
        ModalUtils.show(this.elements.libraryModal);
    }

    hideLibrary () {
        if (!this.elements.libraryModal) return;
        ModalUtils.hide(this.elements.libraryModal);
    }
}

// Make SkillsUI available globally
if (typeof window !== 'undefined') {
    window.SkillsUI = SkillsUI;
}
