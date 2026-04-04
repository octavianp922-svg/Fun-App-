// ===== VitaLife v2 - Apple Health Data Import =====

class HealthImporter {
    constructor() {
        this.data = null;
    }

    async processFile(file) {
        if (file.name.endsWith('.zip')) {
            return await this.processZip(file);
        } else if (file.name.endsWith('.xml')) {
            return await this.processXML(file);
        }
        throw new Error('Format nesuportat. Urcă fișierul ZIP sau XML exportat din Health.');
    }

    async processZip(file) {
        // For ZIP files, we'll try to read with basic approach
        // In reality, Apple Health exports as a ZIP containing export.xml
        // We'll guide user to extract the XML first if ZIP parsing isn't available
        try {
            // Try using JSZip if available, otherwise ask for XML
            const text = await file.text();
            if (text.includes('<?xml') || text.includes('<HealthData')) {
                return await this.parseHealthXML(text);
            }
        } catch (e) {
            // ZIP binary - can't read directly
        }

        return {
            error: true,
            message: 'Nu pot citi fișierul ZIP direct. Te rog:\n1. Dezarhivează fișierul ZIP pe telefon\n2. Găsește fișierul "export.xml" din interior\n3. Urcă fișierul XML aici'
        };
    }

    async processXML(file) {
        const text = await file.text();
        return await this.parseHealthXML(text);
    }

    async parseHealthXML(xmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');

        const records = doc.querySelectorAll('Record');
        const workouts = doc.querySelectorAll('Workout');

        const summary = {
            totalRecords: records.length,
            dateRange: { start: null, end: null },
            steps: { total: 0, dailyAvg: 0, days: 0 },
            heartRate: { avg: 0, min: 999, max: 0, readings: 0 },
            sleep: { avgHours: 0, totalDays: 0 },
            weight: { latest: null, unit: 'kg' },
            height: { latest: null, unit: 'cm' },
            activeEnergy: { dailyAvg: 0, total: 0 },
            restingHeartRate: { avg: 0, readings: 0 },
            vo2max: { latest: null },
            bloodPressure: { systolic: null, diastolic: null },
            workouts: { total: workouts.length, types: {} },
            rawSummary: ''
        };

        const stepsByDay = {};
        const sleepDays = {};
        let hrSum = 0;
        let rhrSum = 0;

        records.forEach(rec => {
            const type = rec.getAttribute('type');
            const value = parseFloat(rec.getAttribute('value'));
            const date = rec.getAttribute('startDate');

            if (date) {
                const d = new Date(date);
                if (!summary.dateRange.start || d < new Date(summary.dateRange.start)) summary.dateRange.start = date;
                if (!summary.dateRange.end || d > new Date(summary.dateRange.end)) summary.dateRange.end = date;
            }

            const dayKey = date ? date.substring(0, 10) : null;

            switch (type) {
                case 'HKQuantityTypeIdentifierStepCount':
                    if (dayKey) {
                        stepsByDay[dayKey] = (stepsByDay[dayKey] || 0) + value;
                    }
                    break;
                case 'HKQuantityTypeIdentifierHeartRate':
                    if (!isNaN(value)) {
                        hrSum += value;
                        summary.heartRate.readings++;
                        if (value < summary.heartRate.min) summary.heartRate.min = value;
                        if (value > summary.heartRate.max) summary.heartRate.max = value;
                    }
                    break;
                case 'HKQuantityTypeIdentifierRestingHeartRate':
                    if (!isNaN(value)) {
                        rhrSum += value;
                        summary.restingHeartRate.readings++;
                    }
                    break;
                case 'HKQuantityTypeIdentifierBodyMass':
                    summary.weight.latest = value;
                    break;
                case 'HKQuantityTypeIdentifierHeight':
                    summary.height.latest = value * 100; // m to cm
                    break;
                case 'HKQuantityTypeIdentifierVO2Max':
                    summary.vo2max.latest = value;
                    break;
                case 'HKQuantityTypeIdentifierActiveEnergyBurned':
                    summary.activeEnergy.total += value;
                    break;
                case 'HKCategoryTypeIdentifierSleepAnalysis':
                    if (dayKey) {
                        const start = new Date(rec.getAttribute('startDate'));
                        const end = new Date(rec.getAttribute('endDate'));
                        const hours = (end - start) / 3600000;
                        if (hours > 0 && hours < 24) {
                            sleepDays[dayKey] = (sleepDays[dayKey] || 0) + hours;
                        }
                    }
                    break;
            }
        });

        // Process steps
        const stepDays = Object.values(stepsByDay);
        summary.steps.days = stepDays.length;
        summary.steps.total = stepDays.reduce((a, b) => a + b, 0);
        summary.steps.dailyAvg = stepDays.length > 0 ? Math.round(summary.steps.total / stepDays.length) : 0;

        // Process heart rate
        if (summary.heartRate.readings > 0) {
            summary.heartRate.avg = Math.round(hrSum / summary.heartRate.readings);
        }
        if (summary.restingHeartRate.readings > 0) {
            summary.restingHeartRate.avg = Math.round(rhrSum / summary.restingHeartRate.readings);
        }

        // Process sleep
        const sleepValues = Object.values(sleepDays).filter(h => h >= 2 && h <= 16);
        summary.sleep.totalDays = sleepValues.length;
        summary.sleep.avgHours = sleepValues.length > 0 ?
            (sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1) : 0;

        // Active energy daily avg
        if (stepDays.length > 0) {
            summary.activeEnergy.dailyAvg = Math.round(summary.activeEnergy.total / stepDays.length);
        }

        // Process workouts
        workouts.forEach(w => {
            const type = w.getAttribute('workoutActivityType')?.replace('HKWorkoutActivityType', '') || 'Other';
            summary.workouts.types[type] = (summary.workouts.types[type] || 0) + 1;
        });

        // Build text summary for AI
        summary.rawSummary = this.buildTextSummary(summary);

        this.data = summary;
        await storage.put(STORES.SETTINGS, { id: 'healthData', summary: summary });

        return summary;
    }

