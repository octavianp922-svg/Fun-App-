const SoundManager = {
    ctx: null,
    enabled: true,
    initialized: false,

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) { this.enabled = false; }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    toggle() {
        this.enabled = !this.enabled;
        document.querySelector('.sound-on').style.display = this.enabled ? '' : 'none';
        document.querySelector('.sound-off').style.display = this.enabled ? 'none' : '';
        return this.enabled;
    },

    _play(freq, type, duration, volume, delay) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
        osc.start(this.ctx.currentTime + delay);
        osc.stop(this.ctx.currentTime + delay + duration);
    },

    typewriterTick() {
        if (!this.enabled || !this.ctx) return;
        const freq = 800 + Math.random() * 400;
        this._play(freq, 'sine', 0.03, 0.04, 0);
    },

    tap() {
        this._play(520, 'sine', 0.08, 0.12, 0);
        this._play(780, 'sine', 0.08, 0.08, 0.04);
    },

    choiceSelect() {
        this._play(440, 'triangle', 0.1, 0.15, 0);
        this._play(660, 'triangle', 0.1, 0.12, 0.06);
        this._play(880, 'triangle', 0.15, 0.1, 0.12);
    },

    sceneTransition() {
        this._play(330, 'sine', 0.3, 0.08, 0);
        this._play(440, 'sine', 0.3, 0.06, 0.1);
        this._play(550, 'sine', 0.4, 0.05, 0.2);
    },

    episodeStart() {
        const notes = [262, 330, 392, 523];
        notes.forEach((n, i) => {
            this._play(n, 'triangle', 0.3, 0.12, i * 0.12);
        });
    },

    ending() {
        const melody = [523, 659, 784, 1047, 784, 1047];
        melody.forEach((n, i) => {
            this._play(n, 'sine', 0.25, 0.1, i * 0.15);
        });
        setTimeout(() => {
            this._play(523, 'triangle', 0.8, 0.06, 0);
            this._play(659, 'triangle', 0.8, 0.05, 0);
            this._play(784, 'triangle', 0.8, 0.04, 0);
        }, 1000);
    },

    hover() {
        this._play(600, 'sine', 0.05, 0.03, 0);
    },

    menuClick() {
        this._play(440, 'square', 0.06, 0.08, 0);
        this._play(660, 'square', 0.08, 0.06, 0.05);
    }
};
