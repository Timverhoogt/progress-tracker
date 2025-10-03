class AppState {
    constructor() {
        this.store = {
            // Core app state
            currentProject: null,
            projects: [],
            user: {},

            // UI state
            ui: {
                activeTab: 'projects',
                loading: false,
                modal: {
                    active: null,
                    data: null
                }
            },

            // Feature-specific state
            timeline: {
                currentData: null,
                zoom: 'months',
                filter: 'all'
            },

            // Voice/Speech state
            voice: {
                mediaRecorder: null,
                recordedChunks: [],
                isRecording: false,
                recognition: null,
                isDeviceSttActive: false,
                deviceSttFinalText: ''
            },

            // AI coaching state
            coaching: {
                conversation: [],
                active: false
            },

            // Learning state
            learning: {
                skills: [],
                achievements: [],
                reflections: [],
                reflectionTemplates: []
            },

            // Mood state
            mood: {
                charts: {}
            }
        };

        this.subscribers = new Map();
    }

    // Subscribe to state changes
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, []);
        }
        this.subscribers.get(key).push(callback);
    }

    // Unsubscribe from state changes
    unsubscribe(key, callback) {
        if (this.subscribers.has(key)) {
            const callbacks = this.subscribers.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Get state value
    getState(key) {
        const keys = key.split('.');
        let value = this.store;

        for (const k of keys) {
            value = value[k];
            if (value === undefined) return undefined;
        }

        return value;
    }

    // Set state value and notify subscribers
    setState(key, value) {
        const keys = key.split('.');
        let target = this.store;

        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
            if (!target[keys[i]]) {
                target[keys[i]] = {};
            }
            target = target[keys[i]];
        }

        // Set the value
        target[keys[keys.length - 1]] = value;

        // Notify subscribers
        this.notify(key);
    }

    // Notify subscribers of state change
    notify(key) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).forEach(callback => callback(this.getState(key)));
        }
    }

    // Get all state
    getAllState() {
        return { ...this.store };
    }

    // Reset state to initial values
    reset() {
        this.store = {
            currentProject: null,
            projects: [],
            user: {},
            ui: {
                activeTab: 'projects',
                loading: false,
                modal: {
                    active: null,
                    data: null
                }
            },
            timeline: {
                currentData: null,
                zoom: 'months',
                filter: 'all'
            },
            voice: {
                mediaRecorder: null,
                recordedChunks: [],
                isRecording: false,
                recognition: null,
                isDeviceSttActive: false,
                deviceSttFinalText: ''
            },
            coaching: {
                conversation: [],
                active: false
            },
            learning: {
                skills: [],
                achievements: [],
                reflections: [],
                reflectionTemplates: []
            },
            mood: {
                charts: {}
            }
        };
    }
}

// Export singleton instance as global
window.state = new AppState();
