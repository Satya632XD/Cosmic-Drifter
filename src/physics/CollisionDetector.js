import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG } from '../config/GameConfig.js';

export class CollisionDetector {
    check(player, entityManager, game) {
        if (!player) return;
        const pPos = player.mesh.position;
        const pRadius = 0.7;
        // Asteroids
        for (const asteroid of entityManager.asteroids) {
            const aPos = asteroid.mesh.position;
            const dist = pPos.distanceTo(aPos) - asteroid.radius - pRadius;
            if (dist < 0) {
                if (player.takeDamage(1)) {
                    game.effects.shake(0.6);
                    game.particles.emit(aPos, 0xaaaaaa, 20);
                    entityManager.removeAsteroid(asteroid);
                }
                if (player.health <= 0) game.gameOver();
                break;
            }
        }
        // Enemies
        for (const enemy of entityManager.enemies) {
            if (!enemy.alive) continue;
            const ePos = enemy.mesh.position;
            const dist = pPos.distanceTo(ePos) - 1.0 - pRadius;
            if (dist < 0) {
                if (player.takeDamage(1)) {
                    game.effects.shake(0.5);
                    game.particles.emit(ePos, 0xff3333, 15);
                    entityManager.removeEnemy(enemy);
                }
                if (player.health <= 0) game.gameOver();
                break;
            }
        }
        // Enemy bullets
        for (const bullet of entityManager.enemyBullets) {
            const dist = pPos.distanceTo(bullet.position) - 0.4;
            if (dist < 0) {
                game.scene.remove(bullet);
                entityManager.enemyBullets.splice(entityManager.enemyBullets.indexOf(bullet),1);
                if (player.takeDamage(1)) {
                    game.effects.shake(0.3);
                }
                if (player.health <= 0) game.gameOver();
                break;
            }
        }
        // Player projectiles vs asteroids/enemies/boss
        for (let i = player.projectilePool.length-1; i >= 0; i--) {
            const bolt = player.projectilePool[i];
            for (const asteroid of entityManager.asteroids) {
                if (bolt.position.distanceTo(asteroid.mesh.position) < 1.2) {
                    game.scene.remove(bolt);
                    player.projectilePool.splice(i,1);
                    game.particles.emit(asteroid.mesh.position, 0xaaaaaa, 10);
                    entityManager.removeAsteroid(asteroid);
                    game.stats.addKill();
                    break;
                }
            }
            for (const enemy of entityManager.enemies) {
                if (!enemy.alive) continue;
                if (bolt.position.distanceTo(enemy.mesh.position) < 1.1) {
                    game.scene.remove(bolt);
                    player.projectilePool.splice(i,1);
                    if (enemy.takeDamage(1)) {
                        game.particles.emit(enemy.mesh.position, 0xff3333, 15);
                        game.stats.addKill();
                        game.audio.playExplosion();
                        if (Math.random() < 0.4) entityManager.spawnPickup(enemy.mesh.position.clone(), 'starbit');
                    }
                    break;
                }
            }
            // Boss collision (using entityManager.boss)
            if (entityManager.boss && entityManager.boss.alive && bolt.position.distanceTo(entityManager.boss.mesh.position) < 3) {
                game.scene.remove(bolt);
                player.projectilePool.splice(i,1);
                if (entityManager.boss.takeDamage(1)) {
                    game.particles.emit(entityManager.boss.mesh.position, 0xff00ff, 30);
                    if (!entityManager.boss.alive) {
                        game.stats.addBossKill();
                        game.audio.playExplosion();
                        for (let j=0; j<10; j++) entityManager.spawnPickup(entityManager.boss.mesh.position.clone().add(new THREE.Vector3(Math.random()*4-2, Math.random()*4-2, 0)), 'starbit');
                        game.scene.remove(entityManager.boss.mesh);
                        entityManager.boss = null;
                        game.spawner.bossActive = false;
                    }
                }
                break;
            }
        }
        // Pickups (magnet effect)
        for (const pickup of entityManager.pickups) {
            if (!pickup.alive) continue;
            const range = (player.activePowerup === 'MAGNET') ? player.magnetRange : CONFIG.STARBIT_MAGNET_RANGE;
            const dist = pPos.distanceTo(pickup.mesh.position);
            if (dist < 1.0 + range) {
                if (pickup.type === 'starbit') {
                    game.stats.collectStarBit(1);
                    game.audio.playCollect();
                } else {
                    player.activatePowerup(pickup.type);
                    game.audio.playCollect();
                }
                entityManager.removePickup(pickup);
            }
        }
    }
            }
