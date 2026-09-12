/**
 * Procedural Field - SVG Path on Warping Space-Time Grid
 *
 * Draws garment outline on a grid that warps with mouse hover.
 */

(function() {
    'use strict';

    const CONFIG = {
        drawing: {
            totalDuration: 2.5,
            lineWidth: 2.5,
            pyramidLineWidth: 1.8
        },
        grid: {
            spacing: 40,
            lineWidth: 0.5,
            color: 'rgba(0, 0, 0, 0.08)'
        },
        wave: {
            amplitude: 6,
            frequency: 0.006,
            speed: 0.5,
            layers: 2
        },
        hover: {
            radius: 300,
            strength: 40,
            falloff: 1.6
        },
        pyramid: {
            layers: 12,
            outerRadius: 65,
            innerRadius: 5,
            baseTwist: -0.6,
            rotationSpeed: 0.08,
            breatheSpeed: 0.4,
            breatheAmount: 0.03,
            centerX: 0.5,
            centerY: 0.42
        },
        colors: {
            outline: '#4a4a4a',
            pyramidLightLow: 0.15,
            pyramidLightHigh: 0.5
        },
        reveal: {
            duration: 1000,
            twistAcceleration: 10,
            expandAmount: 1.5
        },
        svg: {
            path: 'assets/img/garment-outline.svg',
            filename: 'garment-outline.svg'
        }
    };

    class ProceduralField {
        constructor(container) {
            this.container = container;
            this.canvas = null;
            this.ctx = null;
            this.pathPoints = [];

            this.time = 0;
            this.drawProgress = 0;
            this.pyramidRotation = 0;
            this.isRunning = false;
            this.revealProgress = 0;
            this.isRevealing = false;
            this.onRevealComplete = null;

            this.width = 0;
            this.height = 0;
            this.scale = 1;
            this.offsetX = 0;
            this.offsetY = 0;

            // Mouse position for hover warp (no click needed)
            this.mouse = { x: -1000, y: -1000 };
            this.mouseSmooth = { x: -1000, y: -1000 };

            this.svgWidth = 962;
            this.svgHeight = 943;

            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            this.init();
        }

        async init() {
            this.createCanvas();
            this.resize();
            await this.loadSVG();
            this.bindEvents();
        }

        createCanvas() {
            this.canvas = document.createElement('canvas');
            this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                touch-action: none;
            `;
            this.container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
        }

        resize() {
            const dpr = Math.min(window.devicePixelRatio, 2);
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            this.canvas.width = this.width * dpr;
            this.canvas.height = this.height * dpr;
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(dpr, dpr);

            const padding = 0.1;
            const availWidth = this.width * (1 - padding * 2);
            const availHeight = this.height * (1 - padding * 2) - 100;

            const scaleX = availWidth / this.svgWidth;
            const scaleY = availHeight / this.svgHeight;
            this.scale = Math.min(scaleX, scaleY) * 0.8;

            this.offsetX = (this.width - this.svgWidth * this.scale) / 2;
            this.offsetY = (this.height - this.svgHeight * this.scale) / 2 - 20;
        }

        async loadSVG() {
            try {
                // Try to get URL from page data, then tidConfig, then fallback to relative
                const maskData = document.getElementById('tid-mask-data');
                let svgPath = CONFIG.svg.path;

                if (maskData) {
                    try {
                        const data = JSON.parse(maskData.textContent);
                        if (data.outlineUrl) svgPath = data.outlineUrl;
                    } catch (e) {}
                } else if (window.tidConfig?.assets_url) {
                    svgPath = window.tidConfig.assets_url + 'img/' + CONFIG.svg.filename;
                }

                const response = await fetch(svgPath);
                const svgText = await response.text();

                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const pathElement = svgDoc.querySelector('path');

                if (!pathElement) return;

                const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                tempSvg.setAttribute('width', this.svgWidth);
                tempSvg.setAttribute('height', this.svgHeight);
                tempSvg.style.position = 'absolute';
                tempSvg.style.visibility = 'hidden';

                const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                tempPath.setAttribute('d', pathElement.getAttribute('d'));
                tempSvg.appendChild(tempPath);
                document.body.appendChild(tempSvg);

                const pathLength = tempPath.getTotalLength();
                const numPoints = 500;
                this.pathPoints = [];

                for (let i = 0; i <= numPoints; i++) {
                    const distance = (i / numPoints) * pathLength;
                    const point = tempPath.getPointAtLength(distance);
                    this.pathPoints.push({ x: point.x, y: point.y });
                }

                document.body.removeChild(tempSvg);

            } catch (error) {
                console.error('Failed to load SVG:', error);
            }
        }

        bindEvents() {
            window.addEventListener('resize', () => this.resize());

            // Mouse tracking - just hover, no click needed
            window.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.x = e.clientX - rect.left;
                this.mouse.y = e.clientY - rect.top;
            });

            // Touch support
            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                this.mouse.x = touch.clientX - rect.left;
                this.mouse.y = touch.clientY - rect.top;
            }, { passive: false });

            this.canvas.addEventListener('touchend', () => {
                this.mouse.x = -1000;
                this.mouse.y = -1000;
            });

            this.canvas.tabIndex = 0;
        }

        // Calculate wave distortion at a point
        getWaveOffset(x, y, time) {
            const { amplitude, frequency, speed, layers } = CONFIG.wave;
            let offsetX = 0;
            let offsetY = 0;

            for (let i = 0; i < layers; i++) {
                const layerFreq = frequency * (1 + i * 0.5);
                const layerAmp = amplitude / (1 + i * 0.5);
                const layerSpeed = speed * (1 + i * 0.3);
                const phase = i * 1.5;

                offsetX += Math.sin(y * layerFreq + time * layerSpeed + phase) * layerAmp;
                offsetY += Math.cos(x * layerFreq + time * layerSpeed + phase) * layerAmp;
            }

            return { x: offsetX, y: offsetY };
        }

        // Calculate hover warp at a point
        getHoverOffset(x, y) {
            const dx = x - this.mouseSmooth.x;
            const dy = y - this.mouseSmooth.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > CONFIG.hover.radius || dist < 1) return { x: 0, y: 0 };

            const { radius, strength, falloff } = CONFIG.hover;
            const factor = Math.pow(1 - dist / radius, falloff);

            // Push points away from cursor
            const pushX = (dx / dist) * factor * strength;
            const pushY = (dy / dist) * factor * strength;

            return { x: pushX, y: pushY };
        }

        // Get total distortion at a point
        getDistortedPoint(x, y) {
            const wave = this.getWaveOffset(x, y, this.time);
            let newX = x + wave.x;
            let newY = y + wave.y;

            const hover = this.getHoverOffset(newX, newY);
            newX += hover.x;
            newY += hover.y;

            return { x: newX, y: newY };
        }

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

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animate();
        }

        stop() {
            this.isRunning = false;
        }

        animate() {
            if (!this.isRunning) return;

            const now = performance.now();
            const delta = (now - this.lastTime) / 1000;
            this.lastTime = now;
            this.time += delta;

            // Smooth mouse following
            this.mouseSmooth.x += (this.mouse.x - this.mouseSmooth.x) * 0.15;
            this.mouseSmooth.y += (this.mouse.y - this.mouseSmooth.y) * 0.15;

            // Drawing progress
            if (this.drawProgress < 1) {
                this.drawProgress = Math.min(1, this.time / CONFIG.drawing.totalDuration);
            }

            // Pyramid rotation is now handled per-layer in renderPyramid
            // No need for global rotation tracking

            // Reveal progress
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

            this.render();
            requestAnimationFrame(() => this.animate());
        }

        render() {
            const ctx = this.ctx;
            const revealEased = this.easeInOutCubic(this.revealProgress);
            const fade = 1 - revealEased * 0.98;

            // Clear
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, this.width, this.height);

            ctx.save();
            ctx.globalAlpha = fade;

            // Draw space-time grid
            this.renderGrid(ctx);

            // Draw garment outline
            if (this.pathPoints.length > 0) {
                this.renderOutline(ctx);
                this.renderPyramid(ctx, revealEased);
            }

            ctx.restore();

            // Bottom gradient overlay - darker grey at bottom
            const gradientHeight = this.height * 0.4;
            const gradient = ctx.createLinearGradient(0, this.height - gradientHeight, 0, this.height);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(0.5, 'rgba(180, 180, 180, 0.3)');
            gradient.addColorStop(1, 'rgba(100, 100, 100, 0.6)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, this.height - gradientHeight, this.width, gradientHeight);
        }

        renderGrid(ctx) {
            const { spacing, lineWidth, color } = CONFIG.grid;

            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;

            // Horizontal lines
            for (let y = 0; y < this.height + spacing; y += spacing) {
                ctx.beginPath();
                for (let x = 0; x <= this.width; x += 10) {
                    const distorted = this.getDistortedPoint(x, y);
                    if (x === 0) {
                        ctx.moveTo(distorted.x, distorted.y);
                    } else {
                        ctx.lineTo(distorted.x, distorted.y);
                    }
                }
                ctx.stroke();
            }

            // Vertical lines
            for (let x = 0; x < this.width + spacing; x += spacing) {
                ctx.beginPath();
                for (let y = 0; y <= this.height; y += 10) {
                    const distorted = this.getDistortedPoint(x, y);
                    if (y === 0) {
                        ctx.moveTo(distorted.x, distorted.y);
                    } else {
                        ctx.lineTo(distorted.x, distorted.y);
                    }
                }
                ctx.stroke();
            }
        }

        renderOutline(ctx) {
            const pointsToDraw = Math.floor(this.drawProgress * this.pathPoints.length);
            if (pointsToDraw < 2) return;

            ctx.beginPath();

            for (let i = 0; i < pointsToDraw; i++) {
                const point = this.pathPoints[i];

                // Convert to screen coordinates
                const screenX = this.offsetX + point.x * this.scale;
                const screenY = this.offsetY + point.y * this.scale;

                // Apply distortion
                const distorted = this.getDistortedPoint(screenX, screenY);

                if (i === 0) {
                    ctx.moveTo(distorted.x, distorted.y);
                } else {
                    ctx.lineTo(distorted.x, distorted.y);
                }
            }

            ctx.strokeStyle = CONFIG.colors.outline;
            ctx.lineWidth = CONFIG.drawing.lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }

        renderPyramid(ctx, revealEased) {
            const { layers, outerRadius, innerRadius, baseTwist, breatheSpeed, breatheAmount } = CONFIG.pyramid;

            const garmentCenterX = this.svgWidth * CONFIG.pyramid.centerX;
            const garmentCenterY = this.svgHeight * CONFIG.pyramid.centerY;

            const screenX = this.offsetX + garmentCenterX * this.scale;
            const screenY = this.offsetY + garmentCenterY * this.scale;

            // Apply distortion to center
            const distorted = this.getDistortedPoint(screenX, screenY);

            const breathe = Math.sin(this.time * breatheSpeed) * breatheAmount;

            // Continuous growth - starts at 40% and grows over time
            const growthSpeed = 0.008;
            const minScale = 0.4;
            const growthScale = Math.min(1, this.time * growthSpeed);
            const easedGrowth = minScale + (1 - minScale) * (1 - Math.pow(1 - growthScale, 3));

            // Zoom through effect - exponential scale increase
            const zoomScale = this.isRevealing ? 1 + Math.pow(revealEased, 2) * 15 : 1;

            // Overall fade as we zoom through
            const zoomFade = Math.max(0, 1 - revealEased * 1.2);
            if (zoomFade <= 0) return;

            ctx.save();
            ctx.translate(distorted.x, distorted.y);
            ctx.scale(easedGrowth * zoomScale, easedGrowth * zoomScale);
            ctx.globalAlpha *= zoomFade;

            // Each layer twists independently based on its depth
            for (let i = 0; i < layers; i++) {
                const t = i / (layers - 1);
                const radius = (outerRadius - (outerRadius - innerRadius) * t) * this.scale * 7.5;

                const rotationSpeed = CONFIG.pyramid.rotationSpeed * (1 + t * 2);
                const timeRotation = this.time * rotationSpeed;

                // During zoom, outer layers fade first (they "pass by")
                // Inner layers stay visible longer
                const layerFade = this.isRevealing
                    ? Math.max(0, 1 - (revealEased * 2 - (1 - t) * 0.8))
                    : 1;

                if (layerFade <= 0) continue;

                const twist = baseTwist * t + timeRotation + breathe * (1 + t);

                const light = CONFIG.colors.pyramidLightLow +
                    (CONFIG.colors.pyramidLightHigh - CONFIG.colors.pyramidLightLow) * t;

                ctx.save();
                ctx.globalAlpha *= layerFade;

                // Draw rounded triangle - radius increases with layer (outer = more rounded)
                const cornerRadius = Math.min(3 + (1 - t) * 12, radius * 0.4);

                // Calculate 3 vertices
                const vertices = [];
                for (let v = 0; v < 3; v++) {
                    const angle = (v / 3) * Math.PI * 2 - Math.PI / 2 + twist;
                    vertices.push({
                        x: Math.cos(angle) * radius,
                        y: Math.sin(angle) * radius
                    });
                }

                // Draw rounded triangle using arcTo for each corner
                ctx.beginPath();

                // Start between vertex 2 and vertex 0
                const v0 = vertices[0], v1 = vertices[1], v2 = vertices[2];

                // Move to a point on the edge approaching v0
                const startDx = v0.x - v2.x;
                const startDy = v0.y - v2.y;
                const startLen = Math.sqrt(startDx * startDx + startDy * startDy);
                ctx.moveTo(
                    v0.x - (startDx / startLen) * cornerRadius,
                    v0.y - (startDy / startLen) * cornerRadius
                );

                // Arc around v0 towards v1
                ctx.arcTo(v0.x, v0.y, v1.x, v1.y, cornerRadius);
                // Arc around v1 towards v2
                ctx.arcTo(v1.x, v1.y, v2.x, v2.y, cornerRadius);
                // Arc around v2 towards v0
                ctx.arcTo(v2.x, v2.y, v0.x, v0.y, cornerRadius);
                // Close back to start
                ctx.closePath();

                ctx.strokeStyle = `hsl(0, 0%, ${light * 100}%)`;
                ctx.lineWidth = CONFIG.drawing.pyramidLineWidth - t * 0.6;
                ctx.stroke();

                if (t > 0.4) {
                    ctx.fillStyle = `hsla(0, 0%, ${light * 100}%, ${0.08 * t})`;
                    ctx.fill();
                }

                ctx.restore();
            }

            ctx.restore();
        }

        easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        getRevealProgress() {
            return this.revealProgress;
        }

        dispose() {
            this.stop();
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }

    window.ProceduralField = ProceduralField;
})();
