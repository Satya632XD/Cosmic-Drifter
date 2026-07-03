// src/input/InputManager.js
export class InputManager {
    constructor(domElement) {
        this.domElement = domElement;
        this.keys = {};
        this.mouseDown = false;
        this.touchActive = false;
        this.touchMove = { x: 0, y: 0 };
        this.touchShoot = false;
        this.joystickBase = { x: 0, y: 0 };
        this.joystickRadius = 60;

        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        domElement.addEventListener('mousedown', e => { this.mouseDown = true; e.preventDefault(); });
        domElement.addEventListener('mouseup', e => { this.mouseDown = false; e.preventDefault(); });
        domElement.addEventListener('touchstart', e => this.onTouchStart(e), { passive: false });
        domElement.addEventListener('touchmove', e => this.onTouchMove(e), { passive: false });
        domElement.addEventListener('touchend', e => this.onTouchEnd(e));
    }

    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) return;
        this.touchActive = true;
        this.joystickBase.x = touch.clientX;
        this.joystickBase.y = touch.clientY;
        // Shooting if on right side
        this.touchShoot = touch.clientX > window.innerWidth / 2;
    }

    onTouchMove(e) {
        e.preventDefault();
        if (!this.touchActive || !e.touches[0]) return;
        const touch = e.touches[0];
        const dx = touch.clientX - this.joystickBase.x;
        const dy = touch.clientY - this.joystickBase.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > this.joystickRadius) {
            this.touchMove.x = dx / dist;
            this.touchMove.y = dy / dist;
        } else {
            this.touchMove.x = dx / this.joystickRadius;
            this.touchMove.y = dy / this.joystickRadius;
        }
    }

    onTouchEnd(e) {
        this.touchActive = false;
        this.touchMove.x = 0;
        this.touchMove.y = 0;
        this.touchShoot = false;
    }

    getMovement() {
        let x = 0, y = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) y += 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) y -= 1;
        if (this.touchActive) {
            x += this.touchMove.x;
            y += this.touchMove.y;
        }
        const len = Math.sqrt(x*x + y*y);
        if (len > 1) { x /= len; y /= len; }
        return { x, y };
    }

    isShooting() {
        return this.mouseDown || this.keys['Space'] || this.keys['KeyJ'] || this.touchShoot;
    }
}
