// src/audio/AudioManager.js
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.initialized = false;
    }

    ensureContext() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.musicGain = this.ctx.createGain();
            this.musicGain.connect(this.masterGain);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.connect(this.masterGain);
            this.initialized = true;
        }
    }

    setMasterVolume(v) { if (this.masterGain) this.masterGain.gain.value = v; }
    setMusicVolume(v) { if (this.musicGain) this.musicGain.gain.value = v; }
    setSFXVolume(v) { if (this.sfxGain) this.sfxGain.gain.value = v; }

    playTone(freq, duration, type = 'sine', gain = 0.3, dest = this.sfxGain) {
        this.ensureContext();
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gainNode.gain.setValueAtTime(gain, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gainNode);
        gainNode.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playShoot() { this.playTone(800, 0.08, 'square', 0.1); }
    playExplosion() { this.playTone(80, 0.4, 'sawtooth', 0.3); }
    playCollect() { this.playTone(1200, 0.15, 'sine', 0.2); this.playTone(1600, 0.1, 'sine', 0.15); }
    playHit() { this.playTone(200, 0.2, 'triangle', 0.2); }
    playLose() { for (let i=0;i<3;i++) setTimeout(()=>this.playTone(150, 0.3, 'sawtooth', 0.2), i*150); }

    startMusic() {
        this.ensureContext();
        // Simple generative loop: two oscillators with patterns
        const bpm = 110;
        const beatTime = 60 / bpm;
        // We'll create a loop using setValueAtTime, but need to schedule ahead.
        // For simplicity, we'll just play a drone and random notes.
        setInterval(() => {
            if (!this.ctx || this.ctx.state !== 'running') return;
            this.playTone(220 + Math.random()*200, 0.2, 'triangle', 0.1, this.musicGain);
        }, beatTime * 1000);
    }

    update(delta) {}
}
