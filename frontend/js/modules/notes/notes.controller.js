class NotesController {
    constructor(apiClient, appState = window.state, options = {}) {
        this.api = new NotesApi(apiClient);
        this.ui = new NotesUI();
        this.state = appState || {
            getState: () => null,
            subscribe: () => {},
            setState: () => {}
        };
        this.hasGlobalState = Boolean(appState && typeof appState.subscribe === 'function');

        this.currentProjectId = null;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.recognition = null;
        this.isDeviceSttActive = false;

        this._eventsBound = false;
        this._subscriptionsBound = false;
        this._isInitializing = false;
        this._initializationPromise = null;

        if (this._shouldAutoInitialize(options.autoInitialize)) {
            this.initialize().catch(error => {
                console.error('NotesController auto-initialization failed:', error);
            });
        }
    }

    async initialize() {
        if (this._isInitializing) {
            return this._initializationPromise;
        }

        this._isInitializing = true;
        const initialization = (async () => {
            if (!this._eventsBound) {
                this.bindUIEvents();
                this._eventsBound = true;
            }

            if (!this._subscriptionsBound) {
                this.subscribeToState();
                this._subscriptionsBound = true;
            }

            const getState = this.state && typeof this.state.getState === 'function'
                ? this.state.getState.bind(this.state)
                : () => null;

            this.currentProjectId = getState('currentProject');

            if (this.currentProjectId) {
                await this.loadNotes(this.currentProjectId);
            } else {
                this.ui.showEmptyState();
            }
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

    bindUIEvents() {
        this.bindProjectSelector();
        this.ui.bindAddNote(() => this.handleAddNote());
        this.ui.bindDeleteNote((noteId) => this.handleDeleteNote(noteId));
        this.ui.bindVoiceRecording(
            () => this.startVoiceRecording(),
            () => this.stopVoiceRecording()
        );
    }

    bindProjectSelector() {
        const selector = document.getElementById('notesProjectSelector');
        if (!selector || selector.dataset.notesSelectorBound) {
            return;
        }

        selector.addEventListener('change', async (event) => {
            const projectId = event.target.value || null;

            // Ensure legacy global stays in sync for modules that still depend on it
            window.currentProject = projectId;

            if (this.hasGlobalState) {
                this.state.setState('currentProject', projectId);
                return;
            }

            this.currentProjectId = projectId;
            if (!projectId) {
                this.ui.showEmptyState();
                return;
            }

            await this.loadNotes(projectId);
        });

        selector.dataset.notesSelectorBound = 'true';
    }

    subscribeToState() {
        if (!this.hasGlobalState || this._subscriptionsBound) {
            return;
        }

        this._subscriptionsBound = true;

        this.state.subscribe('currentProject', async (projectId) => {
            this.currentProjectId = projectId;
            if (!projectId) {
                this.ui.showEmptyState();
                return;
            }
            await this.loadNotes(projectId);
        });
    }

    async loadNotes(projectId) {
        if (!projectId) {
            this.ui.showEmptyState();
            return;
        }

        try {
            this.ui.showLoading();
            const notes = await this.api.getAll(projectId);
            if (!notes || notes.length === 0) {
                this.ui.showEmptyState();
            } else {
                this.ui.renderNotes(notes);
            }
        } catch (error) {
            console.error('Failed to load notes:', error);
            this.ui.showError('Failed to load notes');
        } finally {
            this.ui.hideLoading();
        }
    }

    async handleAddNote() {
        const content = this.ui.elements.noteInput?.value.trim();
        if (!this.currentProjectId) {
            this.ui.showError('Please select a project first');
            return;
        }

        if (!content) {
            this.ui.showError('Please enter note content');
            return;
        }

        try {
            this.ui.showLoading();
            await this.api.create({
                project_id: this.currentProjectId,
                content
            });

            this.ui.showSuccess('Note added');
            this.ui.clearNoteInput();
            await this.loadNotes(this.currentProjectId);
        } catch (error) {
            console.error('Failed to add note:', error);
            this.ui.showError('Failed to add note');
        } finally {
            this.ui.hideLoading();
        }
    }

    async handleDeleteNote(noteId) {
        if (!noteId) return;

        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            this.ui.showLoading();
            await this.api.delete(noteId);
            this.ui.showSuccess('Note deleted');
            await this.loadNotes(this.currentProjectId);
        } catch (error) {
            console.error('Failed to delete note:', error);
            this.ui.showError('Failed to delete note');
        } finally {
            this.ui.hideLoading();
        }
    }

    async startVoiceRecording() {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const deviceSttSupported = !!SpeechRecognition && location.protocol === 'https:';

            if (deviceSttSupported) {
                this.startDeviceSpeechRecognition(SpeechRecognition);
                return;
            }

            if (!navigator.mediaDevices?.getUserMedia) {
                this.ui.showError('Microphone not supported in this browser');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.recordedChunks = [];
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: this.getSupportedAudioMimeType() });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType });
                await this.uploadForTranscription(blob);
                stream.getTracks().forEach((track) => track.stop());
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.ui.setRecordingState(true);
        } catch (error) {
            console.error('Failed to access microphone:', error);
            this.ui.showError('Failed to access microphone');
            this.ui.setRecordingState(false);
        }
    }

    stopVoiceRecording() {
        if (this.isDeviceSttActive) {
            this.stopDeviceSpeechRecognition();
            return;
        }

        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.ui.setRecordingState(false);
        }
    }

    startDeviceSpeechRecognition(SpeechRecognitionCtor) {
        try {
            this.recognition = new SpeechRecognitionCtor();
            this.recognition.lang = navigator.language || 'en-US';
            this.recognition.interimResults = true;
            this.recognition.continuous = true;
            this.isDeviceSttActive = true;

            const startingNoteValue = this.ui.elements.noteInput?.value || '';

            this.recognition.onresult = (event) => {
                let interim = '';
                let finalText = startingNoteValue;

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalText += (finalText ? '\n' : '') + result[0].transcript.trim();
                    } else {
                        interim += result[0].transcript;
                    }
                }

                const parts = [];
                if (finalText) parts.push(finalText.trim());
                if (interim.trim()) parts.push(interim.trim());
                this.ui.elements.noteInput.value = parts.join('\n');
            };

            this.recognition.onerror = () => {
                this.ui.showError('Device speech recognition error');
                this.stopDeviceSpeechRecognition();
            };

            this.recognition.onend = () => {
                this.stopDeviceSpeechRecognition();
            };

            this.recognition.start();
            this.ui.setRecordingState(true);
        } catch (error) {
            console.error('Device speech recognition unavailable:', error);
            this.ui.showError('Device speech recognition unavailable');
            this.isDeviceSttActive = false;
            this.ui.setRecordingState(false);
        }
    }

    stopDeviceSpeechRecognition() {
        if (this.recognition?.stop) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.warn('Failed to stop recognition', error);
            }
        }

        this.isDeviceSttActive = false;
        this.ui.setRecordingState(false);
    }

    getSupportedAudioMimeType() {
        const candidates = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/ogg'
        ];

        for (const type of candidates) {
            if (MediaRecorder.isTypeSupported?.(type)) {
                return type;
            }
        }

        return 'audio/webm';
    }

    async uploadForTranscription(blob) {
        try {
            this.ui.setRecordStatus('Transcribing audio…');
            const form = new FormData();
            const extension = blob.type.includes('ogg') ? 'ogg' : 'webm';
            form.append('audio', blob, `voice-note-${Date.now()}.${extension}`);

            const response = await this.api.transcribe(form);
            if (response?.transcript) {
                this.ui.appendTranscription(response.transcript);
                this.ui.showSuccess('Transcription complete');
            } else {
                this.ui.showError('No transcript returned');
            }
        } catch (error) {
            console.error('Failed to transcribe audio:', error);
            this.ui.showError('Failed to transcribe audio');
        } finally {
            this.ui.setRecordStatus('');
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

// Expose to global scope for traditional script loading
window.NotesController = NotesController;

