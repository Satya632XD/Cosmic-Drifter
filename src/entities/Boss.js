// src/entities/Boss.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Boss {
    constructor(difficulty) {
        this.mesh = this.createMesh();
        this.alive = false;
        this.health = 0;
        this.maxHealth = 0;
        this.phase = 1;
        this.shootTimer = 0;
        this.spawned = false;
    }

    createMesh() {
        const group = new THREE.Group();
        const core = new THREE.Mesh(
            new THREE.OctahedronGeometry(2, 0),
            new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: new THREE.Color(0x330066), roughness: 0.2, metalness: 0.9 })
        );
        group.add(core);
        // Rings
        const ringGeo = new THREE.TorusGeometry(2.2, 0.1, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI/2;
        group.add(ring1);
        const ring2 = ring1.clone();
        ring2.rotation.z = Math.PI/3;
        group.add(ring2);
        return group;
    }

    spawn(position, difficulty) {
        this.mesh.position.copy(position);
        this.alive = true;
        this.health = 30 + difficulty.level * 10;
        this.maxHealth = this.health;
        this.phase = 1;
        this.shootTimer = 0;
        this.mesh.visible = true;
    }

    update(delta, playerPos, game) {
        if (!this.alive) return;
        // Move slowly forward
        this.mesh.position.z += 8 * delta;
        this.mesh.rotation.y += 0.5 * delta;
        // Phases
        if (this.phase === 1) {
            this.shootTimer -= delta;
            if (this.shootTimer <= 0) {
                this.shootTimer = 0.2;
                // Fire rotating beams
                const angle = Date.now() * 0.003;
                for (let i = 0; i < 8; i++) {
                    const a = angle + (i * Math.PI*2/8);
                    const bolt = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.1, 0.1, 3, 4),
                        new THREE.MeshBasicMaterial({ color: 0xff00ff })
                    );
                    bolt.position.copy(this.mesh.position);
                    bolt.position.x += Math.cos(a) * 2;
                    bolt.position.y += Math.sin(a) * 2;
                    bolt.userData.velocity = new THREE.Vector3(Math.cos(a)*12, Math.sin(a)*12, -5);
                    bolt.userData.life = 2;
                    game.scene.add(bolt);
                    game.entityManager.enemyBullets.push(bolt);
                }
            }
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
}
