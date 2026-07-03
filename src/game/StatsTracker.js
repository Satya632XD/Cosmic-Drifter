// src/game/StatsTracker.js
export class StatsTracker {
    constructor() {
        this.reset();
    }
    reset() {
        this.distance = 0;
        this.starBits = 0;
        this.kills = 0;
        this.bossKills = 0;
    }
    addKill() { this.kills++; }
    addBossKill() { this.bossKills++; }
    collectStarBit(amount) { this.starBits += amount; }
}
