// ===== VitaLife - Main App =====

class App {
    constructor() {
        this.currentPage = 'dashboard';
        this.goals = { water: 8, steps: 10000, sleep: 8, exercise: 30 };
    }

    async init() {
        try {
            await storage.init();
            await this.loadSettings();
            await profileManager.load();
            await habitsManager.loadDay(new Date());
            await documentsManager.load();

            this.bindEvents();
            this.updateDashboard();
            this.updateHabitsUI();
            documentsManager.renderList();

            // Hide splash
            setTimeout(() => {
                document.getElementById('splash').classList.add('fade-out');
                document.getElementById('app').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('splash').style.display = 'none';
                }, 500);
            }, 800);

        } catch (err) {
            console.error('Init error:', err);
            document.getElementById('splash').innerHTML = `
                <div class="splash-content">
                    <div class="splash-icon">⚠️</div>
                    <h1>Eroare</h1>
                    <p>Nu s-a putut inițializa aplicația. Reîncarcă pagina.</p>
                </div>
            `;
        }
    }

    async loadSettings() {
        const settings = await storage.get(STORES.SETTINGS, 'main');
        if (settings) {
            this.goals = {
                water: settings.goalWater || 8,
                steps: settings.goalSteps || 10000,
                sleep: settings.goalSleep || 8,
                exercise: settings.goalExercise || 30
            };
            if (settings.model) {
                document.getElementById('ai-model').value = settings.model;
            }
            document.getElementById('goal-water').value = this.goals.water;
            document.getElementById('goal-steps').value = this.goals.steps;
            document.getElementById('goal-sleep').value = this.goals.sleep;
            document.getElementById('goal-exercise').value = this.goals.exercise;
        }
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => this.navigate(btn.dataset.page));
        });

        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.navigate('settings');
        });

        // Profile form
        document.getElementById('profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = profileManager.getFormData();
            await profileManager.save(data);
            this.showToast('Profil salvat!', 'success');
            this.updateDashboard();
        });

        // Profile tags
        this.bindTagEvents('add-condition', 'condition-input', 'conditions', 'conditions-list');
        this.bindTagEvents('add-allergy', 'allergy-input', 'allergies', 'allergies-list');
        this.bindTagEvents('add-med', 'med-input', 'medications', 'meds-list');

        // Tag removal (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-remove')) {
                const type = e.target.dataset.type;
                const value = e.target.dataset.value;
                profileManager.removeTag(type, value);
                const listId = type === 'medications' ? 'meds-list' :
                              type === 'conditions' ? 'conditions-list' : 'allergies-list';
                profileManager.renderTags(listId, profileManager.profile[type], type);
            }
        });

        // Dashboard quick stats
        document.querySelectorAll('.stat-add').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                if (action === 'add-water') {
                    await habitsManager.addWater(1);
                    this.updateDashboard();
                    this.updateHabitsUI();
                } else if (action === 'add-steps') {
                    const steps = prompt('Câți pași?');
                    if (steps && !isNaN(steps)) {
                        await habitsManager.setSteps(parseInt(steps));
                        this.updateDashboard();
                        this.updateHabitsUI();
                    }
                } else if (action === 'add-sleep') {
                    const sleep = prompt('Câte ore ai dormit?');
                    if (sleep && !isNaN(sleep)) {
                        await habitsManager.setSleep(parseFloat(sleep));
                        this.updateDashboard();
                        this.updateHabitsUI();
                    }
                } else if (action === 'add-mood') {
                    this.navigate('habits');
                }
            });
        });

        // Habits controls
        document.querySelectorAll('.habit-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const habit = btn.dataset.habit;
                const action = btn.dataset.action;
                if (habit === 'water') {
                    await habitsManager.addWater(action === 'add' ? 1 : -1);
                    this.updateHabitsUI();
                    this.updateDashboard();
                }
            });
        });

        document.querySelectorAll('.habit-btn-save').forEach(btn => {
            btn.addEventListener('click', async () => {
                const habit = btn.dataset.habit;
                if (habit === 'steps') {
                    const val = parseInt(document.getElementById('steps-input').value);
                    if (!isNaN(val)) {
                        await habitsManager.setSteps(val);
                        document.getElementById('steps-input').value = '';
                    }
                } else if (habit === 'sleep') {
                    const val = parseFloat(document.getElementById('sleep-input').value);
                    if (!isNaN(val)) {
                        await habitsManager.setSleep(val);
                        document.getElementById('sleep-input').value = '';
                    }
                } else if (habit === 'exercise') {
                    const min = parseInt(document.getElementById('exercise-input').value);
                    const type = document.getElementById('exercise-type').value;
                    if (!isNaN(min) && min > 0) {
                        await habitsManager.addExercise(min, type);
                        document.getElementById('exercise-input').value = '';
                    }
                }
                this.updateHabitsUI();
                this.updateDashboard();
                this.showToast('Salvat!', 'success');
            });
        });

        // Mood buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                await habitsManager.setMood(parseInt(btn.dataset.mood));
                this.updateDashboard();
                this.showToast('Dispoziție salvată!', 'success');
            });
        });

        // Date navigation
        document.getElementById('prev-day').addEventListener('click', async () => {
            if (habitsManager.navigateDay(-1)) {
                await habitsManager.loadDay(habitsManager.currentDate);
                this.updateHabitsUI();
            }
        });
        document.getElementById('next-day').addEventListener('click', async () => {
            if (habitsManager.navigateDay(1)) {
                await habitsManager.loadDay(habitsManager.currentDate);
                this.updateHabitsUI();
            }
        });

        // Meals
        document.getElementById('add-meal-btn').addEventListener('click', () => {
            document.getElementById('meal-modal').classList.remove('hidden');
        });
        document.getElementById('meal-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const type = document.getElementById('meal-type').value;
            const desc = document.getElementById('meal-desc').value.trim();
            if (desc) {
                await habitsManager.addMeal(type, desc);
                document.getElementById('meal-desc').value = '';
                document.getElementById('meal-modal').classList.add('hidden');
                this.updateHabitsUI();
                this.showToast('Masă adăugată!', 'success');
            }
        });

        // Documents
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        uploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            await this.handleFiles(e.dataTransfer.files);
        });
        fileInput.addEventListener('change', async () => {
            await this.handleFiles(fileInput.files);
            fileInput.value = '';
        });

        // Document actions (delegated)
        document.getElementById('documents-list').addEventListener('click', async (e) => {
            const viewBtn = e.target.closest('.doc-view');
            const deleteBtn = e.target.closest('.doc-delete');
            if (viewBtn) {
                documentsManager.viewDocument(parseInt(viewBtn.dataset.docId));
            } else if (deleteBtn) {
                if (confirm('Ești sigur că vrei să ștergi acest document?')) {
                    await documentsManager.removeDocument(parseInt(deleteBtn.dataset.docId));
                    documentsManager.renderList();
                    this.showToast('Document șters', 'success');
                }
            }
        });

        // Modals close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById(btn.dataset.close).classList.add('hidden');
            });
        });
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        });

        // AI Chat
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');

        chatSend.addEventListener('click', () => this.sendChat());
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChat();
            }
        });
        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });

        // Quick questions
        document.querySelectorAll('.quick-q').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigate('ai');
                setTimeout(() => {
                    document.getElementById('chat-input').value = btn.dataset.q;
                    this.sendChat();
                }, 300);
            });
        });

        // Settings
        document.getElementById('save-api-key').addEventListener('click', async () => {
            const key = document.getElementById('api-key').value.trim();
            await this.saveSetting('apiKey', key);
            this.showToast('Cheie API salvată!', 'success');
        });

        document.getElementById('ai-model').addEventListener('change', async (e) => {
            await this.saveSetting('model', e.target.value);
            this.showToast('Model AI actualizat!', 'success');
        });

        document.getElementById('save-goals').addEventListener('click', async () => {
            this.goals = {
                water: parseInt(document.getElementById('goal-water').value) || 8,
                steps: parseInt(document.getElementById('goal-steps').value) || 10000,
                sleep: parseFloat(document.getElementById('goal-sleep').value) || 8,
                exercise: parseInt(document.getElementById('goal-exercise').value) || 30
            };
            await this.saveSetting('goalWater', this.goals.water);
            await this.saveSetting('goalSteps', this.goals.steps);
            await this.saveSetting('goalSleep', this.goals.sleep);
            await this.saveSetting('goalExercise', this.goals.exercise);
            this.updateHabitsUI();
            this.updateDashboard();
            this.showToast('Obiective salvate!', 'success');
        });

        document.getElementById('export-data').addEventListener('click', async () => {
            const data = await storage.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vitalife-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('Date exportate!', 'success');
        });

        document.getElementById('import-data').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                await storage.importAll(data);
                await profileManager.load();
                profileManager.populateForm();
                await habitsManager.loadDay(new Date());
                this.updateDashboard();
                this.updateHabitsUI();
                await documentsManager.load();
                documentsManager.renderList();
                this.showToast('Date importate cu succes!', 'success');
            } catch (err) {
                this.showToast('Eroare la import: fișier invalid', 'error');
            }
        });

        document.getElementById('clear-data').addEventListener('click', async () => {
            if (confirm('Ești sigur? Toate datele vor fi șterse permanent!')) {
                await storage.clearAll();
                location.reload();
            }
        });
    }

    bindTagEvents(btnId, inputId, type, listId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);

        const addTag = () => {
            const val = input.value.trim();
            if (val) {
                profileManager.addTag(type, val);
                profileManager.renderTags(listId, profileManager.profile[type], type);
                input.value = '';
            }
        };

        btn.addEventListener('click', addTag);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });
    }

    navigate(page) {
        this.currentPage = page;

        // Update pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');

        // Update nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navBtn) navBtn.classList.add('active');

        // Update header
        const titles = {
            dashboard: 'VitaLife',
            profile: 'Profilul Meu',
            habits: 'Obiceiuri',
            documents: 'Documente',
            ai: 'AI Advisor',
            settings: 'Setări'
        };
        document.getElementById('page-title').textContent = titles[page] || 'VitaLife';

        // Populate profile form when navigating to profile
        if (page === 'profile') {
            profileManager.populateForm();
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }

    updateDashboard() {
        // Greeting
        const name = profileManager.profile?.name;
        const hour = new Date().getHours();
        let greeting = hour < 12 ? 'Bună dimineața' : hour < 18 ? 'Bună ziua' : 'Bună seara';
        if (name) greeting += `, <span>${name}</span>`;
        greeting += '! 👋';
        document.getElementById('greeting').innerHTML = greeting;

        // Quick stats
        const habits = habitsManager.todayData;
        if (habits) {
            document.getElementById('stat-water').textContent = habits.water || 0;
            document.getElementById('stat-steps').textContent = (habits.steps || 0).toLocaleString();
            document.getElementById('stat-sleep').textContent = habits.sleep || '--';
            const moods = ['--', '😢', '😕', '😐', '😊', '😄'];
            document.getElementById('stat-mood').textContent = moods[habits.mood || 0];
        }

        // Health score
        const score = profileManager.calculateHealthScore(habits, this.goals);
        const scoreValue = document.getElementById('score-value');
        const scoreCircle = document.getElementById('score-circle');
        const scoreMessage = document.getElementById('score-message');

        scoreValue.textContent = score;
        const circumference = 339.292;
        const offset = circumference - (score / 100) * circumference;
        scoreCircle.style.strokeDashoffset = offset;

        if (score >= 80) scoreMessage.textContent = 'Excelent! Continuă așa! 🌟';
        else if (score >= 60) scoreMessage.textContent = 'Bine! Mai ai puțin până la excelent! 💪';
        else if (score >= 40) scoreMessage.textContent = 'Nu rău! Hai să îmbunătățim! 🌿';
        else scoreMessage.textContent = 'Completează-ți obiceiurile zilnice! 📝';

        // Daily tip
        this.updateDailyTip();
    }

    updateDailyTip() {
        const tips = [
            'Bea un pahar de apă dimineața pe stomacul gol pentru a-ți activa metabolismul.',
            'Încearcă să faci o plimbare de 10 minute după fiecare masă principală.',
            'Limitează ecranele cu 1 oră înainte de culcare pentru un somn mai bun.',
            'Mănâncă lent și savurează fiecare îmbucătură - durează 20 min ca creierul să simtă sațietatea.',
            'Adaugă o porție de legume la fiecare masă pentru mai multe fibre și vitamine.',
            'Respirația profundă 5 minute pe zi reduce stresul și tensiunea arterială.',
            'Încearcă să te ridici și să te miști la fiecare oră dacă lucrezi la birou.',
            'Un fruct pe zi aduce vitamine esențiale și energie naturală.',
            'Somnul regulat (culcare/trezire la aceeași oră) îmbunătățește calitatea odihnei.',
            'Hidratarea corectă ajută la concentrare, energie și digestie.',
            'Stretching-ul de 5 minute dimineața îți pregătește corpul pentru zi.',
            'Încearcă să mănânci ultima masă cu cel puțin 2-3 ore înainte de culcare.',
            'Zâmbește! Studiile arată că zâmbetul reduce hormonii de stres.',
            'Adaugă nuci și semințe în alimentație pentru grăsimi sănătoase.',
            'Limitează zahărul adăugat - corpul tău îți va mulțumi!'
        ];
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        document.getElementById('tip-text').textContent = tips[dayOfYear % tips.length];
    }

    updateHabitsUI() {
        const data = habitsManager.todayData;
        if (!data) return;

        // Date
        document.getElementById('current-date').textContent = habitsManager.formatDate();

        // Water
        document.getElementById('habit-water-val').textContent = data.water || 0;
        document.getElementById('habit-water-count').textContent = `${data.water || 0} / ${this.goals.water} pahare`;
        document.getElementById('water-progress').style.width = `${Math.min(((data.water || 0) / this.goals.water) * 100, 100)}%`;

        // Steps
        document.getElementById('habit-steps-count').textContent = `${(data.steps || 0).toLocaleString()} / ${this.goals.steps.toLocaleString()}`;
        document.getElementById('steps-progress').style.width = `${Math.min(((data.steps || 0) / this.goals.steps) * 100, 100)}%`;

        // Sleep
        document.getElementById('habit-sleep-count').textContent = `${data.sleep || '--'} ore`;
        document.getElementById('sleep-progress').style.width = `${Math.min(((data.sleep || 0) / this.goals.sleep) * 100, 100)}%`;

        // Exercise
        document.getElementById('habit-exercise-count').textContent = `${data.exercise || 0} min`;

        // Meals
        const mealLabels = {
            breakfast: 'Mic dejun',
            lunch: 'Prânz',
            dinner: 'Cină',
            snack: 'Gustare'
        };
        const mealsList = document.getElementById('meals-list');
        if (data.meals && data.meals.length > 0) {
            document.getElementById('habit-meals-count').textContent = `${data.meals.length} / 3`;
            mealsList.innerHTML = data.meals.map(m => `
                <div class="meal-item">
                    <div>
                        <div class="meal-type">${mealLabels[m.type] || m.type}</div>
                        <div>${m.description}</div>
                    </div>
                    <button class="meal-delete" data-meal-id="${m.id}">✕</button>
                </div>
            `).join('');

            // Bind delete
            mealsList.querySelectorAll('.meal-delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await habitsManager.removeMeal(parseInt(btn.dataset.mealId));
                    this.updateHabitsUI();
                });
            });
        } else {
            document.getElementById('habit-meals-count').textContent = '0 / 3';
            mealsList.innerHTML = '';
        }

        // Mood
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.mood) === data.mood);
        });
    }

    async handleFiles(files) {
        for (const file of files) {
            try {
                await documentsManager.addDocument(file);
                this.showToast(`${file.name} încărcat!`, 'success');
            } catch (err) {
                this.showToast(`Eroare la ${file.name}`, 'error');
            }
        }
        documentsManager.renderList();
    }

    async sendChat() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message || aiAdvisor.isProcessing) return;

        input.value = '';
        input.style.height = 'auto';

        aiAdvisor.addMessageToUI(message, true);
        aiAdvisor.showTyping();

        const result = await aiAdvisor.sendMessage(message);
        aiAdvisor.hideTyping();

        if (result.success) {
            aiAdvisor.addMessageToUI(result.message, false);
        } else {
            aiAdvisor.addMessageToUI('⚠️ ' + result.message, false);
        }
    }

    async saveSetting(key, value) {
        let settings = await storage.get(STORES.SETTINGS, 'main');
        if (!settings) settings = { id: 'main' };
        settings[key] = value;
        await storage.put(STORES.SETTINGS, settings);
    }

    showToast(message, type = '') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}

// Start the app
const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
