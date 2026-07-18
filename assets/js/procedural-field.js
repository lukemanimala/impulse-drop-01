/**
 * Procedural Field - Three.js Displaced Geometry System
 *
 * Creates an interactive procedural surface that reveals into a garment shape.
 * Uses layered simplex noise displacement with touch-responsive wave deformation.
 */

(function() {
    'use strict';

    // Simplex noise implementation (fast, compact)
    const SimplexNoise = (function() {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        const F3 = 1 / 3;
        const G3 = 1 / 6;

        const grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];

        class Simplex {
            constructor(seed = Math.random()) {
                this.p = new Uint8Array(256);
                this.perm = new Uint8Array(512);
                this.permMod12 = new Uint8Array(512);

                for (let i = 0; i < 256; i++) this.p[i] = i;

                let n, q;
                for (let i = 255; i > 0; i--) {
                    seed = (seed * 16807) % 2147483647;
                    n = Math.floor((seed / 2147483647) * (i + 1));
                    q = this.p[i];
                    this.p[i] = this.p[n];
                    this.p[n] = q;
                }

                for (let i = 0; i < 512; i++) {
                    this.perm[i] = this.p[i & 255];
                    this.permMod12[i] = this.perm[i] % 12;
                }
            }

            noise2D(x, y) {
                const s = (x + y) * F2;
                const i = Math.floor(x + s);
                const j = Math.floor(y + s);
                const t = (i + j) * G2;
                const X0 = i - t;
                const Y0 = j - t;
                const x0 = x - X0;
                const y0 = y - Y0;

                let i1, j1;
                if (x0 > y0) { i1 = 1; j1 = 0; }
                else { i1 = 0; j1 = 1; }

                const x1 = x0 - i1 + G2;
                const y1 = y0 - j1 + G2;
                const x2 = x0 - 1 + 2 * G2;
                const y2 = y0 - 1 + 2 * G2;

                const ii = i & 255;
                const jj = j & 255;

                let n0 = 0, n1 = 0, n2 = 0;

                let t0 = 0.5 - x0 * x0 - y0 * y0;
                if (t0 >= 0) {
                    const gi0 = this.permMod12[ii + this.perm[jj]];
                    t0 *= t0;
                    n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0);
                }

                let t1 = 0.5 - x1 * x1 - y1 * y1;
                if (t1 >= 0) {
                    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
                    t1 *= t1;
                    n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1);
                }

                let t2 = 0.5 - x2 * x2 - y2 * y2;
                if (t2 >= 0) {
                    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
                    t2 *= t2;
                    n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2);
                }

                return 70 * (n0 + n1 + n2);
            }

            noise3D(x, y, z) {
                const s = (x + y + z) * F3;
                const i = Math.floor(x + s);
                const j = Math.floor(y + s);
                const k = Math.floor(z + s);
                const t = (i + j + k) * G3;
                const X0 = i - t;
                const Y0 = j - t;
                const Z0 = k - t;
                const x0 = x - X0;
                const y0 = y - Y0;
                const z0 = z - Z0;

                let i1, j1, k1, i2, j2, k2;
                if (x0 >= y0) {
                    if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
                    else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
                    else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
                } else {
                    if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
                    else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
                    else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
                }

                const x1 = x0 - i1 + G3;
                const y1 = y0 - j1 + G3;
                const z1 = z0 - k1 + G3;
                const x2 = x0 - i2 + 2 * G3;
                const y2 = y0 - j2 + 2 * G3;
                const z2 = z0 - k2 + 2 * G3;
                const x3 = x0 - 1 + 3 * G3;
                const y3 = y0 - 1 + 3 * G3;
                const z3 = z0 - 1 + 3 * G3;

                const ii = i & 255;
                const jj = j & 255;
                const kk = k & 255;

                let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

                let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
                if (t0 >= 0) {
                    const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]];
                    t0 *= t0;
                    n0 = t0 * t0 * (grad3[gi0][0]*x0 + grad3[gi0][1]*y0 + grad3[gi0][2]*z0);
                }

                let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
                if (t1 >= 0) {
                    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
                    t1 *= t1;
                    n1 = t1 * t1 * (grad3[gi1][0]*x1 + grad3[gi1][1]*y1 + grad3[gi1][2]*z1);
                }

                let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
                if (t2 >= 0) {
                    const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
                    t2 *= t2;
                    n2 = t2 * t2 * (grad3[gi2][0]*x2 + grad3[gi2][1]*y2 + grad3[gi2][2]*z2);
                }

                let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
                if (t3 >= 0) {
                    const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];
                    t3 *= t3;
                    n3 = t3 * t3 * (grad3[gi3][0]*x3 + grad3[gi3][1]*y3 + grad3[gi3][2]*z3);
                }

                return 32 * (n0 + n1 + n2 + n3);
            }
        }

        return Simplex;
    })();

    // Configuration
    const CONFIG = {
        mesh: {
            widthSegments: 80,
            heightSegments: 100,
            baseWidth: 3.2,
            baseHeight: 4.0
        },
        noise: {
            scale1: 0.8,
            scale2: 1.6,
            scale3: 3.2,
            amplitude: 0.6,
            timeScale: 0.0003
        },
        wave: {
            maxCount: 4,
            speed: 2.5,
            decay: 0.92,
            radius: 2.0,
            strength: 0.4
        },
        reveal: {
            duration: 3200,
            cameraDuration: 2000
        },
        camera: {
            initialZ: 6,
            initialRotationX: 0.15,
            finalZ: 4.5,
            finalRotationX: 0
        }
    };

    /**
     * Wave distortion class
     */
    class Wave {
        constructor(x, y, z) {
            this.origin = { x, y, z };
            this.radius = 0;
            this.strength = CONFIG.wave.strength;
            this.active = true;
        }

        update(delta) {
            this.radius += CONFIG.wave.speed * delta;
            this.strength *= CONFIG.wave.decay;

            if (this.strength < 0.001) {
                this.active = false;
            }

            return this.active;
        }
    }

    /**
     * Main Procedural Field class
     */
    class ProceduralField {
        constructor(container) {
            this.container = container;
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.mesh = null;
            this.wireframe = null;
            this.geometry = null;
            this.originalPositions = null;
            this.garmentMask = null;

            this.noise = new SimplexNoise(42);
            this.waves = [];
            this.time = 0;
            this.isRunning = false;
            this.revealProgress = 0;
            this.isRevealing = false;
            this.onRevealComplete = null;

            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.pointer = { x: 0, y: 0 };
            this.raycaster = null;

            this.init();
        }

        async init() {
            // Wait for THREE to be available
            if (typeof THREE === 'undefined') {
                console.error('Three.js not loaded');
                return;
            }

            this.setupScene();
            this.setupCamera();
            this.setupRenderer();
            this.setupLights();
            this.createGarmentMesh();
            this.setupRaycaster();
            this.bindEvents();

            // Listen for reduced motion changes
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.reducedMotion = e.matches;
            });
        }

        setupScene() {
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000000);
        }

        setupCamera() {
            const aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
            this.camera.position.z = CONFIG.camera.initialZ;
            this.camera.rotation.x = CONFIG.camera.initialRotationX;
        }

        setupRenderer() {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance'
            });
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.container.appendChild(this.renderer.domElement);

            // Style the canvas
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.renderer.domElement.style.touchAction = 'none';
        }

        setupLights() {
            // Ambient light
            const ambient = new THREE.AmbientLight(0x404040, 0.5);
            this.scene.add(ambient);

            // Key light
            const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
            keyLight.position.set(2, 3, 4);
            this.scene.add(keyLight);

            // Fill light
            const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
            fillLight.position.set(-2, 1, 2);
            this.scene.add(fillLight);

            // Rim light
            const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
            rimLight.position.set(0, -1, -3);
            this.scene.add(rimLight);
        }

        createGarmentMesh() {
            const { widthSegments, heightSegments, baseWidth, baseHeight } = CONFIG.mesh;

            // Create a plane geometry
            this.geometry = new THREE.PlaneGeometry(
                baseWidth,
                baseHeight,
                widthSegments,
                heightSegments
            );

            // Store original positions for animation
            this.originalPositions = new Float32Array(this.geometry.attributes.position.array);

            // Apply garment silhouette mask to vertices
            this.applyGarmentShape();

            // Material - dark with subtle metallic feel
            const material = new THREE.MeshStandardMaterial({
                color: 0x1a1a1a,
                metalness: 0.2,
                roughness: 0.8,
                side: THREE.DoubleSide,
                flatShading: false
            });

            this.mesh = new THREE.Mesh(this.geometry, material);
            this.scene.add(this.mesh);

            // Wireframe overlay
            const wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x444444,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });

            this.wireframe = new THREE.Mesh(this.geometry, wireframeMaterial);
            this.scene.add(this.wireframe);

            // Add contour lines
            this.createContourLines();
        }

        applyGarmentShape() {
            const positions = this.geometry.attributes.position.array;
            const { widthSegments, heightSegments, baseWidth, baseHeight } = CONFIG.mesh;

            // Create garment silhouette mask
            // This shapes the plane to resemble the sleeveless vest
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];

                // Normalize to 0-1
                const nx = (x / baseWidth) + 0.5;
                const ny = (y / baseHeight) + 0.5;

                // Vest shape parameters
                const centerX = 0.5;
                const bodyWidth = 0.55;
                const shoulderWidth = 0.7;
                const neckWidth = 0.25;
                const armholeDepth = 0.35;

                let mask = 1.0;

                // Top (neck and shoulders)
                if (ny > 0.85) {
                    const neckDist = Math.abs(nx - centerX);
                    if (neckDist < neckWidth * 0.5) {
                        // Inside neck opening
                        const neckCurve = 1 - Math.pow(neckDist / (neckWidth * 0.5), 2);
                        mask = Math.max(0, 1 - neckCurve * 0.8);
                    }
                }

                // Armholes (sides)
                if (ny > 0.5 && ny < 0.9) {
                    const sideProgress = (ny - 0.5) / 0.4;
                    const armholeCurve = Math.sin(sideProgress * Math.PI);
                    const currentWidth = bodyWidth + (shoulderWidth - bodyWidth) * sideProgress;

                    if (Math.abs(nx - centerX) > currentWidth * 0.5) {
                        const edgeDist = Math.abs(nx - centerX) - currentWidth * 0.5;
                        mask = Math.max(0, 1 - edgeDist * 4);
                    }

                    // Carve armholes deeper
                    if (ny > 0.65 && ny < 0.85) {
                        const armholeY = (ny - 0.65) / 0.2;
                        const armholeCurve = Math.sin(armholeY * Math.PI);
                        const sideX = Math.abs(nx - centerX);
                        if (sideX > bodyWidth * 0.45) {
                            mask *= 1 - armholeCurve * 0.7;
                        }
                    }
                }

                // Store mask for later use
                this.geometry.attributes.position.array[i + 2] = mask > 0.1 ? 0 : -10; // Hide masked vertices
            }

            this.geometry.attributes.position.needsUpdate = true;
            this.geometry.computeVertexNormals();
        }

        createContourLines() {
            // Create procedural contour lines using line segments
            const contourMaterial = new THREE.LineBasicMaterial({
                color: 0x666666,
                transparent: true,
                opacity: 0.4
            });

            const contourGroup = new THREE.Group();

            // Horizontal contours
            for (let i = 0; i < 15; i++) {
                const y = -2 + (i / 14) * 4;
                const points = [];
                for (let j = 0; j <= 40; j++) {
                    const x = -1.6 + (j / 40) * 3.2;
                    const z = 0;
                    points.push(new THREE.Vector3(x, y, z));
                }
                const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(lineGeom, contourMaterial);
                contourGroup.add(line);
            }

            this.contourLines = contourGroup;
            this.scene.add(contourGroup);
        }

        setupRaycaster() {
            this.raycaster = new THREE.Raycaster();
        }

        bindEvents() {
            // Resize
            window.addEventListener('resize', () => this.onResize());

            // Pointer events
            const canvas = this.renderer.domElement;
            canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
            canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));

            // Keyboard
            canvas.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.createWave(0, 0, 0);
                }
            });
            canvas.tabIndex = 0;
        }

        onResize() {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }

        onPointerDown(e) {
            this.updatePointer(e);
            this.castWave();
        }

        onPointerMove(e) {
            this.updatePointer(e);
            // Create subtle waves on drag
            if (e.pressure > 0 && Math.random() > 0.7) {
                this.castWave();
            }
        }

        updatePointer(e) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }

        castWave() {
            this.raycaster.setFromCamera(this.pointer, this.camera);
            const intersects = this.raycaster.intersectObject(this.mesh);

            if (intersects.length > 0) {
                const point = intersects[0].point;
                this.createWave(point.x, point.y, point.z);

                // Dispatch event
                this.container.dispatchEvent(new CustomEvent('tid:ripple', {
                    detail: { x: point.x, y: point.y }
                }));
            }
        }

        createWave(x, y, z) {
            if (this.waves.length >= CONFIG.wave.maxCount) {
                this.waves.shift();
            }
            this.waves.push(new Wave(x, y, z));
        }

        /**
         * Start reveal animation
         */
        startReveal(callback) {
            if (this.isRevealing) return;

            this.isRevealing = true;
            this.revealProgress = 0;
            this.onRevealComplete = callback;

            if (this.reducedMotion) {
                this.revealProgress = 1;
                this.isRevealing = false;
                if (callback) callback();
            }
        }

        /**
         * Start animation loop
         */
        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();
        }

        /**
         * Stop animation loop
         */
        stop() {
            this.isRunning = false;
        }

        /**
         * Main animation loop
         */
        animate() {
            if (!this.isRunning) return;

            const now = performance.now();
            const delta = (now - this.lastTime) / 1000;
            this.lastTime = now;
            this.time = now;

            // Update reveal progress
            if (this.isRevealing && this.revealProgress < 1) {
                this.revealProgress += delta / (CONFIG.reveal.duration / 1000);
                if (this.revealProgress >= 1) {
                    this.revealProgress = 1;
                    this.isRevealing = false;
                    if (this.onRevealComplete) {
                        this.onRevealComplete();
                    }
                }
            }

            // Update waves
            this.waves = this.waves.filter(wave => wave.update(delta));

            // Update geometry
            this.updateGeometry();

            // Update camera for reveal
            this.updateCamera();

            // Update materials
            this.updateMaterials();

            // Render
            this.renderer.render(this.scene, this.camera);

            requestAnimationFrame(() => this.animate());
        }

        updateGeometry() {
            const positions = this.geometry.attributes.position.array;
            const original = this.originalPositions;
            const time = this.time * CONFIG.noise.timeScale;

            // Noise amplitude decreases during reveal
            const noiseAmp = CONFIG.noise.amplitude * (1 - this.easeInOutCubic(this.revealProgress) * 0.9);

            for (let i = 0; i < positions.length; i += 3) {
                const ox = original[i];
                const oy = original[i + 1];
                const oz = original[i + 2];

                // Skip masked vertices
                if (oz < -5) continue;

                // Layered noise displacement
                let displacement = 0;

                if (!this.reducedMotion) {
                    const n1 = this.noise.noise3D(
                        ox * CONFIG.noise.scale1,
                        oy * CONFIG.noise.scale1,
                        time
                    );
                    const n2 = this.noise.noise3D(
                        ox * CONFIG.noise.scale2 + 100,
                        oy * CONFIG.noise.scale2,
                        time * 1.5
                    );
                    const n3 = this.noise.noise3D(
                        ox * CONFIG.noise.scale3 + 200,
                        oy * CONFIG.noise.scale3,
                        time * 2
                    );

                    displacement = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2) * noiseAmp;
                }

                // Wave displacement
                for (const wave of this.waves) {
                    const dx = ox - wave.origin.x;
                    const dy = oy - wave.origin.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const waveEdge = wave.radius;
                    const waveWidth = 0.5;

                    if (dist < waveEdge + waveWidth && dist > waveEdge - waveWidth) {
                        const waveDist = Math.abs(dist - waveEdge);
                        const waveStrength = (1 - waveDist / waveWidth) * wave.strength;
                        displacement += Math.sin(waveDist * 10) * waveStrength;
                    }
                }

                // Apply displacement
                positions[i + 2] = displacement;
            }

            this.geometry.attributes.position.needsUpdate = true;
            this.geometry.computeVertexNormals();

            // Update wireframe to match
            if (this.wireframe) {
                this.wireframe.geometry.attributes.position.needsUpdate = true;
            }

            // Update contour lines
            this.updateContourLines();
        }

        updateContourLines() {
            if (!this.contourLines) return;

            const progress = this.easeInOutCubic(this.revealProgress);

            this.contourLines.children.forEach((line, i) => {
                const positions = line.geometry.attributes.position.array;

                for (let j = 0; j < positions.length; j += 3) {
                    const x = positions[j];
                    const y = positions[j + 1];
                    const time = this.time * CONFIG.noise.timeScale;

                    // Match mesh displacement
                    const noiseAmp = CONFIG.noise.amplitude * (1 - progress * 0.9) * 0.5;
                    const n = this.noise.noise3D(
                        x * CONFIG.noise.scale1,
                        y * CONFIG.noise.scale1,
                        time
                    );

                    positions[j + 2] = n * noiseAmp + 0.01; // Slightly in front of mesh
                }

                line.geometry.attributes.position.needsUpdate = true;
            });

            // Fade contours during reveal
            this.contourLines.children.forEach(line => {
                line.material.opacity = 0.4 * (1 - progress * 0.6);
            });
        }

        updateCamera() {
            const progress = this.easeInOutCubic(this.revealProgress);

            // Interpolate camera position
            this.camera.position.z = CONFIG.camera.initialZ +
                (CONFIG.camera.finalZ - CONFIG.camera.initialZ) * progress;

            this.camera.rotation.x = CONFIG.camera.initialRotationX +
                (CONFIG.camera.finalRotationX - CONFIG.camera.initialRotationX) * progress;
        }

        updateMaterials() {
            const progress = this.easeInOutCubic(this.revealProgress);

            // Mesh becomes lighter during reveal
            if (this.mesh && this.mesh.material) {
                const brightness = 0.1 + progress * 0.15;
                this.mesh.material.color.setRGB(brightness, brightness, brightness);
                this.mesh.material.roughness = 0.8 - progress * 0.3;
            }

            // Wireframe fades
            if (this.wireframe && this.wireframe.material) {
                this.wireframe.material.opacity = 0.3 * (1 - progress * 0.7);
            }
        }

        easeInOutCubic(t) {
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        /**
         * Get reveal progress (0-1)
         */
        getRevealProgress() {
            return this.revealProgress;
        }

        /**
         * Cleanup
         */
        dispose() {
            this.stop();

            if (this.renderer) {
                this.renderer.dispose();
                this.container.removeChild(this.renderer.domElement);
            }

            if (this.geometry) {
                this.geometry.dispose();
            }

            if (this.mesh && this.mesh.material) {
                this.mesh.material.dispose();
            }
        }
    }

    // Export
    window.ProceduralField = ProceduralField;

})();
