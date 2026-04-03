// ===== VitaLife - Habits Tracker =====

class HabitsManager {
    constructor() {
        this.currentDate = new Date();
        this.todayData = null;
    }

    getDateKey(date) {
        const d = date || this.currentDate;
        return d.toISOString().split('T')[0];
    }

    getDefaultData(dateKey) {
        return {
            date: dateKey,
            water: 0,
            steps: 0,
            sleep: 0,
            exercise: 0,
            exerciseType: '',
            meals: [],
            mood: 0,
            notes: ''
        };
    }

    async loadDay(date) {
        const dateKey = this.getDateKey(date);
        let data = await storage.get(STORES.HABITS, dateKey);
        if (!data) {
            data = this.getDefaultData(dateKey);
        }
        this.todayData = data;
        return data;
    }

    async saveDay() {
        if (!this.todayData) return;
        await storage.put(STORES.HABITS, this.todayData);
    }

    async addWater(amount = 1) {
        if (!this.todayData) await this.loadDay(this.currentDate);
        this.todayData.water = Math.max(0, (this.todayData.water || 0) + amount);
        await this.saveDay();
        return this.todayData.water;
    }

    async setSteps(steps) {
        if (!this.todayData) await this.loadDay(this.currentDate);
        this.todayData.steps = Math.max(0, steps);
        await this.saveDay();
        return this.todayData.steps;
    }

    async setSleep(hours) {
        if (!this.todayData) await this.loadDay(this.currentDate);
        this.todayData.sleep = Math.max(0, Math.min(24, hours));
        await this.saveDay();
        return this.todayData.sleep;
    }

    async addExercise(minutes, type) {
        if (!this.todayData) await this.loadDay(this.currentDate);
        this.todayData.exercise = (this.todayData.exercise || 0) + minutes;
        this.todayData.exerciseType = type;
        await this.saveDay();
        return this.todayData.exercise;
    }

    async setMood(level) {
        if (!this.todayData) await this.loadDay(this.currentDate);
        this.todayData.mood = level;
        await this.saveDay();
        return this.todayData.mood;
    }

    async addMeal(type, description) {
        if (!this.todayData) await this.loadDay(this.currentDate);
        if (!this.todayData.meals) this.todayData.meals = [];
        this.todayData.meals.push({
            id: Date.now(),
            type,
            description,
            time: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
        });
        await this.saveDay();
        return this.todayData.meals;
    }

    async removeMeal(mealId) {
        if (!this.todayData) return;
        this.todayData.meals = this.todayData.meals.filter(m => m.id !== mealId);
        await this.saveDay();
        return this.todayData.meals;
    }

    navigateDay(direction) {
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + direction);

        // Don't go into the future
        if (newDate > new Date()) return false;

        this.currentDate = newDate;
        return true;
    }

    formatDate(date) {
        const d = date || this.currentDate;
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Astăzi';
        if (d.toDateString() === yesterday.toDateString()) return 'Ieri';

        return d.toLocaleDateString('ro-RO', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    }

    async getWeekSummary() {
        const days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const data = await storage.get(STORES.HABITS, this.getDateKey(d));
            days.push(data || this.getDefaultData(this.getDateKey(d)));
        }
        return days;
    }

    getHabitsSummary() {
        if (!this.todayData) return '';
        const d = this.todayData;
        let summary = `Date: ${d.date}`;
        summary += `, Apă: ${d.water} pahare`;
        summary += `, Pași: ${d.steps}`;
        summary += `, Somn: ${d.sleep} ore`;
        summary += `, Exerciții: ${d.exercise} min`;
        if (d.mood > 0) {
            const moods = ['', 'Foarte rău', 'Rău', 'OK', 'Bine', 'Foarte bine'];
            summary += `, Dispoziție: ${moods[d.mood]}`;
        }
        if (d.meals && d.meals.length > 0) {
            summary += `, Mese: ${d.meals.map(m => `${m.type}: ${m.description}`).join('; ')}`;
        }
        return summary;
    }
}

const habitsManager = new HabitsManager();
