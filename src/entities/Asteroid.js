// src/entities/Asteroid.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function createAsteroidMesh(scale = 1) {
    const geo = new THREE.IcosahedronGeometry(1.2 * scale, 1);
    const positions = geo.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        positions[i] += (Math.random() - 0.5) * 0.3 * scale;
        positions[i+1] += (Math.random() - 0.5) * 0.3 * scale;
        positions[i+2] += (Math.random() - 0.5) * 0.3 * scale;
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x888899, roughness: 0.9, metalness: 0.1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = false;
    return mesh;
}

export class Asteroid {
    constructor(mesh, speed) {
        this.mesh = mesh;
        this.speed = speed;
        this.rotationSpeed = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5);
        this.radius = 0.8 * mesh.scale.x; // approximate
        this.health = 1;
        this.alive = true;
    }

    update(delta) {
        this.mesh.position.z += this.speed * delta;
        this.mesh.rotateX(this.rotationSpeed.x * delta);
        this.mesh.rotateY(this.rotationSpeed.y * delta);
    }

    reset(position, speed) {
        this.mesh.position.copy(position);
        this.speed = speed;
        this.alive = true;
        this.health = 1;
    }
}
