// src/graphics/Renderer.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Renderer {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;
        document.getElementById('game-container').appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x020612);
        this.scene.fog = new THREE.FogExp2(0x020612, 0.009);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.5, 200);
        this.camera.position.set(0, 2, -8);
        this.camera.lookAt(0, 0, 20);

        // Starfield
        this.addStarfield();
        this.addNebulae();

        // Lighting
        const ambient = new THREE.HemisphereLight(0x6eaee8, 0x07101f, 1.25);
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xc8e6ff, 1.8);
        dirLight.position.set(-6, 8, -4);
        this.scene.add(dirLight);
        const rimLight = new THREE.DirectionalLight(0x377cff, 1.3);
        rimLight.position.set(5, -2, 8);
        this.scene.add(rimLight);

        // Bloom setup
        this.bloomPass = new BloomPass(this.renderer);
    }

    addStarfield() {
        const geom = new THREE.BufferGeometry();
        const count = 1500;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 80;
            positions[i+1] = (Math.random() - 0.5) * 40;
            positions[i+2] = Math.random() * 100 - 10;
        }
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ color: 0xbddcff, size: 0.11, sizeAttenuation: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
        const stars = new THREE.Points(geom, mat);
        this.scene.add(stars);
        this.stars = stars;

        const brightStars = new THREE.BufferGeometry();
        const brightPositions = new Float32Array(180 * 3);
        for (let i = 0; i < brightPositions.length; i += 3) {
            brightPositions[i] = (Math.random() - 0.5) * 72;
            brightPositions[i + 1] = (Math.random() - 0.5) * 34;
            brightPositions[i + 2] = Math.random() * 95;
        }
        brightStars.setAttribute('position', new THREE.BufferAttribute(brightPositions, 3));
        this.scene.add(new THREE.Points(brightStars, new THREE.PointsMaterial({ color: 0xffffff, size: 0.28, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })));
    }

    addNebulae() {
        const createNebula = (color, position, scale) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 256;
            const context = canvas.getContext('2d');
            const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.28, color);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 256, 256);
            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
            sprite.position.copy(position);
            sprite.scale.set(scale, scale * 0.62, 1);
            this.scene.add(sprite);
        };
        createNebula('rgba(37, 82, 215, 0.65)', new THREE.Vector3(-16, 4, 48), 30);
        createNebula('rgba(135, 35, 205, 0.52)', new THREE.Vector3(19, -6, 63), 25);
        createNebula('rgba(18, 165, 205, 0.36)', new THREE.Vector3(3, 10, 84), 35);
    }

    render(scene, camera, bloomPass) {
        bloomPass.render(scene, camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.bloomPass.setSize(window.innerWidth, window.innerHeight);
    }

    get domElement() { return this.renderer.domElement; }
}

// Simple separable bloom with half-res
class BloomPass {
    constructor(renderer) {
        this.renderer = renderer;
        const w = renderer.domElement.width;
        const h = renderer.domElement.height;
        this.renderTargetA = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
        this.renderTargetB = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
        this.blurTargetA = new THREE.WebGLRenderTarget(w/2, h/2, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });
        this.blurTargetB = new THREE.WebGLRenderTarget(w/2, h/2, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat });

        this.blurMaterialH = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                texelSize: { value: new THREE.Vector2(1/(w/2), 1/(h/2)) },
            },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 texelSize;
                varying vec2 vUv;
                void main() {
                    vec4 sum = vec4(0.0);
                    sum += texture2D(tDiffuse, vec2(vUv.x - 4.0*texelSize.x, vUv.y)) * 0.05;
                    sum += texture2D(tDiffuse, vec2(vUv.x - 3.0*texelSize.x, vUv.y)) * 0.09;
                    sum += texture2D(tDiffuse, vec2(vUv.x - 2.0*texelSize.x, vUv.y)) * 0.12;
                    sum += texture2D(tDiffuse, vec2(vUv.x - texelSize.x, vUv.y)) * 0.15;
                    sum += texture2D(tDiffuse, vUv) * 0.16;
                    sum += texture2D(tDiffuse, vec2(vUv.x + texelSize.x, vUv.y)) * 0.15;
                    sum += texture2D(tDiffuse, vec2(vUv.x + 2.0*texelSize.x, vUv.y)) * 0.12;
                    sum += texture2D(tDiffuse, vec2(vUv.x + 3.0*texelSize.x, vUv.y)) * 0.09;
                    sum += texture2D(tDiffuse, vec2(vUv.x + 4.0*texelSize.x, vUv.y)) * 0.05;
                    gl_FragColor = sum;
                }`
        });
        this.blurMaterialV = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                texelSize: { value: new THREE.Vector2(1/(w/2), 1/(h/2)) },
            },
            vertexShader: this.blurMaterialH.vertexShader,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform vec2 texelSize;
                varying vec2 vUv;
                void main() {
                    vec4 sum = vec4(0.0);
                    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 4.0*texelSize.y)) * 0.05;
                    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 3.0*texelSize.y)) * 0.09;
                    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 2.0*texelSize.y)) * 0.12;
                    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - texelSize.y)) * 0.15;
                    sum += texture2D(tDiffuse, vUv) * 0.16;
                    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + texelSize.y)) * 0.15;
                    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 2.0*texelSize.y)) * 0.12;
                    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 3.0*texelSize.y)) * 0.09;
                    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 4.0*texelSize.y)) * 0.05;
                    gl_FragColor = sum;
                }`
        });
        this.finalMaterial = new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: null },
            },
            vertexShader: this.blurMaterialH.vertexShader,
            fragmentShader: `
                uniform sampler2D baseTexture;
                uniform sampler2D bloomTexture;
                varying vec2 vUv;
                void main() {
                    vec4 base = texture2D(baseTexture, vUv);
                    vec4 bloom = texture2D(bloomTexture, vUv);
                    gl_FragColor = base + bloom * 0.8;
                }`
        });
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.finalMaterial);
        this.scene.add(this.quad);
    }

    setSize(w, h) {
        this.renderTargetA.setSize(w, h);
        this.renderTargetB.setSize(w, h);
        this.blurTargetA.setSize(w/2, h/2);
        this.blurTargetB.setSize(w/2, h/2);
        this.blurMaterialH.uniforms.texelSize.value.set(1/(w/2), 1/(h/2));
        this.blurMaterialV.uniforms.texelSize.value.set(1/(w/2), 1/(h/2));
    }

    render(scene, camera) {
        // Render scene to A
        this.renderer.setRenderTarget(this.renderTargetA);
        this.renderer.render(scene, camera);
        // Downsample and blur horizontal
        this.blurMaterialH.uniforms.tDiffuse.value = this.renderTargetA.texture;
        this.renderer.setRenderTarget(this.blurTargetA);
        this.quad.material = this.blurMaterialH;
        this.renderer.render(this.scene, this.camera);
        // Blur vertical
        this.blurMaterialV.uniforms.tDiffuse.value = this.blurTargetA.texture;
        this.renderer.setRenderTarget(this.blurTargetB);
        this.quad.material = this.blurMaterialV;
        this.renderer.render(this.scene, this.camera);
        // Composite
        this.finalMaterial.uniforms.baseTexture.value = this.renderTargetA.texture;
        this.finalMaterial.uniforms.bloomTexture.value = this.blurTargetB.texture;
        this.renderer.setRenderTarget(null);
        this.quad.material = this.finalMaterial;
        this.renderer.render(this.quad, this.camera, this.finalMaterial);
    }
}
