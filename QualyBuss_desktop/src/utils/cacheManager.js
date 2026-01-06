export class CacheManager {
    constructor() {
        this.cache = new Map();
        this.ttl = new Map();
    }

    /**
     * @param {string} key - Unique key for the cache item
     * @param {any} value - Data to store
     * @param {number} ttlSeconds - Time to live in seconds (default 5 min)
     */
    set(key, value, ttlSeconds = 300) {
        this.cache.set(key, value);
        const expiry = Date.now() + ttlSeconds * 1000;
        this.ttl.set(key, expiry);
    }

    /**
     * @param {string} key 
     * @returns {any | null} Cached value or null if expired/missing
     */
    get(key) {
        if (!this.cache.has(key)) return null;

        const expiry = this.ttl.get(key);
        if (Date.now() > expiry) {
            this.del(key);
            return null;
        }

        return this.cache.get(key);
    }

    /**
     * @param {string} key 
     */
    del(key) {
        this.cache.delete(key);
        this.ttl.delete(key);
    }

    /**
     * Removes all keys that contain the given pattern
     * @param {string} pattern 
     */
    invalidate(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.del(key);
            }
        }
    }

    clearAll() {
        this.cache.clear();
        this.ttl.clear();
    }
}

// Export singleton instance
export const cache = new CacheManager();
