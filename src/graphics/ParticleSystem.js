// src/graphics/ParticleSystem.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { ObjectPool } from '../utils/ObjectPool.js';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.maxParticles = 400;
        this.particles = [];
        this.geom = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.maxParticles * 3);
        this.colors = new Float32Array(this.maxParticles * 3);
        this.alive = new Float32Array(this.maxParticles);
        this.velocities = [];
        this.lifespans = [];
        this.geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geom.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        const mat = new THREE.PointsMaterial({ size: 0.3, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false });
        this.points = new THREE.Points(this.geom, mat);
        this.scene.add(this.points);
        for (let i = 0; i < this.maxParticles; i++) {
            this.velocities.push(new THREE.Vector3());
            this.lifespans.push(0);
            this.alive[i] = 0;
        }
    }

    emit(position, color, count = 15, speed = 5) {
        let emitted = 0;
        for (let i = 0; i < this.maxParticles && emitted < count; i++) {
            if (this.alive[i] <= 0) {
                this.alive[i] = 0.6 + Math.random() * 0.5;
                this.positions[i*3] = position.x;
                this.positions[i*3+1] = position.y;
                this.positions[i*3+2] = position.z;
                this.velocities[i].set((Math.random()-0.5)*speed, (Math.random()-0.5)*speed, (Math.random()-0.5)*speed);
                const c = new THREE.Color(color);
                this.colors[i*3] = c.r;
                this.colors[i*3+1] = c.g;
                this.colors[i*3+2] = c.b;
                emitted++;
            }
        }
    }

    update(delta) {
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.alive[i] > 0) {
                this.alive[i] -= delta;
                this.positions[i*3] += this.velocities[i].x * delta;
                this.positions[i*3+1] += this.velocities[i].y * delta;
                this.positions[i*3+2] += this.velocities[i].z * delta;
                if (this.alive[i] <= 0) {
                    this.positions[i*3] = this.positions[i*3+1] = this.positions[i*3+2] = 9999; // hide
                }
            }
        }
        this.geom.attributes.position.needsUpdate = true;
        this.geom.attributes.color.needsUpdate = true;
    }

    clear() {
        for (let i = 0; i < this.maxParticles; i++) this.alive[i] = 0;
    }
}
