// ===== VitaLife v2 - AI Health Advisor Core =====

class AIAdvisor {
    constructor() {
        this.chatHistory = [];
        this.isProcessing = false;
    }

    async getApiKey() {
        const s = await storage.get(STORES.SETTINGS, 'main');
        return s?.apiKey || null;
    }

    async getModel() {
        const s = await storage.get(STORES.SETTINGS, 'main');
        return s?.model || 'gpt-4o-mini';
    }

    buildSystemPrompt() {
        // Gather all context
        const profile = this._getStoredProfile();
        const docs = this._getDocsSummary();
        const health = this._getHealthSummary();
        const plan = this._getCurrentPlan();

        return `Ești VitaLife AI — un asistent personal de sănătate, nutriție și stil de viață. Vorbești NUMAI în limba română.

## ROLUL TĂU
Ești ca un medic de familie + nutriționist + antrenor personal, totul într-unul. Ești empatic, curios, și vrei să înțelegi totul despre utilizator. Scopul tău final e să creezi un PLAN SĂPTĂMÂNAL COMPLET de viață sănătoasă, personalizat 100%.

## ABORDAREA TA
1. **Interviu profund** — Nu cere date seci. Poartă o conversație naturală. Întreabă despre:
   - Stil de viață actual (program, muncă, stres, somn)
   - Obiceiuri alimentare (ce mănâncă de obicei, preferințe, alergii)
   - Probleme de sănătate, simptome, dureri
   - Istoric medical, boli cronice, medicație
   - Nivel de fitness, sport, mobilitate
   - Obiective (ce vrea să schimbe, ce l-ar face fericit)
   - Vicii (fumat, alcool, sedentarism)

2. **Analiză documente** — Când utilizatorul urcă documente medicale, analizează-le și discută ce ai observat. Întreabă despre valorile anormale. Sapă adânc.

3. **Date Apple Health** — Dacă are date de la Apple Watch, analizează patterns de somn, ritm cardiac, activitate, VO2max etc.

4. **Generare plan** — Când ai suficiente informații, oferă-te să generezi planul. Planul trebuie să fie DETALIAT:
   - Fiecare zi a săptămânii (Luni-Duminică)
   - Ora de trezire și culcare
   - Ce să mănânce la fiecare masă (mic dejun, prânz, cină, gustări) — rețete concrete românești
   - Câtă apă să bea și când
   - Ce sport să facă, cât timp, și la ce oră
   - Momente de relaxare/meditație
   - Suplimente sau medicamente (dacă e cazul)

## REGULI STRICTE
- Nu diagnostica boli. Recomanzi consultarea medicului pentru lucruri serioase.
- Nu prescrie medicamente.
- Fii specific — nu "mănâncă sănătos", ci "la mic dejun: ovăz cu banane, nuci și scorțișoară, 350ml apă"
- Adaptează la bucătăria românească (mâncăruri locale, ingrediente accesibile)
- Adaptează sportul la nivelul real al persoanei
- Fii prietenos dar profesionist
- Folosește emoji-uri moderat
- Când generezi planul săptămânal, folosește EXACT formatul JSON de mai jos între taguri [PLAN_START] și [PLAN_END]

## FORMAT PLAN (când ți se cere)
Când generezi planul, include-l în mesajul tău între tagurile [PLAN_START] și [PLAN_END] ca JSON valid:
[PLAN_START]
{
  "title": "Plan Personalizat",
  "summary": "Scurt rezumat al planului",
  "general": {
    "water": "2.5L pe zi",
    "sleep": "22:30 - 06:30",
    "supplements": ["Vitamina D 2000UI", "Magneziu 400mg"]
  },
  "days": {
    "Luni": {
      "wake": "06:30",
      "sleep": "22:30",
      "meals": {
        "mic_dejun": {"time": "07:00", "desc": "Descriere masă"},
        "gustare_1": {"time": "10:00", "desc": "Descriere"},
        "pranz": {"time": "13:00", "desc": "Descriere masă"},
        "gustare_2": {"time": "16:00", "desc": "Descriere"},
        "cina": {"time": "19:00", "desc": "Descriere masă"}
      },
      "exercise": {"time": "07:30", "type": "Cardio", "duration": "30 min", "desc": "Alergare ușoară în parc"},
      "water_schedule": ["07:00 - 500ml", "10:00 - 300ml", "13:00 - 500ml", "16:00 - 300ml", "19:00 - 500ml", "21:00 - 400ml"],
      "notes": "Note extra pentru ziua respectivă"
    }
  }
}
[PLAN_END]

## CONTEXT ACTUAL
${profile ? `### Profil utilizator:\n${profile}\n` : 'Profilul nu a fost completat. Trebuie să-l cunoști prin conversație.\n'}
${docs ? `### Documente medicale:\n${docs}\n` : ''}
${health ? `### Date Apple Health:\n${health}\n` : ''}
${plan ? `### Plan curent activ:\n${plan}\n` : ''}

## PRIMA INTERACȚIUNE
Dacă este prima conversație (fără istoric), salută-l călduros și începe interviul natural. Nu cere totul dintr-o dată — o întrebare-două pe mesaj, ca la doctor.`;
    }

    _getStoredProfile() {
        // Profile is built from conversation, stored as summary
        const el = document.getElementById('ai-profile-data');
        return el ? el.textContent : null;
    }

    _getDocsSummary() {
        if (typeof documentsManager === 'undefined') return null;
        if (!documentsManager.documents || documentsManager.documents.length === 0) return null;
        return documentsManager.documents
            .filter(d => d.aiSummary)
            .map(d => `[${d.name}]: ${d.aiSummary}`)
            .join('\n');
    }

    _getHealthSummary() {
        const el = document.getElementById('health-stats');
        return el && el.textContent.trim() ? el.textContent : null;
    }

    _getCurrentPlan() {
        const el = document.getElementById('plan-days');
        return el && el.textContent.trim() ? 'Are deja un plan activ.' : null;
    }

    async sendMessage(userMessage, attachments = []) {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            return {
                success: false,
                message: '⚙️ Trebuie să adaugi cheia OpenAI API în **Setări** pentru a folosi VitaLife AI.\n\nMergi la tab-ul ⚙️ Setări și introdu cheia ta de la platform.openai.com'
            };
        }

        this.isProcessing = true;

        // Build user message with attachments
        let content = userMessage;
        if (attachments.length > 0) {
            content += '\n\n[Documente atașate: ' + attachments.map(a => a.name).join(', ') + ']';
            for (const att of attachments) {
                if (att.textContent) {
                    content += `\n\n--- Conținut ${att.name} ---\n${att.textContent.substring(0, 8000)}`;
                }
            }
        }

        this.chatHistory.push({ role: 'user', content });

        // Keep reasonable context
        if (this.chatHistory.length > 40) {
            this.chatHistory = this.chatHistory.slice(-40);
        }

        try {
            const model = await this.getModel();
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: this.buildSystemPrompt() },
                        ...this.chatHistory
                    ],
                    max_tokens: 4000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                if (response.status === 401) throw new Error('Cheia API este invalidă. Verifică în Setări.');
                if (response.status === 429) throw new Error('Prea multe cereri. Așteaptă puțin.');
                throw new Error(err.error?.message || `Eroare: ${response.status}`);
            }

            const data = await response.json();
            const reply = data.choices[0].message.content;

            this.chatHistory.push({ role: 'assistant', content: reply });

            // Save conversation
            await this.saveHistory();

            this.isProcessing = false;
            return { success: true, message: reply };

        } catch (error) {
            this.isProcessing = false;
            this.chatHistory.pop();
            return { success: false, message: '❌ ' + error.message };
        }
    }

    async saveHistory() {
        await storage.put(STORES.CHAT, {
            id: 'history',
            messages: this.chatHistory,
            updatedAt: new Date().toISOString()
        });
    }

    async loadHistory() {
        const data = await storage.get(STORES.CHAT, 'history');
        if (data && data.messages) {
            this.chatHistory = data.messages;
        }
        return this.chatHistory;
    }

    async clearHistory() {
        this.chatHistory = [];
        await storage.delete(STORES.CHAT, 'history');
    }

    // Extract plan JSON from AI response
    extractPlan(message) {
        const match = message.match(/\[PLAN_START\]([\s\S]*?)\[PLAN_END\]/);
        if (!match) return null;
        try {
            return JSON.parse(match[1].trim());
        } catch (e) {
            console.error('Plan parse error:', e);
            return null;
        }
    }

    // Format message for display (markdown-like)
    formatMessage(text) {
        // Remove plan JSON from display
        text = text.replace(/\[PLAN_START\][\s\S]*?\[PLAN_END\]/g, '✅ **Planul tău săptămânal a fost generat! Mergi la tab-ul 📋 Planul Meu pentru a-l vedea.**');

        return text
            .replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/## (.*)/g, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n- /g, '\n• ')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }

    addBotMessage(content, actions = []) {
        const container = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message bot';
        msgDiv.innerHTML = `
            <div class="msg-avatar">🌿</div>
            <div class="msg-bubble"><p>${this.formatMessage(content)}</p></div>
        `;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;

        // Quick action buttons
        if (actions.length > 0) {
            this.showActions(actions);
        }
    }

    addUserMessage(content, attachments = []) {
        const container = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message user';

        let attachHtml = '';
        if (attachments.length > 0) {
            attachHtml = attachments.map(a =>
                `<div class="msg-attachment"><span class="msg-attachment-icon">📎</span>${a.name}</div>`
            ).join('');
        }

        msgDiv.innerHTML = `
            <div class="msg-avatar">👤</div>
            <div class="msg-bubble"><p>${this.formatMessage(content)}</p>${attachHtml}</div>
        `;
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    showTyping() {
        const container = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = 'message bot';
        div.id = 'typing-msg';
        div.innerHTML = `
            <div class="msg-avatar">🌿</div>
            <div class="msg-bubble">
                <div class="typing-indicator"><span></span><span></span><span></span></div>
            </div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    hideTyping() {
        const el = document.getElementById('typing-msg');
        if (el) el.remove();
    }

    showActions(actions) {
        const container = document.getElementById('chat-actions');
        container.innerHTML = '';
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'chat-action-btn';
            btn.textContent = action.label;
            btn.addEventListener('click', () => {
                container.innerHTML = '';
                if (action.callback) action.callback();
                else if (action.message) {
                    document.getElementById('chat-input').value = action.message;
                    document.getElementById('chat-send').click();
                }
            });
            container.appendChild(btn);
        });
    }

    clearActions() {
        document.getElementById('chat-actions').innerHTML = '';
    }
}

const aiAdvisor = new AIAdvisor();
