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

define('TID_VERSION', '1.0.0');
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

        // Visual field canvas renderer
        wp_register_script(
            'tid-visual-field',
            TID_PLUGIN_URL . 'assets/js/visual-field.js',
            [],
            TID_VERSION,
            true
        );

        // Image ripple effect
        wp_register_script(
            'tid-image-ripple',
            TID_PLUGIN_URL . 'assets/js/image-ripple.js',
            [],
            TID_VERSION,
            true
        );

        // Main drop script
        wp_register_script(
            'tid-drop',
            TID_PLUGIN_URL . 'assets/js/drop-01.js',
            ['gsap', 'tid-visual-field', 'tid-image-ripple'],
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
    }

    /**
     * Enqueue assets and inject product data
     */
    private function enqueue_drop_assets() {
        wp_enqueue_style('tid-drop');
        wp_enqueue_script('tid-drop');

        // Inject product configuration
        wp_localize_script('tid-drop', 'tidConfig', [
            'product' => $this->product_config->get_product_data(),
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
        ], $atts, 'true_impulse_drop');

        // Set product ID if provided
        if (!empty($atts['product_id'])) {
            $this->product_config->set_product_id(intval($atts['product_id']));
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
    check_ajax_referer('add-to-cart', 'security');

    $product_id = isset($_POST['product_id']) ? absint($_POST['product_id']) : 0;
    $variation_id = isset($_POST['variation_id']) ? absint($_POST['variation_id']) : 0;
    $quantity = isset($_POST['quantity']) ? absint($_POST['quantity']) : 1;

    if (!$product_id) {
        wp_send_json_error(['message' => __('Invalid product', 'true-impulse-drop')]);
    }

    // Add to cart
    $cart_item_key = WC()->cart->add_to_cart(
        $product_id,
        $quantity,
        $variation_id
    );

    if ($cart_item_key) {
        wp_send_json_success([
            'message' => __('Added to cart', 'true-impulse-drop'),
            'cart_item_key' => $cart_item_key,
            'cart_count' => WC()->cart->get_cart_contents_count(),
            'checkout_url' => wc_get_checkout_url(),
        ]);
    } else {
        wp_send_json_error([
            'message' => __('Could not add to cart', 'true-impulse-drop'),
        ]);
    }
}
