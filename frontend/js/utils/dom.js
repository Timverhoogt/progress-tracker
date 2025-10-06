// DOM manipulation utilities
class DOMUtils {
    // Get element by selector
    static getElement(selector) {
        return document.querySelector(selector);
    }

    // Get all elements by selector
    static getAllElements(selector) {
        return document.querySelectorAll(selector);
    }

    // Add class to element
    static addClass(element, className) {
        element.classList.add(className);
    }

    // Remove class from element
    static removeClass(element, className) {
        element.classList.remove(className);
    }

    // Toggle class on element
    static toggleClass(element, className) {
        element.classList.toggle(className);
    }

    // Check if element has class
    static hasClass(element, className) {
        return element.classList.contains(className);
    }

    // Set element text content
    static setText(element, text) {
        element.textContent = text;
    }

    // Set element HTML content
    static setHTML(element, html) {
        element.innerHTML = html;
    }

    // Add event listener
    static on(element, event, handler) {
        element.addEventListener(event, handler);
    }

    // Remove event listener
    static off(element, event, handler) {
        element.removeEventListener(event, handler);
    }

    // Create element with attributes and content
    static createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        if (content) {
            element.textContent = content;
        }
        return element;
    }

    // Show element
    static show(element) {
        element.style.display = '';
    }

    // Hide element
    static hide(element) {
        element.style.display = 'none';
    }

    // Get element dimensions
    static getDimensions(element) {
        return {
            width: element.offsetWidth,
            height: element.offsetHeight,
            top: element.offsetTop,
            left: element.offsetLeft
        };
    }

    // Get element position relative to document
    static getPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height
        };
    }
}

// Modal utilities
class ModalUtils {
    static show(modal) {
        modal.classList.add('active');
    }

    static hide(modal) {
        modal.classList.remove('active');
    }

    static isVisible(modal) {
        return modal.classList.contains('active');
    }
}

// Loading utilities
class LoadingUtils {
    static show(overlay) {
        overlay.classList.add('active');
    }

    static hide(overlay) {
        overlay.classList.remove('active');
    }
}

// Message utilities
class MessageUtils {
    static show(message, type = 'info', duration = 3000) {
        // Remove any existing message
        const existingMessage = document.querySelector('.message-toast');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast message-${type}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <span class="message-text">${message}</span>
                <button class="message-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(messageEl);

        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                if (messageEl.parentElement) {
                    messageEl.remove();
                }
            }, duration);
        }

        return messageEl;
    }

    static showError(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    static showSuccess(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    static showInfo(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    static showWarning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }
}

// Export to global scope for non-module usage
if (typeof window !== 'undefined') {
    window.DOMUtils = DOMUtils;
    window.ModalUtils = ModalUtils;
    window.LoadingUtils = LoadingUtils;
    window.MessageUtils = MessageUtils;
}
