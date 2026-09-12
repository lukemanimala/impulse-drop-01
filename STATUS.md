# True Impulse Drop - Development Status

**Last Updated:** 2026-08-17

## Current Status: WORKING

All core functionality is operational.

---

## Completed Fixes (2026-08-17)

### 1. tidConfig Not Defined
**Problem:** `wp_localize_script` doesn't work with block themes (Twenty Twenty-Five) - shortcode runs after scripts are queued.
**Fix:** Added inline `<script>` with `tidConfig` directly in `templates/drop-01.php`

### 2. Varnish Cache Serving Stale Pages
**Problem:** Cloudways Varnish was caching pages with dynamic nonces/product data.
**Fix:** Added cache-control headers in `true-impulse-drop.php`:
```php
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('X-Varnish-Bypass: 1');
```

### 3. View Toggle / Brand Mark Overlap on Mobile
**Problem:** "IMPULSE CLOTHING" text overlapped with Front/360/Worn tabs on mobile.
**Fix:** Hide brand mark on mobile during reveal state in CSS.

### 4. Worn Image Not Centered
**Problem:** Worn view image was shifted down.
**Fix:** Adjusted padding in `.tid-product-worn` CSS.

### 5. WooCommerce Emails Not Sending
**Problem:** Cloudways server mail not configured.
**Fix:** Set up WP Mail SMTP with Brevo (impulse.clothing domain authenticated).

---

## Product Setup

- **Product:** Impulse Boxy Tank Top
- **Product ID:** 66
- **Variations:** 69 (S), 70 (M), 71 (L), 72 (XL)
- **Price:** $50.00
- **Tapstitch Cost:** $17.48
- **Margin:** $32.52 (65%)
- **Shortcode:** `[true_impulse_drop product_id="66"]`

---

## Environment

### Live Site
- URL: https://impulse.clothing
- Hosting: **Cloudways** (IP: 138.197.123.86)
- Caching: **Varnish** (bypassed for drop pages)
- WooCommerce: 10.9.4
- Stripe: Active
- Email: Brevo (via WP Mail SMTP)

### Development
- Repo: `/Users/lukemanimala/Projects/true-impulse-drop/`
- LocalWP: `/Users/lukemanimala/Local Sites/impulse-clothing/`
- Plugin Version: 1.0.3

---

## Deployment Process

1. Edit files in `/Users/lukemanimala/Projects/true-impulse-drop/`
2. Upload via SFTP to `public_html/wp-content/plugins/true-impulse-drop/`
3. Bump `TID_VERSION` in `true-impulse-drop.php` if CSS/JS changed
4. Hard refresh browser (Cmd+Shift+R)

---

## Key Files

| File | Purpose |
|------|---------|
| `true-impulse-drop.php` | Main plugin, cache headers, version |
| `templates/drop-01.php` | Template with inline tidConfig |
| `assets/js/drop-01.js` | State machine, add-to-cart flow |
| `assets/css/drop-01.css` | Styles, mobile fixes |

---

## Add-to-Cart Flow

```
Select Size → Click "Add to Cart" → loading state
→ GET /?add-to-cart={variation_id}&quantity=1 (redirect:manual)
→ Show "Added!" → 300ms delay → redirect to /checkout/
```
