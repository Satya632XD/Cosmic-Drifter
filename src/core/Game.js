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
        this.state = 'menu'; // menu, playing, paused, gameover, shop, settings, credits
        this.clock = new THREE.Clock();
        this.deltaTime = 0;
        this.timeScale = 1;
        this.frameCount = 0;
        this.distance = 0;
    }

    async init() {
        // Renderer
        this.renderer = new Renderer();
        this.scene = this.renderer.scene;
        this.camera = this.renderer.camera;
        this.bloomPass = this.renderer.bloomPass;

        // Managers
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

        // Apply saved audio settings
        this.audio.setMasterVolume(this.progression.getSetting('masterVol', 70) / 100);
        this.audio.setMusicVolume(this.progression.getSetting('musicVol', 60) / 100);
        this.audio.setSFXVolume(this.progression.getSetting('sfxVol', 80) / 100);
        this.audio.startMusic();

        // Start loop
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
        this.ui.showHUD();
        this.screens.hideAll();
        this.audio.playShoot(); // just to init context
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
        const delta = Math.min(this.clock.getDelta(), 0.05) * this.timeScale;
        this.deltaTime = delta;
        this.frameCount++;

        if (this.state === 'playing') {
            // Input movement
            const move = this.input.getMovement();
            this.player.update(delta, move, this.input.isShooting(), this);
            this.distance += this.player.speed * delta * 10; // approximate meters
            this.stats.distance = Math.floor(this.distance);

            this.difficulty.update(this.distance);
            this.spawner.update(delta, this.difficulty, this.distance);

            // Update all entities
            this.entityManager.updateAll(delta, this.player, this);

            // Collisions
            this.collision.check(this.player, this.entityManager, this);

            // Effects update
            this.effects.update(delta);
            this.particles.update(delta);

            // UI update
            this.ui.updateHUD(this.player, this.stats);

            // Boss check
            if (this.distance > CONFIG.BOSS_DISTANCE && !this.spawner.bossActive) {
                this.spawner.spawnBoss(this.difficulty);
            }
        }

        this.audio.update(delta);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.renderer.render(this.scene, this.camera, this.bloomPass);
    }

    onResize() {
        this.renderer.onResize();
    }
}
