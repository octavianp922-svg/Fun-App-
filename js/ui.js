class NovelUI {
    constructor(engine) {
        this.engine = engine;
        this.typewriterTimer = null;
        this.typewriterDone = false;
        this.fullText = "";
        this.currentBg = null;
        this.charTickCounter = 0;
        this.activeSvgs = [];

        this.bgLayer = document.getElementById("bg-layer");
        this.bgLayerNext = document.getElementById("bg-layer-next");
        this.bgParticles = document.getElementById("bg-particles");
        this.sceneEnv = document.getElementById("scene-environment");
        this.charLeft = document.getElementById("character-left");
        this.charRight = document.getElementById("character-right");
        this.speakerName = document.getElementById("speaker-name");
        this.dialogueText = document.getElementById("dialogue-text");
        this.tapIndicator = document.getElementById("tap-indicator");
        this.choicesContainer = document.getElementById("choices-container");

        SceneRenderer.init(this.sceneEnv);
        this.dialogueText.addEventListener("click", () => this.onDialogueTap());
    }

    renderScene() {
        const scene = this.engine.getCurrentScene();
        if (!scene) return;

        if (this.engine.isAtEnding()) {
            const ending = this.engine.getEnding();
            if (ending) {
                this.onEnding(ending);
                return;
            }
        }

        SoundManager.sceneTransition();
        this.setBackground(scene.background);
        this.setCharacters(scene.characters || [], scene.speaker);
        this.setSpeaker(scene.speaker);
        this.startTypewriter(scene.dialogue);
        this.choicesContainer.classList.add("hidden");
        this.choicesContainer.innerHTML = "";
        this.tapIndicator.classList.remove("hidden");
        this.spawnBgParticles();
    }

    setBackground(bgKey) {
        if (!bgKey) return;
        const gradient = BACKGROUNDS[bgKey] || BACKGROUNDS.livingroom;
        if (bgKey !== this.currentBg) {
            this.bgLayerNext.style.background = gradient;
            this.bgLayerNext.style.opacity = "1";
            setTimeout(() => {
                this.bgLayer.style.background = gradient;
                this.bgLayerNext.style.opacity = "0";
            }, 800);
            SceneRenderer.render(bgKey);
        }
        this.currentBg = bgKey;
    }

    spawnBgParticles() {
        this.bgParticles.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const p = document.createElement('div');
            p.className = 'bg-particle';
            const size = 3 + Math.random() * 8;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (10 + Math.random() * 15) + 's';
            p.style.animationDelay = Math.random() * 5 + 's';
            this.bgParticles.appendChild(p);
        }
    }

    setCharacters(charIds, speakerId) {
        // Stop old avatar animations
        this.activeSvgs.forEach(svg => Avatars.stopAnimations(svg));
        this.activeSvgs = [];

        const slots = [this.charLeft, this.charRight];
        slots.forEach((slot, i) => {
            slot.classList.remove('active-speaker', 'speaking');
            if (charIds[i]) {
                const char = CHARACTERS[charIds[i]];
                if (char) {
                    const avatarHtml = Avatars.create(charIds[i], 110);
                    slot.innerHTML = `
                        <div class="avatar-container">${avatarHtml}</div>
                        <span class="char-name">${char.name}</span>
                    `;
                    slot.classList.add("visible");

                    const svg = slot.querySelector('.avatar-svg');
                    if (svg) {
                        Avatars.startAnimations(svg);
                        this.activeSvgs.push(svg);
                        if (charIds[i] === speakerId) {
                            slot.classList.add('active-speaker');
                            slot.style.setProperty('--speaker-color', char.color);
                            slot.style.setProperty('--speaker-glow', char.color + '40');
                            setTimeout(() => slot.classList.add('speaking'), 50);
                            Avatars.setSpeaking(svg, true);
                        } else {
                            Avatars.setSpeaking(svg, false);
                        }
                    }
                } else {
                    slot.classList.remove("visible");
                }
            } else {
                slot.classList.remove("visible");
            }
        });
    }

    setSpeaker(speakerId) {
        if (!speakerId) {
            this.speakerName.style.display = "none";
            return;
        }
        const char = CHARACTERS[speakerId];
        if (!char) {
            this.speakerName.style.display = "none";
            return;
        }
        this.speakerName.style.display = "inline-block";
        this.speakerName.textContent = char.name;
        this.speakerName.style.background = `linear-gradient(135deg, ${char.color}, ${char.color}cc)`;
        this.speakerName.style.animation = 'none';
        this.speakerName.offsetHeight;
        this.speakerName.style.animation = 'speakerAppear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }

    startTypewriter(text) {
        this.fullText = text;
        this.typewriterDone = false;
        this.dialogueText.textContent = "";
        this.charTickCounter = 0;
        clearInterval(this.typewriterTimer);

        // Stop speaking animation on all avatars initially, then start on speaker
        this.activeSvgs.forEach(svg => Avatars.setSpeaking(svg, false));
        const scene = this.engine.getCurrentScene();
        if (scene && scene.speaker) {
            const chars = scene.characters || [];
            const speakerIdx = chars.indexOf(scene.speaker);
            if (speakerIdx >= 0 && speakerIdx < 2) {
                const svg = this.activeSvgs[speakerIdx];
                if (svg) Avatars.setSpeaking(svg, true);
            }
        }

        let i = 0;
        this.typewriterTimer = setInterval(() => {
            if (i < text.length) {
                this.dialogueText.textContent += text[i];
                this.charTickCounter++;
                if (this.charTickCounter % 3 === 0) {
                    SoundManager.typewriterTick();
                }
                i++;
            } else {
                clearInterval(this.typewriterTimer);
                this.typewriterDone = true;
                // Stop speaking when done
                this.activeSvgs.forEach(svg => Avatars.setSpeaking(svg, false));
                this.onTypewriterComplete();
            }
        }, 22);
    }

    skipTypewriter() {
        clearInterval(this.typewriterTimer);
        this.dialogueText.textContent = this.fullText;
        this.typewriterDone = true;
        this.activeSvgs.forEach(svg => Avatars.setSpeaking(svg, false));
        SoundManager.tap();
        this.onTypewriterComplete();
    }

    onTypewriterComplete() {
        if (this.engine.hasChoices()) {
            this.showChoices();
            this.tapIndicator.classList.add("hidden");
        } else {
            this.tapIndicator.classList.remove("hidden");
        }
    }

    onDialogueTap() {
        if (!this.typewriterDone) {
            this.skipTypewriter();
            return;
        }
        if (this.engine.hasChoices()) return;
        SoundManager.tap();
        if (this.engine.advanceScene()) {
            this.renderScene();
            SaveManager.saveProgress(this.engine);
        }
    }

    showChoices() {
        const scene = this.engine.getCurrentScene();
        if (!scene || !scene.choices) return;

        this.choicesContainer.innerHTML = "";
        this.choicesContainer.classList.remove("hidden");

        scene.choices.forEach((choice, index) => {
            const btn = document.createElement("button");
            btn.className = "choice-btn choice-appear";
            btn.textContent = choice.text;
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.onChoiceSelected(index);
            });
            this.choicesContainer.appendChild(btn);
        });
    }

    onChoiceSelected(index) {
        SoundManager.choiceSelect();
        if (this.engine.makeChoice(index)) {
            this.renderScene();
            SaveManager.saveProgress(this.engine);
        }
    }

    onEnding(ending) {
        if (typeof this._endingCallback === "function") {
            this._endingCallback(ending);
        }
    }

    setEndingCallback(fn) {
        this._endingCallback = fn;
    }

    reset() {
        clearInterval(this.typewriterTimer);
        this.activeSvgs.forEach(svg => {
            Avatars.stopAnimations(svg);
            Avatars.setSpeaking(svg, false);
        });
        this.activeSvgs = [];
        SceneRenderer.cleanup();
        this.currentBg = null;
        this.dialogueText.textContent = "";
        this.choicesContainer.innerHTML = "";
        this.choicesContainer.classList.add("hidden");
        this.charLeft.classList.remove("visible", "active-speaker", "speaking");
        this.charRight.classList.remove("visible", "active-speaker", "speaking");
        this.bgLayer.style.background = "";
        this.bgLayerNext.style.opacity = "0";
        if (this.bgParticles) this.bgParticles.innerHTML = '';
    }
}
