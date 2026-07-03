// src/game/ProgressionManager.js
const STORAGE_KEY = 'cosmic_drifter_save';

export class ProgressionManager {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : this.defaultData();
        } catch { return this.defaultData(); }
    }

    defaultData() {
        return {
            starBits: 0,
            highScore: 0,
            upgrades: {
                hull: 0,
                magnet: 0,
                engine: 0,
                shield: 0,
                lucky: 0,
            },
            settings: {
                masterVol: 70,
                musicVol: 60,
                sfxVol: 80,
            }
        };
    }

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }

    getStarbits() { return this.data.starBits; }
    addStarbits(amount) { this.data.starBits += amount; this.save(); }
    spendStarbits(amount) { if (this.data.starBits >= amount) { this.data.starBits -= amount; this.save(); return true; } return false; }

    getUpgradeLevel(key) { return this.data.upgrades[key] || 0; }
    setUpgradeLevel(key, level) { this.data.upgrades[key] = level; this.save(); }

    getSetting(key, defaultVal) { return this.data.settings[key] ?? defaultVal; }
    setSetting(key, value) { this.data.settings[key] = value; this.save(); }

    checkHighScore(score) { if (score > this.data.highScore) { this.data.highScore = score; this.save(); } }
}
