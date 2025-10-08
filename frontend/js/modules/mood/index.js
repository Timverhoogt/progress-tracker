// Mood module uses traditional script pattern - functions available globally

// Lazy loading initialization for mood module
let moodControllerInstance = null;

async function initializeMoodModule(apiClient) {
    if (moodControllerInstance) {
        console.log('Mood module already initialized');
        return moodControllerInstance;
    }

    try {
        console.log('🚀 Initializing mood module...');

        // Create new controller instance
        moodControllerInstance = new MoodController(apiClient, { autoInitialize: false });
        await moodControllerInstance.initialize();

        // Make globally available
        window.moodController = moodControllerInstance;

        console.log('✅ Mood module initialized successfully');
        return moodControllerInstance;
    } catch (error) {
        console.error('❌ Failed to initialize mood module:', error);
        throw error;
    }
}

// Export for ES module compatibility
export { initializeMoodModule };

// Function is available globally for traditional script loading
