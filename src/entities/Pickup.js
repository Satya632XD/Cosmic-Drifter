// src/entities/Pickup.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { POWERUP_TYPES } from '../config/GameConfig.js';

export class Pickup {
    constructor(type) {
        this.type = type;
        this.mesh = this.createMesh(type);
        this.alive = false;
    }

    createMesh(type) {
        const group = new THREE.Group();
        const geo = new THREE.OctahedronGeometry(0.5);
        const mat = new THREE.MeshStandardMaterial({ 
            color: POWERUP_TYPES[type]?.color || 0xffffff, 
            emissive: new THREE.Color(POWERUP_TYPES[type]?.color).multiplyScalar(0.5),
            roughness: 0.2,
            metalness: 0.3
        });
        const core = new THREE.Mesh(geo, mat);
        group.add(core);
        // Orbit motes
        for (let i = 0; i < 3; i++) {
            const mote = new THREE.Mesh(new THREE.SphereGeometry(0.08), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            mote.position.set(Math.cos(i*2.1)*0.7, Math.sin(i*2.1)*0.7, 0);
            group.add(mote);
        }
        return group;
    }

    update(delta) {
        this.mesh.position.z += 20 * delta;
        this.mesh.rotation.y += 2 * delta;
        for (const child of this.mesh.children) {
            if (child !== this.mesh.children[0]) continue; // motes rotate around
        }
    }
}