    buildTextSummary(s) {
        let text = '=== Date Apple Health ===\n';
        if (s.dateRange.start) text += `Perioada: ${s.dateRange.start?.substring(0, 10)} — ${s.dateRange.end?.substring(0, 10)}\n`;
        text += `Total înregistrări: ${s.totalRecords.toLocaleString()}\n\n`;

        if (s.steps.dailyAvg > 0) text += `Pași zilnici (medie): ${s.steps.dailyAvg.toLocaleString()} (${s.steps.days} zile)\n`;
        if (s.heartRate.avg > 0) text += `Ritm cardiac: medie ${s.heartRate.avg} bpm, min ${s.heartRate.min}, max ${s.heartRate.max}\n`;
        if (s.restingHeartRate.avg > 0) text += `Ritm cardiac în repaus: ${s.restingHeartRate.avg} bpm\n`;
        if (s.sleep.avgHours > 0) text += `Somn (medie): ${s.sleep.avgHours} ore/noapte (${s.sleep.totalDays} nopți)\n`;
        if (s.weight.latest) text += `Greutate: ${s.weight.latest} kg\n`;
        if (s.height.latest) text += `Înălțime: ${Math.round(s.height.latest)} cm\n`;
        if (s.vo2max.latest) text += `VO2 Max: ${s.vo2max.latest} mL/kg/min\n`;
        if (s.activeEnergy.dailyAvg > 0) text += `Energie activă zilnic (medie): ${s.activeEnergy.dailyAvg} kcal\n`;

        if (s.workouts.total > 0) {
            text += `\nAntrenamente totale: ${s.workouts.total}\n`;
            for (const [type, count] of Object.entries(s.workouts.types)) {
                text += `  - ${type}: ${count}x\n`;
            }
        }

        return text;
    }

    renderStats(summary) {
        const container = document.getElementById('health-stats');
        const stats = [];

        if (summary.dateRange.start) {
            stats.push(['Perioada', `${summary.dateRange.start?.substring(0, 10)} — ${summary.dateRange.end?.substring(0, 10)}`]);
        }
        if (summary.steps.dailyAvg) stats.push(['Pași/zi (medie)', summary.steps.dailyAvg.toLocaleString()]);
        if (summary.heartRate.avg) stats.push(['Ritm cardiac mediu', `${summary.heartRate.avg} bpm`]);
        if (summary.restingHeartRate.avg) stats.push(['Ritm cardiac repaus', `${summary.restingHeartRate.avg} bpm`]);
        if (summary.sleep.avgHours > 0) stats.push(['Somn mediu', `${summary.sleep.avgHours} ore`]);
        if (summary.weight.latest) stats.push(['Greutate', `${summary.weight.latest} kg`]);
        if (summary.vo2max.latest) stats.push(['VO2 Max', `${summary.vo2max.latest}`]);
        if (summary.activeEnergy.dailyAvg) stats.push(['Energie activă/zi', `${summary.activeEnergy.dailyAvg} kcal`]);
        if (summary.workouts.total) stats.push(['Antrenamente totale', summary.workouts.total]);

        container.innerHTML = stats.map(([label, value]) =>
            `<div class="health-stat"><span class="health-stat-label">${label}</span><span class="health-stat-value">${value}</span></div>`
        ).join('');

        document.getElementById('health-summary').classList.remove('hidden');
    }

    async loadSaved() {
        const saved = await storage.get(STORES.SETTINGS, 'healthData');
        if (saved?.summary) {
            this.data = saved.summary;
            this.renderStats(saved.summary);
            return saved.summary;
        }
        return null;
    }
}

const healthImporter = new HealthImporter();
