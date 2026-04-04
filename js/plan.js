// ===== VitaLife v2 - Weekly Plan Manager =====

class PlanManager {
    constructor() {
        this.currentPlan = null;
    }

    async load() {
        const saved = await storage.get(STORES.SETTINGS, 'weeklyPlan');
        if (saved?.plan) {
            this.currentPlan = saved.plan;
            this.render();
        }
        return this.currentPlan;
    }

    async save(plan) {
        this.currentPlan = plan;
        await storage.put(STORES.SETTINGS, {
            id: 'weeklyPlan',
            plan,
            generatedAt: new Date().toISOString()
        });
        this.render();
    }

    render() {
        if (!this.currentPlan) {
            document.getElementById('plan-empty').classList.remove('hidden');
            document.getElementById('plan-content').classList.add('hidden');
            return;
        }

        const plan = this.currentPlan;
        document.getElementById('plan-empty').classList.add('hidden');
        document.getElementById('plan-content').classList.remove('hidden');

        // Date
        const saved = document.getElementById('plan-date');
        saved.textContent = `Generat: ${new Date().toLocaleDateString('ro-RO')}`;

        // Days
        const container = document.getElementById('plan-days');
        container.innerHTML = '';

        if (!plan.days) {
            container.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">Planul nu conține zile detaliate.</p>';
            return;
        }

        const dayOrder = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
        const dayKeys = Object.keys(plan.days);

        // Sort by day order if possible
        dayKeys.sort((a, b) => {
            const ia = dayOrder.findIndex(d => a.toLowerCase().includes(d.toLowerCase()));
            const ib = dayOrder.findIndex(d => b.toLowerCase().includes(d.toLowerCase()));
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

        // General info card
        if (plan.general) {
            const generalCard = document.createElement('div');
            generalCard.className = 'plan-day';
            let generalHtml = `
                <div class="plan-day-header" onclick="this.classList.toggle('collapsed'); this.nextElementSibling.classList.toggle('collapsed');">
                    <span>📌 Reguli Generale</span>
                    <span class="toggle">▼</span>
                </div>
                <div class="plan-day-body">
            `;

            if (plan.summary) {
                generalHtml += `<div class="plan-section">
                    <div class="plan-item">${plan.summary}</div>
                </div>`;
            }
            if (plan.general.water) {
                generalHtml += `<div class="plan-item"><span class="time">💧</span> Apă: ${plan.general.water}</div>`;
            }
            if (plan.general.sleep) {
                generalHtml += `<div class="plan-item"><span class="time">😴</span> Somn: ${plan.general.sleep}</div>`;
            }
            if (plan.general.supplements && plan.general.supplements.length > 0) {
                generalHtml += `<div class="plan-item"><span class="time">💊</span> Suplimente: ${plan.general.supplements.join(', ')}</div>`;
            }

            generalHtml += '</div>';
            generalCard.innerHTML = generalHtml;
            container.appendChild(generalCard);
        }

        // Each day
        for (const dayName of dayKeys) {
            const day = plan.days[dayName];
            const dayEl = document.createElement('div');
            dayEl.className = 'plan-day';

            let html = `
                <div class="plan-day-header" onclick="this.classList.toggle('collapsed'); this.nextElementSibling.classList.toggle('collapsed');">
                    <span>📅 ${dayName}</span>
                    <span class="toggle">▼</span>
                </div>
                <div class="plan-day-body">
            `;

            // Wake/Sleep
            if (day.wake || day.sleep) {
                html += `<div class="plan-section">
                    <div class="plan-section-title">⏰ Program</div>`;
                if (day.wake) html += `<div class="plan-item"><span class="time">${day.wake}</span> Trezire</div>`;
                if (day.sleep) html += `<div class="plan-item"><span class="time">${day.sleep}</span> Culcare</div>`;
                html += '</div>';
            }

            // Meals
            if (day.meals) {
                html += '<div class="plan-section"><div class="plan-section-title">🍽️ Mese</div>';
                const mealOrder = ['mic_dejun', 'gustare_1', 'pranz', 'gustare_2', 'cina'];
                const mealLabels = {
                    mic_dejun: '🌅 Mic dejun',
                    gustare_1: '🍎 Gustare',
                    pranz: '☀️ Prânz',
                    gustare_2: '🍎 Gustare',
                    cina: '🌙 Cină'
                };

                const mealKeys = Object.keys(day.meals);
                mealKeys.sort((a, b) => {
                    const ia = mealOrder.indexOf(a);
                    const ib = mealOrder.indexOf(b);
                    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                });

                for (const mealKey of mealKeys) {
                    const meal = day.meals[mealKey];
                    if (typeof meal === 'string') {
                        html += `<div class="plan-item"><span class="time">${mealLabels[mealKey] || mealKey}</span> ${meal}</div>`;
                    } else if (meal.desc) {
                        html += `<div class="plan-item"><span class="time">${meal.time || ''} ${mealLabels[mealKey] || mealKey}</span> ${meal.desc}</div>`;
                    }
                }
                html += '</div>';
            }

            // Exercise
            if (day.exercise) {
                html += '<div class="plan-section"><div class="plan-section-title">💪 Exerciții</div>';
                if (typeof day.exercise === 'string') {
                    html += `<div class="plan-item">${day.exercise}</div>`;
                } else {
                    html += `<div class="plan-item">
                        <span class="time">${day.exercise.time || ''}</span>
                        ${day.exercise.type || ''} — ${day.exercise.duration || ''}
                        <br><span style="color: var(--text-muted)">${day.exercise.desc || ''}</span>
                    </div>`;
                }
                html += '</div>';
            }

            // Water schedule
            if (day.water_schedule && Array.isArray(day.water_schedule)) {
                html += '<div class="plan-section"><div class="plan-section-title">💧 Program apă</div>';
                day.water_schedule.forEach(w => {
                    html += `<div class="plan-item">${w}</div>`;
                });
                html += '</div>';
            }

            // Notes
            if (day.notes) {
                html += `<div class="plan-section"><div class="plan-section-title">📝 Note</div>
                    <div class="plan-item">${day.notes}</div></div>`;
            }

            html += '</div>';
            dayEl.innerHTML = html;
            container.appendChild(dayEl);
        }
    }

    exportAsText() {
        if (!this.currentPlan) return '';
        return JSON.stringify(this.currentPlan, null, 2);
    }
}

const planManager = new PlanManager();
