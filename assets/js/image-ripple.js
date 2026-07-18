/**
 * Image Ripple Effect
 *
 * Creates a displacement ripple effect on product images using Canvas
 */

(function() {
    'use strict';

    class ImageRipple {
        constructor(container) {
            this.container = container;
            this.canvas = null;
            this.ctx = null;
            this.image = null;
            this.imageData = null;
            this.ripples = [];
            this.isRunning = false;
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            this.init();
        }

        init() {
            // Find the image in the container
            const img = this.container.querySelector('img');
            if (!img) return;

            // Wait for image to load
            if (img.complete) {
                this.setupCanvas(img);
            } else {
                img.addEventListener('load', () => this.setupCanvas(img));
            }

            // Listen for reduced motion changes
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
                this.reducedMotion = e.matches;
            });
        }

        setupCanvas(img) {
            this.image = img;

            // Create canvas overlay
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'tid-image-ripple-canvas';
            this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                mix-blend-mode: normal;
            `;

            this.ctx = this.canvas.getContext('2d');

            // Insert canvas after image
            img.style.position = 'relative';
            this.container.style.position = 'relative';
            this.container.appendChild(this.canvas);

            this.resize();
            this.bindEvents();
        }

        resize() {
            if (!this.canvas || !this.image) return;

            const rect = this.container.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.width = rect.width;
            this.height = rect.height;

            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.canvas.style.width = this.width + 'px';
            this.canvas.style.height = this.height + 'px';

            this.ctx.scale(dpr, dpr);
        }

        bindEvents() {
            // Click/tap creates ripple
            this.container.addEventListener('pointerdown', (e) => {
                if (this.reducedMotion) return;

                const rect = this.container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.createRipple(x, y);
            });

            // Resize handler
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => this.resize(), 200);
            });
        }

        createRipple(x, y) {
            if (this.ripples.length >= 3) {
                this.ripples.shift();
            }

            this.ripples.push({
                x,
                y,
                radius: 0,
                maxRadius: Math.max(this.width, this.height) * 0.5,
                strength: 1,
                startTime: performance.now(),
                duration: 1200
            });

            if (!this.isRunning) {
                this.start();
            }
        }

        start() {
            this.isRunning = true;
            this.animate();
        }

        stop() {
            this.isRunning = false;
        }

        animate() {
            if (!this.isRunning) return;

            const time = performance.now();

            // Update ripples
            this.ripples = this.ripples.filter(ripple => {
                const elapsed = time - ripple.startTime;
                const progress = Math.min(elapsed / ripple.duration, 1);

                ripple.radius = ripple.maxRadius * this.easeOutQuad(progress);
                ripple.strength = 1 - this.easeOutQuad(progress);

                return progress < 1;
            });

            // Render
            this.render();

            if (this.ripples.length > 0) {
                requestAnimationFrame(() => this.animate());
            } else {
                this.isRunning = false;
                // Clear canvas
                this.ctx.clearRect(0, 0, this.width, this.height);
            }
        }

        render() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            // Draw ripple distortion rings
            this.ripples.forEach(ripple => {
                const gradient = ctx.createRadialGradient(
                    ripple.x, ripple.y, ripple.radius * 0.7,
                    ripple.x, ripple.y, ripple.radius
                );

                // Create a subtle highlight/shadow effect
                const alpha = 0.15 * ripple.strength;
                gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
                gradient.addColorStop(0.4, `rgba(255, 255, 255, ${alpha})`);
                gradient.addColorStop(0.6, `rgba(0, 0, 0, ${alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);

                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Inner bright ring
                const innerGradient = ctx.createRadialGradient(
                    ripple.x, ripple.y, ripple.radius * 0.3,
                    ripple.x, ripple.y, ripple.radius * 0.5
                );
                innerGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
                innerGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.5})`);
                innerGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

                ctx.beginPath();
                ctx.arc(ripple.x, ripple.y, ripple.radius * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = innerGradient;
                ctx.fill();
            });
        }

        easeOutQuad(t) {
            return t * (2 - t);
        }
    }

    // Auto-initialize on product reveal containers
    function initImageRipples() {
        const containers = document.querySelectorAll('.tid-product-image');
        containers.forEach(container => {
            if (!container._ripple) {
                container._ripple = new ImageRipple(container);
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initImageRipples);
    } else {
        initImageRipples();
    }

    // Re-initialize when product is revealed (for dynamic content)
    document.addEventListener('tid:reveal', initImageRipples);

    // Export
    window.ImageRipple = ImageRipple;

})();
