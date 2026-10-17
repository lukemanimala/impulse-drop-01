<?php
/**
 * Delivery Tracker
 *
 * Handles AfterShip tracking integration and survey email automation
 */

defined('ABSPATH') || exit;

class TID_Delivery_Tracker {

    private static $instance = null;

    const AFTERSHIP_API_URL = 'https://api.aftership.com/v4';
    const CARRIER_SLUG = 'parcll'; // GOFO's AfterShip slug
    const DAYS_BEFORE_SURVEY = 4;

    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Schedule cron events on init
        add_action('init', [$this, 'schedule_cron_events']);

        // Cron handlers
        add_action('tid_daily_tracking_check', [$this, 'check_tracking_status']);
        add_action('tid_daily_survey_check', [$this, 'send_pending_surveys']);

        // Clean up on deactivation
        register_deactivation_hook(TID_PLUGIN_DIR . 'true-impulse-drop.php', [$this, 'clear_cron_events']);
    }

    /**
     * Schedule daily cron events
     */
    public function schedule_cron_events() {
        if (!wp_next_scheduled('tid_daily_tracking_check')) {
            wp_schedule_event(time(), 'daily', 'tid_daily_tracking_check');
        }
        if (!wp_next_scheduled('tid_daily_survey_check')) {
            wp_schedule_event(time(), 'daily', 'tid_daily_survey_check');
        }
    }

    /**
     * Clear cron events on plugin deactivation
     */
    public function clear_cron_events() {
        wp_clear_scheduled_hook('tid_daily_tracking_check');
        wp_clear_scheduled_hook('tid_daily_survey_check');
    }

    /**
     * Get AfterShip API key
     */
    private function get_api_key() {
        return defined('AFTERSHIP_API_KEY') ? AFTERSHIP_API_KEY : '';
    }

    /**
     * Process shipping note and extract tracking info
     */
    public function process_shipping_note($note_content, $order) {
        // Check for GOFO tracking URL
        if (preg_match('/gofo\.com.*searchID=([A-Z0-9]+)/', $note_content, $matches)) {
            $tracking_number = $matches[1];
            $this->save_tracking_info($order, $tracking_number, self::CARRIER_SLUG);
            $this->register_with_aftership($tracking_number, $order->get_id());
            return true;
        }

        // Check for United Delivery Service (no tracking ID in URL)
        if (strpos($note_content, 'uniteddeliveryservice.com') !== false) {
            // Log but don't track - no tracking number available
            $order->add_order_note('Shipping detected but no tracking number available (United Delivery Service).');
            return false;
        }

        return false;
    }

    /**
     * Save tracking info to order meta
     */
    private function save_tracking_info($order, $tracking_number, $carrier) {
        $order->update_meta_data('_tid_tracking_number', $tracking_number);
        $order->update_meta_data('_tid_carrier', $carrier);
        $order->update_meta_data('_tid_shipped_date', current_time('mysql'));
        $order->save();
    }

    /**
     * Register tracking number with AfterShip
     */
    public function register_with_aftership($tracking_number, $order_id) {
        $api_key = $this->get_api_key();
        if (!$api_key) {
            error_log('TID Delivery Tracker: AfterShip API key not configured');
            return false;
        }

        $response = wp_remote_post(self::AFTERSHIP_API_URL . '/trackings', [
            'headers' => [
                'Content-Type' => 'application/json',
                'aftership-api-key' => $api_key,
            ],
            'body' => json_encode([
                'tracking' => [
                    'slug' => self::CARRIER_SLUG,
                    'tracking_number' => $tracking_number,
                    'custom_fields' => [
                        'order_id' => $order_id,
                    ],
                ],
            ]),
            'timeout' => 30,
        ]);

        if (is_wp_error($response)) {
            error_log('TID Delivery Tracker: AfterShip registration failed - ' . $response->get_error_message());
            return false;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        $code = wp_remote_retrieve_response_code($response);

        if ($code === 201 || $code === 200) {
            return true;
        }

        // 4003 = tracking already exists (ok)
        if (isset($body['meta']['code']) && $body['meta']['code'] === 4003) {
            return true;
        }

        error_log('TID Delivery Tracker: AfterShip registration failed - ' . print_r($body, true));
        return false;
    }

    /**
     * Check tracking status for all pending orders (daily cron)
     */
    public function check_tracking_status() {
        $api_key = $this->get_api_key();
        if (!$api_key) {
            return;
        }

        // Get orders with tracking but no delivery date
        $orders = wc_get_orders([
            'meta_query' => [
                [
                    'key' => '_tid_tracking_number',
                    'compare' => 'EXISTS',
                ],
                [
                    'key' => '_tid_delivery_date',
                    'compare' => 'NOT EXISTS',
                ],
            ],
            'limit' => 50,
        ]);

        foreach ($orders as $order) {
            $tracking_number = $order->get_meta('_tid_tracking_number');
            $carrier = $order->get_meta('_tid_carrier') ?: self::CARRIER_SLUG;

            $status = $this->get_aftership_status($tracking_number, $carrier);

            if ($status && $status['tag'] === 'Delivered') {
                $delivery_date = $status['delivery_time'] ?? current_time('mysql');
                $order->update_meta_data('_tid_delivery_date', $delivery_date);
                $order->add_order_note('Package delivered. Survey email scheduled for ' . self::DAYS_BEFORE_SURVEY . ' days.');
                $order->save();
            }
        }
    }

    /**
     * Get tracking status from AfterShip
     */
    private function get_aftership_status($tracking_number, $carrier) {
        $api_key = $this->get_api_key();
        if (!$api_key) {
            return null;
        }

        $url = self::AFTERSHIP_API_URL . '/trackings/' . $carrier . '/' . $tracking_number;

        $response = wp_remote_get($url, [
            'headers' => [
                'aftership-api-key' => $api_key,
            ],
            'timeout' => 30,
        ]);

        if (is_wp_error($response)) {
            error_log('TID Delivery Tracker: AfterShip status check failed - ' . $response->get_error_message());
            return null;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($body['data']['tracking'])) {
            return [
                'tag' => $body['data']['tracking']['tag'] ?? null,
                'delivery_time' => $body['data']['tracking']['shipment_delivery_date'] ?? null,
            ];
        }

        return null;
    }

    /**
     * Send survey emails for delivered orders (daily cron)
     */
    public function send_pending_surveys() {
        $cutoff_date = date('Y-m-d H:i:s', strtotime('-' . self::DAYS_BEFORE_SURVEY . ' days'));

        // Get orders delivered more than X days ago without survey sent
        $orders = wc_get_orders([
            'meta_query' => [
                [
                    'key' => '_tid_delivery_date',
                    'value' => $cutoff_date,
                    'compare' => '<',
                    'type' => 'DATETIME',
                ],
                [
                    'key' => '_tid_survey_sent',
                    'compare' => 'NOT EXISTS',
                ],
            ],
            'limit' => 50,
        ]);

        foreach ($orders as $order) {
            if ($this->send_survey_email($order)) {
                $order->update_meta_data('_tid_survey_sent', current_time('mysql'));
                $order->add_order_note('Survey email sent to customer.');
                $order->save();
            }
        }
    }

    /**
     * Send survey email to customer
     */
    private function send_survey_email($order) {
        $email = $order->get_billing_email();
        $first_name = $order->get_billing_first_name();
        $order_id = $order->get_id();

        if (!$email) {
            return false;
        }

        // Get email template from options or use default
        $subject = get_option('tid_survey_email_subject', 'Capsule 01 feedback');
        $template = get_option('tid_survey_email_template', $this->get_default_template());

        // Replace placeholders
        $body = str_replace(
            ['{first_name}', '{order_id}'],
            [$first_name, $order_id],
            $template
        );

        // Set headers for plain text from WooCommerce store email
        $headers = [
            'Content-Type: text/plain; charset=UTF-8',
            'From: Impulse <orders@impulse.clothing>',
        ];

        $sent = wp_mail($email, $subject, $body, $headers);

        if (!$sent) {
            error_log('TID Delivery Tracker: Failed to send survey email to ' . $email . ' for order ' . $order_id);
        }

        return $sent;
    }

    /**
     * Get default email template
     */
    private function get_default_template() {
        return "Hey {first_name},

Your order should've landed by now.

We're collecting feedback on Capsule 01 — fit, fabric, construction. Takes 2 minutes:

https://feedback.impulse.clothing?order={order_id}

Appreciate it.

Luke";
    }

    /**
     * Manual trigger to check a specific order (for testing)
     */
    public function check_order($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return false;
        }

        $tracking_number = $order->get_meta('_tid_tracking_number');
        if (!$tracking_number) {
            return ['error' => 'No tracking number found'];
        }

        $carrier = $order->get_meta('_tid_carrier') ?: self::CARRIER_SLUG;
        return $this->get_aftership_status($tracking_number, $carrier);
    }
}
