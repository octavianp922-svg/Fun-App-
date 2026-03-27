const SaveManager = {
    _key(episodeId) {
        return `funapp_${episodeId}_state`;
    },

    _completedKey(episodeId) {
        return `funapp_${episodeId}_completed`;
    },

    saveProgress(engine) {
        const state = engine.getState();
        if (!state.episodeId) return;
        try {
            localStorage.setItem(this._key(state.episodeId), JSON.stringify(state));
        } catch (e) { /* storage full, ignore */ }
    },

    loadProgress(episodeId) {
        try {
            const raw = localStorage.getItem(this._key(episodeId));
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    clearProgress(episodeId) {
        localStorage.removeItem(this._key(episodeId));
    },

    markCompleted(episodeId, endingId) {
        try {
            const key = this._completedKey(episodeId);
            const raw = localStorage.getItem(key);
            const endings = raw ? JSON.parse(raw) : [];
            if (!endings.includes(endingId)) {
                endings.push(endingId);
            }
            localStorage.setItem(key, JSON.stringify(endings));
        } catch (e) { /* ignore */ }
        this.clearProgress(episodeId);
    },

    isCompleted(episodeId) {
        try {
            const raw = localStorage.getItem(this._completedKey(episodeId));
            const endings = raw ? JSON.parse(raw) : [];
            return endings.length > 0;
        } catch (e) {
            return false;
        }
    },

    hasSave(episodeId) {
        return this.loadProgress(episodeId) !== null;
    }
};
