<?php
/**
 * Product Configuration Helper
 *
 * Handles WooCommerce product data retrieval and formatting
 */

defined('ABSPATH') || exit;

class TID_Product_Config {

    private $product_id = 0;
    private $product = null;

    /**
     * Set the product ID
     */
    public function set_product_id($product_id) {
        $this->product_id = $product_id;
        $this->product = null; // Reset cached product
    }

    /**
     * Get the product ID (from setting or default)
     */
    public function get_product_id() {
        if ($this->product_id) {
            return $this->product_id;
        }

        // Try to get from plugin settings or use demo ID
        $saved_id = get_option('tid_product_id', 0);
        return $saved_id ?: $this->get_demo_product_id();
    }

    /**
     * Get a demo product ID for development
     */
    private function get_demo_product_id() {
        // In development, return 0 - will use placeholder data
        return 0;
    }

    /**
     * Get the WooCommerce product
     */
    public function get_product() {
        if ($this->product !== null) {
            return $this->product;
        }

        $product_id = $this->get_product_id();
        if ($product_id && function_exists('wc_get_product')) {
            $this->product = wc_get_product($product_id);
        }

        return $this->product;
    }

    /**
     * Get formatted product data for JavaScript
     */
    public function get_product_data() {
        $product = $this->get_product();

        // Return demo data if no product
        if (!$product) {
            return $this->get_demo_product_data();
        }

        $data = [
            'id' => $product->get_id(),
            'name' => $product->get_name(),
            'price' => $product->get_price(),
            'price_html' => $product->get_price_html(),
            'currency_symbol' => get_woocommerce_currency_symbol(),
            'in_stock' => $product->is_in_stock(),
            'variations' => [],
            'images' => [],
        ];

        // Get product images
        $image_id = $product->get_image_id();
        if ($image_id) {
            $data['images']['front'] = wp_get_attachment_image_url($image_id, 'large');
        }

        $gallery_ids = $product->get_gallery_image_ids();
        if (!empty($gallery_ids)) {
            if (isset($gallery_ids[0])) {
                $data['images']['back'] = wp_get_attachment_image_url($gallery_ids[0], 'large');
            }
            if (isset($gallery_ids[1])) {
                $data['images']['detail'] = wp_get_attachment_image_url($gallery_ids[1], 'large');
            }
        }

        // Get variations for variable products
        if ($product->is_type('variable')) {
            $variations = $product->get_available_variations();
            foreach ($variations as $variation) {
                $size = '';
                foreach ($variation['attributes'] as $attr_key => $attr_value) {
                    if (stripos($attr_key, 'size') !== false || stripos($attr_key, 'pa_size') !== false) {
                        $size = $attr_value;
                        break;
                    }
                }

                if (!$size) {
                    // Fallback to first attribute
                    $size = reset($variation['attributes']) ?: 'Default';
                }

                $data['variations'][] = [
                    'id' => $variation['variation_id'],
                    'size' => strtoupper($size),
                    'price' => $variation['display_price'],
                    'in_stock' => $variation['is_in_stock'],
                    'stock_qty' => $variation['max_qty'] ?? null,
                ];
            }
        } else {
            // Simple product - single "one size" option
            $data['variations'][] = [
                'id' => $product->get_id(),
                'size' => 'ONE SIZE',
                'price' => $product->get_price(),
                'in_stock' => $product->is_in_stock(),
                'stock_qty' => $product->get_stock_quantity(),
            ];
        }

        return $data;
    }

    /**
     * Get demo product data for development/preview
     */
    private function get_demo_product_data() {
        return [
            'id' => 0,
            'name' => 'True Impulse Drop 01',
            'price' => '120.00',
            'price_html' => '<span class="woocommerce-Price-amount amount"><bdi><span class="woocommerce-Price-currencySymbol">$</span>120.00</bdi></span>',
            'currency_symbol' => '$',
            'in_stock' => true,
            'variations' => [
                ['id' => 1, 'size' => 'S', 'price' => '120.00', 'in_stock' => true, 'stock_qty' => 10],
                ['id' => 2, 'size' => 'M', 'price' => '120.00', 'in_stock' => true, 'stock_qty' => 15],
                ['id' => 3, 'size' => 'L', 'price' => '120.00', 'in_stock' => true, 'stock_qty' => 12],
                ['id' => 4, 'size' => 'XL', 'price' => '120.00', 'in_stock' => false, 'stock_qty' => 0],
            ],
            'images' => [
                'front' => '',
                'back' => '',
                'detail' => '',
            ],
            'is_demo' => true,
        ];
    }

    /**
     * Get the mask SVG URL
     */
    public function get_mask_url() {
        return TID_PLUGIN_URL . 'assets/img/garment-mask.svg';
    }

    /**
     * Get founder video URL if set
     */
    public function get_founder_video_url() {
        $video_url = get_option('tid_founder_video', '');
        return $video_url ?: TID_PLUGIN_URL . 'assets/video/founder-loop.mp4';
    }
}
