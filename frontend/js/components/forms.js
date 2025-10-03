

// Base form component
class Form {
    constructor(formElement) {
        this.form = formElement;
        this.fields = new Map();
        this.errors = new Map();
        this.isValid = true;
        this.init();
    }

    // Initialize form
    init() {
        this.discoverFields();
        this.bindEvents();
    }

    // Discover form fields
    discoverFields() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            this.fields.set(input.name, {
                element: input,
                validators: [],
                errors: []
            });
        });
    }

    // Bind form events
    bindEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.validate();
            if (this.isValid) {
                this.onSubmit(this.getData());
            }
        });

        // Real-time validation
        this.fields.forEach((field, name) => {
            field.element.addEventListener('blur', () => {
                this.validateField(name);
            });

            field.element.addEventListener('input', () => {
                this.clearFieldError(name);
            });
        });
    }

    // Add validation rule to field
    addValidation(name, validator, message) {
        if (this.fields.has(name)) {
            this.fields.get(name).validators.push({ validator, message });
        }
    }

    // Validate entire form
    validate() {
        this.isValid = true;
        this.errors.clear();

        this.fields.forEach((field, name) => {
            this.validateField(name);
        });

        this.displayErrors();
        return this.isValid;
    }

    // Validate single field
    validateField(name) {
        const field = this.fields.get(name);
        if (!field) return;

        field.errors = [];
        const value = field.element.value;

        field.validators.forEach(({ validator, message }) => {
            if (!validator(value)) {
                field.errors.push(message);
            }
        });

        if (field.errors.length > 0) {
            this.errors.set(name, field.errors);
            this.isValid = false;
        }
    }

    // Display validation errors
    displayErrors() {
        // Clear previous errors
        this.form.querySelectorAll('.error-message').forEach(el => el.remove());
        this.form.querySelectorAll('.field-error').forEach(el => {
            el.classList.remove('field-error');
        });

        // Show new errors
        this.errors.forEach((messages, name) => {
            const field = this.fields.get(name);
            if (field) {
                field.element.classList.add('field-error');

                const errorContainer = document.createElement('div');
                errorContainer.className = 'error-message';
                errorContainer.innerHTML = messages.map(msg =>
                    `<div class="error-item">${msg}</div>`
                ).join('');

                field.element.parentNode.appendChild(errorContainer);
            }
        });
    }

    // Clear field error
    clearFieldError(name) {
        const field = this.fields.get(name);
        if (field && this.errors.has(name)) {
            this.errors.delete(name);
            field.element.classList.remove('field-error');

            const errorContainer = field.element.parentNode.querySelector('.error-message');
            if (errorContainer) {
                errorContainer.remove();
            }
        }
    }

    // Get form data
    getData() {
        const data = {};
        this.fields.forEach((field, name) => {
            data[name] = field.element.value;
        });
        return data;
    }

    // Set form data
    setData(data) {
        Object.keys(data).forEach(name => {
            const field = this.fields.get(name);
            if (field) {
                field.element.value = data[name];
            }
        });
    }

    // Reset form
    reset() {
        this.form.reset();
        this.errors.clear();
        this.isValid = true;
        this.displayErrors();
    }

    // Set submit handler
    setSubmitHandler(handler) {
        this.onSubmit = handler;
    }
}

// Project form component
class ProjectForm extends Form {
    constructor(formElement) {
        super(formElement);
        this.setupValidation();
    }

    setupValidation() {
        // Name validation
        this.addValidation('name', (value) => {
            return ValidationUtils.isNotEmpty(value) && ValidationUtils.isValidLength(value, 1, 100);
        }, 'Project name is required and must be 1-100 characters');

        // Description validation
        this.addValidation('description', (value) => {
            return ValidationUtils.isValidLength(value, 0, 1000);
        }, 'Project description must be no more than 1000 characters');
    }
}

// Todo form component
class TodoForm extends Form {
    constructor(formElement) {
        super(formElement);
        this.setupValidation();
    }

    setupValidation() {
        // Title validation
        this.addValidation('title', (value) => {
            return ValidationUtils.isNotEmpty(value) && ValidationUtils.isValidLength(value, 1, 200);
        }, 'Todo title is required and must be 1-200 characters');
    }
}

// Form factory
class FormFactory {
    static create(formElement, type) {
        switch (type) {
            case 'project':
                return new ProjectForm(formElement);
            case 'todo':
                return new TodoForm(formElement);
            default:
                return new Form(formElement);
        }
    }
}

