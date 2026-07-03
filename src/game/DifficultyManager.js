// src/game/DifficultyManager.js
export class DifficultyManager {
    constructor() {
        this.level = 1;
        this.spawnRateMultiplier = 1;
        this.speedIncrease = 0;
    }

    update(distance) {
        this.level = 1 + Math.floor(distance / 2000);
        this.spawnRateMultiplier = 1 + this.level * 0.3;
        this.speedIncrease = this.level * 2;
    }

    reset() {
        this.level = 1;
        this.spawnRateMultiplier = 1;
        this.speedIncrease = 0;
    }
}
