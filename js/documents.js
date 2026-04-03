// ===== VitaLife - Documents Manager =====

class DocumentsManager {
    constructor() {
        this.documents = [];
    }

    async load() {
        this.documents = await storage.getAll(STORES.DOCUMENTS);
        this.documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        return this.documents;
    }

    async addDocument(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const doc = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    uploadDate: new Date().toISOString(),
                    notes: ''
                };

                try {
                    await storage.put(STORES.DOCUMENTS, doc);
                    await this.load();
                    resolve(doc);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(reader.error);

            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }

    async removeDocument(id) {
        await storage.delete(STORES.DOCUMENTS, id);
        await this.load();
    }

    getFileIcon(type) {
        if (type.startsWith('image/')) return '🖼️';
        if (type === 'application/pdf') return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.startsWith('text/')) return '📃';
        return '📁';
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('ro-RO', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    renderList() {
        const container = document.getElementById('documents-list');

        if (this.documents.length === 0) {
            container.innerHTML = '<p class="empty-state">Niciun document încărcat încă</p>';
            return;
        }

        container.innerHTML = this.documents.map(doc => `
            <div class="doc-item" data-doc-id="${doc.id}">
                <span class="doc-icon">${this.getFileIcon(doc.type)}</span>
                <div class="doc-info">
                    <div class="doc-name">${this.escapeHtml(doc.name)}</div>
                    <div class="doc-meta">${this.formatSize(doc.size)} • ${this.formatDate(doc.uploadDate)}</div>
                </div>
                <div class="doc-actions">
                    <button class="doc-action-btn doc-view" data-doc-id="${doc.id}" title="Vizualizează">👁️</button>
                    <button class="doc-action-btn doc-delete" data-doc-id="${doc.id}" title="Șterge">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    viewDocument(id) {
        const doc = this.documents.find(d => d.id === id);
        if (!doc) return;

        const modal = document.getElementById('doc-modal');
        const title = document.getElementById('doc-modal-title');
        const body = document.getElementById('doc-modal-body');

        title.textContent = doc.name;

        if (doc.type.startsWith('image/')) {
            body.innerHTML = `<img src="${doc.data}" style="max-width:100%; border-radius: 8px;" alt="${this.escapeHtml(doc.name)}">`;
        } else if (doc.type === 'application/pdf') {
            body.innerHTML = `<iframe src="${doc.data}" style="width:100%; height:70vh; border:none; border-radius:8px;"></iframe>`;
        } else {
            body.innerHTML = `
                <div style="padding: 20px; background: var(--bg); border-radius: 8px;">
                    <p style="color: var(--text-muted);">Previzualizarea nu este disponibilă pentru acest tip de fișier.</p>
                    <a href="${doc.data}" download="${this.escapeHtml(doc.name)}" class="btn btn-primary" style="margin-top: 16px;">📥 Descarcă</a>
                </div>
            `;
        }

        modal.classList.remove('hidden');
    }

    getDocumentsSummary() {
        if (this.documents.length === 0) return '';
        return `Documente medicale încărcate: ${this.documents.map(d => d.name).join(', ')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const documentsManager = new DocumentsManager();
