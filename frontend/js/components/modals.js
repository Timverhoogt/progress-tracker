// Reusable modal system
class Modal {
    constructor(element) {
        this.element = element;
        this.isVisible = false;
        this.onShowCallbacks = [];
        this.onHideCallbacks = [];
        this.init();
    }

    // Initialize modal
    init() {
        // Add close button functionality
        const closeBtn = this.element.querySelector('.modal-close, .btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }

        // Add backdrop click functionality
        const backdrop = this.element.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.hide());
        }

        // Add escape key functionality
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    // Show modal
    show(data = null) {
        this.isVisible = true;
        this.element.classList.add('active');
        this.element.style.display = 'flex';

        // Execute show callbacks
        this.onShowCallbacks.forEach(callback => callback(data));

        // Focus first input if available
        const firstInput = this.element.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    // Hide modal
    hide() {
        this.isVisible = false;
        this.element.classList.remove('active');
        this.element.style.display = 'none';

        // Execute hide callbacks
        this.onHideCallbacks.forEach(callback => callback());

        // Clear form if exists
        const form = this.element.querySelector('form');
        if (form) {
            form.reset();
            // Clear any data attributes
            delete form.dataset.editId;
        }
    }

    // Toggle modal
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // Set title
    setTitle(title) {
        const titleElement = this.element.querySelector('.modal-title, .modal-header h2, .modal-header h3');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // Set content
    setContent(content) {
        const contentElement = this.element.querySelector('.modal-content, .modal-body');
        if (contentElement) {
            contentElement.innerHTML = content;
        }
    }

    // Get form data
    getFormData() {
        const form = this.element.querySelector('form');
        if (!form) return null;

        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    }

    // Set form data
    setFormData(data) {
        const form = this.element.querySelector('form');
        if (!form || !data) return;

        Object.keys(data).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                field.value = data[key];
            }
        });
    }

    // Add event listener
    on(event, callback) {
        if (event === 'show') {
            this.onShowCallbacks.push(callback);
        } else if (event === 'hide') {
            this.onHideCallbacks.push(callback);
        }
    }

    // Remove event listener
    off(event, callback) {
        if (event === 'show') {
            const index = this.onShowCallbacks.indexOf(callback);
            if (index > -1) {
                this.onShowCallbacks.splice(index, 1);
            }
        } else if (event === 'hide') {
            const index = this.onHideCallbacks.indexOf(callback);
            if (index > -1) {
                this.onHideCallbacks.splice(index, 1);
            }
        }
    }
}

// Modal manager for handling multiple modals
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
    }

    // Register a modal
    register(id, element) {
        const modal = new Modal(element);
        this.modals.set(id, modal);
        return modal;
    }

    // Get modal by id
    get(id) {
        return this.modals.get(id);
    }

    // Show modal by id
    show(id, data = null) {
        const modal = this.get(id);
        if (modal) {
            // Hide currently active modal
            if (this.activeModal && this.activeModal !== modal) {
                this.activeModal.hide();
            }

            modal.show(data);
            this.activeModal = modal;
        }
    }

    // Hide modal by id
    hide(id) {
        const modal = this.get(id);
        if (modal) {
            modal.hide();
            if (this.activeModal === modal) {
                this.activeModal = null;
            }
        }
    }

    // Hide all modals
    hideAll() {
        this.modals.forEach(modal => modal.hide());
        this.activeModal = null;
    }

    // Get active modal
    getActive() {
        return this.activeModal;
    }

    // Check if any modal is active
    hasActive() {
        return this.activeModal !== null;
    }
}

// Global modal manager instance
window.modalManager = new ModalManager();

