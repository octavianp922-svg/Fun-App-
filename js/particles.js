const ParticleSystem = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,
    running: false,

    init() {
        this.canvas = document.getElementById('particles-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.createParticles(40);
        this.start();
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createParticles(count) {
        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.3 - 0.2,
                opacity: Math.random() * 0.4 + 0.1,
                hue: Math.random() * 60 + 320
            });
        }
    },

    start() {
        if (this.running) return;
        this.running = true;
        this.animate();
    },

    stop() {
        this.running = false;
        if (this.animId) cancelAnimationFrame(this.animId);
    },

    animate() {
        if (!this.running) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`;
            this.ctx.fill();
        });

        this.animId = requestAnimationFrame(() => this.animate());
    },

    burst(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 3;
            const particle = {
                x, y,
                size: Math.random() * 4 + 2,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                opacity: 1,
                hue: color || Math.random() * 360,
                life: 1,
                decay: 0.02 + Math.random() * 0.02
            };
            this.particles.push(particle);
        }
    },

    confetti(container) {
        const el = container || document.getElementById('ending-confetti');
        if (!el) return;
        el.innerHTML = '';
        const colors = ['#e94560', '#f4d03f', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0'];
        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.cssText = `
                left: ${Math.random() * 100}%;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                animation-delay: ${Math.random() * 2}s;
                animation-duration: ${2 + Math.random() * 3}s;
            `;
            el.appendChild(piece);
        }
    }
};
