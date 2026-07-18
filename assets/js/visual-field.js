/**
 * Visual Field - Canvas 2D Renderer
 *
 * Handles particle field, ripple effects, and garment morph animation
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        particleCount: {
            mobile: 3000,
            desktop: 8000
        },
        ripple: {
            maxCount: 5,
            duration: 900,
            maxRadius: 0.35 // viewport width percentage
        },
        ambient: {
            speed: 0.0003,
            amplitude: 0.02
        },
        morph: {
            duration: 1400
        },
        colors: {
            particle: 'rgba(192, 192, 192, 0.6)',
            particleBright: 'rgba(255, 255, 255, 0.9)',
            ripple: 'rgba(255, 255, 255, 0.15)'
        }
    };

    /**
     * Particle class
     */
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.originX = x;
            this.originY = y;
            this.targetX = x;
            this.targetY = y;
            this.vx = 0;
            this.vy = 0;
            this.size = Math.random() * 1.5 + 0.5;
            this.alpha = Math.random() * 0.5 + 0.3;
            this.phase = Math.random() * Math.PI * 2;
        }

        update(time, ripples, morphProgress, reducedMotion) {
            // Ambient drift (disabled in reduced motion)
            if (!reducedMotion && morphProgress === 0) {
                const drift = Math.sin(time * CONFIG.ambient.speed + this.phase) * CONFIG.ambient.amplitude;
                this.x = this.originX + drift * 100;
                this.y = this.originY + Math.cos(time * CONFIG.ambient.speed * 0.7 + this.phase) * CONFIG.ambient.amplitude * 50;
            }

            // Ripple displacement
            for (const ripple of ripples) {
                const dx = this.x - ripple.x;
                const dy = this.y - ripple.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const rippleRadius = ripple.radius;
                const waveWidth = 60;

                if (dist < rippleRadius + waveWidth && dist > rippleRadius - waveWidth) {
                    const waveDist = Math.abs(dist - rippleRadius);
                    const waveStrength = 1 - waveDist / waveWidth;
                    const angle = Math.atan2(dy, dx);
                    const displacement = waveStrength * 15 * ripple.strength;

                    this.x += Math.cos(angle) * displacement;
                    this.y += Math.sin(angle) * displacement;
                }
            }

            // Morph to target
            if (morphProgress > 0) {
                const ease = this.easeOutQuart(morphProgress);
                this.x = this.originX + (this.targetX - this.originX) * ease;
                this.y = this.originY + (this.targetY - this.originY) * ease;
            }
        }

        easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        }
    }

    /**
     * Ripple class
     */
    class Ripple {
        constructor(x, y, maxRadius) {
            this.x = x;
            this.y = y;
            this.maxRadius = maxRadius;
            this.radius = 0;
            this.strength = 1;
            this.startTime = performance.now();
            this.duration = CONFIG.ripple.duration;
        }

        update(time) {
            const elapsed = time - this.startTime;
            const progress = Math.min(elapsed / this.duration, 1);

            this.radius = this.maxRadius * this.easeOutQuad(progress);
            this.strength = 1 - this.easeOutQuad(progress);

            return progress < 1;
        }

        easeOutQuad(t) {
            return t * (2 - t);
        }
    }

    /**
     * Main VisualField class
     */
    class VisualField {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.ripples = [];
            this.maskPoints = [];
            this.isRunning = false;
            this.morphProgress = 0;
            this.isMorphing = false;
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.onMorphComplete = null;
            this.lastFrameTime = 0;
            this.frameCount = 0;

            this.init();
        }

        init() {
            this.resize();
            this.createParticles();
            this.bindEvents();

            // Listen for reduced motion changes
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.reducedMotion = e.matches;
            });
        }

        resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const rect = this.canvas.getBoundingClientRect();

            this.width = rect.width;
            this.height = rect.height;

            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;

            this.ctx.scale(dpr, dpr);
        }

        createParticles() {
            this.particles = [];
            const isMobile = window.innerWidth < 768;
            const count = isMobile ? CONFIG.particleCount.mobile : CONFIG.particleCount.desktop;

            for (let i = 0; i < count; i++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                this.particles.push(new Particle(x, y));
            }
        }

        bindEvents() {
            // Resize handler
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.resize();
                    this.createParticles();
                    if (this.maskPoints.length > 0) {
                        this.assignTargets();
                    }
                }, 200);
            });

            // Pointer events for ripples
            this.canvas.addEventListener('pointerdown', (e) => this.handlePointer(e));
            this.canvas.addEventListener('pointermove', (e) => {
                if (e.pressure > 0 || e.pointerType === 'touch') {
                    this.handlePointer(e);
                }
            });

            // Keyboard support
            this.canvas.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.createRipple(this.width / 2, this.height / 2);
                }
            });
        }

        handlePointer(e) {
            if (this.isMorphing && this.morphProgress > 0.5) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.createRipple(x, y);
        }

        createRipple(x, y) {
            // Limit ripple count
            if (this.ripples.length >= CONFIG.ripple.maxCount) {
                this.ripples.shift();
            }

            const maxRadius = Math.min(this.width, this.height) * CONFIG.ripple.maxRadius;
            this.ripples.push(new Ripple(x, y, maxRadius));

            // Dispatch event for state machine
            this.canvas.dispatchEvent(new CustomEvent('tid:ripple', {
                detail: { x, y }
            }));
        }

        /**
         * Load SVG mask and extract points
         */
        async loadMask(url) {
            try {
                const response = await fetch(url);
                const svgText = await response.text();

                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const paths = svgDoc.querySelectorAll('path');

                this.maskPoints = [];

                // Sample points from paths
                paths.forEach(path => {
                    const length = path.getTotalLength();
                    const pointCount = Math.floor(length / 3); // Point every 3 units

                    for (let i = 0; i < pointCount; i++) {
                        const point = path.getPointAtLength((i / pointCount) * length);
                        this.maskPoints.push({ x: point.x, y: point.y });
                    }
                });

                // Get SVG viewBox for scaling
                const svg = svgDoc.querySelector('svg');
                const viewBox = svg.getAttribute('viewBox');
                if (viewBox) {
                    const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
                    this.svgViewBox = { width: vbWidth, height: vbHeight };
                } else {
                    this.svgViewBox = { width: 400, height: 500 };
                }

                this.assignTargets();
                return true;
            } catch (error) {
                console.warn('Failed to load mask:', error);
                // Fallback: create simple rectangle silhouette
                this.createFallbackMask();
                return false;
            }
        }

        createFallbackMask() {
            this.maskPoints = [];
            const centerX = this.width / 2;
            const centerY = this.height / 2;
            const w = 200;
            const h = 300;

            // Simple rectangle with rounded top (basic garment shape)
            for (let i = 0; i < 100; i++) {
                const t = i / 100;
                // Left edge
                this.maskPoints.push({ x: centerX - w/2, y: centerY - h/2 + t * h });
                // Right edge
                this.maskPoints.push({ x: centerX + w/2, y: centerY - h/2 + t * h });
                // Top edge
                this.maskPoints.push({ x: centerX - w/2 + t * w, y: centerY - h/2 });
                // Bottom edge
                this.maskPoints.push({ x: centerX - w/2 + t * w, y: centerY + h/2 });
            }

            this.svgViewBox = { width: this.width, height: this.height };
            this.assignTargets();
        }

        assignTargets() {
            if (this.maskPoints.length === 0) return;

            // Scale mask to fit canvas
            const scale = Math.min(
                (this.width * 0.6) / this.svgViewBox.width,
                (this.height * 0.6) / this.svgViewBox.height
            );
            const offsetX = (this.width - this.svgViewBox.width * scale) / 2;
            const offsetY = (this.height - this.svgViewBox.height * scale) / 2;

            // Scale mask points
            const scaledMask = this.maskPoints.map(p => ({
                x: p.x * scale + offsetX,
                y: p.y * scale + offsetY
            }));

            // Assign particles to mask points
            const particlesPerPoint = Math.ceil(this.particles.length / scaledMask.length);

            this.particles.forEach((particle, i) => {
                const maskIndex = Math.floor(i / particlesPerPoint) % scaledMask.length;
                const target = scaledMask[maskIndex];

                // Add some randomness around the target
                particle.targetX = target.x + (Math.random() - 0.5) * 10;
                particle.targetY = target.y + (Math.random() - 0.5) * 10;
            });
        }

        /**
         * Start the morph animation
         */
        startMorph(callback) {
            if (this.isMorphing) return;

            this.isMorphing = true;
            this.morphProgress = 0;
            this.onMorphComplete = callback;

            if (this.reducedMotion) {
                // Skip to end for reduced motion
                this.morphProgress = 1;
                this.isMorphing = false;
                if (callback) callback();
            }
        }

        /**
         * Start the animation loop
         */
        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            this.animate();
        }

        /**
         * Stop the animation loop
         */
        stop() {
            this.isRunning = false;
        }

        /**
         * Main animation loop
         */
        animate() {
            if (!this.isRunning) return;

            const time = performance.now();

            // Update morph progress
            if (this.isMorphing && this.morphProgress < 1) {
                this.morphProgress += (time - this.lastFrameTime) / CONFIG.morph.duration;
                if (this.morphProgress >= 1) {
                    this.morphProgress = 1;
                    this.isMorphing = false;
                    if (this.onMorphComplete) {
                        this.onMorphComplete();
                    }
                }
            }

            // Update ripples
            this.ripples = this.ripples.filter(ripple => ripple.update(time));

            // Update particles
            this.particles.forEach(particle => {
                particle.update(time, this.ripples, this.morphProgress, this.reducedMotion);
            });

            // Render
            this.render();

            this.lastFrameTime = time;
            this.frameCount++;

            requestAnimationFrame(() => this.animate());
        }

        /**
         * Render the scene
         */
        render() {
            const ctx = this.ctx;

            // Clear
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, this.width, this.height);

            // Draw ripple rings
            this.ripples.forEach(ripple => {
                const gradient = ctx.createRadialGradient(
                    ripple.x, ripple.y, ripple.radius * 0.8,
                    ripple.x, ripple.y, ripple.radius
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                gradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.1 * ripple.strength})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            });

            // Draw particles
            this.particles.forEach(particle => {
                const isActive = this.ripples.some(ripple => {
                    const dx = particle.x - ripple.x;
                    const dy = particle.y - ripple.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    return Math.abs(dist - ripple.radius) < 40;
                });

                const alpha = particle.alpha * (this.morphProgress > 0 ? 1 - this.morphProgress * 0.85 : 1);

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = isActive
                    ? `rgba(255, 255, 255, ${Math.min(alpha * 2, 1)})`
                    : `rgba(192, 192, 192, ${alpha})`;
                ctx.fill();
            });
        }

        /**
         * Get normalized coordinates (0-1)
         */
        getNormalizedCoords(x, y) {
            return {
                x: x / this.width,
                y: y / this.height
            };
        }

        /**
         * Create ripple from normalized coordinates
         */
        createRippleNormalized(nx, ny) {
            this.createRipple(nx * this.width, ny * this.height);
        }
    }

    // Export to global scope
    window.VisualField = VisualField;

})();
