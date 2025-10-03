// Configuration and Constants
const getApiBaseUrl = () => {
    const currentHost = window.location.hostname;
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        // Backend is running on port 3060
        return 'http://localhost:3060/api';
    }
    // Same-origin relative path lets HTTPS reverse proxy handle API
    return '/api';
};

const CONFIG = {
    API_BASE_URL: getApiBaseUrl(),
    DEFAULT_TIMEOUT: 30000,
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    FEATURES: {
        VOICE_NOTES: true,
        AI_COACHING: true,
        PHASE_3_ENABLED: true
    }
};

// Make available globally
window.CONFIG = CONFIG;

// Default values for API calls
window.DEFAULT_DAYS = {
    STATS: 30,
    PATTERNS: 90,
    ANALYSIS: 90,
    INTERVENTION_TRIGGERS: 14,
    STRESS_ALERTS: 7,
    BREAK_RECOMMENDATIONS: 7,
    WORK_BOUNDARIES: 30,
    GRATITUDE_STATS: 30,
    ACHIEVEMENT_PROMPTS: 30,
    STRATEGY_ANALYTICS: 30,
    REFLECTION_INSIGHTS: 30
};

// Default values for work preferences
window.DEFAULT_WORK_PREFERENCES = {
    MAX_DAILY_HOURS: 8,
    MAX_WEEKLY_HOURS: 40,
    PREFERRED_START_TIME: '09:00',
    PREFERRED_END_TIME: '17:00',
    BREAK_DURATION_MINUTES: 60,
    BREAK_REMINDER_INTERVAL: 90,
    MAX_WEEKEND_HOURS: 4,
    OVERTIME_THRESHOLD_HOURS: 2,
    WORK_LIFE_BALANCE_GOAL: 'balanced',
    WEEKEND_WORK_ALLOWED: false
};

// Mood levels constants
window.MOOD_LEVELS = {
    EXCELLENT: { min: 8, emoji: '😄', color: '#10b981' },
    GOOD: { min: 6, emoji: '😊', color: '#3b82f6' },
    OKAY: { min: 4, emoji: '😐', color: '#f59e0b' },
    DIFFICULT: { min: 2, emoji: '😕', color: '#ef4444' },
    STRUGGLING: { min: 0, emoji: '😞', color: '#7c2d12' }
};

// Workload categories
window. WORKLOAD_CATEGORIES = {
    WORK: 'work',
    PERSONAL: 'personal',
    HEALTH: 'health',
    LEARNING: 'learning',
    SOCIAL: 'social'
};

// Project status options
window. PROJECT_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    ON_HOLD: 'on_hold',
    CANCELLED: 'cancelled'
};

// Timeline zoom levels
window. TIMELINE_ZOOM = {
    DAYS: 'days',
    WEEKS: 'weeks',
    MONTHS: 'months',
    YEARS: 'years'
};

// Strategy categories
window. STRATEGY_CATEGORIES = {
    MINDFULNESS: 'mindfulness',
    PHYSICAL: 'physical',
    SOCIAL: 'social',
    CREATIVE: 'creative',
    WORK_LIFE_BALANCE: 'work_life_balance'
};

// Gratitude categories
window. GRATITUDE_CATEGORIES = {
    PEOPLE: 'people',
    EXPERIENCES: 'experiences',
    ACHIEVEMENTS: 'achievements',
    HEALTH: 'health',
    NATURE: 'nature',
    PERSONAL_GROWTH: 'personal_growth'
};

// Mood score thresholds
window. MOOD_THRESHOLDS = {
    HIGH_MOOD: 7,
    LOW_MOOD: 4
};

// Work intensity thresholds
window. WORK_INTENSITY_THRESHOLDS = {
    HIGH_INTENSITY: 8,
    LONG_WORK_DAY: 10
};

// Animation durations (in milliseconds)
window. ANIMATION_DURATIONS = {
    SLIDE_IN: 300,
    FADE_IN: 200,
    MESSAGE_DISPLAY: 5000
};

// Message types
window. MESSAGE_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning'
};

// CSS Z-index values
window. Z_INDEX = {
    MODAL: 1000,
    TOOLTIP: 1100,
    DROPDOWN: 1200,
    MESSAGE: 10000
};

// File upload limits
window. FILE_LIMITS = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt']
};

// Chart colors
window. CHART_COLORS = {
    PRIMARY: '#3b82f6',
    SECONDARY: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    SUCCESS: '#10b981',
    INFO: '#3b82f6'
};

// Break recommendations
window. BREAK_RECOMMENDATIONS = {
    SHORT_BREAK: 5,
    LONG_BREAK: 15,
    LUNCH_BREAK: 60
};

// Learning path defaults
window. LEARNING_DEFAULTS = {
    MAX_ACTIVE_PATHS: 3,
    DEFAULT_DIFFICULTY: 'intermediate',
    DEFAULT_DURATION_HOURS: 20
};

// Reflection defaults
window. REFLECTION_DEFAULTS = {
    MAX_REFLECTIONS_PER_DAY: 5,
    DEFAULT_RATING: 3
};