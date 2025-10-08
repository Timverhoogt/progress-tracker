// Workload module uses traditional script pattern - functions available globally

// Lazy loading initialization for workload module
let workloadControllerInstance = null;

async function initializeWorkloadModule(apiClient) {
    if (workloadControllerInstance) {
        console.log('Workload module already initialized');
        return workloadControllerInstance;
    }

    try {
        console.log('🚀 Initializing workload module...');

        // Create new controller instance
        workloadControllerInstance = new WorkloadController(apiClient, { autoInitialize: false });
        await workloadControllerInstance.initialize();

        // Make globally available
        window.workloadController = workloadControllerInstance;

        console.log('✅ Workload module initialized successfully');
        return workloadControllerInstance;
    } catch (error) {
        console.error('❌ Failed to initialize workload module:', error);
        throw error;
    }
}

// Export for ES module compatibility
export { initializeWorkloadModule };

// Function is available globally for traditional script loading
