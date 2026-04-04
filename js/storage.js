// ===== VitaLife - IndexedDB Local Storage =====

const DB_NAME = 'VitaLifeDB';
const DB_VERSION = 1;

const STORES = {
    PROFILE: 'profile',
    HABITS: 'habits',
    DOCUMENTS: 'documents',
    SETTINGS: 'settings',
    CHAT: 'chat'
};

class Storage {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORES.PROFILE)) {
                    db.createObjectStore(STORES.PROFILE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.HABITS)) {
                    const habitsStore = db.createObjectStore(STORES.HABITS, { keyPath: 'date' });
                    habitsStore.createIndex('date', 'date', { unique: true });
                }
                if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
                    const docsStore = db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id', autoIncrement: true });
                    docsStore.createIndex('uploadDate', 'uploadDate');
                }
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.CHAT)) {
                    db.createObjectStore(STORES.CHAT, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };

            request.onerror = (e) => {
                console.error('DB Error:', e);
                reject(e);
            };
        });
    }

    _getStore(storeName, mode = 'readonly') {
        const tx = this.db.transaction(storeName, mode);
        return tx.objectStore(storeName);
    }

    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName, 'readwrite');
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName, 'readwrite');
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const store = this._getStore(storeName, 'readwrite');
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        const storeNames = Object.values(STORES);
        for (const name of storeNames) {
            await this.clear(name);
        }
    }

    async exportAll() {
        const data = {};
        for (const [key, name] of Object.entries(STORES)) {
            data[key] = await this.getAll(name);
        }
        return data;
    }

    async importAll(data) {
        for (const [key, name] of Object.entries(STORES)) {
            if (data[key]) {
                await this.clear(name);
                for (const item of data[key]) {
                    await this.put(name, item);
                }
            }
        }
    }
}

// Singleton
const storage = new Storage();
