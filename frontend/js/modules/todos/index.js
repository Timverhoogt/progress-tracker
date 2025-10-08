let todosControllerInstance = null;

async function initializeTodosModule(apiClient) {
    if (todosControllerInstance) {
        console.log('Todos module already initialized');
        return todosControllerInstance;
    }

    try {
        console.log('🚀 Initializing todos module...');
        const ui = new TodosUI();
        const api = new TodosApi(apiClient);
        todosControllerInstance = new TodosController(apiClient, window.state, ui, api, { autoInitialize: false });
        await todosControllerInstance.initialize();
        window.todosController = todosControllerInstance;
        console.log('✅ Todos module initialized successfully');
        return todosControllerInstance;
    } catch (error) {
        console.error('❌ Failed to initialize todos module:', error);
        throw error;
    }
}

// Export for ES module compatibility
export { initializeTodosModule };

// Function is available in global scope for traditional script loading
