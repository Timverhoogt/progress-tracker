class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    // Subscribe to an event
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
    }

    // Unsubscribe from an event
    off(event, handler) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(handler);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Emit an event
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    // Subscribe to an event only once
    once(event, handler) {
        const onceHandler = (data) => {
            handler(data);
            this.off(event, onceHandler);
        };
        this.on(event, onceHandler);
    }

    // Delegate event handling to specific selectors
    delegate(selector, event, handler) {
        document.addEventListener(event, (e) => {
            if (e.target.matches(selector)) {
                handler(e);
            }
        });
    }

    // Remove all listeners for an event or all events
    removeAllListeners(event = null) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    // Get listener count for an event
    listenerCount(event) {
        return this.listeners.has(event) ? this.listeners.get(event).length : 0;
    }
}

// Export singleton instance as global
window.events = new EventManager();
