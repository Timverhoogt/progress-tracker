// Input validation utilities
class ValidationUtils {
    // Email validation
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // URL validation
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Required field validation
    static isNotEmpty(value) {
        return value !== null && value !== undefined && String(value).trim().length > 0;
    }

    // Length validation
    static isValidLength(value, min, max = null) {
        const length = String(value).length;
        if (max === null) {
            return length >= min;
        }
        return length >= min && length <= max;
    }

    // Numeric validation
    static isNumeric(value) {
        return !isNaN(value) && !isNaN(parseFloat(value));
    }

    // Integer validation
    static isInteger(value) {
        return Number.isInteger(Number(value));
    }

    // Positive number validation
    static isPositiveNumber(value) {
        const num = Number(value);
        return !isNaN(num) && num > 0;
    }

    // Date validation
    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }

    // Future date validation
    static isFutureDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        return date > now;
    }

    // Password strength validation
    static getPasswordStrength(password) {
        let strength = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        strength = Object.values(checks).filter(Boolean).length;

        return {
            score: strength,
            checks,
            isStrong: strength >= 4,
            isMedium: strength >= 3,
            isWeak: strength < 3
        };
    }

    // Project name validation
    static isValidProjectName(name) {
        return this.isNotEmpty(name) && this.isValidLength(name, 1, 100);
    }

    // Project description validation
    static isValidProjectDescription(description) {
        return this.isValidLength(description, 0, 1000);
    }

    // Note content validation
    static isValidNoteContent(content) {
        return this.isNotEmpty(content) && this.isValidLength(content, 1, 2000);
    }

    // Todo title validation
    static isValidTodoTitle(title) {
        return this.isNotEmpty(title) && this.isValidLength(title, 1, 200);
    }

    // File size validation
    static isValidFileSize(size, maxSize = 10 * 1024 * 1024) {
        return size > 0 && size <= maxSize;
    }

    // File type validation
    static isValidFileType(filename, allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt']) {
        const extension = filename.split('.').pop().toLowerCase();
        return allowedTypes.includes(extension);
    }

    // Phone number validation
    static isValidPhoneNumber(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    // Validate form data
    static validateForm(formData, rules) {
        const errors = {};

        Object.keys(rules).forEach(field => {
            const value = formData[field];
            const fieldRules = rules[field];

            for (const rule of fieldRules) {
                if (rule.type === 'required' && !this.isNotEmpty(value)) {
                    errors[field] = rule.message || `${field} is required`;
                    break;
                }

                if (value && rule.type === 'email' && !this.isValidEmail(value)) {
                    errors[field] = rule.message || `${field} must be a valid email`;
                    break;
                }

                if (value && rule.type === 'minLength' && !this.isValidLength(value, rule.value)) {
                    errors[field] = rule.message || `${field} must be at least ${rule.value} characters`;
                    break;
                }

                if (value && rule.type === 'maxLength' && !this.isValidLength(value, 0, rule.value)) {
                    errors[field] = rule.message || `${field} must be no more than ${rule.value} characters`;
                    break;
                }

                if (value && rule.type === 'numeric' && !this.isNumeric(value)) {
                    errors[field] = rule.message || `${field} must be a number`;
                    break;
                }

                if (value && rule.type === 'positive' && !this.isPositiveNumber(value)) {
                    errors[field] = rule.message || `${field} must be a positive number`;
                    break;
                }

                if (value && rule.type === 'custom' && rule.validator && !rule.validator(value)) {
                    errors[field] = rule.message || `${field} is invalid`;
                    break;
                }
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

// Form validation helpers
class FormValidator {
    constructor(form, rules) {
        this.form = form;
        this.rules = rules;
        this.errors = {};
        this.isValid = true;
    }

    // Validate the form
    validate() {
        this.errors = {};
        this.isValid = true;

        const formData = new FormData(this.form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        const result = ValidationUtils.validateForm(data, this.rules);
        this.errors = result.errors;
        this.isValid = result.isValid;

        this.displayErrors();
        return result;
    }

    // Display validation errors
    displayErrors() {
        // Clear previous errors
        this.form.querySelectorAll('.error-message').forEach(el => el.remove());
        this.form.querySelectorAll('.field-error').forEach(el => {
            el.classList.remove('field-error');
        });

        // Show new errors
        Object.keys(this.errors).forEach(field => {
            const fieldElement = this.form.querySelector(`[name="${field}"]`);
            if (fieldElement) {
                fieldElement.classList.add('field-error');

                const errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = this.errors[field];

                fieldElement.parentNode.appendChild(errorElement);
            }
        });
    }

    // Get field value
    getValue(fieldName) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        return field ? field.value : '';
    }

    // Set field value
    setValue(fieldName, value) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.value = value;
        }
    }

    // Check if field is valid
    isFieldValid(fieldName) {
        return !this.errors[fieldName];
    }

    // Get all form data
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }
}

