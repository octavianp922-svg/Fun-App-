const App = {
    engine: null,
    ui: null,
    currentEpisodeId: null,

    init() {
        this.engine = new StoryEngine();
        this.ui = new NovelUI(this.engine);
        this.ui.setEndingCallback((ending) => this.showEnding(ending));

        this.renderMenu();
        this.bindEvents();
        this.showScreen("screen-menu");
    },

    bindEvents() {
        document.getElementById("btn-menu").addEventListener("click", () => {
            this.showScreen("screen-menu");
            this.renderMenu();
        });
        document.getElementById("btn-replay").addEventListener("click", () => {
            if (this.currentEpisodeId) {
                SaveManager.clearProgress(this.currentEpisodeId);
                this.startEpisode(this.currentEpisodeId);
            }
        });
        document.getElementById("btn-back-menu").addEventListener("click", () => {
            this.showScreen("screen-menu");
            this.renderMenu();
        });
    },

    renderMenu() {
        const grid = document.getElementById("episode-grid");
        grid.innerHTML = "";

        EPISODES.forEach((ep) => {
            const card = document.createElement("div");
            card.className = "episode-card";
            if (SaveManager.isCompleted(ep.id)) {
                card.classList.add("completed");
            }

            let statusText = "";
            if (SaveManager.hasSave(ep.id)) {
                statusText = "&#9654; Continua";
            } else if (SaveManager.isCompleted(ep.id)) {
                statusText = "&#10003; Terminat - joaca din nou?";
            }

            card.innerHTML = `
                <div class="episode-number">Episodul ${ep.number}</div>
                <div class="episode-title">${ep.title}</div>
                <div class="episode-desc">${ep.description}</div>
                ${statusText ? `<div class="episode-status">${statusText}</div>` : ""}
            `;

            card.addEventListener("click", () => this.startEpisode(ep.id));
            grid.appendChild(card);
        });
    },

    async startEpisode(episodeId) {
        const ep = EPISODES.find(e => e.id === episodeId);
        if (!ep) return;

        this.currentEpisodeId = episodeId;

        try {
            const response = await fetch(ep.file);
            const data = await response.json();
            this.engine.loadEpisode(data);

            const saved = SaveManager.loadProgress(episodeId);
            if (saved) {
                this.engine.loadState(saved);
            }

            this.ui.reset();
            this.showScreen("screen-game");
            this.ui.renderScene();
        } catch (err) {
            console.error("Eroare la incarcarea episodului:", err);
        }
    },

    showEnding(ending) {
        const scene = this.engine.getCurrentScene();
        const endingId = scene ? scene.ending : "unknown";
        SaveManager.markCompleted(this.currentEpisodeId, endingId);

        document.getElementById("ending-title").textContent = ending.title;
        document.getElementById("ending-description").textContent = ending.description;
        this.showScreen("screen-ending");
    },

    showScreen(screenId) {
        document.querySelectorAll(".screen").forEach(s => {
            s.classList.remove("active");
        });
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add("active");
            target.classList.add("screen-enter");
            setTimeout(() => target.classList.remove("screen-enter"), 400);
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
});
