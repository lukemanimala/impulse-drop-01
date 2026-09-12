<?php
/**
 * Drop 01 Page Template
 *
 * Semantic HTML structure for the interactive commerce experience
 */

defined('ABSPATH') || exit;

$product_config = true_impulse_drop()->get_product_config();
$product_data = $product_config->get_product_data();
$all_products = $product_config->get_all_products_data();
$tab_labels = $product_config->get_tab_labels();
$has_multiple = $product_config->has_multiple_products();
$mask_url = $product_config->get_mask_url();
?>

<div id="tid-drop" class="tid-drop" data-state="loading" role="main">
    <!-- Skip link for accessibility -->
    <a href="#tid-purchase-tray" class="tid-skip-link screen-reader-text">
        <?php esc_html_e('Skip to purchase options', 'true-impulse-drop'); ?>
    </a>

    <!-- Loading State (S0) -->
    <div class="tid-loading" aria-live="polite">
        <div class="tid-loading__wordmark">IMPULSE CLOTHING</div>
        <div class="tid-loading__logo" role="status" aria-label="<?php esc_attr_e('Loading animation', 'true-impulse-drop'); ?>">
            <svg width="120" height="125" viewBox="0 0 435 453" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path opacity="0.1" d="M322.21 301.407C333.659 301.404 340.814 289.011 335.093 279.094L186.96 22.33C181.235 12.4074 166.915 12.4051 161.187 22.3259L12.8898 279.185C7.16206 289.106 14.3241 301.506 25.7797 301.502L322.21 301.407Z" fill="#1a1a1a" stroke="#1a1a1a" stroke-width="3.47626" stroke-linecap="round" stroke-linejoin="round"/>
                <path opacity="0.25" d="M260.773 296.424C271.973 298.801 281.548 288.167 278.013 277.277L213.357 78.0664C209.82 67.1704 195.813 64.1908 188.148 72.7039L47.9275 228.435C40.2623 236.948 44.6896 250.567 55.8956 252.945L260.773 296.424Z" fill="#1a1a1a" stroke="#1a1a1a" stroke-width="3.47626" stroke-linecap="round" stroke-linejoin="round"/>
                <path opacity="0.4" d="M225.237 282.031C235.977 285.907 246.9 276.742 244.947 265.492L218.992 115.931C217.03 104.629 203.556 99.7043 194.769 107.078L77.9431 205.106C69.1556 212.48 71.6658 226.604 82.4558 230.498L225.237 282.031Z" fill="#1a1a1a" stroke="#1a1a1a" stroke-width="3.47626" stroke-linecap="round" stroke-linejoin="round"/>
                <path opacity="0.6" d="M199.489 261.836C207.848 266.313 217.91 260.025 217.55 250.55L213.679 148.514C213.321 139.088 202.907 133.571 194.908 138.569L108.767 192.396C100.768 197.395 101.161 209.173 109.476 213.626L199.489 261.836Z" fill="#1a1a1a" stroke="#1a1a1a" stroke-width="3.47626" stroke-linecap="round" stroke-linejoin="round"/>
                <path opacity="0.8" d="M178.808 235.496C185.757 240.541 195.561 236.176 196.462 227.636L201.53 179.56C202.431 171.016 193.743 164.702 185.894 168.196L141.707 187.87C133.858 191.364 132.737 202.046 139.689 207.094L178.808 235.496Z" fill="#1a1a1a" stroke="#1a1a1a" stroke-width="3.47626" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M173.642 212.406C175.9 214.514 179.59 213.455 180.387 210.471L184.321 195.754C185.142 192.681 182.297 189.888 179.24 190.764L164.172 195.085C161.115 195.962 160.183 199.838 162.507 202.009L173.642 212.406Z" fill="#1a1a1a" stroke="#1a1a1a" stroke-width="3.47626" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <span class="screen-reader-text"><?php esc_html_e('Loading experience...', 'true-impulse-drop'); ?></span>
    </div>

    <!-- Custom Cursor -->
    <!-- Brand mark - shows on all states -->
    <div class="tid-brand-mark tid-brand-mark--global">IMPULSE CLOTHING</div>

    <!-- Cart button - top right -->
    <button type="button" id="tid-cart-btn" class="tid-cart-btn" aria-label="<?php esc_attr_e('View cart', 'true-impulse-drop'); ?>">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 6h15l-1.5 9h-12z"/>
            <circle cx="9" cy="20" r="1"/>
            <circle cx="18" cy="20" r="1"/>
            <path d="M6 6L5 3H2"/>
        </svg>
        <span class="tid-cart-btn__count" id="tid-cart-count" style="display: none;">0</span>
    </button>

    <?php if ($has_multiple && !empty($tab_labels)): ?>
    <!-- Product Tabs -->
    <div class="tid-product-tabs" id="tid-product-tabs" role="tablist" aria-label="<?php esc_attr_e('Product selection', 'true-impulse-drop'); ?>">
        <?php foreach ($tab_labels as $index => $label): ?>
            <button
                type="button"
                role="tab"
                data-product-index="<?php echo esc_attr($index); ?>"
                aria-selected="<?php echo $index === 0 ? 'true' : 'false'; ?>"
                <?php echo $index === 0 ? 'class="active"' : ''; ?>
            >
                <?php echo esc_html($label); ?>
            </button>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <!-- Custom cursor / tap prompt -->
    <div id="tid-cursor" class="tid-cursor">TAP TO MATERIALIZE</div>

    <!-- Visual Field Canvas Container (S1) -->
    <div id="tid-field-container" class="tid-field-container" tabindex="0" aria-label="<?php esc_attr_e('Interactive procedural surface - tap or drag to create waves', 'true-impulse-drop'); ?>">
        <!-- Drop number overlay -->
        <div class="tid-drop-number" aria-hidden="true">
            <span class="tid-drop-number__label">DROP</span>
            <span class="tid-drop-number__value">001</span>
        </div>
    </div>

    <!-- Product Reveal Layer (S3) -->
    <div class="tid-product-reveal" aria-hidden="true">
        <div class="tid-product-image" id="tid-product-container">
            <!-- Front view -->
            <?php if (!empty($product_data['images']['front'])): ?>
                <img
                    id="tid-product-front"
                    src="<?php echo esc_url($product_data['images']['front']); ?>"
                    alt="<?php echo esc_attr($product_data['name']); ?> - Front view"
                    data-view="front"
                />
            <?php else: ?>
                <img
                    id="tid-product-front"
                    src="<?php echo esc_url(TID_PLUGIN_URL . 'assets/img/product-front.png'); ?>"
                    alt="<?php echo esc_attr($product_data['name']); ?> - Front view"
                    data-view="front"
                />
            <?php endif; ?>

            <!-- Back view (for products with color variants) -->
            <img
                id="tid-product-back"
                class="tid-product-back"
                src=""
                alt=""
                data-view="back"
                style="display: none;"
            />

            <!-- Worn view -->
            <div id="tid-product-worn" class="tid-product-worn" data-view="worn" style="display: none;">
                <?php if (!empty($product_data['images']['back'])): ?>
                    <img
                        src="<?php echo esc_url($product_data['images']['back']); ?>"
                        alt="<?php echo esc_attr($product_data['name']); ?> - Worn"
                    />
                <?php else: ?>
                    <img
                        src="<?php echo esc_url(TID_PLUGIN_URL . 'assets/img/product-worn.png'); ?>"
                        alt="<?php echo esc_attr($product_data['name']); ?> - Worn"
                    />
                <?php endif; ?>
            </div>

            <!-- Product rotation video -->
            <div class="tid-product-video" id="tid-product-video">
                <video
                    id="tid-rotation-video"
                    src="<?php echo esc_url(TID_PLUGIN_URL . 'assets/video/product-rotation.mp4'); ?>"
                    muted
                    loop
                    playsinline
                    autoplay
                    preload="auto"
                ></video>
            </div>

            <!-- View toggle buttons (JS configures which buttons show) -->
            <div class="tid-view-toggle" id="tid-view-toggle" style="display: none;">
                <button type="button" data-view="front" class="active"><?php esc_html_e('Front', 'true-impulse-drop'); ?></button>
                <button type="button" data-view="video"><?php esc_html_e('360', 'true-impulse-drop'); ?></button>
                <button type="button" data-view="back"><?php esc_html_e('Back', 'true-impulse-drop'); ?></button>
                <button type="button" data-view="worn"><?php esc_html_e('Worn', 'true-impulse-drop'); ?></button>
            </div>
        </div>
    </div>

    <!-- Materialize CTA (hidden, for accessibility fallback) -->
    <button
        type="button"
        id="tid-materialize-btn"
        class="tid-materialize-btn screen-reader-text"
        aria-describedby="tid-materialize-desc"
    >
        <span class="tid-materialize-btn__text">MATERIALIZE</span>
    </button>
    <span id="tid-materialize-desc" class="screen-reader-text">
        <?php esc_html_e('Activate to transform the abstract field into the product', 'true-impulse-drop'); ?>
    </span>

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
            <!-- Color Selection (rendered by JavaScript based on product) -->
            <fieldset class="tid-color-selector" id="tid-color-selector" style="display:none;">
                <legend class="tid-color-selector__label"><?php esc_html_e('Color', 'true-impulse-drop'); ?></legend>
                <div class="tid-color-selector__options" role="radiogroup" aria-label="<?php esc_attr_e('Available colors', 'true-impulse-drop'); ?>">
                    <!-- Color buttons injected by JavaScript -->
                </div>
            </fieldset>

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
            </div>
        </div>
    </div>

    <!-- Fallback Product View - Shown when JS/Canvas fails -->
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
        {"maskUrl": "<?php echo esc_url($mask_url); ?>", "outlineUrl": "<?php echo esc_url(TID_PLUGIN_URL . 'assets/img/garment-outline.svg'); ?>"}
    </script>

    <!-- Product configuration for JavaScript -->
    <script>
        var tidConfig = <?php echo wp_json_encode([
            'product' => $product_data,
            'products' => $all_products,
            'tabs' => $tab_labels,
            'hasMultipleProducts' => $has_multiple,
            'colorMap' => [
                'black' => '#1a1a1a',
                'green' => '#2d4a3e',
                'white' => '#ffffff',
                'grey' => '#6b6b6b',
                'gray' => '#6b6b6b',
                'navy' => '#1a2744',
                'brown' => '#4a3728',
                'cream' => '#f5f5dc',
            ],
            'ajax_url' => admin_url('admin-ajax.php'),
            'checkout_url' => function_exists('wc_get_checkout_url') ? wc_get_checkout_url() : '/checkout/',
            'cart_url' => function_exists('wc_get_cart_url') ? wc_get_cart_url() : '/cart/',
            'nonce' => wp_create_nonce('wc_store_api'),
            'add_to_cart_nonce' => wp_create_nonce('add-to-cart'),
            'assets_url' => TID_PLUGIN_URL . 'assets/',
            'i18n' => [
                'add_to_cart' => __('Add to Cart', 'true-impulse-drop'),
                'added' => __('Added', 'true-impulse-drop'),
                'checkout' => __('Checkout', 'true-impulse-drop'),
                'select_size' => __('Select Size', 'true-impulse-drop'),
                'select_color' => __('Select Color', 'true-impulse-drop'),
                'sold_out' => __('Sold Out', 'true-impulse-drop'),
                'error' => __('Error adding to cart', 'true-impulse-drop'),
            ],
        ]); ?>;
    </script>
</div>
