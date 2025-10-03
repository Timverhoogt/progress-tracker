// LocalStorage utilities with error handling and type safety
class StorageUtils {
    // Set item with type conversion
    static setItem(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(key, serializedValue);
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    // Get item with type conversion
    static getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }

    // Remove item
    static removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }

    // Clear all storage
    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    }

    // Check if storage is available
    static isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, 'test');
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    // Get all keys
    static getAllKeys() {
        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                keys.push(localStorage.key(i));
            }
            return keys;
        } catch (error) {
            console.error('Failed to get localStorage keys:', error);
            return [];
        }
    }

    // Get storage size in bytes
    static getStorageSize() {
        try {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                total += (key.length + value.length) * 2; // UTF-16 characters
            }
            return total;
        } catch (error) {
            console.error('Failed to calculate storage size:', error);
            return 0;
        }
    }

    // Set with expiration
    static setItemWithExpiry(key, value, expiryInMinutes) {
        const item = {
            value: value,
            expiry: Date.now() + (expiryInMinutes * 60 * 1000)
        };
        return this.setItem(key, item);
    }

    // Get with expiration check
    static getItemWithExpiry(key) {
        try {
            const item = this.getItem(key);
            if (!item) return null;

            if (Date.now() > item.expiry) {
                this.removeItem(key);
                return null;
            }

            return item.value;
        } catch (error) {
            console.error('Failed to get item with expiry:', error);
            return null;
        }
    }

    // Batch operations
    static setItems(items) {
        const results = {};
        Object.keys(items).forEach(key => {
            results[key] = this.setItem(key, items[key]);
        });
        return results;
    }

    static getItems(keys) {
        const results = {};
        keys.forEach(key => {
            results[key] = this.getItem(key);
        });
        return results;
    }

    static removeItems(keys) {
        keys.forEach(key => {
            this.removeItem(key);
        });
    }

    // Storage event listener
    static onStorageChange(callback) {
        window.addEventListener('storage', (e) => {
            callback(e.key, e.oldValue, e.newValue, e.storageArea);
        });
    }

    // Export all data
    static exportData() {
        try {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = this.getItem(key);
            }
            return data;
        } catch (error) {
            console.error('Failed to export localStorage data:', error);
            return {};
        }
    }

    // Import data
    static importData(data) {
        try {
            Object.keys(data).forEach(key => {
                this.setItem(key, data[key]);
            });
            return true;
        } catch (error) {
            console.error('Failed to import localStorage data:', error);
            return false;
        }
    }

    // Storage quota management
    static getStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate()
                .then(estimate => ({
                    quota: estimate.quota,
                    usage: estimate.usage,
                    usageDetails: estimate.usageDetails
                }))
                .catch(error => {
                    console.error('Failed to get storage quota:', error);
                    return null;
                });
        }
        return Promise.resolve(null);
    }
}

// Authentication disabled - AuthStorage class removed

// Settings storage utilities
class SettingsStorage {
    static setSettings(settings) {
        return StorageUtils.setItem('app_settings', settings);
    }

    static getSettings() {
        return StorageUtils.getItem('app_settings', {});
    }

    static setSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.setSettings(settings);
    }

    static getSetting(key, defaultValue = null) {
        const settings = this.getSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }

    static removeSetting(key) {
        const settings = this.getSettings();
        delete settings[key];
        return this.setSettings(settings);
    }
}

// Cache storage utilities
class CacheStorage {
    static setCache(key, data, expiryInMinutes = 5) {
        return StorageUtils.setItemWithExpiry(`cache_${key}`, data, expiryInMinutes);
    }

    static getCache(key) {
        return StorageUtils.getItemWithExpiry(`cache_${key}`);
    }

    static removeCache(key) {
        return StorageUtils.removeItem(`cache_${key}`);
    }

    static clearCache() {
        const keys = StorageUtils.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith('cache_'));
        cacheKeys.forEach(key => StorageUtils.removeItem(key));
        return cacheKeys.length;
    }
}

