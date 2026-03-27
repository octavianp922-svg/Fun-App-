const SceneRenderer = {
    current: null,
    container: null,
    animTimers: [],

    init(container) {
        this.container = container;
    },

    render(bgKey) {
        if (!this.container) return;
        this.cleanup();
        this.current = bgKey;
        const scene = this.scenes[bgKey];
        if (!scene) return;

        const el = document.createElement('div');
        el.className = 'scene-env';
        el.innerHTML = scene.svg;
        this.container.appendChild(el);

        if (scene.init) scene.init(el, this);
    },

    cleanup() {
        this.animTimers.forEach(t => {
            clearTimeout(t);
            clearInterval(t);
        });
        this.animTimers = [];
        if (this.container) {
            this.container.querySelectorAll('.scene-env').forEach(e => e.remove());
        }
    },

    addTimer(t) { this.animTimers.push(t); },

    spawnFloating(parent, className, count, minDur, maxDur) {
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = className;
            el.style.left = Math.random() * 100 + '%';
            el.style.animationDuration = (minDur + Math.random() * (maxDur - minDur)) + 's';
            el.style.animationDelay = Math.random() * maxDur + 's';
            el.style.opacity = 0.3 + Math.random() * 0.5;
            parent.appendChild(el);
        }
    },

    scenes: {
        airport: {
            svg: `<div class="scene-sky" style="background:linear-gradient(180deg,#4a90d9 0%,#87CEEB 60%,#c9e8f7 100%)"></div>
                <div class="scene-clouds"></div>
                <div class="scene-ground" style="background:linear-gradient(180deg,#8899aa 0%,#667788 100%);height:25%">
                    <div class="scene-runway"></div>
                </div>
                <div class="scene-building airport-building"></div>
                <div class="scene-plane"></div>`,
            init(el, r) { r.spawnFloating(el.querySelector('.scene-clouds'), 'cloud', 5, 20, 40); }
        },
        beach: {
            svg: `<div class="scene-sky" style="background:linear-gradient(180deg,#87CEEB 0%,#E0F7FA 50%,#FFF9C4 100%)"></div>
                <div class="scene-sun"></div>
                <div class="scene-clouds"></div>
                <div class="scene-water">
                    <div class="wave wave-1"></div>
                    <div class="wave wave-2"></div>
                    <div class="wave wave-3"></div>
                </div>
                <div class="scene-sand"></div>
                <div class="scene-palm"></div>`,
            init(el, r) {
                r.spawnFloating(el.querySelector('.scene-clouds'), 'cloud', 3, 25, 45);
                const sun = el.querySelector('.scene-sun');
                if (sun) { sun.innerHTML = '<div class="sun-rays"></div>'; }
            }
        },
        mountain: {
            svg: `<div class="scene-sky" style="background:linear-gradient(180deg,#1a3a4a 0%,#2c5364 40%,#6db3c5 100%)"></div>
                <div class="scene-clouds"></div>
                <div class="mountain-range">
                    <div class="mountain m1"></div>
                    <div class="mountain m2"></div>
                    <div class="mountain m3"></div>
                </div>
                <div class="scene-trees"></div>
                <div class="scene-ground" style="background:linear-gradient(180deg,#2d5a27 0%,#1a4314 100%);height:20%"></div>`,
            init(el, r) {
                r.spawnFloating(el.querySelector('.scene-clouds'), 'cloud', 4, 30, 50);
                const trees = el.querySelector('.scene-trees');
                for (let i = 0; i < 12; i++) {
                    const tree = document.createElement('div');
                    tree.className = 'pine-tree';
                    tree.style.left = (5 + Math.random() * 90) + '%';
                    tree.style.bottom = (15 + Math.random() * 10) + '%';
                    tree.style.transform = `scale(${0.5 + Math.random() * 0.8})`;
                    tree.style.animationDelay = Math.random() * 3 + 's';
                    trees.appendChild(tree);
                }
            }
        },
        kitchen: {
            svg: `<div class="scene-interior" style="background:linear-gradient(180deg,#FFF8E1 0%,#FFE0B2 100%)"></div>
                <div class="kitchen-wall"></div>
                <div class="kitchen-counter"></div>
                <div class="kitchen-steam"></div>`,
            init(el, r) {
                const steam = el.querySelector('.kitchen-steam');
                r.spawnFloating(steam, 'steam-puff', 8, 3, 6);
            }
        },
        livingroom: {
            svg: `<div class="scene-interior" style="background:linear-gradient(180deg,#E8D5B7 0%,#D4B896 100%)"></div>
                <div class="livingroom-wall"></div>
                <div class="livingroom-couch"></div>
                <div class="livingroom-lamp"></div>`,
            init(el, r) {
                const lamp = el.querySelector('.livingroom-lamp');
                if (lamp) lamp.innerHTML = '<div class="lamp-glow"></div>';
            }
        },
        car: {
            svg: `<div class="scene-sky" style="background:linear-gradient(180deg,#1a1a3e 0%,#2d2d6e 40%,#4a4a8a 100%)"></div>
                <div class="scene-stars"></div>
                <div class="scene-road">
                    <div class="road-line"></div>
                </div>
                <div class="car-dash"></div>`,
            init(el, r) {
                const stars = el.querySelector('.scene-stars');
                for (let i = 0; i < 30; i++) {
                    const star = document.createElement('div');
                    star.className = 'star';
                    star.style.left = Math.random() * 100 + '%';
                    star.style.top = Math.random() * 50 + '%';
                    star.style.animationDelay = Math.random() * 3 + 's';
                    stars.appendChild(star);
                }
            }
        },
        garden: {
            svg: `<div class="scene-sky" style="background:linear-gradient(180deg,#87CEEB 0%,#B2EBF2 100%)"></div>
                <div class="scene-clouds"></div>
                <div class="scene-sun"></div>
                <div class="scene-ground" style="background:linear-gradient(180deg,#4CAF50 0%,#388E3C 100%);height:35%"></div>
                <div class="garden-flowers"></div>`,
            init(el, r) {
                r.spawnFloating(el.querySelector('.scene-clouds'), 'cloud', 3, 25, 40);
                const flowers = el.querySelector('.garden-flowers');
                const cols = ['#E91E63','#FF9800','#FDD835','#E040FB','#FF5722'];
                for (let i = 0; i < 15; i++) {
                    const f = document.createElement('div');
                    f.className = 'flower';
                    f.style.left = (5 + Math.random() * 90) + '%';
                    f.style.bottom = (2 + Math.random() * 25) + '%';
                    f.style.setProperty('--flower-color', cols[Math.floor(Math.random()*cols.length)]);
                    f.style.animationDelay = Math.random() * 2 + 's';
                    f.style.transform = `scale(${0.6 + Math.random() * 0.6})`;
                    flowers.appendChild(f);
                }
            }
        },
        night: {
            svg: `<div class="scene-sky" style="background:linear-gradient(180deg,#0a0a1a 0%,#1a1a3e 40%,#2d2d5e 100%)"></div>
                <div class="scene-stars"></div>
                <div class="scene-moon"></div>
                <div class="scene-ground" style="background:linear-gradient(180deg,#1a2a1a 0%,#0d1a0d 100%);height:20%"></div>`,
            init(el, r) {
                const stars = el.querySelector('.scene-stars');
                for (let i = 0; i < 50; i++) {
                    const star = document.createElement('div');
                    star.className = 'star';
                    star.style.left = Math.random() * 100 + '%';
                    star.style.top = Math.random() * 60 + '%';
                    star.style.animationDelay = Math.random() * 4 + 's';
                    star.style.width = (1 + Math.random() * 3) + 'px';
                    star.style.height = star.style.width;
                    stars.appendChild(star);
                }
            }
        },
        village: {
            svg: `<div class="scene-sky" style="background:linear-gradient(180deg,#87CEEB 0%,#B3E5FC 60%,#E1F5FE 100%)"></div>
                <div class="scene-clouds"></div>
                <div class="scene-ground" style="background:linear-gradient(180deg,#7CB342 0%,#558B2F 100%);height:30%"></div>
                <div class="village-houses"></div>`,
            init(el, r) {
                r.spawnFloating(el.querySelector('.scene-clouds'), 'cloud', 4, 20, 35);
                const houses = el.querySelector('.village-houses');
                const roofColors = ['#D32F2F','#F57C00','#5D4037','#C62828'];
                for (let i = 0; i < 4; i++) {
                    const h = document.createElement('div');
                    h.className = 'village-house';
                    h.style.left = (10 + i * 22) + '%';
                    h.style.setProperty('--roof-color', roofColors[i]);
                    h.style.transform = `scale(${0.7 + Math.random() * 0.4})`;
                    houses.appendChild(h);
                }
            }
        },
        party: {
            svg: `<div class="scene-interior" style="background:linear-gradient(135deg,#4a148c 0%,#880e4f 50%,#e65100 100%)"></div>
                <div class="party-lights"></div>
                <div class="party-balloons"></div>
                <div class="party-confetti-bg"></div>`,
            init(el, r) {
                const lights = el.querySelector('.party-lights');
                const colors = ['#FF1744','#00E676','#2979FF','#FFEA00','#D500F9'];
                for (let i = 0; i < 12; i++) {
                    const l = document.createElement('div');
                    l.className = 'disco-light';
                    l.style.left = (i * 9) + '%';
                    l.style.background = colors[i % colors.length];
                    l.style.animationDelay = (i * 0.3) + 's';
                    lights.appendChild(l);
                }
                const balloons = el.querySelector('.party-balloons');
                for (let i = 0; i < 8; i++) {
                    const b = document.createElement('div');
                    b.className = 'balloon';
                    b.style.left = (5 + Math.random() * 85) + '%';
                    b.style.background = colors[Math.floor(Math.random()*colors.length)];
                    b.style.animationDelay = Math.random() * 3 + 's';
                    balloons.appendChild(b);
                }
            }
        },
        store: {
            svg: `<div class="scene-interior" style="background:linear-gradient(180deg,#ECEFF1 0%,#CFD8DC 100%)"></div>
                <div class="store-shelves"></div>`,
            init() {}
        },
        park: {
            svg: `<div class="scene-sky" style="background:linear-gradient(180deg,#4FC3F7 0%,#81D4FA 100%)"></div>
                <div class="scene-clouds"></div>
                <div class="scene-sun"></div>
                <div class="scene-ground" style="background:linear-gradient(180deg,#66BB6A 0%,#43A047 100%);height:35%"></div>
                <div class="scene-trees"></div>`,
            init(el, r) {
                r.spawnFloating(el.querySelector('.scene-clouds'), 'cloud', 3, 20, 35);
                const trees = el.querySelector('.scene-trees');
                for (let i = 0; i < 6; i++) {
                    const tree = document.createElement('div');
                    tree.className = 'round-tree';
                    tree.style.left = (8 + i * 16) + '%';
                    tree.style.animationDelay = Math.random() * 2 + 's';
                    trees.appendChild(tree);
                }
            }
        },
        christmas: {
            svg: `<div class="scene-interior" style="background:linear-gradient(180deg,#1B5E20 0%,#2E7D32 50%,#4CAF50 100%)"></div>
                <div class="snow-fall"></div>
                <div class="christmas-tree-bg"></div>
                <div class="christmas-lights"></div>`,
            init(el, r) {
                const snow = el.querySelector('.snow-fall');
                for (let i = 0; i < 40; i++) {
                    const flake = document.createElement('div');
                    flake.className = 'snowflake';
                    flake.style.left = Math.random() * 100 + '%';
                    flake.style.animationDuration = (3 + Math.random() * 5) + 's';
                    flake.style.animationDelay = Math.random() * 5 + 's';
                    flake.style.width = (3 + Math.random() * 6) + 'px';
                    flake.style.height = flake.style.width;
                    snow.appendChild(flake);
                }
            }
        }
    }
};
