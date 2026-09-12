<?php
/**
 * Plugin Name: True Impulse Drop
 * Description: Interactive commerce experience with visual field, garment reveal, and WooCommerce checkout
 * Version: 1.0.0
 * Author: True Impulse
 * Text Domain: true-impulse-drop
 * Requires PHP: 7.4
 * Requires at least: 5.8
 */

defined('ABSPATH') || exit;

define('TID_VERSION', '1.3.1');
define('TID_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('TID_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include product configuration helper
require_once TID_PLUGIN_DIR . 'includes/class-product-config.php';

/**
 * Main plugin class
 */
class True_Impulse_Drop {

    private static $instance = null;
    private $product_config;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->product_config = new TID_Product_Config();

        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
        add_shortcode('true_impulse_drop', [$this, 'render_shortcode']);
        add_action('init', [$this, 'register_page_template']);
    }

    /**
     * Register and enqueue assets
     */
    public function register_assets() {
        // Register GSAP from CDN
        wp_register_script(
            'gsap',
            'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
            [],
            '3.12.5',
            true
        );

        // Procedural field - Canvas 2D animation system
        wp_register_script(
            'tid-procedural-field',
            TID_PLUGIN_URL . 'assets/js/procedural-field.js',
            [],
            TID_VERSION,
            true
        );

        // Main drop script
        wp_register_script(
            'tid-drop',
            TID_PLUGIN_URL . 'assets/js/drop-01.js',
            ['gsap', 'tid-procedural-field'],
            TID_VERSION,
            true
        );

        // Styles
        wp_register_style(
            'tid-drop',
            TID_PLUGIN_URL . 'assets/css/drop-01.css',
            [],
            TID_VERSION
        );

        // WooCommerce page cleanup (cart, checkout, order confirmation)
        if (function_exists('is_cart') && (is_cart() || is_checkout() || is_order_received_page())) {
            wp_enqueue_style(
                'tid-woo-cleanup',
                TID_PLUGIN_URL . 'assets/css/woo-cleanup.css',
                [],
                TID_VERSION
            );
        }
    }

    /**
     * Enqueue assets and inject product data
     */
    private function enqueue_drop_assets() {
        wp_enqueue_style('tid-drop');
        wp_enqueue_script('tid-drop');

        // Get products data (supports single or multiple)
        $products = $this->product_config->get_all_products_data();
        $tabs = $this->product_config->get_tab_labels();
        $has_multiple = $this->product_config->has_multiple_products();

        // Inject product configuration
        wp_localize_script('tid-drop', 'tidConfig', [
            'product' => $products[0], // First product for backward compatibility
            'products' => $products,
            'tabs' => $tabs,
            'hasMultipleProducts' => $has_multiple,
            'ajax_url' => admin_url('admin-ajax.php'),
            'checkout_url' => wc_get_checkout_url(),
            'cart_url' => wc_get_cart_url(),
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
        ]);
    }

    /**
     * Render the shortcode
     */
    public function render_shortcode($atts) {
        $atts = shortcode_atts([
            'product_id' => 0,
            'products' => '',
            'tabs' => '',
        ], $atts, 'true_impulse_drop');

        // Multi-product support
        if (!empty($atts['products'])) {
            $product_ids = array_map('trim', explode(',', $atts['products']));
            $tab_labels = !empty($atts['tabs']) ? array_map('trim', explode(',', $atts['tabs'])) : [];
            $this->product_config->set_products($product_ids, $tab_labels);
        } elseif (!empty($atts['product_id'])) {
            // Single product fallback
            $this->product_config->set_product_id(intval($atts['product_id']));
        }

        // Prevent Varnish/CDN caching - page has dynamic nonces and product data
        if (!headers_sent()) {
            header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: 0');
            // Cloudways Varnish bypass
            header('X-Varnish-Bypass: 1');
        }

        $this->enqueue_drop_assets();

        ob_start();
        include TID_PLUGIN_DIR . 'templates/drop-01.php';
        return ob_get_clean();
    }

    /**
     * Register custom page template
     */
    public function register_page_template() {
        // Template will be loaded via shortcode or theme integration
    }

    /**
     * Get product config instance
     */
    public function get_product_config() {
        return $this->product_config;
    }
}

/**
 * Initialize plugin
 */
function true_impulse_drop() {
    return True_Impulse_Drop::instance();
}

// Check for WooCommerce
add_action('plugins_loaded', function() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', function() {
            echo '<div class="error"><p>';
            echo esc_html__('True Impulse Drop requires WooCommerce to be installed and active.', 'true-impulse-drop');
            echo '</p></div>';
        });
        return;
    }
    true_impulse_drop();
});

/**
 * AJAX handler for add to cart
 */
add_action('wp_ajax_tid_add_to_cart', 'tid_ajax_add_to_cart');
add_action('wp_ajax_nopriv_tid_add_to_cart', 'tid_ajax_add_to_cart');

function tid_ajax_add_to_cart() {
    // Verify nonce - return JSON error instead of dying
    if (!wp_verify_nonce($_POST['security'] ?? '', 'add-to-cart')) {
        wp_send_json_error(['message' => __('Security check failed. Please refresh the page.', 'true-impulse-drop')]);
        return;
    }

    $product_id = isset($_POST['product_id']) ? absint($_POST['product_id']) : 0;
    $variation_id = isset($_POST['variation_id']) ? absint($_POST['variation_id']) : 0;
    $quantity = isset($_POST['quantity']) ? absint($_POST['quantity']) : 1;

    if (!$product_id) {
        wp_send_json_error(['message' => __('Invalid product', 'true-impulse-drop')]);
        return;
    }

    // Get variation attributes if this is a variation
    $variation = [];
    if ($variation_id) {
        $variation_obj = wc_get_product($variation_id);
        if ($variation_obj && $variation_obj->is_type('variation')) {
            $variation = $variation_obj->get_variation_attributes();
        }
    }

    // Add to cart
    $cart_item_key = WC()->cart->add_to_cart(
        $product_id,
        $quantity,
        $variation_id,
        $variation
    );

    if ($cart_item_key) {
        wp_send_json_success([
            'message' => __('Added to cart', 'true-impulse-drop'),
            'cart_item_key' => $cart_item_key,
            'cart_count' => WC()->cart->get_cart_contents_count(),
            'checkout_url' => wc_get_checkout_url(),
        ]);
    } else {
        // Get WooCommerce notices for better error message
        $notices = wc_get_notices('error');
        $error_msg = !empty($notices) ? strip_tags($notices[0]['notice']) : __('Could not add to cart', 'true-impulse-drop');
        wc_clear_notices();

        wp_send_json_error([
            'message' => $error_msg,
        ]);
    }
}
