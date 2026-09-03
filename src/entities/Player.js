import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { CONFIG } from '../config/GameConfig.js';

export class Player {
    constructor(startHp, hasShield) {
        this.originalMaterials = [];
        this.engineFlares = [];
        this.engineLights = [];
        this.mesh = this.createMesh();
        this.speed = CONFIG.PLAYER_SPEED;
        this.baseSpeed = CONFIG.PLAYER_SPEED;
        this.fireRate = CONFIG.PLAYER_FIRE_RATE;
        this.baseFireRate = CONFIG.PLAYER_FIRE_RATE;
        this.fireCooldown = 0;
        this.health = startHp;
        this.maxHealth = startHp;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.shieldActive = hasShield;
        this.shieldMesh = null;
        if (this.shieldActive) this.addShieldVisual();
        this.activePowerup = null;
        this.powerupTimer = 0;
        this.projectilePool = [];
        this.baseMagnetRange = CONFIG.STARBIT_MAGNET_RANGE;
        this.magnetRange = this.baseMagnetRange;
        this.starBitMultiplier = 1;
        this.mesh.position.set(0, 0, 0);
    }

    createMaterial(options) {
        const material = new THREE.MeshStandardMaterial(options);
        this.originalMaterials.push(material);
        return material;
    }

    createMesh() {
        const ship = new THREE.Group();
        ship.rotation.order = 'YXZ';

        const hull = this.createMaterial({ color: 0x9bb8cb, metalness: 0.9, roughness: 0.25 });
        const darkMetal = this.createMaterial({ color: 0x15283b, metalness: 0.95, roughness: 0.2 });
        const accent = this.createMaterial({ color: 0x2b9dff, emissive: 0x073b7a, emissiveIntensity: 1.4, metalness: 0.7, roughness: 0.22 });
        const canopy = this.createMaterial({ color: 0x5eeaff, emissive: 0x0a4f70, emissiveIntensity: 1.1, metalness: 0.75, roughness: 0.08, transparent: true, opacity: 0.88 });

        // The forward axis is +Z, keeping the silhouette readable from the chase camera.
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.5, 24), hull);
        nose.rotation.x = Math.PI / 2;
        nose.position.z = 0.86;
        ship.add(nose);

        const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 1.65, 24), hull);
        fuselage.rotation.x = Math.PI / 2;
        fuselage.position.z = -0.15;
        ship.add(fuselage);

        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 2.05), accent);
        spine.position.set(0, 0.43, -0.1);
        ship.add(spine);

        // Armored collar segments break up the hull and keep its silhouette crisp at a distance.
        for (const z of [-0.68, -0.28, 0.12]) {
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.035, 8, 24), darkMetal);
            collar.rotation.x = Math.PI / 2;
            collar.position.z = z;
            ship.add(collar);
        }

        const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), canopy);
        cockpit.scale.set(0.9, 0.62, 1.28);
        cockpit.position.set(0, 0.3, 0.34);
        cockpit.rotation.x = -Math.PI / 2;
        ship.add(cockpit);

        const wingShape = new THREE.Shape();
        wingShape.moveTo(0.25, 0.15);
        wingShape.lineTo(1.85, 0.02);
        wingShape.lineTo(0.82, -0.16);
        wingShape.lineTo(0.12, -0.13);
        wingShape.closePath();
        const wingGeometry = new THREE.ExtrudeGeometry(wingShape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2 });
        const leftWing = new THREE.Mesh(wingGeometry, darkMetal);
        leftWing.position.set(-0.05, -0.08, 0.16);
        leftWing.rotation.x = -Math.PI / 2;
        ship.add(leftWing);
        const rightWing = leftWing.clone();
        rightWing.scale.x = -1;
        ship.add(rightWing);

        for (const side of [-1, 1]) {
            const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.045, 0.12), accent);
            wingStripe.position.set(side * 0.86, -0.11, 0.25);
            wingStripe.rotation.y = side * -0.14;
            ship.add(wingStripe);

            const wingTip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ color: side < 0 ? 0xff426c : 0x37baff }));
            wingTip.position.set(side * 1.63, -0.08, 0.22);
            ship.add(wingTip);

            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.72), darkMetal);
            fin.position.set(side * 0.32, 0.28, -0.63);
            fin.rotation.z = side * -0.23;
            ship.add(fin);

            const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.86, 16), darkMetal);
            nacelle.rotation.x = Math.PI / 2;
            nacelle.position.set(side * 0.38, -0.2, -0.74);
            ship.add(nacelle);
            this.addEngine(ship, side * 0.38, -0.2, -1.2);
        }

        const keel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 1.25), darkMetal);
        keel.position.set(0, -0.42, -0.27);
        ship.add(keel);
        const reactor = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 20), accent);
        reactor.rotation.x = Math.PI / 2;
        reactor.position.set(0, -0.12, -0.78);
        ship.add(reactor);
        this.addEngine(ship, 0, -0.16, -1.28, 1.16);
        return ship;
    }

    addEngine(ship, x, y, z, scale = 1) {
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.25 * scale, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0x070d16, metalness: 1, roughness: 0.16 }));
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.set(x, y, z + 0.08);
        ship.add(nozzle);
        const core = new THREE.Mesh(new THREE.CircleGeometry(0.15 * scale, 16), new THREE.MeshBasicMaterial({ color: 0xc9f8ff }));
        core.position.set(x, y, z - 0.04);
        core.rotation.y = Math.PI;
        ship.add(core);
        const flare = new THREE.Mesh(new THREE.ConeGeometry(0.19 * scale, 0.95 * scale, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x22bfff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
        flare.rotation.x = -Math.PI / 2;
        flare.position.set(x, y, z - 0.42 * scale);
        ship.add(flare);
        this.engineFlares.push(flare);
        const innerFlare = new THREE.Mesh(new THREE.ConeGeometry(0.085 * scale, 0.7 * scale, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
        innerFlare.rotation.x = -Math.PI / 2;
        innerFlare.position.set(x, y, z - 0.34 * scale);
        ship.add(innerFlare);
        this.engineFlares.push(innerFlare);
        const light = new THREE.PointLight(0x25bfff, 3.5 * scale, 5);
        light.position.set(x, y, z - 0.15);
        ship.add(light);
        this.engineLights.push(light);
    }

    addShieldVisual() {
        const shieldGeo = new THREE.SphereGeometry(1.5, 28, 20);
        const shieldMat = new THREE.MeshBasicMaterial({ color: 0x30ddff, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        this.mesh.add(this.shieldMesh);
    }

    update(delta, moveDir, isShooting, game) {
        const spd = this.speed * delta;
        this.mesh.position.x = THREE.MathUtils.clamp(this.mesh.position.x + moveDir.x * spd, CONFIG.PLAY_AREA.X_MIN, CONFIG.PLAY_AREA.X_MAX);
        this.mesh.position.y = THREE.MathUtils.clamp(this.mesh.position.y + moveDir.y * spd, CONFIG.PLAY_AREA.Y_MIN, CONFIG.PLAY_AREA.Y_MAX);
        const pulse = 0.88 + Math.sin(performance.now() * 0.024) * 0.16;
        this.engineFlares.forEach((flare, index) => flare.scale.set(1, pulse + index * 0.03, 1));
        this.engineLights.forEach(light => light.intensity = 3.2 + pulse * 1.5);
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, -moveDir.x * 0.22, 1 - Math.exp(-8 * delta));
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, moveDir.y * 0.1, 1 - Math.exp(-8 * delta));

        this.fireCooldown -= delta;
        if (isShooting && this.fireCooldown <= 0) { this.fireCooldown = this.fireRate; this.shoot(game); }
        if (this.activePowerup) { this.powerupTimer -= delta; if (this.powerupTimer <= 0) this.deactivatePowerup(); }
        if (this.invincible) {
            this.invincibleTimer -= delta;
            if (this.invincibleTimer <= 0) { this.invincible = false; this.mesh.visible = true; }
            else this.mesh.visible = Math.sin(this.invincibleTimer * 25) > 0;
        }
        for (let i = this.projectilePool.length - 1; i >= 0; i--) {
            const projectile = this.projectilePool[i];
            projectile.position.z -= CONFIG.PLAYER_PROJECTILE_SPEED * delta;
            if (projectile.position.z < -40) { game.scene.remove(projectile); this.projectilePool.splice(i, 1); }
        }
    }

    shoot(game) {
        const laser = this.activePowerup === 'LASER';
        const spread = this.activePowerup === 'SPREAD';
        for (const angle of (spread ? [-0.2, 0, 0.2, -0.4, 0.4] : [0])) {
            const bolt = new THREE.Mesh(new THREE.BoxGeometry(laser ? 0.3 : 0.15, laser ? 0.3 : 0.15, laser ? 2.4 : 0.8), new THREE.MeshBasicMaterial({ color: laser ? 0xff00ff : 0x58f7ff }));
            bolt.position.copy(this.mesh.position); bolt.position.z -= laser ? 2 : 1.5; bolt.rotation.z = angle;
            game.scene.add(bolt); this.projectilePool.push(bolt);
        }
        game.audio.playShoot();
    }

    activatePowerup(type) { this.deactivatePowerup(); this.activePowerup = type; this.powerupTimer = CONFIG.POWERUP_DURATION; if (type === 'SPEED') this.speed = this.baseSpeed * 1.5; if (type === 'SPREAD') this.fireRate = this.baseFireRate * 1.3; if (type === 'LASER') this.fireRate = this.baseFireRate * 0.5; if (type === 'SHIELD' && !this.shieldActive) { this.shieldActive = true; this.addShieldVisual(); } if (type === 'MAGNET') this.magnetRange = this.baseMagnetRange * 2; }
    deactivatePowerup() { if (this.activePowerup === 'SPEED') this.speed = this.baseSpeed; if (this.activePowerup === 'SPREAD') this.fireRate = this.baseFireRate; if (this.activePowerup === 'MAGNET') this.magnetRange = this.baseMagnetRange; this.activePowerup = null; this.powerupTimer = 0; }
    takeDamage(amount) { if (this.invincible) return false; if (this.shieldActive) { this.shieldActive = false; if (this.shieldMesh) { this.mesh.remove(this.shieldMesh); this.shieldMesh = null; } return true; } this.health -= amount; if (this.health <= 0) return false; this.invincible = true; this.invincibleTimer = CONFIG.PLAYER_INVINCIBLE_TIME; return true; }
}
