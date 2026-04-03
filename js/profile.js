// ===== VitaLife - Profile Manager =====

class ProfileManager {
    constructor() {
        this.profile = null;
    }

    async load() {
        this.profile = await storage.get(STORES.PROFILE, 'main');
        if (!this.profile) {
            this.profile = {
                id: 'main',
                name: '',
                age: null,
                sex: '',
                height: null,
                weight: null,
                conditions: [],
                allergies: [],
                medications: [],
                activityLevel: '',
                goal: '',
                notes: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
        return this.profile;
    }

    async save(data) {
        this.profile = {
            ...this.profile,
            ...data,
            id: 'main',
            updatedAt: new Date().toISOString()
        };
        await storage.put(STORES.PROFILE, this.profile);
        return this.profile;
    }

    populateForm() {
        if (!this.profile) return;

        const p = this.profile;
        document.getElementById('profile-name').value = p.name || '';
        document.getElementById('profile-age').value = p.age || '';
        document.getElementById('profile-sex').value = p.sex || '';
        document.getElementById('profile-height').value = p.height || '';
        document.getElementById('profile-weight').value = p.weight || '';
        document.getElementById('profile-activity').value = p.activityLevel || '';
        document.getElementById('profile-goal').value = p.goal || '';
        document.getElementById('profile-notes').value = p.notes || '';

        this.renderTags('conditions-list', p.conditions, 'conditions');
        this.renderTags('allergies-list', p.allergies, 'allergies');
        this.renderTags('meds-list', p.medications, 'medications');
    }

    getFormData() {
        return {
            name: document.getElementById('profile-name').value.trim(),
            age: parseInt(document.getElementById('profile-age').value) || null,
            sex: document.getElementById('profile-sex').value,
            height: parseInt(document.getElementById('profile-height').value) || null,
            weight: parseFloat(document.getElementById('profile-weight').value) || null,
            activityLevel: document.getElementById('profile-activity').value,
            goal: document.getElementById('profile-goal').value,
            notes: document.getElementById('profile-notes').value.trim(),
            conditions: this.profile.conditions || [],
            allergies: this.profile.allergies || [],
            medications: this.profile.medications || []
        };
    }

    addTag(type, value) {
        if (!value.trim()) return;
        if (!this.profile[type]) this.profile[type] = [];
        if (!this.profile[type].includes(value.trim())) {
            this.profile[type].push(value.trim());
        }
    }

    removeTag(type, value) {
        if (!this.profile[type]) return;
        this.profile[type] = this.profile[type].filter(t => t !== value);
    }

    renderTags(containerId, tags, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        if (!tags || tags.length === 0) return;

        tags.forEach(tag => {
            const el = document.createElement('span');
            el.className = 'tag';
            el.innerHTML = `${tag} <button class="tag-remove" data-type="${type}" data-value="${tag}">&times;</button>`;
            container.appendChild(el);
        });
    }

    getBMI() {
        if (!this.profile || !this.profile.height || !this.profile.weight) return null;
        const heightM = this.profile.height / 100;
        return (this.profile.weight / (heightM * heightM)).toFixed(1);
    }

    getBMICategory() {
        const bmi = parseFloat(this.getBMI());
        if (!bmi) return null;
        if (bmi < 18.5) return 'Subponderal';
        if (bmi < 25) return 'Normal';
        if (bmi < 30) return 'Supraponderal';
        return 'Obez';
    }

    getProfileSummary() {
        const p = this.profile;
        if (!p || !p.name) return null;

        const activityLabels = {
            'sedentary': 'Sedentar',
            'light': 'Ușor activ',
            'moderate': 'Moderat activ',
            'active': 'Activ',
            'very-active': 'Foarte activ'
        };
        const goalLabels = {
            'lose-weight': 'Pierdere în greutate',
            'gain-weight': 'Creștere în greutate',
            'maintain': 'Menținere greutate',
            'muscle': 'Creștere masă musculară',
            'health': 'Sănătate generală',
            'energy': 'Mai multă energie'
        };

        let summary = `Nume: ${p.name}`;
        if (p.age) summary += `, Vârstă: ${p.age} ani`;
        if (p.sex) summary += `, Sex: ${p.sex === 'M' ? 'Masculin' : 'Feminin'}`;
        if (p.height) summary += `, Înălțime: ${p.height}cm`;
        if (p.weight) summary += `, Greutate: ${p.weight}kg`;
        const bmi = this.getBMI();
        if (bmi) summary += `, BMI: ${bmi} (${this.getBMICategory()})`;
        if (p.activityLevel) summary += `, Nivel activitate: ${activityLabels[p.activityLevel] || p.activityLevel}`;
        if (p.goal) summary += `, Obiectiv: ${goalLabels[p.goal] || p.goal}`;
        if (p.conditions && p.conditions.length > 0) summary += `, Condiții medicale: ${p.conditions.join(', ')}`;
        if (p.allergies && p.allergies.length > 0) summary += `, Alergii: ${p.allergies.join(', ')}`;
        if (p.medications && p.medications.length > 0) summary += `, Medicamente: ${p.medications.join(', ')}`;
        if (p.notes) summary += `, Note: ${p.notes}`;

        return summary;
    }

    calculateHealthScore(todayHabits, goals) {
        let score = 0;
        let factors = 0;

        // Profile completeness (20%)
        const p = this.profile;
        if (p && p.name) {
            let completeness = 0;
            if (p.name) completeness++;
            if (p.age) completeness++;
            if (p.sex) completeness++;
            if (p.height && p.weight) completeness++;
            if (p.activityLevel) completeness++;
            if (p.goal) completeness++;
            score += (completeness / 6) * 20;
            factors += 20;
        }

        // BMI score (15%)
        const bmi = parseFloat(this.getBMI());
        if (bmi) {
            if (bmi >= 18.5 && bmi < 25) score += 15;
            else if (bmi >= 25 && bmi < 30) score += 8;
            else score += 3;
            factors += 15;
        }

        if (todayHabits && goals) {
            // Water (15%)
            const waterRatio = Math.min((todayHabits.water || 0) / (goals.water || 8), 1);
            score += waterRatio * 15;
            factors += 15;

            // Sleep (20%)
            const sleepHours = todayHabits.sleep || 0;
            if (sleepHours >= 7 && sleepHours <= 9) score += 20;
            else if (sleepHours >= 6) score += 12;
            else if (sleepHours > 0) score += 5;
            factors += 20;

            // Steps (15%)
            const stepsRatio = Math.min((todayHabits.steps || 0) / (goals.steps || 10000), 1);
            score += stepsRatio * 15;
            factors += 15;

            // Exercise (15%)
            const exerciseRatio = Math.min((todayHabits.exercise || 0) / (goals.exercise || 30), 1);
            score += exerciseRatio * 15;
            factors += 15;
        }

        return factors > 0 ? Math.round((score / factors) * 100) : 0;
    }
}

const profileManager = new ProfileManager();
