// src/game/Spawner.js
import { CONFIG } from '../config/GameConfig.js';

export class Spawner {
    constructor(scene, entityManager) {
        this.scene = scene;
        this.em = entityManager;
        this.asteroidTimer = 0;
        this.enemyTimer = 0;
        this.pickupTimer = 0;
        this.bossActive = false;
    }

    reset() {
        this.asteroidTimer = 0;
        this.enemyTimer = 2;
        this.pickupTimer = 5;
        this.bossActive = false;
    }

    update(delta, difficulty, distance) {
        this.asteroidTimer -= delta;
        this.enemyTimer -= delta;
        this.pickupTimer -= delta;

        if (this.asteroidTimer <= 0) {
            this.asteroidTimer = CONFIG.ASTEROID_SPAWN_RATE / difficulty.spawnRateMultiplier;
            const x = (Math.random() - 0.5) * 25;
            const y = (Math.random() - 0.5) * 12;
            const z = -30 - Math.random() * 10;
            this.em.spawnAsteroid(new THREE.Vector3(x, y, z), CONFIG.ASTEROID_SPEED + difficulty.speedIncrease);
        }
        if (this.enemyTimer <= 0 && !this.bossActive) {
            this.enemyTimer = CONFIG.ENEMY_SPAWN_RATE / difficulty.spawnRateMultiplier;
            const x = (Math.random() - 0.5) * 20;
            const y = (Math.random() - 0.5) * 10;
            this.em.spawnEnemy(new THREE.Vector3(x, y, -25), 'fighter');
        }
        if (this.pickupTimer <= 0) {
            this.pickupTimer = 8 + Math.random() * 10;
            const types = ['starbit','starbit','SPREAD','SPEED','SHIELD','MAGNET','LASER'];
            const type = types[Math.floor(Math.random() * types.length)];
            const pos = new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*10, -25);
            this.em.spawnPickup(pos, type);
        }
    }

    spawnBoss(difficulty) {
        if (this.bossActive) return;
        this.bossActive = true;
        const boss = new Boss(difficulty);
        boss.spawn(new THREE.Vector3(0, 0, -30), difficulty);
        this.em.boss = boss;
        this.scene.add(boss.mesh);
        // Boss defeated callback handled in collision
    }
}
