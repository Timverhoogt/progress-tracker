class SkillsController {
    constructor (apiClient, options = {}) {
        this.api = new SkillsApi(apiClient);
        this.ui = new SkillsUI();
        this.skills = [];
        this.currentSkillId = null;
        this.library = (typeof window !== 'undefined' && window.EvosCompetencyLibrary)
            ? window.EvosCompetencyLibrary
            : null;
        this._eventsBound = false;
        this._librarySetup = false;
        this._isInitializing = false;
        this._initializationPromise = null;

        if (this._shouldAutoInitialize(options.autoInitialize)) {
            this.initialize().catch(error => {
                console.error('SkillsController auto-initialization failed:', error);
            });
        }
    }

    async initialize () {
        if (this._isInitializing) {
            return this._initializationPromise;
        }

        this._isInitializing = true;
        const initialization = (async () => {
            if (!this._eventsBound) {
                this.bindEvents();
                this._eventsBound = true;
            }

            if (!this._librarySetup) {
                this.setupCompetencyLibrary();
                this._librarySetup = true;
            }

            await this.loadSkills();
        })();

        this._initializationPromise = initialization;

        try {
            await initialization;
        } finally {
            this._isInitializing = false;
            this._initializationPromise = null;
        }

        return initialization;
    }

    bindEvents () {
        if (this._eventsBound) {
            return;
        }

        // Bind new skill button
        this.ui.bindNewSkillButton(() => this.showSkillModal());

        // Bind form submission
        this.ui.bindFormSubmit((data) => this.handleSaveSkill(data));

        // Bind skill actions (edit/assess)
        this.ui.bindSkillActions(
            (skillId) => this.editSkill(skillId),
            (skillId) => this.assessSkill(skillId)
        );

        // Bind category filter
        this.ui.bindCategoryFilter(() => this.loadSkills());

        // Bind view mode changes
        this.ui.bindViewMode((view) => this.switchView(view));

        // Bind analysis buttons
        this.ui.bindProgressButton(() => this.showProgress());
        this.ui.bindGapsButton(() => this.showGaps());

        // Set up range input handlers
        this.setupRangeInputs();

        if (typeof this.ui.bindModalControls === 'function') {
            this.ui.bindModalControls();
        }
    }

    setupRangeInputs () {
        ['currentLevel', 'targetLevel', 'selfAssessmentScore'].forEach(id => {
            const range = document.getElementById(id);
            if (range) {
                range.addEventListener('input', (e) => {
                    if (window.updateRangeValue) {
                        window.updateRangeValue(id, e.target.value);
                    }
                });
            }
        });
    }

    async loadSkills () {
        this.ui.showLoading();
        try {
            const categoryFilter = document.getElementById('skillsCategoryFilter');
            const filters = {
                category: categoryFilter?.value || ''
            };

            this.skills = await this.api.getAll(filters);
            this.ui.renderSkills(this.skills);
        } catch (error) {
            console.error('Error loading skills:', error);
            this.ui.showMessage('Failed to load skills', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    showSkillModal (skillId = null, defaults = null) {
        this.currentSkillId = skillId;

        if (skillId) {
            const skill = this.skills.find(s => s.id === skillId);
            if (skill) {
                this.ui.showModal(skill);
            }
        } else {
            this.ui.showModal(defaults);
        }
    }

    async handleSaveSkill (data) {
        try {
            if (this.currentSkillId) {
                await this.api.update(this.currentSkillId, data);
                this.ui.showMessage('Skill updated successfully!', 'success');
            } else {
                await this.api.create(data);
                this.ui.showMessage('Skill added successfully!', 'success');
            }

            this.ui.hideModal();
            this.currentSkillId = null;
            await this.loadSkills();
        } catch (error) {
            console.error('Error saving skill:', error);
            this.ui.showMessage('Failed to save skill', 'error');
        }
    }

    editSkill (skillId) {
        this.showSkillModal(skillId);
    }

    assessSkill (skillId) {
        // For now, just open the edit modal
        // In the future, this could show a dedicated assessment interface
        this.showSkillModal(skillId);
    }

    switchView (view) {
        this.ui.switchView(view);

        // Load data for the selected view if needed
        if (view === 'progress') {
            this.showProgress();
        } else if (view === 'gaps') {
            this.showGaps();
        }
    }

    async showProgress () {
        try {
            this.ui.showLoading();
            const stats = await this.api.getStats();
            // TODO: Render progress chart
            console.log('Skills progress:', stats);
            this.ui.switchView('progress');
        } catch (error) {
            console.error('Error loading skills progress:', error);
            this.ui.showMessage('Failed to load skills progress', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async showGaps () {
        try {
            this.ui.showLoading();
            const gaps = await this.api.getGaps();
            // TODO: Render gaps analysis
            console.log('Skills gaps:', gaps);
            this.ui.switchView('gaps');
        } catch (error) {
            console.error('Error loading skills gaps:', error);
            this.ui.showMessage('Failed to load skills gaps analysis', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    setupCompetencyLibrary () {
        if (!this.library) return;

        this.ui.setupLibrary(this.library, {
            onSkillSelect: ({ role, skillName, suggestedCategory }) => {
                this.prefillSkillFromLibrary(role, skillName, suggestedCategory);
            },
            onImportRole: (role) => this.importRoleCompetencies(role)
        });
    }

    prefillSkillFromLibrary (role, skillName, suggestedCategory) {
        const defaults = {
            skill_name: skillName,
            skill_category: suggestedCategory || '',
            current_level: 3,
            target_level: 7,
            self_assessment_score: 5,
            assessment_notes: `Imported from ${role} competency library`
        };

        this.ui.hideLibrary();
        this.showSkillModal(null, defaults);
    }

    async importRoleCompetencies (role) {
        if (!this.library || !this.library.roles?.[role]) {
            this.ui.showMessage('No competencies found for that role', 'warning');
            return;
        }

        const competencies = this.library.roles[role];
        if (!Array.isArray(competencies) || competencies.length === 0) {
            this.ui.showMessage('No competencies available to import', 'warning');
            return;
        }

        const existingNames = new Set((this.skills || []).map((skill) => skill.skill_name?.toLowerCase()));
        const payloads = competencies.filter((item) => !existingNames.has(item.name.toLowerCase())).map((item) => ({
            skill_name: item.name,
            skill_category: item.suggestedCategory || '',
            current_level: 1,
            target_level: 7,
            self_assessment_score: 5,
            assessment_notes: `Imported from ${role} competency library`
        }));

        if (payloads.length === 0) {
            this.ui.showMessage('All competencies for this role are already in your list', 'info');
            return;
        }

        const confirmImport = typeof window !== 'undefined'
            ? window.confirm(`Import ${payloads.length} competencies for ${role}?`)
            : true;
        if (!confirmImport) return;

        try {
            this.ui.showLoading();
            await Promise.all(payloads.map((data) => this.api.create(data)));
            this.ui.showMessage(`Imported ${payloads.length} competencies for ${role}`, 'success');
            await this.loadSkills();
        } catch (error) {
            console.error('Error importing competencies:', error);
            this.ui.showMessage('Failed to import competencies', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    _shouldAutoInitialize(autoInitializePreference) {
        if (typeof autoInitializePreference === 'boolean') {
            return autoInitializePreference;
        }

        const env = typeof process !== 'undefined' && process.env
            ? process.env.NODE_ENV
            : undefined;

        return env !== 'test';
    }
}

// Make SkillsController available globally
if (typeof window !== 'undefined') {
    window.SkillsController = SkillsController;
}
