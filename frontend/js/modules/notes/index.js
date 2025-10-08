let notesControllerInstance = null;

async function initializeNotesModule(apiClient) {
    if (notesControllerInstance) {
        console.log('Notes module already initialized');
        return notesControllerInstance;
    }

    try {
        console.log('🚀 Initializing notes module...');
        notesControllerInstance = new NotesController(apiClient, window.state, { autoInitialize: false });
        await notesControllerInstance.initialize();
        window.notesController = notesControllerInstance;
        console.log('✅ Notes module initialized successfully');
        return notesControllerInstance;
    } catch (error) {
        console.error('❌ Failed to initialize notes module:', error);
        throw error;
    }
}

// Export for ES module compatibility
export { initializeNotesModule };

// Function is available in global scope for traditional script loading

