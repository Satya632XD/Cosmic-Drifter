// src/ui/UIManager.js
import { CONFIG } from '../config/GameConfig.js';

export class UIManager {
    constructor(game) {
        this.game = game;
    }

    showHUD() {
        document.getElementById('hud').style.display = 'flex';
    }

    hideHUD() {
        document.getElementById('hud').style.display = 'none';
    }

    updateHUD(player, stats) {
        document.getElementById('hud-distance').textContent = Math.floor(this.game.distance) + ' m';
        document.getElementById('hud-starbits').textContent = '✦ ' + stats.starBits;
        let hearts = '';
        for (let i=0; i<player.maxHealth; i++) hearts += i < player.health ? '❤️' : '🖤';
        document.getElementById('hud-health').innerHTML = hearts;
        document.getElementById('hud-shield').style.display = player.shieldActive ? 'block' : 'none';
        if (player.activePowerup) {
            document.getElementById('hud-powerup').style.display = 'flex';
            document.getElementById('powerup-icon').textContent = player.activePowerup;
            document.getElementById('powerup-timer').textContent = Math.ceil(player.powerupTimer);
        } else {
            document.getElementById('hud-powerup').style.display = 'none';
        }
    }
}
