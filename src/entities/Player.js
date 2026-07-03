// src/entities/Player.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG, POWERUP_TYPES } from '../config/GameConfig.js';

export class Player {
    constructor(startHp, hasShield) {
        this.mesh = this.createMesh();
        this.speed = CONFIG.PLAYER_SPEED;
        this.baseSpeed = CONFIG.PLAYER_SPEED;
        this.fireRate = CONFIG.PLAYER_FIRE_RATE;
        this.baseFireRate = CONFIG.PLAYER_FIRE_RATE;
        this.fireCooldown = 0;
        this.health = startHp;
        this.maxHealth = startHp;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.shieldActive = hasShield;
        this.shieldMesh = null;
        if (this.shieldActive) this.addShieldVisual();
        this.activePowerup = null;
        this.powerupTimer = 0;
        this.projectilePool = [];
        this.magnetRange = CONFIG.STARBIT_MAGNET_RANGE;
        // Position offset from camera (player moves in XY, Z is fixed at 0 in local space, camera follows)
        this.mesh.position.set(0, 0, 0);
    }

    createMesh() {
        const group = new THREE.Group();
        const bodyGeo = new THREE.ConeGeometry(0.6, 2, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: new THREE.Color(0x004466), roughness: 0.3, metalness: 0.8 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = Math.PI/2;
        group.add(body);
        // Wings
        const wingGeo = new THREE.BoxGeometry(1.8, 0.1, 0.6);
        const wingMat = new THREE.MeshStandardMaterial({ color: 0x0088cc, emissive: new THREE.Color(0x001122), roughness: 0.5, metalness: 0.9 });
        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.set(-0.7, -0.3, 0);
        group.add(leftWing);
        const rightWing = leftWing.clone();
        rightWing.position.set(0.7, -0.3, 0);
        group.add(rightWing);
        // Engine glow
        const glowGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(0, -0.9, 0);
        group.add(glow);
        this.engineGlow = glow;
        return group;
    }

    addShieldVisual() {
        const shieldGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.mesh.add(this.shieldMesh);
    }

    update(delta, moveDir, isShooting, game) {
        // Movement
        const spd = this.speed * delta;
        this.mesh.position.x += moveDir.x * spd;
        this.mesh.position.y += moveDir.y * spd;
        this.mesh.position.x = Math.max(CONFIG.PLAY_AREA.X_MIN, Math.min(CONFIG.PLAY_AREA.X_MAX, this.mesh.position.x));
        this.mesh.position.y = Math.max(CONFIG.PLAY_AREA.Y_MIN, Math.min(CONFIG.PLAY_AREA.Y_MAX, this.mesh.position.y));

        // Engine pulse
        this.engineGlow.scale.setScalar(1 + 0.2 * Math.sin(Date.now() * 0.02));

        // Firing
        this.fireCooldown -= delta;
        if (isShooting && this.fireCooldown <= 0) {
            this.fireCooldown = this.fireRate;
            this.shoot(game);
        }

        // Powerup timer
        if (this.activePowerup) {
            this.powerupTimer -= delta;
            if (this.powerupTimer <= 0) {
                this.deactivatePowerup();
            }
        }

        // Invincibility
        if (this.invincible) {
            this.invincibleTimer -= delta;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
                this.mesh.visible = true;
            } else {
                this.mesh.visible = Math.sin(this.invincibleTimer * 20) > 0;
            }
        }

        // Move projectiles
        for (let i = this.projectilePool.length-1; i >= 0; i--) {
            const p = this.projectilePool[i];
            p.position.z -= CONFIG.PLAYER_PROJECTILE_SPEED * delta;
            if (p.position.z < -40) {
                game.scene.remove(p);
                this.projectilePool.splice(i, 1);
            }
        }
    }

    shoot(game) {
        const scene = game.scene;
        if (this.activePowerup === 'LASER') {
            // beam handled separately
            return;
        }
        const spread = (this.activePowerup === 'SPREAD') ? 0.3 : 0;
        const angles = [0];
        if (spread) angles.push(-0.15, 0.15, -0.3, 0.3);
        for (const a of angles) {
            const bolt = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.2, 1),
                new THREE.MeshBasicMaterial({ color: 0x00ffff })
            );
            bolt.position.copy(this.mesh.position);
            bolt.position.z -= 1.5;
            bolt.rotation.z = a;
            scene.add(bolt);
            this.projectilePool.push(bolt);
        }
        game.audio.playShoot();
    }

    activatePowerup(type) {
        this.deactivatePowerup();
        this.activePowerup = type;
        this.powerupTimer = CONFIG.POWERUP_DURATION;
        switch (type) {
            case 'SPEED': this.speed = this.baseSpeed * 1.5; break;
            case 'SPREAD': this.fireRate = this.baseFireRate * 1.3; break;
            case 'LASER': this.fireRate = 0; break; // handled elsewhere
            case 'SHIELD': if (!this.shieldActive) { this.shieldActive = true; this.addShieldVisual(); } break;
            case 'MAGNET': this.magnetRange = CONFIG.STARBIT_MAGNET_RANGE * 2; break;
        }
    }

    deactivatePowerup() {
        if (this.activePowerup === 'SPEED') this.speed = this.baseSpeed;
        if (this.activePowerup === 'SPREAD') this.fireRate = this.baseFireRate;
        // Shield remains until hit
        if (this.activePowerup === 'MAGNET') this.magnetRange = CONFIG.STARBIT_MAGNET_RANGE;
        this.activePowerup = null;
        this.powerupTimer = 0;
    }

    takeDamage(amount) {
        if (this.invincible) return false;
        if (this.shieldActive) {
            this.shieldActive = false;
            if (this.shieldMesh) {
                this.mesh.remove(this.shieldMesh);
                this.shieldMesh = null;
            }
            return true; // shield absorbed
        }
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            return false; // dead
        }
        this.invincible = true;
        this.invincibleTimer = CONFIG.PLAYER_INVINCIBLE_TIME;
        return true;
    }
}
