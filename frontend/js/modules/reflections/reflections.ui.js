class ReflectionsUI {
    constructor () {
        this.elements = {
            reflectionsList: document.getElementById('reflectionsList'),
            templatesGrid: document.getElementById('templatesGrid'),
            insightsDashboard: document.getElementById('insightsDashboard'),
            insightsBtn: document.getElementById('reflectionsInsightsBtn'),
            templatesBtn: document.getElementById('reflectionsTemplatesBtn'),
            newReflectionBtn: document.getElementById('newReflectionBtn'),
            reflectionModal: document.getElementById('reflectionModal'),
            reflectionForm: document.getElementById('reflectionForm'),
            closeReflectionModal: document.getElementById('closeReflectionModal'),
            cancelReflectionModal: document.getElementById('cancelReflectionModal'),
            viewTabs: document.querySelectorAll('.view-tab'),
            reflectionViews: document.querySelectorAll('.reflection-view')
        };
    }

    renderReflections (reflections) {
        if (!this.elements.reflectionsList) return;

        if (reflections.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.elements.reflectionsList.innerHTML = reflections.map(reflection =>
            this.createReflectionCard(reflection)
        ).join('');
    }

    createReflectionCard (reflection) {
        const moodHtml = reflection.mood_at_reflection ? `
            <div class="reflection-mood">
                <i class="fas fa-smile"></i> Mood: ${reflection.mood_at_reflection}/10
            </div>
        ` : '';

        const firstResponse = reflection.responses ?
            Object.values(JSON.parse(reflection.responses))[0] : '';
        const summary = firstResponse ?
            (firstResponse.substring(0, 200) + (firstResponse.length > 200 ? '...' : '')) :
            'No response provided';

        return `
            <div class="card card-gray reflection-card" data-reflection-id="${reflection.id}">
                <div class="flex justify-between items-center">
                    <div>
                        <div class="reflection-template-name">${this.escapeHtml(reflection.template_name || 'Reflection')}</div>
                        <div class="reflection-date">${this.formatDate(reflection.reflection_date)}</div>
                    </div>
                    ${moodHtml}
                </div>
                <div class="reflection-summary">
                    ${this.escapeHtml(summary)}
                </div>
            </div>
        `;
    }

    renderEmptyState () {
        if (!this.elements.reflectionsList) return;

        this.elements.reflectionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-mirror" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No Reflections Yet</h3>
                <p>Start your reflection journey to gain insights into your personal and professional growth.</p>
                <button class="btn btn-primary" id="addFirstReflection">
                    <i class="fas fa-plus"></i> Start Your First Reflection
                </button>
            </div>
        `;
    }

    renderTemplates (templates) {
        if (!this.elements.templatesGrid) return;

        this.elements.templatesGrid.innerHTML = templates.map(template =>
            this.createTemplateCard(template)
        ).join('');
    }

    createTemplateCard (template) {
        const questionCount = template.prompt_questions ?
            (Array.isArray(template.prompt_questions) ?
                template.prompt_questions.length :
                JSON.parse(template.prompt_questions).length) :
            0;

        return `
            <div class="card card-gray template-card" data-template-id="${template.id}">
                <div class="template-name">${this.escapeHtml(template.template_name)}</div>
                <span class="template-type">${template.template_type}</span>
                <div class="template-questions-count">
                    ${questionCount} questions
                </div>
            </div>
        `;
    }

    showModal (templateId = null, templates = []) {
        if (!this.elements.reflectionModal) return;

        if (templateId && templates.length > 0) {
            const template = templates.find(t => t.id === templateId);
            if (template) {
                this.populateForm(template);
            }
        } else {
            this.resetForm();
        }

        ModalUtils.show(this.elements.reflectionModal);
    }

    hideModal () {
        if (!this.elements.reflectionModal) return;

        ModalUtils.hide(this.elements.reflectionModal);
    }

    bindModalControls () {
        ModalUtils.bindCloseTriggers(
            this.elements.reflectionModal,
            [this.elements.closeReflectionModal, this.elements.cancelReflectionModal]
        );
    }

    populateForm (template) {
        const templateSelect = document.getElementById('reflectionTemplate');
        if (templateSelect) {
            templateSelect.value = template.id;
        }

        // Load template questions
        this.loadTemplateQuestions(template);
    }

    loadTemplateQuestions (template) {
        const questionsContainer = document.getElementById('reflectionQuestions');
        if (!questionsContainer) return;

        const questions = Array.isArray(template.prompt_questions) ?
            template.prompt_questions :
            JSON.parse(template.prompt_questions || '[]');

        questionsContainer.innerHTML = questions.map((question, index) => `
            <div class="form-group">
                <label for="question_${index}">${this.escapeHtml(question)}</label>
                <textarea id="question_${index}" name="question_${index}" rows="3" required></textarea>
            </div>
        `).join('');
    }

    resetForm () {
        const form = this.elements.reflectionForm;
        if (!form) return;

        form.reset();

        const questionsContainer = document.getElementById('reflectionQuestions');
        if (questionsContainer) {
            questionsContainer.innerHTML = '';
        }

        // Reset date to today
        const dateInput = document.getElementById('reflectionDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }

        // Reset mood slider
        if (window.updateRangeValue) {
            window.updateRangeValue('moodAtReflection', 5);
        }
    }

    getFormData (templates) {
        const templateId = document.getElementById('reflectionTemplate')?.value;
        const template = templates.find(t => t.id === templateId);

        if (!template) return null;

        const questions = Array.isArray(template.prompt_questions) ?
            template.prompt_questions :
            JSON.parse(template.prompt_questions || '[]');

        const responses = {};
        questions.forEach((question, index) => {
            const questionInput = document.getElementById(`question_${index}`);
            responses[question] = questionInput ? questionInput.value : '';
        });

        return {
            template_id: templateId,
            reflection_date: document.getElementById('reflectionDate')?.value,
            responses: JSON.stringify(responses),
            mood_at_reflection: parseInt(document.getElementById('moodAtReflection')?.value || 5)
        };
    }

    bindNewReflectionButton (callback) {
        if (this.elements.newReflectionBtn) {
            this.elements.newReflectionBtn.addEventListener('click', callback);
        }

        // Also bind the empty state button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'addFirstReflection') {
                callback();
            }
        });
    }

    bindFormSubmit (callback) {
        if (this.elements.reflectionForm) {
            this.elements.reflectionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await callback();
            });
        }
    }

    bindTemplateSelection (callback) {
        const templateSelect = document.getElementById('reflectionTemplate');
        if (templateSelect) {
            templateSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    callback(e.target.value);
                }
            });
        }
    }

    bindTemplateCards (callback) {
        if (this.elements.templatesGrid) {
            this.elements.templatesGrid.addEventListener('click', (e) => {
                const card = e.target.closest('[data-template-id]');
                if (card) {
                    callback(card.dataset.templateId);
                }
            });
        }
    }

    bindInsightsButton (callback) {
        if (this.elements.insightsBtn) {
            this.elements.insightsBtn.addEventListener('click', callback);
        }
    }

    bindTemplatesButton (callback) {
        if (this.elements.templatesBtn) {
            this.elements.templatesBtn.addEventListener('click', callback);
        }
    }

    bindViewTabs (callback) {
        this.elements.viewTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                callback(tab.dataset.view);
            });
        });
    }

    switchView (view) {
        // Update tab active states
        this.elements.viewTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.view === view);
        });

        // Update view visibility
        this.elements.reflectionViews.forEach(viewEl => {
            viewEl.classList.toggle('active', viewEl.id === `${view}ReflectionsView`);
        });
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

    formatDate (dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml (text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make ReflectionsUI available globally
if (typeof window !== 'undefined') {
    window.ReflectionsUI = ReflectionsUI;
}
