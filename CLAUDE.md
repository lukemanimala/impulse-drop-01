# Impulse Drop 01 - WooCommerce Plugin

## Deployment
- `main` branch → staging (WP Pusher auto-deploy)
- `production` branch → production (WP Pusher auto-deploy)
- Staging: https://wordpress-1670281-6667531.cloudwaysapps.com
- Production: https://impulse.clothing

## WP Pusher Webhooks (GitHub → auto-deploy)
Staging (main branch):
```
https://wordpress-1670281-6667531.cloudwaysapps.com/?wppusher-hook&token=34468d394c204e64ef9567ffac2d9b914f4d2aee8c8df5d82ca95a390028229f&package=aW1wdWxzZS1kcm9wLTAxL3RydWUtaW1wdWxzZS1kcm9wLnBocA%3D%3D
```

Production (production branch):
```
https://impulse.clothing/?wppusher-hook&token=34468d394c204e64ef9567ffac2d9b914f4d2aee8c8df5d82ca95a390028229f&package=aW1wdWxzZS1kcm9wLTAxL3RydWUtaW1wdWxzZS1kcm9wLnBocA%3D%3D
```

## WooCommerce API Access

| Environment | Method | Why |
|-------------|--------|-----|
| **Production** | MCP tools (`mcp__woocommerce__wc_*`) | Works normally |
| **Staging** | curl (see below) | MCP + Cloudways httpx incompatibility |

### Staging: Use curl (NOT MCP)
The `woocommerce-staging` MCP server does not work with Cloudways due to an httpx/auth incompatibility. Always use curl for staging:

```bash
# GET - List/fetch data
curl -s "https://wordpress-1670281-6667531.cloudwaysapps.com/wp-json/wc/v3/{endpoint}" \
  -u "ck_5534bb410b0aa095d179d9337d84c157a4002b37:cs_8c682bfb9200460d206abf682d08f5d1532f1e34" | jq

# PUT - Update data
curl -s -X PUT "https://wordpress-1670281-6667531.cloudwaysapps.com/wp-json/wc/v3/{endpoint}" \
  -u "ck_5534bb410b0aa095d179d9337d84c157a4002b37:cs_8c682bfb9200460d206abf682d08f5d1532f1e34" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# Common endpoints: /orders, /orders/{id}, /orders/{id}/notes, /products, /products/{id}
```

### Production: Use MCP
```
mcp__woocommerce__wc_get_order
mcp__woocommerce__wc_list_orders
mcp__woocommerce__wc_get_order_notes
mcp__woocommerce__wc_search_products
# etc.
```

## Products (Staging)
| ID | Name | Price |
|----|------|-------|
| 66 | 01 Cutoff Tank | $50 |
| 85 | 02 Sunfaded Hoodie | $78 |

## Key Files
- `true-impulse-drop.php` - Main plugin
- `assets/css/drop-01.css` - Styles
- `assets/js/drop-01.js` - Main controller
- `templates/drop-01.php` - Template
- `assets/video/product-rotation.mp4` - 360 video (Tank only)

## Tab Labels
Set via shortcode, separate from product names:
```
[true_impulse_drop products="66,85" tabs="01 TANK, 02 HOODIE"]
```
