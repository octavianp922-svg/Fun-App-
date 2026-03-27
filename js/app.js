const EPISODE_ICONS = {
    episode1: "\u{2708}\u{FE0F}",
    episode2: "\u{1F384}",
    episode3: "\u{1F382}"
};

const App = {
    engine: null,
    ui: null,
    currentEpisodeId: null,

    init() {
        this.engine = new StoryEngine();
        this.ui = new NovelUI(this.engine);
        this.ui.setEndingCallback((ending) => this.showEnding(ending));

        ParticleSystem.init();
        this.renderMenu();
        this.bindEvents();
        this.showScreen("screen-menu");
    },

    bindEvents() {
        document.getElementById("btn-menu").addEventListener("click", () => {
            SoundManager.menuClick();
            this.showScreen("screen-menu");
            this.renderMenu();
        });
        document.getElementById("btn-replay").addEventListener("click", () => {
            SoundManager.menuClick();
            if (this.currentEpisodeId) {
                SaveManager.clearProgress(this.currentEpisodeId);
                this.startEpisode(this.currentEpisodeId);
            }
        });
        document.getElementById("btn-back-menu").addEventListener("click", () => {
            SoundManager.menuClick();
            this.showScreen("screen-menu");
            this.renderMenu();
        });
        document.getElementById("btn-sound-toggle").addEventListener("click", () => {
            SoundManager.init();
            SoundManager.toggle();
            if (SoundManager.enabled) SoundManager.tap();
        });

        document.addEventListener('touchstart', () => {
            SoundManager.init();
            SoundManager.resume();
        }, { once: true });
        document.addEventListener('click', () => {
            SoundManager.init();
            SoundManager.resume();
        }, { once: true });
    },

    renderMenu() {
        const grid = document.getElementById("episode-grid");
        grid.innerHTML = "";

        EPISODES.forEach((ep) => {
            const card = document.createElement("div");
            card.className = "episode-card";
            const completed = SaveManager.isCompleted(ep.id);
            const hasSave = SaveManager.hasSave(ep.id);

            if (completed) card.classList.add("completed");

            let statusHtml = "";
            if (hasSave) {
                statusHtml = `<div class="episode-status continue">\u{25B6}\u{FE0F} Continua aventura</div>`;
            } else if (completed) {
                statusHtml = `<div class="episode-status completed">\u{2705} Terminat - joaca din nou?</div>`;
            }

            const icon = EPISODE_ICONS[ep.id] || "\u{1F4D6}";

            card.innerHTML = `
                <span class="episode-icon">${icon}</span>
                <div class="episode-number">Episodul ${ep.number}</div>
                <div class="episode-title">${ep.title}</div>
                <div class="episode-desc">${ep.description}</div>
                ${statusHtml}
            `;

            card.addEventListener("click", () => {
                SoundManager.init();
                SoundManager.resume();
                SoundManager.menuClick();
                this.startEpisode(ep.id);
            });
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
            SoundManager.episodeStart();
            setTimeout(() => this.ui.renderScene(), 300);
        } catch (err) {
            console.error("Eroare la incarcarea episodului:", err);
        }
    },

    showEnding(ending) {
        const scene = this.engine.getCurrentScene();
        const endingId = scene ? scene.ending : "unknown";
        SaveManager.markCompleted(this.currentEpisodeId, endingId);

        document.getElementById("ending-badge").textContent = "\u{1F3C6}";
        document.getElementById("ending-title").textContent = ending.title;
        document.getElementById("ending-description").textContent = ending.description;

        const choices = this.engine.choiceHistory.length;
        const statsEl = document.getElementById("ending-stats");
        statsEl.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${choices}</div>
                <div class="stat-label">Alegeri facute</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">\u{2B50}</div>
                <div class="stat-label">Final deblocat</div>
            </div>
        `;

        this.showScreen("screen-ending");
        SoundManager.ending();
        ParticleSystem.confetti();
    },

    showScreen(screenId) {
        document.querySelectorAll(".screen").forEach(s => {
            s.classList.remove("active");
        });
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add("active");
            target.classList.add("screen-enter");
            setTimeout(() => target.classList.remove("screen-enter"), 500);
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    App.init();
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
});
