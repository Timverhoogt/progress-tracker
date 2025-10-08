

// Learning module uses traditional script pattern - functions available globally

// Initialize and expose globally when module is loaded
let learningControllerInstance = null;

async function initializeLearningModule(apiClient) {
    if (learningControllerInstance) {
        console.log('LearningController already initialized');
        return learningControllerInstance;
    }

    console.log('Initializing LearningController...');
    learningControllerInstance = new LearningController(apiClient, { autoInitialize: false });
    await learningControllerInstance.initialize();

    // Expose globally for backward compatibility
    window.learningController = learningControllerInstance;

    // Add global convenience functions
    window.loadLearningData = () => learningControllerInstance.loadLearningData();
    window.getPersonalizedRecommendations = () => learningControllerInstance.getPersonalizedRecommendations();
    window.showLearningPaths = () => learningControllerInstance.showLearningPaths();
    window.showNewLearningPathModal = () => learningControllerInstance.showNewLearningPathModal();
    window.createLearningPath = (data) => learningControllerInstance.createLearningPath(data);
    window.createLearningPathForSkill = (skill, gap) => learningControllerInstance.createLearningPathForSkill(skill, gap);
    window.createLearningPathFromRecommendation = (skillFocus, title, description, hours) =>
        learningControllerInstance.createLearningPathFromRecommendation(skillFocus, title, description, hours);
    window.editLearningPath = (id) => learningControllerInstance.editLearningPath(id);
    window.updateLearningProgress = (id) => learningControllerInstance.updateLearningProgress(id);
    window.deleteLearningPath = (id) => learningControllerInstance.deleteLearningPath(id);
    window.actOnRecommendation = (type, title) => learningControllerInstance.actOnRecommendation(type, title);
    window.exportLearningData = () => learningControllerInstance.exportLearningData();

    return learningControllerInstance;
}

// Export for ES module compatibility
export { initializeLearningModule };

