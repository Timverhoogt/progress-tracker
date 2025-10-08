class NotesUI {
    constructor() {
        this.elements = this.initializeElements();
    }

    initializeElements() {
        return {
            noteInput: document.getElementById('noteInput'),
            addNoteBtn: document.getElementById('addNoteBtn'),
            recordVoiceBtn: document.getElementById('recordVoiceBtn'),
            recordStatus: document.getElementById('recordStatus'),
            notesList: document.getElementById('notesList'),
            loadingOverlay: document.getElementById('loadingOverlay')
        };
    }

    renderNotes(notes) {
        this.hideLoading();
        // Enhanced notes rendering with AI content
        this.elements.notesList.innerHTML = notes.map(note => `
            <article class="note-item" data-id="${note.id}">
                <div class="note-content">
                    <section class="note-section note-section--original">
                        <header class="note-section-header">
                            <span class="note-section-icon" aria-hidden="true">
                                <i class="fas fa-pen-nib"></i>
                            </span>
                            <span class="note-section-title">Original Note</span>
                        </header>
                        <div class="note-section-body">${this.escapeHtml(note.content)}</div>
                    </section>
                    ${note.enhanced_content ? `
                        <section class="note-section note-section--enhanced">
                            <header class="note-section-header">
                                <span class="note-section-icon" aria-hidden="true">
                                    <i class="fas fa-wand-magic-sparkles"></i>
                                </span>
                                <span class="note-section-title">AI Enhanced</span>
                            </header>
                            <div class="note-section-body enhanced-content">${this.escapeHtml(note.enhanced_content)}</div>
                            ${note.structured_data ? `
                                <div class="note-section-meta">
                                    <details class="structured-data">
                                        <summary>View Structured Insights</summary>
                                        <pre>${JSON.stringify(note.structured_data, null, 2)}</pre>
                                    </details>
                                </div>
                            ` : ''}
                        </section>
                    ` : ''}
                </div>
                <footer class="note-actions">
                    <button class="btn btn-danger delete-note-btn" data-id="${note.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </footer>
            </article>
        `).join('');
    }

    showEmptyState() {
        this.hideLoading();
        this.elements.notesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-sticky-note"></i>
                <h3>No Notes Yet</h3>
                <p>Add your first note above to get started</p>
            </div>
        `;
    }

    showLoading() {
        if (this.elements.loadingOverlay) {
            LoadingUtils.show(this.elements.loadingOverlay);
        }
        if (this.elements.notesList) {
            this.elements.notesList.innerHTML = '<div class="loading">Processing note with AI...</div>';
        }
    }

    hideLoading() {
        if (this.elements.loadingOverlay) {
            LoadingUtils.hide(this.elements.loadingOverlay);
        }
    }

    showError(message) {
        MessageUtils.showError(message);
    }

    showSuccess(message) {
        MessageUtils.showSuccess(message);
    }

    bindAddNote(handler) {
        if (this.elements.addNoteBtn) {
            this.elements.addNoteBtn.onclick = handler;
        }
    }

    bindDeleteNote(handler) {
        this.elements.notesList?.addEventListener('click', (event) => {
            const button = event.target.closest('.delete-note-btn');
            if (!button) return;
            const noteId = button.dataset.id;
            handler(noteId);
        });
    }

    bindVoiceRecording(startHandler, stopHandler) {
        if (!this.elements.recordVoiceBtn) return;
        this.elements.recordVoiceBtn.addEventListener('click', () => {
            if (this.elements.recordVoiceBtn.classList.contains('recording')) {
                stopHandler();
            } else {
                startHandler();
            }
        });
    }

    setRecordingState(active) {
        if (!this.elements.recordVoiceBtn) return;
        if (active) {
            this.elements.recordVoiceBtn.classList.add('recording');
            this.setRecordStatus('Recording... click to stop');
        } else {
            this.elements.recordVoiceBtn.classList.remove('recording');
            this.setRecordStatus('');
        }
    }

    setRecordStatus(text) {
        if (this.elements.recordStatus) {
            this.elements.recordStatus.textContent = text;
        }
    }

    appendTranscription(text) {
        if (!this.elements.noteInput) return;
        const existing = this.elements.noteInput.value;
        this.elements.noteInput.value = existing ? `${existing}\n${text}` : text;
    }

    clearNoteInput() {
        if (this.elements.noteInput) {
            this.elements.noteInput.value = '';
        }
    }

    // HTML escaping utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Expose to global scope for traditional script loading
window.NotesUI = NotesUI;

