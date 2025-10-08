// Achievements module index
// This file serves as the entry point for the Achievements module

if (typeof window !== 'undefined') {
    window.AchievementsModule = {
        Api: AchievementsApi,
        UI: AchievementsUI,
        Controller: AchievementsController
    };
}