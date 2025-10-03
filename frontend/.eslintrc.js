module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: [
        'standard'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        // Custom rules for this project
        'no-console': 'off', // Allow console.log for debugging
        'no-unused-vars': 'warn', // Warn instead of error for unused vars
        'no-var': 'error', // Prefer const/let over var
        'prefer-const': 'error', // Prefer const for variables that don't reassign
        'no-trailing-spaces': 'error', // No trailing spaces
        'semi': ['error', 'always'], // Always use semicolons
        'quotes': ['error', 'single'], // Use single quotes
        'indent': ['error', 4], // 4 space indentation
        'max-len': ['warn', { code: 120 }], // Max line length
        'camelcase': 'warn', // Warn for camelCase violations
        'no-multiple-empty-lines': ['error', { max: 2 }], // Max 2 empty lines
        'object-curly-spacing': ['error', 'always'], // Spaces in object literals
        'array-bracket-spacing': ['error', 'never'] // No spaces in array brackets
    },
    globals: {
        // Global variables for browser environment
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        Promise: 'readonly',
        Date: 'readonly',
        Math: 'readonly',
        JSON: 'readonly',
        RegExp: 'readonly',
        Array: 'readonly',
        Object: 'readonly',
        String: 'readonly',
        Number: 'readonly',
        Boolean: 'readonly',
        Symbol: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        // Chart.js
        Chart: 'readonly',
        // Application globals
        api: 'readonly',
        state: 'readonly',
        events: 'readonly',
        router: 'readonly',
        // Module controllers
        ProjectsController: 'readonly',
        MoodController: 'readonly',
        WorkloadController: 'readonly',
        LearningController: 'readonly',
        GratitudeController: 'readonly',
        TodosController: 'readonly',
        ReportsController: 'readonly',
        TimelinesController: 'readonly'
    }
};

