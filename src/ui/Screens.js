// src/ui/Screens.js
import { CONFIG, UPGRADES } from '../config/GameConfig.js';
import { ProgressionManager } from '../game/ProgressionManager.js';

export class Screens {
    constructor(game) {
        this.game = game;
        this.progression = game.progression;
        this.setupEvents();
    }

    setupEvents() {
        document.getElementById('btn-play').addEventListener('click', () => this.game.startGame());
        document.getElementById('btn-shop').addEventListener('click', () => this.showShop());
        document.getElementById('btn-settings').addEventListener('click', () => this.showSettings());
        document.getElementById('btn-credits').addEventListener('click', () => this.showCredits());
        document.getElementById('btn-resume').addEventListener('click', () => this.game.resumeGame());
        document.getElementById('btn-restart').addEventListener('click', () => { this.game.resumeGame(); this.game.startGame(); });
        document.getElementById('btn-quit').addEventListener('click', () => this.game.quitToMenu());
        document.getElementById('btn-retry').addEventListener('click', () => { this.game.timeScale=1; this.game.startGame(); });
        document.getElementById('btn-go-shop').addEventListener('click', () => { this.game.quitToMenu(); this.showShop(); });
        document.getElementById('btn-go-menu').addEventListener('click', () => this.game.quitToMenu());
        document.getElementById('btn-shop-back').addEventListener('click', () => this.showMenu());
        document.getElementById('btn-settings-back').addEventListener('click', () => this.showMenu());
        document.getElementById('btn-credits-back').addEventListener('click', () => this.showMenu());
        document.getElementById('btn-fullscreen').addEventListener('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        });
        document.getElementById('vol-master').addEventListener('input', e => {
            this.game.audio.setMasterVolume(e.target.value/100);
            this.progression.setSetting('masterVol', e.target.value);
        });
        document.getElementById('vol-music').addEventListener('input', e => {
            this.game.audio.setMusicVolume(e.target.value/100);
            this.progression.setSetting('musicVol', e.target.value);
        });
        document.getElementById('vol-sfx').addEventListener('input', e => {
            this.game.audio.setSFXVolume(e.target.value/100);
            this.progression.setSetting('sfxVol', e.target.value);
        });
        // load saved volumes
        document.getElementById('vol-master').value = this.progression.getSetting('masterVol', 70);
        document.getElementById('vol-music').value = this.progression.getSetting('musicVol', 60);
        document.getElementById('vol-sfx').value = this.progression.getSetting('sfxVol', 80);
    }

    showMenu() { this.hideAll(); document.getElementById('menu-screen').style.display = 'block'; }
    showShop() { this.hideAll(); document.getElementById('shop-screen').style.display = 'block'; this.renderShop(); }
    showSettings() { this.hideAll(); document.getElementById('settings-screen').style.display = 'block'; }
    showCredits() { this.hideAll(); document.getElementById('credits-screen').style.display = 'block'; }
    showPause() { document.getElementById('pause-screen').style.display = 'block'; }
    showGameOver(dist, bits) {
        document.getElementById('go-distance').textContent = `Distance: ${Math.floor(dist)} m`;
        document.getElementById('go-starbits').textContent = `StarBits: ${bits}`;
        document.getElementById('gameover-screen').style.display = 'block';
    }

    hideAll() {
        const screens = ['menu-screen','shop-screen','settings-screen','pause-screen','gameover-screen','credits-screen'];
        screens.forEach(id => document.getElementById(id).style.display = 'none');
    }

    renderShop() {
        const container = document.getElementById('shop-upgrades');
        container.innerHTML = '';
        const starbits = this.progression.getStarbits();
        document.getElementById('shop-starbits').textContent = '✦ ' + starbits;
        for (const [key, upgrade] of Object.entries(UPGRADES)) {
            const level = this.progression.getUpgradeLevel(key);
            const cost = upgrade.baseCost * (level + 1);
            const maxed = level >= upgrade.maxLevel;
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <strong>${upgrade.name}</strong> (Lv ${level}/${upgrade.maxLevel})<br>
                ${upgrade.description}<br>
                <button ${maxed ? 'disabled' : ''}>${maxed ? 'MAXED' : `Buy ✦${cost}`}</button>
            `;
            if (!maxed) {
                div.querySelector('button').addEventListener('click', () => {
                    if (this.progression.spendStarbits(cost)) {
                        this.progression.setUpgradeLevel(key, level + 1);
                        this.renderShop();
                    }
                });
            }
            container.appendChild(div);
        }
    }
}
