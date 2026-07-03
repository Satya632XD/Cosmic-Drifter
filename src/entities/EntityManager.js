import { CONFIG } from '../config/GameConfig.js';
import { Player } from './Player.js';
import { Asteroid, createAsteroidMesh } from './Asteroid.js';
import { Enemy, createEnemyMesh } from './Enemy.js';
import { Boss } from './Boss.js';
import { Pickup } from './Pickup.js';
import { ObjectPool } from '../utils/ObjectPool.js';

export class EntityManager {
    constructor(scene) {
        this.scene = scene;
        this.player = null;
        this.asteroids = [];
        this.enemies = [];
        this.boss = null;
        this.pickups = [];
        this.enemyBullets = [];
        this.asteroidPool = [];
        this.enemyPool = [];      // essential for pooling
        this.pickupPool = [];     // essential for pooling
        this.asteroidGeo = createAsteroidMesh();
        this.enemyMeshProto = createEnemyMesh();
    }

    createPlayer(startHp) {
        this.player = new Player(startHp, false);
        this.scene.add(this.player.mesh);
        return this.player;
    }

    resetAll() {
        if (this.player) this.scene.remove(this.player.mesh);
        this.player = null;
        this.asteroids.forEach(a => this.scene.remove(a.mesh));
        this.enemies.forEach(e => this.scene.remove(e.mesh));
        this.pickups.forEach(p => this.scene.remove(p.mesh));
        if (this.boss) this.scene.remove(this.boss.mesh);
        this.enemyBullets.forEach(b => this.scene.remove(b));
        this.asteroids.length = 0;
        this.enemies.length = 0;
        this.pickups.length = 0;
        this.enemyBullets.length = 0;
        this.boss = null;
    }

    spawnAsteroid(position, speed) {
        let asteroid;
        if (this.asteroidPool.length > 0) {
            asteroid = this.asteroidPool.pop();
            asteroid.reset(position, speed);
        } else {
            const mesh = createAsteroidMesh(0.8 + Math.random() * 1.2);
            this.scene.add(mesh);
            asteroid = new Asteroid(mesh, speed);
        }
        asteroid.mesh.position.copy(position);
        this.asteroids.push(asteroid);
    }

    spawnEnemy(position, type = 'fighter') {
        let enemy;
        if (this.enemyPool.length > 0) {
            enemy = this.enemyPool.pop();
            enemy.reset(position, type);
        } else {
            const mesh = createEnemyMesh();
            this.scene.add(mesh);
            enemy = new Enemy(mesh);
        }
        enemy.reset(position, type);
        this.enemies.push(enemy);
    }

    spawnPickup(position, type) {
        let pickup;
        if (this.pickupPool.length > 0) {
            pickup = this.pickupPool.pop();
            pickup.mesh.position.copy(position);
            pickup.type = type;
            pickup.alive = true;
        } else {
            pickup = new Pickup(type);
            this.scene.add(pickup.mesh);
        }
        pickup.mesh.position.copy(position);
        pickup.alive = true;
        this.pickups.push(pickup);
    }

    removeAsteroid(asteroid) {
        this.scene.remove(asteroid.mesh);
        this.asteroids = this.asteroids.filter(a => a !== asteroid);
        this.asteroidPool.push(asteroid);
    }

    removeEnemy(enemy) {
        this.scene.remove(enemy.mesh);
        this.enemies = this.enemies.filter(e => e !== enemy);
        this.enemyPool.push(enemy);
    }

    removePickup(pickup) {
        this.scene.remove(pickup.mesh);
        this.pickups = this.pickups.filter(p => p !== pickup);
        this.pickupPool.push(pickup);
    }

    updateAll(delta, player, game) {
        for (let i = this.asteroids.length-1; i >= 0; i--) {
            const a = this.asteroids[i];
            a.update(delta);
            if (a.mesh.position.z > 15) {
                this.removeAsteroid(a);
            }
        }
        for (let i = this.enemies.length-1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(delta, player.mesh.position, game);
            if (e.mesh.position.z > 15 || !e.alive) {
                this.removeEnemy(e);
            }
        }
        for (let i = this.pickups.length-1; i >= 0; i--) {
            const p = this.pickups[i];
            p.update(delta);
            if (p.mesh.position.z > 15) {
                this.removePickup(p);
            }
        }
        if (this.boss && this.boss.alive) {
            this.boss.update(delta, player.mesh.position, game);
            if (this.boss.mesh.position.z > 20) {
                this.scene.remove(this.boss.mesh);
                this.boss = null;
            }
        }
        for (let i = this.enemyBullets.length-1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
            b.userData.life -= delta;
            if (b.position.z > 15 || b.userData.life <= 0) {
                this.scene.remove(b);
                this.enemyBullets.splice(i,1);
            }
        }
    }
}
