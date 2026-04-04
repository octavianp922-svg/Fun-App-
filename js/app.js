// ===== VitaLife v2 - Main App =====

class App {
    constructor() {
        this.currentPage = 'chat';
        this.pendingAttachments = [];
    }

    async init() {
        try {
            await storage.init();
            await documentsManager.load();
            await planManager.load();
            await healthImporter.loadSaved();

            const history = await aiAdvisor.loadHistory();
            this.restoreChatUI(history);

            this.bindEvents();

            // Show welcome if first time
            if (!history || history.length === 0) {
                this.showWelcome();
            }

            // Hide splash
            setTimeout(() => {
                document.getElementById('splash').classList.add('fade-out');
                document.getElementById('app').classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('splash').style.display = 'none';
                }, 500);
            }, 600);

        } catch (err) {
            console.error('Init error:', err);
        }
    }

    showWelcome() {
        aiAdvisor.addBotMessage(
            `Bună! Sunt **VitaLife AI** — asistentul tău personal de sănătate. 🌿\n\n` +
            `Scopul meu e să te cunosc cât mai bine și să-ți creez un **plan complet de viață sănătoasă** — personalizat pe tine.\n\n` +
            `Poți să:\n` +
            `- **Vorbești cu mine** — îți pun întrebări despre sănătate, obiceiuri, alimentație\n` +
            `- **Urci documente medicale** (analize, raporturi) — le analizez\n` +
            `- **Importi date de la Apple Watch** — somn, pași, ritm cardiac\n\n` +
            `Când am suficiente informații, îți generez un **plan săptămânal detaliat**: ce să mănânci, când să dormi, ce sport, câtă apă — tot.\n\n` +
            `Hai să începem! Spune-mi, cum te cheamă și câți ani ai? 😊`
        );

        aiAdvisor.showActions([
            { label: '📄 Urcă analize medicale', callback: () => this.navigate('documents') },
            { label: '⌚ Import Apple Health', callback: () => this.navigate('health-data') },
            { label: '💬 Hai să vorbim!', message: 'Salut! Hai să începem.' }
        ]);
    }

    restoreChatUI(history) {
        if (!history || history.length === 0) return;
        for (const msg of history) {
            if (msg.role === 'user') {
                aiAdvisor.addUserMessage(msg.content);
            } else if (msg.role === 'assistant') {
                aiAdvisor.addBotMessage(msg.content);

                // Check if plan was generated
                const plan = aiAdvisor.extractPlan(msg.content);
                if (plan) {
                    planManager.save(plan);
                }
            }
        }
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => this.navigate(btn.dataset.page));
        });
        document.querySelectorAll('.menu-item').forEach(btn => {
            btn.addEventListener('click', () => {
                this.navigate(btn.dataset.page);
                this.closeMenu();
            });
        });

        // Menu
        document.getElementById('menu-btn').addEventListener('click', () => this.openMenu());
        document.getElementById('menu-overlay').addEventListener('click', () => this.closeMenu());
        document.getElementById('settings-btn').addEventListener('click', () => this.navigate('settings'));

        // Chat
        document.getElementById('chat-send').addEventListener('click', () => this.sendChat());
        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendChat();
            }
        });
        document.getElementById('chat-input').addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        });

        // Chat attach
        document.getElementById('attach-btn').addEventListener('click', () => {
            document.getElementById('chat-file-input').click();
        });
        document.getElementById('chat-file-input').addEventListener('change', async (e) => {
            for (const file of e.target.files) {
                const doc = await documentsManager.addDocument(file);
                this.pendingAttachments.push({
                    name: file.name,
                    type: file.type,
                    dataUrl: doc.data,
                    textContent: doc.textContent || null
                });
                this.showToast(`📎 ${file.name} atașat`, 'success');
            }
            e.target.value = '';
            documentsManager.renderList();

            // Auto-send to AI for analysis
            if (this.pendingAttachments.length > 0 && !aiAdvisor.isProcessing) {
                const names = this.pendingAttachments.map(a => a.name).join(', ');
                document.getElementById('chat-input').value = `Am urcat: ${names}. Te rog analizează documentele/imaginile și spune-mi ce observi.`;
                this.sendChat();
            }
        });

        // Documents
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            for (const file of e.target.files) {
                await documentsManager.addDocument(file);
                this.showToast(`${file.name} încărcat!`, 'success');
            }
            e.target.value = '';
            documentsManager.renderList();
        });

        // Document actions
        document.getElementById('documents-list').addEventListener('click', async (e) => {
            const sendBtn = e.target.closest('.doc-send');
            const viewBtn = e.target.closest('.doc-view');
            const deleteBtn = e.target.closest('.doc-delete');

            if (sendBtn) {
                const doc = documentsManager.getDocForChat(parseInt(sendBtn.dataset.docId));
                if (doc) {
                    this.navigate('chat');
                    this.pendingAttachments.push(doc);
                    document.getElementById('chat-input').value = `Am urcat documentul "${doc.name}". Te rog analizează-l.`;
                    this.sendChat();
                }
            } else if (viewBtn) {
                documentsManager.viewDocument(parseInt(viewBtn.dataset.docId));
            } else if (deleteBtn) {
                if (confirm('Ștergi documentul?')) {
                    await documentsManager.removeDocument(parseInt(deleteBtn.dataset.docId));
                    documentsManager.renderList();
                }
            }
        });

        // Modal close
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

        // Health import
        const healthUpload = document.getElementById('health-upload-area');
        const healthInput = document.getElementById('health-file-input');
        healthUpload.addEventListener('click', () => healthInput.click());
        healthInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            this.showToast('Se procesează datele...', 'info');
            try {
                const result = await healthImporter.processFile(file);
                if (result.error) {
                    this.showToast(result.message, 'error');
                } else {
                    healthImporter.renderStats(result);
                    this.showToast('Date Apple Health importate!', 'success');

                    // Offer to send to AI
                    setTimeout(() => {
                        if (confirm('Vrei să trimit datele Apple Health către AI pentru analiză?')) {
                            this.navigate('chat');
                            document.getElementById('chat-input').value =
                                'Am importat datele mele din Apple Health. Iată rezumatul:\n\n' + result.rawSummary +
                                '\n\nAnalizează aceste date și spune-mi ce observi.';
                            this.sendChat();
                        }
                    }, 500);
                }
            } catch (err) {
                this.showToast('Eroare: ' + err.message, 'error');
            }
            e.target.value = '';
        });

        // Plan actions
        document.getElementById('go-to-chat')?.addEventListener('click', () => this.navigate('chat'));
        document.getElementById('regenerate-plan')?.addEventListener('click', () => {
            this.navigate('chat');
            document.getElementById('chat-input').value = 'Regenerează-mi planul săptămânal te rog, ținând cont de tot ce am discutat.';
            this.sendChat();
        });
        document.getElementById('export-plan')?.addEventListener('click', () => {
            const text = planManager.exportAsText();
            if (text) {
                const blob = new Blob([text], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'vitalife-plan.json';
                a.click();
            }
        });

        // Settings
        document.getElementById('save-api-key').addEventListener('click', async () => {
            const key = document.getElementById('api-key').value.trim();
            await this.saveSetting('apiKey', key);
            this.showToast('Cheie API salvată!', 'success');
        });
        document.getElementById('ai-model').addEventListener('change', async (e) => {
            await this.saveSetting('model', e.target.value);
        });
        document.getElementById('export-data').addEventListener('click', async () => {
            const data = await storage.exportAll();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `vitalife-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        });
        document.getElementById('import-data').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        document.getElementById('import-file').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const data = JSON.parse(await file.text());
                await storage.importAll(data);
                location.reload();
            } catch (err) {
                this.showToast('Fișier invalid', 'error');
            }
        });
        document.getElementById('clear-chat').addEventListener('click', async () => {
            if (confirm('Ștergi toată conversația?')) {
                await aiAdvisor.clearHistory();
                document.getElementById('chat-messages').innerHTML = '';
                this.showWelcome();
                this.showToast('Conversație ștearsă', 'success');
            }
        });
        document.getElementById('clear-all').addEventListener('click', async () => {
            if (confirm('⚠️ Ești sigur? TOTUL va fi șters — conversație, documente, plan, setări!')) {
                await storage.clearAll();
                location.reload();
            }
        });

        // Load saved API key into field
        this.loadSettingsUI();
    }

    async loadSettingsUI() {
        const s = await storage.get(STORES.SETTINGS, 'main');
        if (s?.apiKey) {
            document.getElementById('api-key').value = s.apiKey;
        }
        if (s?.model) {
            document.getElementById('ai-model').value = s.model;
        }
    }

    navigate(page) {
        this.currentPage = page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navBtn) navBtn.classList.add('active');

        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        const menuBtn = document.querySelector(`.menu-item[data-page="${page}"]`);
        if (menuBtn) menuBtn.classList.add('active');

        const titles = {
            chat: 'VitaLife AI',
            plan: 'Planul Meu',
            documents: 'Documente',
            'health-data': 'Apple Health',
            settings: 'Setări'
        };
        document.getElementById('page-title').textContent = titles[page] || 'VitaLife';

        if (page === 'documents') documentsManager.renderList();

        // Scroll chat to bottom
        if (page === 'chat') {
            setTimeout(() => {
                const msgs = document.getElementById('chat-messages');
                msgs.scrollTop = msgs.scrollHeight;
            }, 100);
        }
    }

    openMenu() {
        document.getElementById('side-menu').classList.remove('hidden');
    }
    closeMenu() {
        document.getElementById('side-menu').classList.add('hidden');
    }

    async sendChat() {
        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if (!msg || aiAdvisor.isProcessing) return;

        input.value = '';
        input.style.height = 'auto';

        const attachments = [...this.pendingAttachments];
        this.pendingAttachments = [];

        aiAdvisor.clearActions();
        aiAdvisor.addUserMessage(msg, attachments);
        aiAdvisor.showTyping();

        const result = await aiAdvisor.sendMessage(msg, attachments);
        aiAdvisor.hideTyping();

        if (result.success) {
            // Check for plan
            const plan = aiAdvisor.extractPlan(result.message);
            if (plan) {
                await planManager.save(plan);
            }

            aiAdvisor.addBotMessage(result.message);

            // Show contextual actions after response
            if (plan) {
                aiAdvisor.showActions([
                    { label: '📋 Vezi planul', callback: () => this.navigate('plan') },
                    { label: '🔄 Modifică planul', message: 'Poți să modifici planul? Aș vrea câteva schimbări.' }
                ]);
            }
        } else {
            aiAdvisor.addBotMessage(result.message);
        }
    }

    async saveSetting(key, value) {
        let s = await storage.get(STORES.SETTINGS, 'main');
        if (!s) s = { id: 'main' };
        s[key] = value;
        await storage.put(STORES.SETTINGS, s);
    }

    showToast(message, type = '') {
        document.querySelectorAll('.toast').forEach(t => t.remove());
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());
