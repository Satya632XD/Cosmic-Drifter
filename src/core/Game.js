// src/core/Game.js
import { CONFIG, UPGRADES } from '../config/GameConfig.js';
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
        this.cameraLookTarget = new THREE.Vector3();
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

        this.audio.startMusic();
        this.audio.setMasterVolume(this.progression.getSetting('masterVol', 70) / 100);
        this.audio.setMusicVolume(this.progression.getSetting('musicVol', 60) / 100);
        this.audio.setSFXVolume(this.progression.getSetting('sfxVol', 80) / 100);
        this.lastTime = performance.now();
        this.animate();
        this.screens.showMenu();
        window.addEventListener('resize', () => this.onResize());
    }

    startGame() {
        this.audio.resume();
        this.state = 'playing';
        this.timeScale = 1;
        this.distance = 0;
        this.stats.reset();
        this.entityManager.resetAll();
        const hullLevel = this.progression.getUpgradeLevel('hull');
        this.player = this.entityManager.createPlayer(CONFIG.START_HEALTH + UPGRADES.hull.effect(hullLevel));
        this.player.shieldActive = this.progression.getUpgradeLevel('shield') > 0;
        if (this.player.shieldActive) this.player.addShieldVisual();
        const engineMultiplier = UPGRADES.engine.effect(this.progression.getUpgradeLevel('engine'));
        this.player.speed *= engineMultiplier;
        this.player.baseSpeed *= engineMultiplier;
        const magnetMultiplier = UPGRADES.magnet.effect(this.progression.getUpgradeLevel('magnet'));
        this.player.baseMagnetRange *= magnetMultiplier;
        this.player.magnetRange = this.player.baseMagnetRange;
        this.player.starBitMultiplier = UPGRADES.lucky.effect(this.progression.getUpgradeLevel('lucky'));
        this.spawner.reset();
        this.difficulty.reset();
        this.particles.clear();
        this.effects.reset();
        // Camera initial position
        this.camera.position.set(0, 3.6, -10.5);
        this.cameraLookTarget.set(0, 0.35, 16);
        this.camera.lookAt(this.cameraLookTarget);
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

    pauseGame() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        this.timeScale = 0;
        this.screens.showPause();
    }

    resumeGame() {
        if (this.state !== 'paused') return;
        this.state = 'playing';
        this.timeScale = 1;
        this.screens.hideAll();
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

            // Responsive chase camera: it stays behind the craft, follows its lateral
            // movement, and looks slightly ahead so the route remains readable.
            const playerPos = this.player.mesh.position;
            const targetCamX = playerPos.x * 0.82;
            const targetCamY = playerPos.y * 0.58 + 3.6;
            const targetCamZ = playerPos.z - 10.5;

            // A short, damped delay gives movement weight without leaving the ship behind.
            const lerpFactor = 1 - Math.exp(-7 * delta);
            this.camera.position.x += (targetCamX - this.camera.position.x) * lerpFactor;
            this.camera.position.y += (targetCamY - this.camera.position.y) * lerpFactor;
            this.camera.position.z += (targetCamZ - this.camera.position.z) * lerpFactor;

            const targetLookX = playerPos.x * 0.58;
            const targetLookY = playerPos.y * 0.42 + 0.4;
            const targetLookZ = playerPos.z + 16;
            const lookLerp = 1 - Math.exp(-9 * delta);
            this.cameraLookTarget.x += (targetLookX - this.cameraLookTarget.x) * lookLerp;
            this.cameraLookTarget.y += (targetLookY - this.cameraLookTarget.y) * lookLerp;
            this.cameraLookTarget.z += (targetLookZ - this.cameraLookTarget.z) * lookLerp;
            this.camera.lookAt(this.cameraLookTarget);

            // Slight FOV change when boosting (speed powerup)
            this.camera.fov = 64 + (this.player.activePowerup === 'SPEED' ? 5 : 0);
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
