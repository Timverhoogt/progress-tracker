/**
 * Jest Setup File
 * Configures test environment and global utilities
 */

// Add TextEncoder polyfill for Node.js < 18
if (typeof TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

// Mock fetch API for testing
global.fetch = jest.fn();

// Mock localStorage for testing
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage for testing
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock console methods to avoid noise in tests
const originalConsole = global.console;
global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};

// Setup DOM environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
});
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock Chart.js for testing
global.Chart = {
    register: jest.fn(),
    defaults: {},
    controllers: {},
    elements: {},
    plugins: {},
    scales: {},
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Setup global test utilities
global.createMockElement = (tagName = 'div', attributes = {}) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
};

global.createMockEvent = (type, options = {}) => {
    return new Event(type, options);
};

// Reset mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Reset fetch mock
    global.fetch.mockClear();

    // Reset DOM
    document.body.innerHTML = '';

    // Reset console mocks
    global.console.log.mockClear();
    global.console.warn.mockClear();
    global.console.error.mockClear();
    global.console.info.mockClear();
    global.console.debug.mockClear();
});

// Global test timeout
jest.setTimeout(10000);

