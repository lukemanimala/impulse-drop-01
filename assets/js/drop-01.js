/**
 * True Impulse Drop 01 - Main Controller
 *
 * State machine, UI interactions, and WooCommerce cart integration
 * Works with ProceduralField (Three.js) for visual experience
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
     * Main Drop Controller
     */
    class DropController {
        constructor() {
            this.state = STATES.LOADING;
            this.proceduralField = null;
            this.selectedVariation = null;
            this.isAddingToCart = false;
            this.config = window.tidConfig || {};
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            this.elements = {};
            this.init();
        }

        init() {
            this.cacheElements();
            this.bindEvents();
            this.loadAssets();
        }

        cacheElements() {
            this.elements = {
                drop: document.getElementById('tid-drop'),
                fieldContainer: document.getElementById('tid-field-container'),
                canvas: document.getElementById('tid-canvas'),
                materializeBtn: document.getElementById('tid-materialize-btn'),
                productReveal: document.querySelector('.tid-product-reveal'),
                productContainer: document.getElementById('tid-product-container'),
                productFront: document.getElementById('tid-product-front'),
                productBack: document.getElementById('tid-product-back'),
                productVideo: document.getElementById('tid-product-video'),
                rotationVideo: document.getElementById('tid-rotation-video'),
                viewToggle: document.getElementById('tid-view-toggle'),
                mediaDrawer: document.getElementById('tid-media-drawer'),
                purchaseTray: document.getElementById('tid-purchase-tray'),
                trayToggle: document.querySelector('.tid-purchase-tray__toggle'),
                trayContent: document.getElementById('tid-purchase-content'),
                sizeButtons: document.querySelectorAll('.tid-size-btn'),
                addToCartBtn: document.getElementById('tid-add-to-cart'),
                cartError: document.getElementById('tid-cart-error'),
                founderVideo: document.getElementById('tid-founder-video'),
                carouselNav: document.querySelectorAll('.tid-media-carousel__nav button'),
                carouselTrack: document.querySelector('.tid-media-carousel__track'),
                drawerClose: document.querySelector('.tid-media-drawer__close'),
                videoControl: document.querySelector('.tid-video-control')
            };
        }

        bindEvents() {
            // Materialize button
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

            // Product image click - create ripple or open drawer
            if (this.elements.productContainer) {
                this.elements.productContainer.addEventListener('click', (e) => {
                    if (e.target.tagName === 'IMG') {
                        this.createImageRipple(e);
                    }
                });
            }

            // Media drawer close
            if (this.elements.drawerClose) {
                this.elements.drawerClose.addEventListener('click', () => this.closeMediaDrawer());
            }

            // Carousel navigation
            this.elements.carouselNav.forEach(btn => {
                btn.addEventListener('click', () => this.navigateCarousel(btn.dataset.target));
            });

            // Video control
            if (this.elements.videoControl) {
                this.elements.videoControl.addEventListener('click', () => this.toggleVideo());
            }

            // Keyboard escape to close drawer
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.elements.mediaDrawer?.getAttribute('aria-hidden') === 'false') {
                    this.closeMediaDrawer();
                }
            });

            // Field container ripple event
            if (this.elements.fieldContainer) {
                this.elements.fieldContainer.addEventListener('tid:ripple', () => {
                    this.trackEvent('first_ripple');
                });
            }
        }

        async loadAssets() {
            const timeout = 2000;
            const startTime = Date.now();

            try {
                // Initialize procedural field (Three.js)
                const container = this.elements.fieldContainer || this.elements.canvas?.parentElement;

                if (container && window.ProceduralField) {
                    this.proceduralField = new window.ProceduralField(container);
                    this.proceduralField.start();
                }

                // Ensure minimum loading time for smooth transition
                const elapsed = Date.now() - startTime;
                if (elapsed < 600) {
                    await this.delay(600 - elapsed);
                }

                this.setState(STATES.FIELD);
                this.trackEvent('drop_view');

            } catch (error) {
                console.error('Failed to initialize:', error);
                this.setState(STATES.FAILURE);
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
            this.trackEvent('materialize_click');

            if (this.proceduralField) {
                this.proceduralField.startReveal(() => {
                    this.onMorphComplete();
                });
            } else {
                // Fallback: just show product
                setTimeout(() => this.onMorphComplete(), 300);
            }
        }

        onMorphComplete() {
            this.setState(STATES.REVEAL);
            this.trackEvent('reveal_complete');

            // Show view toggle if available
            if (this.elements.viewToggle) {
                this.elements.viewToggle.style.display = 'flex';
            }

            // Expand purchase tray
            if (this.elements.trayToggle) {
                this.elements.trayToggle.setAttribute('aria-expanded', 'true');
            }

            // Use GSAP for smooth product reveal if available
            if (window.gsap && this.elements.productReveal) {
                gsap.fromTo(this.elements.productReveal,
                    { opacity: 0 },
                    { opacity: 1, duration: 1.0, ease: 'power2.out' }
                );
            }
        }

        switchView(view) {
            if (!this.elements.viewToggle) return;

            // Update toggle buttons
            this.elements.viewToggle.querySelectorAll('button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });

            // Hide all views
            if (this.elements.productFront) this.elements.productFront.style.display = 'none';
            if (this.elements.productBack) this.elements.productBack.style.display = 'none';
            if (this.elements.productVideo) this.elements.productVideo.classList.remove('active');

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
                case 'video':
                    if (this.elements.productVideo) this.elements.productVideo.classList.add('active');
                    if (this.elements.rotationVideo) {
                        this.elements.rotationVideo.play().catch(() => {});
                    }
                    break;
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
                background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%);
                transform: translate(-50%, -50%);
                pointer-events: none;
            `;

            this.elements.productContainer.style.position = 'relative';
            this.elements.productContainer.appendChild(ripple);

            if (window.gsap) {
                gsap.to(ripple, {
                    width: 350,
                    height: 350,
                    opacity: 0,
                    duration: 1.0,
                    ease: 'power2.out',
                    onComplete: () => ripple.remove()
                });
            } else {
                setTimeout(() => ripple.remove(), 1000);
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

            // Update UI
            this.elements.sizeButtons.forEach(btn => {
                btn.setAttribute('aria-checked', 'false');
            });
            button.setAttribute('aria-checked', 'true');

            // Store selection
            this.selectedVariation = {
                id: parseInt(button.dataset.variationId, 10),
                size: button.dataset.size
            };

            // Update add to cart button
            const addBtn = this.elements.addToCartBtn;
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.querySelector('.tid-btn__text').textContent = this.config.i18n?.add_to_cart || 'Add to Cart';
            }

            this.trackEvent('size_select', { size: this.selectedVariation.size });
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
                    this.trackEvent('add_to_cart');

                    // Show success state
                    addBtn.querySelector('.tid-btn__text').textContent = this.config.i18n?.added || 'Added!';

                    // Redirect to checkout
                    setTimeout(() => {
                        this.trackEvent('checkout_redirect');
                        window.location.href = response.data?.checkout_url || this.config.checkout_url || '/checkout/';
                    }, 800);

                } else {
                    throw new Error(response.data?.message || 'Failed to add to cart');
                }

            } catch (error) {
                console.error('Add to cart error:', error);
                this.showError(error.message || this.config.i18n?.error || 'Error adding to cart');
                this.trackEvent('add_to_cart_error');
                addBtn.classList.remove('loading');
                this.isAddingToCart = false;
            }
        }

        async postAddToCart() {
            const productId = this.config.product?.id || this.elements.addToCartBtn?.dataset.productId;
            const variationId = this.selectedVariation?.id;

            // Demo mode - simulate success
            if (!productId || this.config.product?.is_demo) {
                await this.delay(800);
                return {
                    success: true,
                    data: {
                        checkout_url: '/checkout/',
                        message: 'Demo mode - item added'
                    }
                };
            }

            const formData = new FormData();
            formData.append('action', 'tid_add_to_cart');
            formData.append('product_id', productId);
            formData.append('variation_id', variationId || productId);
            formData.append('quantity', 1);
            formData.append('security', this.config.add_to_cart_nonce);

            const response = await fetch(this.config.ajax_url, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            return response.json();
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

        openMediaDrawer() {
            if (this.state !== STATES.REVEAL && this.state !== STATES.DETAIL) return;

            this.setState(STATES.DETAIL);

            if (this.elements.mediaDrawer) {
                this.elements.mediaDrawer.setAttribute('aria-hidden', 'false');
            }

            this.trackEvent('media_open');
        }

        closeMediaDrawer() {
            if (this.elements.mediaDrawer) {
                this.elements.mediaDrawer.setAttribute('aria-hidden', 'true');
            }

            // Pause video if playing
            if (this.elements.founderVideo) {
                this.elements.founderVideo.pause();
                this.elements.founderVideo.classList.remove('playing');
            }

            this.setState(STATES.REVEAL);
        }

        navigateCarousel(target) {
            // Update nav state
            this.elements.carouselNav.forEach(btn => {
                btn.setAttribute('aria-selected', btn.dataset.target === target);
            });

            // Scroll to slide
            const slide = this.elements.carouselTrack?.querySelector(`[data-slide="${target}"]`);
            if (slide) {
                slide.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            }

            // Handle video
            if (target === 'video' && this.elements.founderVideo) {
                this.elements.founderVideo.play().catch(() => {});
                this.elements.founderVideo.classList.add('playing');
            } else if (this.elements.founderVideo) {
                this.elements.founderVideo.pause();
                this.elements.founderVideo.classList.remove('playing');
            }
        }

        toggleVideo() {
            const video = this.elements.founderVideo;
            if (!video) return;

            if (video.paused) {
                video.play().catch(() => {});
                video.classList.add('playing');
            } else {
                video.pause();
                video.classList.remove('playing');
            }
        }

        trackEvent(eventName, data = {}) {
            // Google Analytics 4
            if (typeof gtag === 'function') {
                gtag('event', eventName, {
                    event_category: 'true_impulse_drop',
                    ...data
                });
            }

            // Custom event for other tracking
            document.dispatchEvent(new CustomEvent('tid:analytics', {
                detail: { event: eventName, ...data }
            }));
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
