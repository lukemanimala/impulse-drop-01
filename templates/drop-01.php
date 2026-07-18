<?php
/**
 * Drop 01 Page Template
 *
 * Semantic HTML structure for the interactive commerce experience
 */

defined('ABSPATH') || exit;

$product_config = true_impulse_drop()->get_product_config();
$product_data = $product_config->get_product_data();
$mask_url = $product_config->get_mask_url();
?>

<div id="tid-drop" class="tid-drop" data-state="loading" role="main">
    <!-- Skip link for accessibility -->
    <a href="#tid-purchase-tray" class="tid-skip-link screen-reader-text">
        <?php esc_html_e('Skip to purchase options', 'true-impulse-drop'); ?>
    </a>

    <!-- Loading State (S0) -->
    <div class="tid-loading" aria-live="polite">
        <div class="tid-loading__wordmark">TRUE IMPULSE</div>
        <div class="tid-loading__indicator" role="status">
            <span class="screen-reader-text"><?php esc_html_e('Loading experience...', 'true-impulse-drop'); ?></span>
        </div>
    </div>

    <!-- Visual Field Canvas (S1) -->
    <div class="tid-field-container">
        <canvas
            id="tid-canvas"
            class="tid-canvas"
            aria-label="<?php esc_attr_e('Interactive visual field - tap or drag to create ripples', 'true-impulse-drop'); ?>"
            role="img"
            tabindex="0"
        ></canvas>

        <!-- Hidden description for screen readers -->
        <div id="tid-canvas-desc" class="screen-reader-text">
            <?php esc_html_e('An abstract monochrome geometry field that responds to touch with ripple effects. Tap the Materialize button to reveal the garment.', 'true-impulse-drop'); ?>
        </div>
    </div>

    <!-- Product Reveal Layer (S3) -->
    <div class="tid-product-reveal" aria-hidden="true">
        <div class="tid-product-image tid-product-image--front">
            <?php if (!empty($product_data['images']['front'])): ?>
                <img
                    src="<?php echo esc_url($product_data['images']['front']); ?>"
                    alt="<?php echo esc_attr($product_data['name']); ?> - Front view"
                    loading="lazy"
                />
            <?php else: ?>
                <div class="tid-product-image__placeholder">
                    <span>Product Image</span>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Materialize CTA -->
    <button
        type="button"
        id="tid-materialize-btn"
        class="tid-materialize-btn"
        aria-describedby="tid-materialize-desc"
    >
        <span class="tid-materialize-btn__text">MATERIALIZE</span>
        <span class="tid-materialize-btn__icon" aria-hidden="true"></span>
    </button>
    <span id="tid-materialize-desc" class="screen-reader-text">
        <?php esc_html_e('Activate to transform the abstract field into the product', 'true-impulse-drop'); ?>
    </span>

    <!-- Media Drawer (S4) -->
    <div id="tid-media-drawer" class="tid-media-drawer" aria-hidden="true">
        <button type="button" class="tid-media-drawer__close" aria-label="<?php esc_attr_e('Close gallery', 'true-impulse-drop'); ?>">
            <span aria-hidden="true">&times;</span>
        </button>

        <div class="tid-media-carousel" role="region" aria-label="<?php esc_attr_e('Product gallery', 'true-impulse-drop'); ?>">
            <div class="tid-media-carousel__track">
                <!-- Front -->
                <div class="tid-media-carousel__slide" data-slide="front">
                    <?php if (!empty($product_data['images']['front'])): ?>
                        <img src="<?php echo esc_url($product_data['images']['front']); ?>" alt="Front view" />
                    <?php else: ?>
                        <div class="tid-product-image__placeholder"><span>Front</span></div>
                    <?php endif; ?>
                </div>
                <!-- Back -->
                <div class="tid-media-carousel__slide" data-slide="back">
                    <?php if (!empty($product_data['images']['back'])): ?>
                        <img src="<?php echo esc_url($product_data['images']['back']); ?>" alt="Back view" />
                    <?php else: ?>
                        <div class="tid-product-image__placeholder"><span>Back</span></div>
                    <?php endif; ?>
                </div>
                <!-- Detail -->
                <div class="tid-media-carousel__slide" data-slide="detail">
                    <?php if (!empty($product_data['images']['detail'])): ?>
                        <img src="<?php echo esc_url($product_data['images']['detail']); ?>" alt="Detail view" />
                    <?php else: ?>
                        <div class="tid-product-image__placeholder"><span>Detail</span></div>
                    <?php endif; ?>
                </div>
                <!-- Founder Video -->
                <div class="tid-media-carousel__slide tid-media-carousel__slide--video" data-slide="video">
                    <video
                        id="tid-founder-video"
                        class="tid-founder-video"
                        muted
                        loop
                        playsinline
                        preload="none"
                        poster=""
                        aria-label="<?php esc_attr_e('Founder wearing the garment', 'true-impulse-drop'); ?>"
                    >
                        <source src="" type="video/mp4" />
                    </video>
                    <button type="button" class="tid-video-control" aria-label="<?php esc_attr_e('Play/Pause video', 'true-impulse-drop'); ?>">
                        <span class="tid-video-control__play" aria-hidden="true"></span>
                        <span class="tid-video-control__pause" aria-hidden="true"></span>
                    </button>
                </div>
            </div>

            <!-- Carousel Navigation -->
            <div class="tid-media-carousel__nav" role="tablist">
                <button type="button" role="tab" aria-selected="true" data-target="front">Front</button>
                <button type="button" role="tab" aria-selected="false" data-target="back">Back</button>
                <button type="button" role="tab" aria-selected="false" data-target="detail">Detail</button>
                <button type="button" role="tab" aria-selected="false" data-target="video">Video</button>
            </div>
        </div>
    </div>

    <!-- Purchase Tray (S5) - Always Accessible -->
    <div id="tid-purchase-tray" class="tid-purchase-tray">
        <div class="tid-purchase-tray__header">
            <button type="button" class="tid-purchase-tray__toggle" aria-expanded="false" aria-controls="tid-purchase-content">
                <span class="tid-purchase-tray__product-name"><?php echo esc_html($product_data['name']); ?></span>
                <span class="tid-purchase-tray__price"><?php echo wp_kses_post($product_data['price_html']); ?></span>
                <span class="tid-purchase-tray__expand-icon" aria-hidden="true"></span>
            </button>
        </div>

        <div id="tid-purchase-content" class="tid-purchase-tray__content">
            <!-- Size Selection -->
            <fieldset class="tid-size-selector">
                <legend class="screen-reader-text"><?php esc_html_e('Select size', 'true-impulse-drop'); ?></legend>
                <div class="tid-size-selector__options" role="radiogroup" aria-label="<?php esc_attr_e('Available sizes', 'true-impulse-drop'); ?>">
                    <?php foreach ($product_data['variations'] as $variation): ?>
                        <button
                            type="button"
                            class="tid-size-btn <?php echo !$variation['in_stock'] ? 'tid-size-btn--sold-out' : ''; ?>"
                            data-variation-id="<?php echo esc_attr($variation['id']); ?>"
                            data-size="<?php echo esc_attr($variation['size']); ?>"
                            <?php echo !$variation['in_stock'] ? 'disabled aria-disabled="true"' : ''; ?>
                            role="radio"
                            aria-checked="false"
                        >
                            <span class="tid-size-btn__label"><?php echo esc_html($variation['size']); ?></span>
                            <?php if (!$variation['in_stock']): ?>
                                <span class="tid-size-btn__status"><?php esc_html_e('Sold Out', 'true-impulse-drop'); ?></span>
                            <?php endif; ?>
                        </button>
                    <?php endforeach; ?>
                </div>
            </fieldset>

            <!-- Add to Cart / Checkout -->
            <div class="tid-purchase-actions">
                <button
                    type="button"
                    id="tid-add-to-cart"
                    class="tid-btn tid-btn--primary tid-add-to-cart"
                    disabled
                    data-product-id="<?php echo esc_attr($product_data['id']); ?>"
                >
                    <span class="tid-btn__text"><?php esc_html_e('Select Size', 'true-impulse-drop'); ?></span>
                    <span class="tid-btn__loading" aria-hidden="true"></span>
                </button>

                <!-- Error message area -->
                <div id="tid-cart-error" class="tid-cart-error" role="alert" aria-live="polite"></div>

                <!-- Fallback link to standard product page -->
                <?php if ($product_data['id']): ?>
                    <a href="<?php echo esc_url(get_permalink($product_data['id'])); ?>" class="tid-fallback-link">
                        <?php esc_html_e('View standard product page', 'true-impulse-drop'); ?>
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Fallback Product View (S6) - Shown when JS/Canvas fails -->
    <noscript>
        <div class="tid-fallback">
            <div class="tid-fallback__image">
                <?php if (!empty($product_data['images']['front'])): ?>
                    <img src="<?php echo esc_url($product_data['images']['front']); ?>" alt="<?php echo esc_attr($product_data['name']); ?>" />
                <?php endif; ?>
            </div>
            <div class="tid-fallback__info">
                <h1><?php echo esc_html($product_data['name']); ?></h1>
                <p class="tid-fallback__price"><?php echo wp_kses_post($product_data['price_html']); ?></p>
                <?php if ($product_data['id']): ?>
                    <a href="<?php echo esc_url(get_permalink($product_data['id'])); ?>" class="tid-btn tid-btn--primary">
                        <?php esc_html_e('View Product', 'true-impulse-drop'); ?>
                    </a>
                <?php endif; ?>
            </div>
        </div>
    </noscript>

    <!-- Hidden data for JavaScript -->
    <script type="application/json" id="tid-mask-data">
        {"maskUrl": "<?php echo esc_url($mask_url); ?>"}
    </script>
</div>
