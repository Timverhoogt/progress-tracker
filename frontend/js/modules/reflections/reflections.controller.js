class ReflectionsController {
    constructor (apiClient, options = {}) {
        this.api = new ReflectionsApi(apiClient);
        this.ui = new ReflectionsUI();
        this.reflections = [];
        this.templates = [];
        this._eventsBound = false;
        this._rangeInputBound = false;
        this._isInitializing = false;
        this._initializationPromise = null;

        if (this._shouldAutoInitialize(options.autoInitialize)) {
            this.initialize().catch(error => {
                console.error('ReflectionsController auto-initialization failed:', error);
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

            if (!this._rangeInputBound) {
                this.setupRangeInput();
                this._rangeInputBound = true;
            }

            await this.loadReflectionsAndTemplates();
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

        // Bind new reflection button
        this.ui.bindNewReflectionButton(() => this.showReflectionModal());

        // Bind form submission
        this.ui.bindFormSubmit(() => this.handleSaveReflection());

        // Bind template selection in form
        this.ui.bindTemplateSelection((templateId) => {
            const template = this.templates.find(t => t.id === templateId);
            if (template) {
                this.ui.loadTemplateQuestions(template);
            }
        });

        // Bind template card clicks
        this.ui.bindTemplateCards((templateId) => this.useTemplate(templateId));

        // Bind analysis buttons
        this.ui.bindInsightsButton(() => this.showInsights());
        this.ui.bindTemplatesButton(() => this.switchView('templates'));

        // Bind view tabs
        this.ui.bindViewTabs((view) => this.switchView(view));

        if (typeof this.ui.bindModalControls === 'function') {
            this.ui.bindModalControls();
        }
    }

    setupRangeInput () {
        const range = document.getElementById('moodAtReflection');
        if (range) {
            range.addEventListener('input', (e) => {
                if (window.updateRangeValue) {
                    window.updateRangeValue('moodAtReflection', e.target.value);
                }
            });
        }
    }

    async loadReflectionsAndTemplates () {
        this.ui.showLoading();
        try {
            const [templates, reflections] = await Promise.all([
                this.api.getTemplates(),
                this.api.getAll({ limit: 20 })
            ]);

            this.templates = templates;
            this.reflections = reflections;

            this.ui.renderReflections(this.reflections);
            this.ui.renderTemplates(this.templates);
        } catch (error) {
            console.error('Error loading reflections:', error);
            this.ui.showMessage('Failed to load reflections', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    showReflectionModal (templateId = null) {
        this.ui.showModal(templateId, this.templates);
    }

    useTemplate (templateId) {
        this.showReflectionModal(templateId);
        this.switchView('recent');
    }

    async handleSaveReflection () {
        try {
            const data = this.ui.getFormData(this.templates);

            if (!data) {
                this.ui.showMessage('Please select a template', 'error');
                return;
            }

            await this.api.create(data);
            this.ui.hideModal();
            this.ui.showMessage('Reflection saved successfully!', 'success');
            await this.loadReflectionsAndTemplates();
        } catch (error) {
            console.error('Error saving reflection:', error);
            this.ui.showMessage('Failed to save reflection', 'error');
        }
    }

    switchView (view) {
        this.ui.switchView(view);

        if (view === 'insights') {
            this.showInsights();
        }
    }

    async showInsights () {
        try {
            this.ui.showLoading();
            const insights = await this.api.getInsights(30);
            // TODO: Render insights in the insights dashboard
            console.log('Reflection insights:', insights);
            this.ui.switchView('insights');
        } catch (error) {
            console.error('Error loading reflection insights:', error);
            this.ui.showMessage('Failed to load reflection insights', 'error');
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

// Make ReflectionsController available globally
if (typeof window !== 'undefined') {
    window.ReflectionsController = ReflectionsController;
}
