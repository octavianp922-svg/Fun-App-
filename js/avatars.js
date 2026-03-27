const Avatars = {
    create(charId, size) {
        size = size || 120;
        const data = this.charData[charId];
        if (!data) return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#333;display:flex;align-items:center;justify-content:center;font-size:${size*0.5}px">?</div>`;
        const id = `av_${charId}_${Date.now()}`;
        return `<svg viewBox="0 0 200 280" width="${size}" height="${size * 1.4}" class="avatar-svg" id="${id}">
            <defs>
                <radialGradient id="${id}_skin" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stop-color="${data.skinLight}"/>
                    <stop offset="100%" stop-color="${data.skin}"/>
                </radialGradient>
                <linearGradient id="${id}_hair" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${data.hairColor}"/>
                    <stop offset="100%" stop-color="${data.hairDark}"/>
                </linearGradient>
                <linearGradient id="${id}_clothes" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${data.clothesColor}"/>
                    <stop offset="100%" stop-color="${data.clothesDark}"/>
                </linearGradient>
            </defs>
            <!-- Body -->
            <g class="av-body" transform="translate(0,0)">
                ${data.body(id)}
            </g>
            <!-- Head -->
            <g class="av-head" transform="translate(0,0)">
                <!-- Neck -->
                <rect x="88" y="105" width="24" height="20" rx="8" fill="url(#${id}_skin)"/>
                <!-- Head shape -->
                <ellipse cx="100" cy="80" rx="42" ry="48" fill="url(#${id}_skin)" class="av-head-shape"/>
                <!-- Hair -->
                ${data.hair(id)}
                <!-- Eyes -->
                <g class="av-eyes">
                    <g class="av-eye-left">
                        <ellipse cx="84" cy="78" rx="8" ry="9" fill="white"/>
                        <ellipse cx="85" cy="79" rx="4.5" ry="5" fill="${data.eyeColor}" class="av-pupil"/>
                        <ellipse cx="86" cy="77" rx="2" ry="2" fill="white" opacity="0.8"/>
                        <ellipse cx="84" cy="78" rx="8" ry="1" fill="${data.skin}" class="av-eyelid" opacity="0"/>
                    </g>
                    <g class="av-eye-right">
                        <ellipse cx="116" cy="78" rx="8" ry="9" fill="white"/>
                        <ellipse cx="117" cy="79" rx="4.5" ry="5" fill="${data.eyeColor}" class="av-pupil"/>
                        <ellipse cx="118" cy="77" rx="2" ry="2" fill="white" opacity="0.8"/>
                        <ellipse cx="116" cy="78" rx="8" ry="1" fill="${data.skin}" class="av-eyelid" opacity="0"/>
                    </g>
                </g>
                <!-- Eyebrows -->
                <line x1="76" y1="66" x2="92" y2="64" stroke="${data.hairDark}" stroke-width="2.5" stroke-linecap="round" class="av-brow-l"/>
                <line x1="108" y1="64" x2="124" y2="66" stroke="${data.hairDark}" stroke-width="2.5" stroke-linecap="round" class="av-brow-r"/>
                <!-- Nose -->
                <path d="M97 85 Q100 92 103 85" fill="none" stroke="${data.skinDark}" stroke-width="1.5" opacity="0.5"/>
                <!-- Mouth -->
                <g class="av-mouth">
                    ${data.mouth()}
                </g>
                <!-- Extras -->
                ${data.extras ? data.extras(id) : ''}
            </g>
        </svg>`;
    },

    charData: {
        cristina: {
            skin: '#F5C6A0', skinLight: '#FDDCBF', skinDark: '#D4A574',
            hairColor: '#C0392B', hairDark: '#922B21',
            eyeColor: '#5D4037', clothesColor: '#E91E63', clothesDark: '#AD1457',
            hair(id) {
                return `<ellipse cx="100" cy="58" rx="48" ry="32" fill="url(#${id}_hair)"/>
                    <path d="M52 70 Q50 100 58 120" fill="url(#${id}_hair)" class="av-hair-strand"/>
                    <path d="M148 70 Q150 100 142 120" fill="url(#${id}_hair)" class="av-hair-strand"/>
                    <path d="M60 55 Q80 30 100 32 Q120 30 140 55" fill="url(#${id}_hair)"/>`;
            },
            mouth() { return `<path d="M90 98 Q100 105 110 98" fill="none" stroke="#C0392B" stroke-width="2" stroke-linecap="round" class="av-mouth-line"/>`; },
            body(id) {
                return `<path d="M60 125 Q60 160 65 200 L135 200 Q140 160 140 125 Q120 115 100 115 Q80 115 60 125Z" fill="url(#${id}_clothes)"/>
                    <path d="M65 130 L100 145 L135 130" fill="none" stroke="#fff" stroke-width="1.5" opacity="0.3"/>`;
            }
        },
        victor: {
            skin: '#F5C6A0', skinLight: '#FDDCBF', skinDark: '#D4A574',
            hairColor: '#5D4037', hairDark: '#3E2723',
            eyeColor: '#1565C0', clothesColor: '#2196F3', clothesDark: '#1565C0',
            hair(id) {
                return `<ellipse cx="100" cy="52" rx="44" ry="26" fill="url(#${id}_hair)"/>
                    <path d="M70 42 Q85 25 105 30 Q120 25 135 42" fill="url(#${id}_hair)"/>
                    <path d="M105 32 Q108 22 115 28" fill="url(#${id}_hair)" class="av-hair-tuft"/>`;
            },
            mouth() { return `<path d="M88 97 Q100 108 112 97" fill="none" stroke="#E57373" stroke-width="2.5" stroke-linecap="round" class="av-mouth-line"/>`; },
            body(id) {
                return `<path d="M65 125 Q65 160 68 200 L132 200 Q135 160 135 125 Q120 115 100 115 Q80 115 65 125Z" fill="url(#${id}_clothes)"/>
                    <circle cx="100" cy="140" r="8" fill="#FDD835" opacity="0.9"/>`;
            }
        },
        veroana: {
            skin: '#E8B896', skinLight: '#F5D0B0', skinDark: '#C49A6C',
            hairColor: '#BDBDBD', hairDark: '#9E9E9E',
            eyeColor: '#795548', clothesColor: '#9C27B0', clothesDark: '#6A1B9A',
            hair(id) {
                return `<ellipse cx="100" cy="55" rx="50" ry="30" fill="url(#${id}_hair)"/>
                    <path d="M55 60 Q50 85 55 105" fill="url(#${id}_hair)" class="av-hair-strand"/>
                    <path d="M145 60 Q150 85 145 105" fill="url(#${id}_hair)" class="av-hair-strand"/>
                    <circle cx="100" cy="38" r="10" fill="url(#${id}_hair)" opacity="0.6"/>`;
            },
            mouth() { return `<path d="M88 98 Q100 103 112 98" fill="none" stroke="#A1887F" stroke-width="2" stroke-linecap="round" class="av-mouth-line"/>`; },
            body(id) {
                return `<path d="M55 125 Q55 165 60 200 L140 200 Q145 165 145 125 Q125 112 100 112 Q75 112 55 125Z" fill="url(#${id}_clothes)"/>
                    <path d="M55 130 Q100 155 145 130" fill="none" stroke="#CE93D8" stroke-width="2" opacity="0.5"/>`;
            },
            extras(id) {
                return `<circle cx="84" cy="82" r="12" fill="none" stroke="#E0E0E0" stroke-width="1.5" opacity="0.4"/>
                    <circle cx="116" cy="82" r="12" fill="none" stroke="#E0E0E0" stroke-width="1.5" opacity="0.4"/>`;
            }
        },
        arya: {
            skin: '#F5C6A0', skinLight: '#FDDCBF', skinDark: '#D4A574',
            hairColor: '#4E342E', hairDark: '#3E2723',
            eyeColor: '#FF8F00', clothesColor: '#FF9800', clothesDark: '#E65100',
            hair(id) {
                return `<ellipse cx="100" cy="54" rx="46" ry="28" fill="url(#${id}_hair)"/>
                    <path d="M62 60 Q55 90 60 110" fill="url(#${id}_hair)" class="av-hair-strand"/>
                    <path d="M138 60 Q145 90 140 110" fill="url(#${id}_hair)" class="av-hair-strand"/>
                    <circle cx="62" cy="65" r="6" fill="#FF9800"/>
                    <circle cx="138" cy="65" r="6" fill="#FF9800"/>`;
            },
            mouth() { return `<ellipse cx="100" cy="100" rx="6" ry="4" fill="#E57373" class="av-mouth-open"/>`; },
            body(id) {
                return `<path d="M68 125 Q68 158 70 200 L130 200 Q132 158 132 125 Q118 116 100 116 Q82 116 68 125Z" fill="url(#${id}_clothes)"/>
                    <path d="M85 135 L100 150 L115 135" fill="#FFF176" opacity="0.6"/>`;
            }
        },
        ana: {
            skin: '#F5C6A0', skinLight: '#FDDCBF', skinDark: '#D4A574',
            hairColor: '#5D4037', hairDark: '#3E2723',
            eyeColor: '#2E7D32', clothesColor: '#4CAF50', clothesDark: '#2E7D32',
            hair(id) {
                return `<ellipse cx="100" cy="55" rx="48" ry="30" fill="url(#${id}_hair)"/>
                    <path d="M56 65 Q52 95 58 115" fill="url(#${id}_hair)" class="av-hair-strand"/>
                    <path d="M144 65 Q148 95 142 115" fill="url(#${id}_hair)" class="av-hair-strand"/>
                    <path d="M65 50 Q82 35 100 38 Q118 35 135 50" fill="url(#${id}_hair)"/>`;
            },
            mouth() { return `<path d="M90 98 Q100 103 110 98" fill="none" stroke="#E57373" stroke-width="2" stroke-linecap="round" class="av-mouth-line"/>`; },
            body(id) {
                return `<path d="M60 125 Q60 160 65 200 L135 200 Q140 160 140 125 Q120 115 100 115 Q80 115 60 125Z" fill="url(#${id}_clothes)"/>`;
            }
        },
        octavian: {
            skin: '#E8B896', skinLight: '#F5D0B0', skinDark: '#C49A6C',
            hairColor: '#4E342E', hairDark: '#3E2723',
            eyeColor: '#795548', clothesColor: '#795548', clothesDark: '#4E342E',
            hair(id) {
                return `<ellipse cx="100" cy="50" rx="44" ry="24" fill="url(#${id}_hair)"/>
                    <path d="M65 45 Q82 30 100 33 Q118 30 135 45" fill="url(#${id}_hair)"/>`;
            },
            mouth() { return `<path d="M88 97 Q100 105 112 97" fill="none" stroke="#A1887F" stroke-width="2.5" stroke-linecap="round" class="av-mouth-line"/>`; },
            body(id) {
                return `<path d="M58 125 Q58 162 62 200 L138 200 Q142 162 142 125 Q122 113 100 113 Q78 113 58 125Z" fill="url(#${id}_clothes)"/>
                    <line x1="100" y1="125" x2="100" y2="175" stroke="#5D4037" stroke-width="2" opacity="0.3"/>`;
            },
            extras() {
                return `<rect x="88" y="95" rx="2" width="24" height="4" fill="none" stroke="#795548" stroke-width="1" opacity="0.3"/>`;
            }
        },
        narrator: {
            skin: '#90A4AE', skinLight: '#B0BEC5', skinDark: '#607D8B',
            hairColor: '#546E7A', hairDark: '#37474F',
            eyeColor: '#263238', clothesColor: '#78909C', clothesDark: '#546E7A',
            hair(id) {
                return `<ellipse cx="100" cy="52" rx="45" ry="28" fill="url(#${id}_hair)"/>`;
            },
            mouth() { return `<path d="M92 98 L108 98" stroke="#78909C" stroke-width="2" stroke-linecap="round" class="av-mouth-line"/>`; },
            body(id) {
                return `<path d="M62 125 Q62 160 65 200 L135 200 Q138 160 138 125 Q120 115 100 115 Q80 115 62 125Z" fill="url(#${id}_clothes)"/>`;
            }
        }
    },

    startAnimations(svgEl) {
        if (!svgEl) return;
        this._blinkLoop(svgEl);
        this._idleLoop(svgEl);
    },

    _blinkLoop(svg) {
        const eyelids = svg.querySelectorAll('.av-eyelid');
        const blink = () => {
            eyelids.forEach(lid => {
                lid.setAttribute('opacity', '1');
                lid.setAttribute('ry', '9');
            });
            setTimeout(() => {
                eyelids.forEach(lid => {
                    lid.setAttribute('opacity', '0');
                    lid.setAttribute('ry', '1');
                });
            }, 150);
        };
        const schedule = () => {
            const delay = 2000 + Math.random() * 4000;
            svg._blinkTimer = setTimeout(() => {
                blink();
                schedule();
            }, delay);
        };
        schedule();
    },

    _idleLoop(svg) {
        const head = svg.querySelector('.av-head');
        const body = svg.querySelector('.av-body');
        if (!head || !body) return;
        let t = 0;
        const animate = () => {
            t += 0.02;
            const sway = Math.sin(t) * 1.5;
            const breathe = Math.sin(t * 1.5) * 0.8;
            head.setAttribute('transform', `translate(${sway}, ${breathe})`);
            body.setAttribute('transform', `translate(${sway * 0.5}, 0)`);
            svg._idleTimer = requestAnimationFrame(animate);
        };
        animate();
    },

    stopAnimations(svgEl) {
        if (!svgEl) return;
        if (svgEl._blinkTimer) clearTimeout(svgEl._blinkTimer);
        if (svgEl._idleTimer) cancelAnimationFrame(svgEl._idleTimer);
    },

    setSpeaking(svgEl, speaking) {
        if (!svgEl) return;
        const mouth = svgEl.querySelector('.av-mouth');
        if (!mouth) return;
        if (speaking) {
            if (svgEl._speakTimer) return;
            const toggle = () => {
                const mouthLine = mouth.querySelector('.av-mouth-line');
                const mouthOpen = mouth.querySelector('.av-mouth-open');
                if (mouthLine) {
                    const open = mouthLine.getAttribute('data-open') === '1';
                    if (open) {
                        mouthLine.setAttribute('d', mouthLine.getAttribute('data-orig'));
                        mouthLine.setAttribute('data-open', '0');
                    } else {
                        if (!mouthLine.getAttribute('data-orig')) {
                            mouthLine.setAttribute('data-orig', mouthLine.getAttribute('d'));
                        }
                        mouthLine.setAttribute('d', 'M88 96 Q100 110 112 96');
                        mouthLine.setAttribute('data-open', '1');
                    }
                }
                if (mouthOpen) {
                    const ry = mouthOpen.getAttribute('ry') === '4' ? '7' : '4';
                    mouthOpen.setAttribute('ry', ry);
                }
                svgEl._speakTimer = setTimeout(toggle, 120 + Math.random() * 80);
            };
            toggle();
        } else {
            if (svgEl._speakTimer) {
                clearTimeout(svgEl._speakTimer);
                svgEl._speakTimer = null;
            }
            const mouthLine = mouth.querySelector('.av-mouth-line');
            if (mouthLine && mouthLine.getAttribute('data-orig')) {
                mouthLine.setAttribute('d', mouthLine.getAttribute('data-orig'));
            }
            const mouthOpen = mouth.querySelector('.av-mouth-open');
            if (mouthOpen) mouthOpen.setAttribute('ry', '4');
        }
    }
};
