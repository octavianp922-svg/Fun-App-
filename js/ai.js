// ===== VitaLife - AI Health Advisor =====

class AIAdvisor {
    constructor() {
        this.chatHistory = [];
        this.isProcessing = false;
    }

    async getApiKey() {
        const settings = await storage.get(STORES.SETTINGS, 'main');
        return settings?.apiKey || null;
    }

    async getModel() {
        const settings = await storage.get(STORES.SETTINGS, 'main');
        return settings?.model || 'gpt-4o-mini';
    }

    getSystemPrompt() {
        const profileSummary = profileManager.getProfileSummary();
        const habitsSummary = habitsManager.getHabitsSummary();
        const docsSummary = documentsManager.getDocumentsSummary();

        return `Ești VitaLife AI, un asistent personal de sănătate și wellness. Răspunzi DOAR în limba română.

IMPORTANT: Nu ești doctor. Oferă sfaturi generale de wellness și stil de viață sănătos. Recomandă mereu consultarea unui medic pentru probleme medicale serioase.

Profil utilizator:
${profileSummary || 'Profilul nu a fost completat încă.'}

Obiceiuri zilnice:
${habitsSummary || 'Nu există date despre obiceiurile de azi.'}

${docsSummary ? `Documente medicale: ${docsSummary}` : ''}

Regulile tale:
1. Răspunde concis și prietenos
2. Oferă sfaturi personalizate bazate pe profilul și obiceiurile utilizatorului
3. Folosește emoji-uri moderat pentru a face conversația plăcută
4. Când nu ai suficiente informații, întreabă
5. Încurajează obiceiuri sănătoase fără a judeca
6. Nu diagnostica și nu prescrie medicamente
7. Recomandă mereu consultarea unui specialist medical când e cazul
8. Adaptează sfaturile la obiectivele utilizatorului`;
    }

    async sendMessage(userMessage) {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            return {
                success: false,
                message: 'Te rog să adaugi cheia API OpenAI în Setări pentru a folosi asistentul AI.'
            };
        }

        this.isProcessing = true;

        this.chatHistory.push({
            role: 'user',
            content: userMessage
        });

        // Keep last 20 messages for context
        if (this.chatHistory.length > 20) {
            this.chatHistory = this.chatHistory.slice(-20);
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
                    model: model,
                    messages: [
                        { role: 'system', content: this.getSystemPrompt() },
                        ...this.chatHistory
                    ],
                    max_tokens: 1000,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    throw new Error('Cheia API este invalidă. Verifică în Setări.');
                }
                if (response.status === 429) {
                    throw new Error('Prea multe cereri. Așteaptă puțin și încearcă din nou.');
                }
                throw new Error(errorData.error?.message || `Eroare API: ${response.status}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;

            this.chatHistory.push({
                role: 'assistant',
                content: assistantMessage
            });

            this.isProcessing = false;
            return { success: true, message: assistantMessage };

        } catch (error) {
            this.isProcessing = false;
            // Remove the failed user message from history
            this.chatHistory.pop();
            return { success: false, message: error.message };
        }
    }

    addMessageToUI(content, isUser = false) {
        const container = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user' : 'bot'}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = this.formatMessage(content);

        msgDiv.appendChild(contentDiv);
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    showTyping() {
        const container = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typing-indicator';

        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;

        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
    }

    hideTyping() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    formatMessage(text) {
        // Basic markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n- /g, '\n• ')
            .replace(/\n\d+\. /g, (match) => '\n' + match.trim() + ' ')
            .replace(/\n/g, '<br>');
    }

    clearHistory() {
        this.chatHistory = [];
    }
}

const aiAdvisor = new AIAdvisor();
