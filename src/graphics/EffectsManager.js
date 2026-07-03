// src/graphics/EffectsManager.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class EffectsManager {
    constructor(camera) {
        this.camera = camera;
        this.shakeAmount = 0;
        this.shakeDecay = 5;
        this.originalPos = camera.position.clone();
    }

    shake(intensity = 0.5) {
        this.shakeAmount = Math.max(this.shakeAmount, intensity);
    }

    update(delta) {
        if (this.shakeAmount > 0.001) {
            const x = (Math.random() - 0.5) * this.shakeAmount * 2;
            const y = (Math.random() - 0.5) * this.shakeAmount * 2;
            this.camera.position.x = this.originalPos.x + x;
            this.camera.position.y = this.originalPos.y + y;
            this.shakeAmount *= Math.exp(-this.shakeDecay * delta);
        } else {
            this.camera.position.copy(this.originalPos);
            this.shakeAmount = 0;
        }
    }

    reset() {
        this.shakeAmount = 0;
        this.camera.position.copy(this.originalPos);
    }
}
