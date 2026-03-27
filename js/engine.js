class StoryEngine {
    constructor() {
        this.episodeData = null;
        this.currentSceneId = null;
        this.choiceHistory = [];
    }

    loadEpisode(data) {
        this.episodeData = data;
        this.currentSceneId = data.startScene;
        this.choiceHistory = [];
    }

    getCurrentScene() {
        if (!this.episodeData || !this.currentSceneId) return null;
        const scene = this.episodeData.scenes[this.currentSceneId];
        if (!scene) return null;
        return { ...scene, id: this.currentSceneId };
    }

    makeChoice(index) {
        const scene = this.getCurrentScene();
        if (!scene || !scene.choices || !scene.choices[index]) return false;
        this.choiceHistory.push({
            sceneId: this.currentSceneId,
            choiceIndex: index,
            choiceText: scene.choices[index].text
        });
        this.currentSceneId = scene.choices[index].next;
        return true;
    }

    advanceScene() {
        const scene = this.getCurrentScene();
        if (!scene || !scene.next) return false;
        this.currentSceneId = scene.next;
        return true;
    }

    isAtEnding() {
        const scene = this.getCurrentScene();
        return scene && scene.ending != null;
    }

    getEnding() {
        const scene = this.getCurrentScene();
        if (!scene || !scene.ending) return null;
        return this.episodeData.endings[scene.ending] || null;
    }

    hasChoices() {
        const scene = this.getCurrentScene();
        return scene && Array.isArray(scene.choices) && scene.choices.length > 0;
    }

    getState() {
        return {
            episodeId: this.episodeData ? this.episodeData.id : null,
            currentSceneId: this.currentSceneId,
            choiceHistory: [...this.choiceHistory]
        };
    }

    loadState(state) {
        if (!this.episodeData || state.episodeId !== this.episodeData.id) return false;
        this.currentSceneId = state.currentSceneId;
        this.choiceHistory = state.choiceHistory || [];
        return true;
    }
}
