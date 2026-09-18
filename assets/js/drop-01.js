/**
 * True Impulse Drop 01 - Main Controller
 *
 * State machine, loading animation, custom cursor, and WooCommerce cart integration
 * Works with ProceduralField for visual experience
 */

(function() {
    'use strict';

    // State constants
    const STATES = {
        LOADING: 'loading',
        FIELD: 'field',
        FORMATION: 'formation',
        REVEAL: 'reveal',
        DETAIL: 'detail',
        PURCHASE: 'purchase',
        FAILURE: 'failure'
    };

    /**
     * Loading Pyramid Animation
     */
    class LoadingPyramid {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.time = 0;
            this.isRunning = false;
            this.layers = 12;
            this.baseTwist = -0.6;
            this.rotationSpeed = 0.2;
            this.growthSpeed = 0.15;

            this.resize();
            this.start();
        }

        resize() {
            const dpr = Math.min(window.devicePixelRatio, 2);
            const size = 120;
            this.canvas.width = size * dpr;
            this.canvas.height = size * dpr;
            this.ctx.scale(dpr, dpr);
            this.size = size;
            this.cx = size / 2;
            this.cy = size / 2;
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

            this.render();
            requestAnimationFrame(() => this.animate());
        }

        render() {
            const ctx = this.ctx;
            const { cx, cy, size, layers, time, baseTwist, rotationSpeed } = this;

            ctx.clearRect(0, 0, size, size);
            ctx.save();
            ctx.translate(cx, cy);

            // Continuous growth - loops
            const growthCycle = (time * this.growthSpeed) % 1;
            const baseScale = 0.3 + growthCycle * 0.7;

            for (let i = 0; i < layers; i++) {
                const t = i / (layers - 1);
                const outerRadius = 50;
                const innerRadius = 5;
                const radius = (outerRadius - (outerRadius - innerRadius) * t) * baseScale;

                const layerRotationSpeed = rotationSpeed * (1 + t * 2);
                const timeRotation = time * layerRotationSpeed;
                const breathe = Math.sin(time * 0.8) * 0.04 * (1 + t);
                const twist = baseTwist * t + timeRotation + breathe;

                const light = 15 + t * 35;
                const alpha = 0.6 + t * 0.4;

                ctx.beginPath();
                for (let v = 0; v <= 3; v++) {
                    const angle = (v / 3) * Math.PI * 2 - Math.PI / 2 + twist;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    if (v === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();

                ctx.strokeStyle = `hsla(0, 0%, ${light}%, ${alpha})`;
                ctx.lineWidth = 1.8 - t * 0.6;
                ctx.stroke();

                if (t > 0.4) {
                    ctx.fillStyle = `hsla(0, 0%, ${light}%, ${0.08 * t})`;
                    ctx.fill();
                }
            }

            ctx.restore();
        }
    }

    /**
     * Main Drop Controller
     */
    class DropController {
        constructor() {
            this.state = STATES.LOADING;
            this.proceduralField = null;
            this.loadingPyramid = null;
            this.selectedVariation = null;
            this.selectedColor = null;
            this.currentProductIndex = 0;
            this.isAddingToCart = false;
            this.config = window.tidConfig || {};
            this.products = this.config.products || [this.config.product];
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            this.elements = {};
            this.init();
        }

        init() {
            this.cacheElements();
            this.initLoadingPyramid();
            this.bindEvents();
            this.renderCurrentProduct();
            this.loadExperience();
        }

        cacheElements() {
            this.elements = {
                drop: document.getElementById('tid-drop'),
                fieldContainer: document.getElementById('tid-field-container'),
                loadingPyramid: document.getElementById('tid-loading-pyramid'),
                cursor: document.getElementById('tid-cursor'),
                materializeBtn: document.getElementById('tid-materialize-btn'),
                productReveal: document.querySelector('.tid-product-reveal'),
                productContainer: document.getElementById('tid-product-container'),
                productFront: document.getElementById('tid-product-front'),
                productBack: document.getElementById('tid-product-back'),
                productWorn: document.getElementById('tid-product-worn'),
                productVideo: document.getElementById('tid-product-video'),
                rotationVideo: document.getElementById('tid-rotation-video'),
                viewToggle: document.getElementById('tid-view-toggle'),
                cartBtn: document.getElementById('tid-cart-btn'),
                purchaseTray: document.getElementById('tid-purchase-tray'),
                trayToggle: document.querySelector('.tid-purchase-tray__toggle'),
                trayContent: document.getElementById('tid-purchase-content'),
                productName: document.querySelector('.tid-purchase-tray__product-name'),
                productPrice: document.querySelector('.tid-purchase-tray__price'),
                sizeSelector: document.querySelector('.tid-size-selector'),
                sizeContainer: document.querySelector('.tid-size-selector__options'),
                sizeButtons: document.querySelectorAll('.tid-size-btn'),
                colorSelector: document.getElementById('tid-color-selector'),
                colorContainer: document.querySelector('.tid-color-selector__options'),
                productTabs: document.getElementById('tid-product-tabs'),
                addToCartBtn: document.getElementById('tid-add-to-cart'),
                cartError: document.getElementById('tid-cart-error')
            };
        }

        initLoadingPyramid() {
            if (this.elements.loadingPyramid) {
                this.loadingPyramid = new LoadingPyramid(this.elements.loadingPyramid);
            }
        }

        bindEvents() {
            // Custom cursor tracking
            if (this.elements.cursor) {
                this.cursorTarget = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
                this.cursorPos = { x: this.cursorTarget.x, y: this.cursorTarget.y };

                window.addEventListener('mousemove', (e) => {
                    this.cursorTarget.x = e.clientX;
                    this.cursorTarget.y = e.clientY;
                });

                const animateCursor = () => {
                    this.cursorPos.x += (this.cursorTarget.x - this.cursorPos.x) * 0.15;
                    this.cursorPos.y += (this.cursorTarget.y - this.cursorPos.y) * 0.15;

                    this.elements.cursor.style.left = this.cursorPos.x + 'px';
                    this.elements.cursor.style.top = this.cursorPos.y + 'px';

                    if (this.state === STATES.FIELD) {
                        this.elements.cursor.classList.add('active');
                    } else {
                        this.elements.cursor.classList.remove('active');
                    }

                    requestAnimationFrame(animateCursor);
                };
                animateCursor();
            }

            // Click on field to materialize
            if (this.elements.fieldContainer) {
                this.elements.fieldContainer.addEventListener('click', () => {
                    if (this.state === STATES.FIELD) {
                        this.materialize();
                    }
                });
            }

            // Materialize button (accessibility fallback)
            if (this.elements.materializeBtn) {
                this.elements.materializeBtn.addEventListener('click', () => this.materialize());
            }

            // Purchase tray toggle
            if (this.elements.trayToggle) {
                this.elements.trayToggle.addEventListener('click', () => this.togglePurchaseTray());
            }

            // Size selection
            this.elements.sizeButtons.forEach(btn => {
                btn.addEventListener('click', () => this.selectSize(btn));
            });

            // Add to cart
            if (this.elements.addToCartBtn) {
                this.elements.addToCartBtn.addEventListener('click', () => this.addToCart());
            }

            // View toggle buttons
            if (this.elements.viewToggle) {
                this.elements.viewToggle.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', () => this.switchView(btn.dataset.view));
                });
            }

            // Product image click - create ripple
            if (this.elements.productContainer) {
                this.elements.productContainer.addEventListener('click', (e) => {
                    if (e.target.tagName === 'IMG') {
                        this.createImageRipple(e);
                    }
                });
            }

            // Product tab switching
            if (this.elements.productTabs) {
                this.elements.productTabs.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const index = parseInt(btn.dataset.productIndex, 10);
                        this.switchProduct(index);
                    });
                });
            }

            // Color selection (delegated for dynamic buttons)
            if (this.elements.colorContainer) {
                this.elements.colorContainer.addEventListener('click', (e) => {
                    const btn = e.target.closest('.tid-color-btn');
                    if (btn) {
                        this.selectColor(btn.dataset.color);
                    }
                });
            }

            // Cart button - go to cart page
            if (this.elements.cartBtn) {
                this.elements.cartBtn.addEventListener('click', () => {
                    window.location.href = this.config.cart_url || '/cart/';
                });
            }
        }

        async loadExperience() {
            try {
                // Initialize procedural field
                if (this.elements.fieldContainer && window.ProceduralField) {
                    this.proceduralField = new window.ProceduralField(this.elements.fieldContainer);
                    this.proceduralField.start();
                }

                // Brief loading delay for pyramid animation
                await this.delay(1500);

                // Transition to field state
                this.setState(STATES.FIELD);

                // Stop loading pyramid after transition
                await this.delay(800);
                if (this.loadingPyramid) {
                    this.loadingPyramid.stop();
                }

            } catch (error) {
                console.error('Failed to initialize:', error);
                this.setState(STATES.REVEAL); // Fallback to product view
            }
        }

        setState(newState) {
            this.state = newState;
            if (this.elements.drop) {
                this.elements.drop.dataset.state = newState;
            }
        }

        materialize() {
            if (this.state !== STATES.FIELD) return;

            this.setState(STATES.FORMATION);

            if (this.proceduralField) {
                this.proceduralField.startReveal(() => {
                    this.onRevealComplete();
                });
            } else {
                setTimeout(() => this.onRevealComplete(), 300);
            }
        }

        onRevealComplete() {
            this.setState(STATES.REVEAL);

            // Remove aria-hidden from product reveal
            if (this.elements.productReveal) {
                this.elements.productReveal.setAttribute('aria-hidden', 'false');
            }

            // Show view toggle
            if (this.elements.viewToggle) {
                this.elements.viewToggle.style.display = 'flex';
            }

            // Expand purchase tray
            if (this.elements.trayToggle) {
                this.elements.trayToggle.setAttribute('aria-expanded', 'true');
            }

            // Animate product in with GSAP if available
            if (window.gsap && this.elements.productReveal) {
                gsap.fromTo(this.elements.productReveal,
                    { opacity: 0 },
                    { opacity: 1, duration: 1.2, ease: 'power2.out' }
                );
            }
        }

        switchView(view) {
            if (!this.elements.viewToggle) return;

            // Update toggle buttons
            this.elements.viewToggle.querySelectorAll('button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });

            const productContainer = this.elements.productContainer;

            // Helper to perform the actual view switch
            const performSwitch = () => {
                // Hide all views
                if (this.elements.productFront) this.elements.productFront.style.display = 'none';
                if (this.elements.productWorn) this.elements.productWorn.style.display = 'none';
                if (this.elements.productVideo) this.elements.productVideo.classList.remove('active');
                if (this.elements.productBack) this.elements.productBack.style.display = 'none';

                // Pause video
                if (this.elements.rotationVideo) {
                    this.elements.rotationVideo.pause();
                }

                // Show selected view
                switch (view) {
                    case 'front':
                        if (this.elements.productFront) this.elements.productFront.style.display = 'block';
                        break;
                    case 'back':
                        if (this.elements.productBack) this.elements.productBack.style.display = 'block';
                        break;
                    case 'worn':
                        if (this.elements.productWorn) this.elements.productWorn.style.display = 'flex';
                        break;
                    case 'video':
                        if (this.elements.productVideo) this.elements.productVideo.classList.add('active');
                        if (this.elements.rotationVideo) {
                            this.elements.rotationVideo.play().catch(() => {});
                        }
                        break;
                }
            };

            // Animate with GSAP if available
            if (window.gsap && productContainer) {
                gsap.to(productContainer, {
                    opacity: 0,
                    duration: 0.2,
                    ease: 'power2.in',
                    onComplete: () => {
                        performSwitch();
                        gsap.to(productContainer, {
                            opacity: 1,
                            duration: 0.3,
                            ease: 'power2.out'
                        });
                    }
                });
            } else {
                performSwitch();
            }
        }

        createImageRipple(e) {
            if (!this.elements.productContainer) return;

            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 70%);
                transform: translate(-50%, -50%);
                pointer-events: none;
            `;

            this.elements.productContainer.style.position = 'relative';
            this.elements.productContainer.appendChild(ripple);

            if (window.gsap) {
                gsap.to(ripple, {
                    width: 300,
                    height: 300,
                    opacity: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    onComplete: () => ripple.remove()
                });
            } else {
                setTimeout(() => ripple.remove(), 800);
            }
        }

        togglePurchaseTray() {
            const toggle = this.elements.trayToggle;
            if (!toggle) return;

            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !isExpanded);
        }

        selectSize(button) {
            if (button.disabled) return;

            this.elements.sizeButtons.forEach(btn => {
                btn.setAttribute('aria-checked', 'false');
            });
            button.setAttribute('aria-checked', 'true');

            this.selectedVariation = {
                id: parseInt(button.dataset.variationId, 10),
                size: button.dataset.size
            };

            const addBtn = this.elements.addToCartBtn;
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.querySelector('.tid-btn__text').textContent = this.config.i18n?.add_to_cart || 'Add to Cart';
            }
        }

        async addToCart() {
            if (!this.selectedVariation || this.isAddingToCart) return;

            const addBtn = this.elements.addToCartBtn;
            if (!addBtn) return;

            this.isAddingToCart = true;
            addBtn.classList.add('loading');
            this.clearError();

            try {
                const response = await this.postAddToCart();

                if (response.success) {
                    addBtn.querySelector('.tid-btn__text').textContent = this.config.i18n?.added || 'Added!';
                    addBtn.classList.remove('loading');
                    addBtn.classList.add('added');

                    // Update cart count badge
                    this.updateCartCount(response.data?.cart_count);

                    // Reset button after a moment
                    setTimeout(() => {
                        addBtn.classList.remove('added');
                        this.resetAddToCartButton();
                        this.isAddingToCart = false;
                    }, 1500);

                } else {
                    throw new Error(response.data?.message || 'Failed to add to cart');
                }

            } catch (error) {
                console.error('Add to cart error:', error);
                this.showError(error.message || this.config.i18n?.error || 'Error adding to cart');
                addBtn.classList.remove('loading');
                this.isAddingToCart = false;
            }
        }

        async postAddToCart() {
            const product = this.getCurrentProduct();
            const productId = product?.id || this.elements.addToCartBtn?.dataset.productId;
            const variationId = this.selectedVariation?.id;

            // Demo mode - simulate success
            if (!productId || product?.is_demo) {
                await this.delay(300);
                return {
                    success: true,
                    data: {
                        checkout_url: '/checkout/',
                        message: 'Demo mode - item added'
                    }
                };
            }

            // Use WooCommerce's native add-to-cart via query string
            const addToCartUrl = new URL(this.config.cart_url || window.location.origin);
            addToCartUrl.searchParams.set('add-to-cart', variationId || productId);
            if (variationId) {
                addToCartUrl.searchParams.set('variation_id', variationId);
            }
            addToCartUrl.searchParams.set('quantity', '1');

            try {
                const response = await fetch(addToCartUrl.toString(), {
                    method: 'GET',
                    credentials: 'same-origin',
                    redirect: 'manual'
                });

                // WooCommerce redirects on success - treat as success
                if (response.type === 'opaqueredirect' || response.ok || response.status === 302) {
                    return {
                        success: true,
                        data: {
                            checkout_url: this.config.checkout_url || '/checkout/',
                            message: 'Added to cart'
                        }
                    };
                }

                return { success: false, data: { message: 'Failed to add to cart' } };
            } catch (error) {
                // Network error or redirect (which we want)
                return {
                    success: true,
                    data: {
                        checkout_url: this.config.checkout_url || '/checkout/',
                        message: 'Added to cart'
                    }
                };
            }
        }

        showError(message) {
            if (this.elements.cartError) {
                this.elements.cartError.textContent = message;
            }
        }

        clearError() {
            if (this.elements.cartError) {
                this.elements.cartError.textContent = '';
            }
        }

        /**
         * Get current product data
         */
        getCurrentProduct() {
            return this.products[this.currentProductIndex] || this.products[0];
        }

        /**
         * Switch to a different product
         */
        switchProduct(index) {
            if (index === this.currentProductIndex || index < 0 || index >= this.products.length) {
                return;
            }

            // Update tab states immediately
            if (this.elements.productTabs) {
                this.elements.productTabs.querySelectorAll('button').forEach((btn, i) => {
                    btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
                    btn.classList.toggle('active', i === index);
                });
            }

            // Fade out, update, fade in
            const productImage = this.elements.productContainer;
            const trayContent = this.elements.trayContent;

            if (window.gsap && productImage) {
                // Fade out product image
                gsap.to(productImage, {
                    opacity: 0,
                    duration: 0.25,
                    ease: 'power2.in',
                    onComplete: () => {
                        // Update state and render
                        this.currentProductIndex = index;
                        this.selectedVariation = null;
                        this.selectedColor = null;
                        this.renderCurrentProduct();
                        this.resetAddToCartButton();

                        // Fade back in
                        gsap.to(productImage, {
                            opacity: 1,
                            duration: 0.4,
                            ease: 'power2.out'
                        });
                    }
                });
            } else {
                // No GSAP - instant switch
                this.currentProductIndex = index;
                this.selectedVariation = null;
                this.selectedColor = null;
                this.renderCurrentProduct();
                this.resetAddToCartButton();
            }
        }

        /**
         * Render the current product (colors, sizes, images, name, price)
         */
        renderCurrentProduct() {
            const product = this.getCurrentProduct();
            if (!product) return;

            // Update product name and price in tray
            if (this.elements.productName) {
                this.elements.productName.textContent = product.name;
            }
            if (this.elements.productPrice) {
                this.elements.productPrice.innerHTML = product.price_html;
            }

            // Update product images
            if (this.elements.productFront && product.images?.front) {
                this.elements.productFront.src = product.images.front;
                this.elements.productFront.alt = `${product.name} - Front view`;
            }
            if (this.elements.productWorn) {
                const wornImg = this.elements.productWorn.querySelector('img');
                if (wornImg && product.images?.back) {
                    wornImg.src = product.images.back;
                    wornImg.alt = `${product.name} - Worn`;
                }
            }

            // Update add to cart button product ID
            if (this.elements.addToCartBtn) {
                this.elements.addToCartBtn.dataset.productId = product.id;
            }

            // Configure view toggle buttons based on product type
            this.configureViewToggle(product);

            // Render color swatches if product has colors
            this.renderColorSwatches(product);

            // Select first color if available
            if (product.has_colors && product.colors?.length > 0) {
                this.selectedColor = product.colors[0].toLowerCase();
            }

            // Render size buttons
            this.renderSizeButtons();
        }

        /**
         * Configure view toggle buttons based on product type
         */
        configureViewToggle(product) {
            if (!this.elements.viewToggle) return;

            const hasColors = product.has_colors && product.colors?.length >= 2;
            const videoBtn = this.elements.viewToggle.querySelector('[data-view="video"]');
            const backBtn = this.elements.viewToggle.querySelector('[data-view="back"]');

            if (hasColors) {
                // Hoodie: hide 360, show back
                if (videoBtn) videoBtn.style.display = 'none';
                if (backBtn) backBtn.style.display = 'inline-flex';
            } else {
                // Tank: show 360, hide back
                if (videoBtn) videoBtn.style.display = 'inline-flex';
                if (backBtn) backBtn.style.display = 'none';
            }

            // Reset to front view when switching products
            this.switchView('front');
        }

        /**
         * Render color swatches for a product
         */
        renderColorSwatches(product) {
            const colorSelector = this.elements.colorSelector;
            const colorContainer = this.elements.colorContainer;

            if (!colorSelector || !colorContainer) return;

            // Clear existing swatches
            colorContainer.innerHTML = '';

            // Hide if less than 2 colors (no need for picker with single color)
            if (!product.has_colors || !product.colors?.length || product.colors.length < 2) {
                colorSelector.style.display = 'none';
                // Auto-select the single color if one exists
                if (product.colors?.length === 1) {
                    this.selectedColor = product.colors[0].toLowerCase();
                }
                return;
            }

            // Show color selector (2+ colors)
            colorSelector.style.display = 'block';

            // Create color buttons
            product.colors.forEach((color, index) => {
                const colorKey = color.toLowerCase();
                const colorHex = this.config.colorMap?.[colorKey] || '#888888';

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'tid-color-btn';
                btn.dataset.color = colorKey;
                btn.setAttribute('role', 'radio');
                btn.setAttribute('aria-checked', index === 0 ? 'true' : 'false');
                btn.setAttribute('aria-label', color);
                btn.style.backgroundColor = colorHex;

                const srText = document.createElement('span');
                srText.className = 'screen-reader-text';
                srText.textContent = color;
                btn.appendChild(srText);

                colorContainer.appendChild(btn);
            });

            // Auto-select first color and update images
            if (product.colors.length > 0) {
                this.selectedColor = product.colors[0].toLowerCase();
                this.updateColorImages(this.selectedColor);
            }
        }

        /**
         * Select a color and filter size buttons
         */
        selectColor(color) {
            if (!color) return;

            this.selectedColor = color.toLowerCase();
            this.selectedVariation = null;

            // Update color button states
            if (this.elements.colorContainer) {
                this.elements.colorContainer.querySelectorAll('.tid-color-btn').forEach(btn => {
                    const isSelected = btn.dataset.color === this.selectedColor;
                    btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
                });
            }

            // Update product images for color
            this.updateColorImages(this.selectedColor);

            // Re-render sizes filtered by color
            this.renderSizeButtons();

            // Reset add to cart button
            this.resetAddToCartButton();
        }

        /**
         * Update product images based on selected color
         */
        updateColorImages(color) {
            const product = this.getCurrentProduct();
            if (!product || !product.has_colors || !color) return;

            // Check if this product has color-specific images in assets
            const assetsUrl = this.config.assets_url || '';
            const colorKey = color.toLowerCase();

            // Hoodie color images are in assets/img/hoodie/{color}-{view}.{ext}
            if (product.colors?.length >= 2) {
                const frontUrl = `${assetsUrl}img/hoodie/${colorKey}-front.png`;
                const backUrl = `${assetsUrl}img/hoodie/${colorKey}-back.png`;
                const hangerUrl = `${assetsUrl}img/hoodie/${colorKey}-hanger.jpeg`;

                // Update front image
                if (this.elements.productFront) {
                    this.elements.productFront.src = frontUrl;
                    this.elements.productFront.alt = `${product.name} - ${color} Front view`;
                }

                // Update back image (design on back)
                if (this.elements.productBack) {
                    this.elements.productBack.src = backUrl;
                    this.elements.productBack.alt = `${product.name} - ${color} Back view`;
                }

                // Update worn/hanger image
                if (this.elements.productWorn) {
                    const wornImg = this.elements.productWorn.querySelector('img');
                    if (wornImg) {
                        wornImg.src = hangerUrl;
                        wornImg.alt = `${product.name} - ${color} Worn`;
                    }
                }
            }
        }

        /**
         * Render size buttons (filtered by color if applicable)
         */
        renderSizeButtons() {
            const product = this.getCurrentProduct();
            const container = this.elements.sizeContainer;

            if (!container || !product) return;

            // Get filtered variations
            const variations = this.getFilteredVariations();

            // Clear existing buttons
            container.innerHTML = '';

            // Get unique sizes from filtered variations
            const sizeMap = new Map();
            variations.forEach(v => {
                if (!sizeMap.has(v.size)) {
                    sizeMap.set(v.size, v);
                } else if (v.in_stock && !sizeMap.get(v.size).in_stock) {
                    // Prefer in-stock variation
                    sizeMap.set(v.size, v);
                }
            });

            // Create size buttons
            sizeMap.forEach((variation, size) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'tid-size-btn';
                if (!variation.in_stock) {
                    btn.className += ' tid-size-btn--sold-out';
                    btn.disabled = true;
                    btn.setAttribute('aria-disabled', 'true');
                }
                btn.dataset.variationId = variation.id;
                btn.dataset.size = size;
                btn.setAttribute('role', 'radio');
                btn.setAttribute('aria-checked', 'false');

                const label = document.createElement('span');
                label.className = 'tid-size-btn__label';
                label.textContent = size;
                btn.appendChild(label);

                if (!variation.in_stock) {
                    const status = document.createElement('span');
                    status.className = 'tid-size-btn__status';
                    status.textContent = this.config.i18n?.sold_out || 'Sold Out';
                    btn.appendChild(status);
                }

                // Add click handler
                btn.addEventListener('click', () => this.selectSize(btn));

                container.appendChild(btn);
            });

            // Update cached size buttons reference
            this.elements.sizeButtons = container.querySelectorAll('.tid-size-btn');
        }

        /**
         * Get variations filtered by selected color
         */
        getFilteredVariations() {
            const product = this.getCurrentProduct();
            if (!product?.variations) return [];

            // If product has no colors or no color selected, return all
            if (!product.has_colors || !this.selectedColor) {
                return product.variations;
            }

            // Filter by selected color
            return product.variations.filter(v => {
                return !v.color || v.color.toLowerCase() === this.selectedColor;
            });
        }

        /**
         * Reset add to cart button to initial state
         */
        resetAddToCartButton() {
            const addBtn = this.elements.addToCartBtn;
            if (addBtn) {
                addBtn.disabled = true;
                addBtn.querySelector('.tid-btn__text').textContent = this.config.i18n?.select_size || 'Select Size';
            }
            this.clearError();
        }

        updateCartCount(count) {
            // Increment cart count (we don't always get exact count from server)
            this.cartCount = (this.cartCount || 0) + 1;
            if (typeof count === 'number') {
                this.cartCount = count;
            }

            const countEl = document.getElementById('tid-cart-count');
            const cartBtn = this.elements.cartBtn;

            if (countEl && this.cartCount > 0) {
                countEl.textContent = this.cartCount;
                countEl.style.display = 'flex';
                if (cartBtn) cartBtn.classList.add('has-items');
            }
        }

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new DropController());
    } else {
        new DropController();
    }

})();
