class NovelUI {
    constructor(engine) {
        this.engine = engine;
        this.typewriterTimer = null;
        this.typewriterDone = false;
        this.fullText = "";
        this.currentBg = null;

        this.bgLayer = document.getElementById("bg-layer");
        this.bgLayerNext = document.getElementById("bg-layer-next");
        this.charLeft = document.getElementById("character-left");
        this.charRight = document.getElementById("character-right");
        this.speakerName = document.getElementById("speaker-name");
        this.dialogueText = document.getElementById("dialogue-text");
        this.tapIndicator = document.getElementById("tap-indicator");
        this.choicesContainer = document.getElementById("choices-container");

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

        this.setBackground(scene.background);
        this.setCharacters(scene.characters || []);
        this.setSpeaker(scene.speaker);
        this.startTypewriter(scene.dialogue);
        this.choicesContainer.classList.add("hidden");
        this.choicesContainer.innerHTML = "";
        this.tapIndicator.classList.remove("hidden");
    }

    setBackground(bgKey) {
        if (!bgKey || bgKey === this.currentBg) return;
        const gradient = BACKGROUNDS[bgKey] || BACKGROUNDS.livingroom;
        this.bgLayerNext.style.background = gradient;
        this.bgLayerNext.style.opacity = "1";
        setTimeout(() => {
            this.bgLayer.style.background = gradient;
            this.bgLayerNext.style.opacity = "0";
        }, 600);
        this.currentBg = bgKey;
    }

    setCharacters(charIds) {
        const slots = [this.charLeft, this.charRight];
        slots.forEach((slot, i) => {
            if (charIds[i]) {
                const char = CHARACTERS[charIds[i]];
                if (char) {
                    slot.innerHTML = `
                        <div class="avatar" style="border-color: ${char.color}">${char.emoji}</div>
                        <span class="char-name">${char.name}</span>
                    `;
                    slot.classList.add("visible");
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
        this.speakerName.style.background = char.color;
    }

    startTypewriter(text) {
        this.fullText = text;
        this.typewriterDone = false;
        this.dialogueText.textContent = "";
        clearInterval(this.typewriterTimer);

        let i = 0;
        this.typewriterTimer = setInterval(() => {
            if (i < text.length) {
                this.dialogueText.textContent += text[i];
                i++;
            } else {
                clearInterval(this.typewriterTimer);
                this.typewriterDone = true;
                this.onTypewriterComplete();
            }
        }, 25);
    }

    skipTypewriter() {
        clearInterval(this.typewriterTimer);
        this.dialogueText.textContent = this.fullText;
        this.typewriterDone = true;
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
        this.currentBg = null;
        this.dialogueText.textContent = "";
        this.choicesContainer.innerHTML = "";
        this.choicesContainer.classList.add("hidden");
        this.charLeft.classList.remove("visible");
        this.charRight.classList.remove("visible");
        this.bgLayer.style.background = "";
        this.bgLayerNext.style.opacity = "0";
    }
}
