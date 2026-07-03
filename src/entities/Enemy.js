// src/entities/Enemy.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG } from '../config/GameConfig.js';

export class Enemy {
    constructor(mesh) {
        this.mesh = mesh;
        this.speed = 18;
        this.health = 2;
        this.shootTimer = 0;
        this.alive = false;
        this.type = 'fighter';
    }

    update(delta, playerPos, game) {
        if (!this.alive) return;
        // Move forward + slight homing
        this.mesh.position.z += this.speed * delta;
        const dx = playerPos.x - this.mesh.position.x;
        const dy = playerPos.y - this.mesh.position.y;
        this.mesh.position.x += dx * 0.5 * delta;
        this.mesh.position.y += dy * 0.5 * delta;
        // Shoot
        this.shootTimer -= delta;
        if (this.shootTimer <= 0) {
            this.shootTimer = 0.8 + Math.random() * 1.2;
            const bolt = new THREE.Mesh(
                new THREE.SphereGeometry(0.15, 4, 4),
                new THREE.MeshBasicMaterial({ color: 0xff4444 })
            );
            bolt.position.copy(this.mesh.position);
            bolt.userData.velocity = new THREE.Vector3(0, 0, -25);
            bolt.userData.life = 3;
            game.scene.add(bolt);
            game.entityManager.enemyBullets.push(bolt);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.alive = false;
            return true;
        }
        return false;
    }

    reset(position, type) {
        this.mesh.position.copy(position);
        this.alive = true;
        this.type = type;
        this.health = type === 'fighter' ? 2 : 1;
        this.speed = 15 + Math.random() * 10;
        this.shootTimer = 1;
        this.mesh.visible = true;
    }
}

export function createEnemyMesh() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
        new THREE.ConeGeometry(0.7, 1.5, 4),
        new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: new THREE.Color(0x330000) })
    );
    body.rotation.x = Math.PI/2;
    group.add(body);
    // Glow eyes
    const eyeGeo = new THREE.SphereGeometry(0.15);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
    eye1.position.set(0.3, 0.1, -0.5);
    group.add(eye1);
    const eye2 = eye1.clone();
    eye2.position.x = -0.3;
    group.add(eye2);
    return group;
}
