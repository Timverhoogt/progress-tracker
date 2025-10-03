

// Timelines module uses traditional script pattern - functions available globally

// Initialize and expose globally when module is loaded
let timelinesControllerInstance = null;

async function initializeTimelinesModule(apiClient) {
    if (timelinesControllerInstance) {
        console.log('TimelinesController already initialized');
        return timelinesControllerInstance;
    }

    console.log('Initializing TimelinesController...');
    timelinesControllerInstance = new TimelinesController(apiClient);

    // Expose globally for backward compatibility
    window.timelinesController = timelinesControllerInstance;

    // Add global convenience functions
    window.loadTimeline = (projectId) => timelinesControllerInstance.loadProjectTimeline(projectId);
    window.refreshTimeline = () => timelinesControllerInstance.refreshTimeline();
    window.createMilestone = (data) => timelinesControllerInstance.createMilestone(data);
    window.showMilestoneModal = (milestone) => timelinesControllerInstance.showMilestoneModal(milestone);
    window.estimateTimeline = () => timelinesControllerInstance.estimateTimeline();
    window.exportTimeline = () => timelinesControllerInstance.exportTimeline();

    return timelinesControllerInstance;
}

// Export for ES module compatibility
export { initializeTimelinesModule };

