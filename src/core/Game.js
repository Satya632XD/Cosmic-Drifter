// src/core/Game.js
import { CONFIG } from '../config/GameConfig.js';
import { InputManager } from '../input/InputManager.js';
import { Renderer } from '../graphics/Renderer.js';
import { EffectsManager } from '../graphics/EffectsManager.js';
import { ParticleSystem } from '../graphics/ParticleSystem.js';
import { EntityManager } from '../entities/EntityManager.js';
import { CollisionDetector } from '../physics/CollisionDetector.js';
import { AudioManager } from '../audio/AudioManager.js';
import { UIManager } from '../ui/UIManager.js';
import { Screens } from '../ui/Screens.js';
import { Spawner } from '../game/Spawner.js';
import { DifficultyManager } from '../game/DifficultyManager.js';
import { ProgressionManager } from '../game/ProgressionManager.js';
import { StatsTracker } from '../game/StatsTracker.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Game {
    constructor() {
        this.state = 'menu';
        this.clock = new THREE.Clock();
        this.timeScale = 1;
        this.distance = 0;
    }

    async init() {
        this.renderer = new Renderer();
        this.scene = this.renderer.scene;
        this.camera = this.renderer.camera;

        this.input = new InputManager(this.renderer.domElement);
        this.audio = new AudioManager();
        this.effects = new EffectsManager(this.camera);
        this.particles = new ParticleSystem(this.scene);
        this.entityManager = new EntityManager(this.scene);
        this.collision = new CollisionDetector();
        this.spawner = new Spawner(this.scene, this.entityManager);
        this.difficulty = new DifficultyManager();
        this.progression = new ProgressionManager();
        this.stats = new StatsTracker();
        this.ui = new UIManager(this);
        this.screens = new Screens(this);

        this.audio.setMasterVolume(this.progression.getSetting('masterVol', 70) / 100);
        this.audio.setMusicVolume(this.progression.getSetting('musicVol', 60) / 100);
        this.audio.setSFXVolume(this.progression.getSetting('sfxVol', 80) / 100);
        this.audio.startMusic();

        this.lastTime = performance.now();
        this.animate();
        this.screens.showMenu();
        window.addEventListener('resize', () => this.onResize());
    }

    startGame() {
        this.state = 'playing';
        this.timeScale = 1;
        this.distance = 0;
        this.stats.reset();
        this.entityManager.resetAll();
        this.player = this.entityManager.createPlayer(this.progression.getUpgradeLevel('hull'));
        this.player.shieldActive = this.progression.getUpgradeLevel('shield') > 0;
        this.spawner.reset();
        this.difficulty.reset();
        this.particles.clear();
        this.effects.reset();
        // Camera initial position
        this.camera.position.set(0, 2, -10);
        this.camera.lookAt(0, 0, 30);
        this.ui.showHUD();
        this.screens.hideAll();
    }

    gameOver() {
        this.state = 'gameover';
        this.timeScale = 0;
        this.progression.addStarbits(this.stats.starBits);
        this.progression.checkHighScore(this.stats.distance);
        this.screens.showGameOver(this.stats.distance, this.stats.starBits);
        this.audio.playLose();
    }

    quitToMenu() {
        this.state = 'menu';
        this.timeScale = 1;
        this.screens.showMenu();
        this.ui.hideHUD();
    }

    update() {
        const rawDelta = this.clock.getDelta();
        const delta = Math.min(rawDelta, 0.05) * this.timeScale;

        if (this.state === 'playing') {
            const move = this.input.getMovement();
            this.player.update(delta, move, this.input.isShooting(), this);

            // Distance increases proportionally to forward speed
            this.distance += CONFIG.ASTEROID_SPEED * delta;
            this.stats.distance = Math.floor(this.distance);

            this.difficulty.update(this.distance);
            this.spawner.update(delta, this.difficulty, this.distance);
            this.entityManager.updateAll(delta, this.player, this);
            this.collision.check(this.player, this.entityManager, this);

            // --- NEW CAMERA LOGIC ---
            // Camera stays at a fixed world offset behind and slightly above the player,
            // but lags horizontally for smoothness.
            const playerPos = this.player.mesh.position;
            const targetCamX = playerPos.x * 0.4;   // lateral lag factor
            const targetCamY = playerPos.y * 0.3 + 3.0; // height offset
            const targetCamZ = playerPos.z - 10;        // behind player

            // Smooth interpolation
            const lerpFactor = 1 - Math.exp(-4 * delta); // smooth damping
            this.camera.position.x += (targetCamX - this.camera.position.x) * lerpFactor;
            this.camera.position.y += (targetCamY - this.camera.position.y) * lerpFactor;
            this.camera.position.z += (targetCamZ - this.camera.position.z) * lerpFactor;

            // Look at a point ahead of the player
            const lookAtPoint = new THREE.Vector3(
                playerPos.x * 0.2,
                playerPos.y * 0.2 + 0.5,
                playerPos.z + 30
            );
            this.camera.lookAt(lookAtPoint);

            // Slight FOV change when boosting (speed powerup)
            this.camera.fov = 70 + (this.player.activePowerup === 'SPEED' ? 5 : 0);
            this.camera.updateProjectionMatrix();

            this.effects.update(delta);
            this.particles.update(delta);
            this.ui.updateHUD(this.player, this.stats);

            // Boss spawn check
            if (this.distance > CONFIG.BOSS_DISTANCE && !this.spawner.bossActive) {
                this.spawner.spawnBoss(this.difficulty);
            }
        }

        this.audio.update(delta);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera, this.renderer.bloomPass);
    }

    onResize() {
        this.renderer.onResize();
    }
}
