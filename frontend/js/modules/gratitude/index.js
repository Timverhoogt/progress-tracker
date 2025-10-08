

// Gratitude module uses traditional script pattern - functions available globally

// Initialize and expose globally when module is loaded
let gratitudeControllerInstance = null;

async function initializeGratitudeModule(apiClient) {
    if (gratitudeControllerInstance) {
        console.log('GratitudeController already initialized');
        return gratitudeControllerInstance;
    }

    console.log('Initializing GratitudeController...');
    gratitudeControllerInstance = new GratitudeController(apiClient, { autoInitialize: false });
    await gratitudeControllerInstance.initialize();

    // Expose globally for backward compatibility
    window.gratitudeController = gratitudeControllerInstance;

    // Add global convenience functions
    window.loadGratitudeData = () => gratitudeControllerInstance.loadGratitudeData();
    window.loadTodayGratitude = () => gratitudeControllerInstance.loadTodayGratitude();
    window.loadGratitudeEntries = (startDate, endDate, limit) =>
        gratitudeControllerInstance.loadGratitudeEntries(startDate, endDate, limit);
    window.loadGratitudePrompts = () => gratitudeControllerInstance.loadGratitudePrompts();
    window.loadGratitudeStats = (days) => gratitudeControllerInstance.loadGratitudeStats(days);
    window.showGratitudeModal = (entryId) => gratitudeControllerInstance.showGratitudeModal(entryId);
    window.createGratitudeEntry = (data) => gratitudeControllerInstance.createGratitudeEntry(data);
    window.updateGratitudeEntry = (id, data) => gratitudeControllerInstance.updateGratitudeEntry(id, data);
    window.deleteGratitudeEntry = (id) => gratitudeControllerInstance.deleteGratitudeEntry(id);
    window.editGratitudeEntry = (id) => gratitudeControllerInstance.editGratitudeEntry(id);
    window.useGratitudePrompt = (prompt) => gratitudeControllerInstance.useGratitudePrompt(prompt);
    window.getPositiveReframing = (challenge) => gratitudeControllerInstance.getPositiveReframing(challenge);
    window.getEncouragement = () => gratitudeControllerInstance.getEncouragement();
    window.getGratitudeEntriesByCategory = (category) => gratitudeControllerInstance.getGratitudeEntriesByCategory(category);
    window.getGratitudeEntriesByMoodRange = (minMood, maxMood) =>
        gratitudeControllerInstance.getGratitudeEntriesByMoodRange(minMood, maxMood);
    window.getRecentGratitudeEntries = (days) => gratitudeControllerInstance.getRecentGratitudeEntries(days);
    window.getGratitudeInsights = () => gratitudeControllerInstance.getGratitudeInsights();
    window.exportGratitudeData = () => gratitudeControllerInstance.exportGratitudeData();
    window.refreshGratitudeData = () => gratitudeControllerInstance.refreshData();

    return gratitudeControllerInstance;
}

// Export for ES module compatibility
export { initializeGratitudeModule };

