# True Impulse Drop 01

Interactive commerce experience: abstract visual field with touch ripples, garment reveal animation, and WooCommerce checkout integration.

## Requirements

- WordPress 5.8+
- WooCommerce 5.0+
- PHP 7.4+
- Tapstitch WooCommerce integration (for fulfillment)

## Installation

1. Upload the `true-impulse-drop` folder to `/wp-content/plugins/`
2. Activate the plugin in WordPress admin
3. Configure your WooCommerce product (see below)
4. Add the shortcode to any page: `[true_impulse_drop product_id="123"]`

## Configuration

### WooCommerce Product Setup

1. Create a **Variable Product** in WooCommerce
2. Add a **Size** attribute with variations (S, M, L, XL, etc.)
3. Set pricing and inventory for each variation
4. Upload product images:
   - Main image: Front view
   - Gallery image 1: Back view
   - Gallery image 2: Detail view
5. Note the product ID for the shortcode

### Tapstitch Integration

1. Connect WooCommerce to Tapstitch via their integration
2. Verify product mapping matches your Woo variations
3. Test with a real order before launch

### Custom Silhouette Mask

Replace `assets/img/garment-mask.svg` with your own SVG silhouette:
- Use paths only (no raster images)
- ViewBox recommended: 400x500
- Keep the SVG simple for performance

### Founder Video

Add your founder video loop:
1. Place as `assets/video/founder-loop.mp4`
2. Specifications:
   - 1080x1350 or 1080x1920
   - 6-10 seconds, seamless loop
   - H.264 MP4, under 6MB
   - Film at 60fps, export at 24/30fps for slow motion effect

## Shortcode Options

```php
[true_impulse_drop]                    // Uses default/configured product
[true_impulse_drop product_id="123"]   // Specify product ID
```

## Plugin Settings

Set the default product via WordPress options:

```php
update_option('tid_product_id', 123);
update_option('tid_founder_video', 'https://yoursite.com/video.mp4');
```

## Page States

| State | Description |
|-------|-------------|
| S0 - Loading | Black screen with wordmark while assets load |
| S1 - Field | Interactive particle field with touch ripples |
| S2 - Formation | Particles converge to garment silhouette |
| S3 - Reveal | Product image crossfades in, purchase tray expands |
| S4 - Detail | Media drawer with carousel and founder video |
| S5 - Purchase | Size selection and checkout flow |
| S6 - Failure | Static product fallback if JS/Canvas fails |

## Accessibility

- Skip link to purchase tray
- Keyboard navigation (Enter/Space for ripples)
- Screen reader labels on all interactive elements
- `prefers-reduced-motion` support (disables animations)
- Works without JavaScript (shows static product)
- WCAG AA contrast on commerce elements

## Performance

| Metric | Target |
|--------|--------|
| Initial HTML + CSS | <100KB |
| Hero image | <350KB |
| JavaScript | <250KB |
| Time to usable | <2.5s on 4G |
| Canvas FPS | 50-60fps |

## Analytics Events

Events dispatched as `tid:analytics` custom events:

- `drop_view` - Page loaded
- `first_ripple` - User's first interaction
- `materialize_click` - CTA activated
- `reveal_complete` - Product revealed
- `media_open` - Gallery opened
- `size_select` - Size chosen
- `add_to_cart` - Item added successfully
- `checkout_redirect` - Redirecting to checkout
- `add_to_cart_error` - Add to cart failed

## File Structure

```
true-impulse-drop/
├── true-impulse-drop.php           # Main plugin file
├── templates/
│   └── drop-01.php                 # Page template
├── assets/
│   ├── css/
│   │   └── drop-01.css             # Styles
│   ├── js/
│   │   ├── drop-01.js              # State machine
│   │   └── visual-field.js         # Canvas renderer
│   ├── img/
│   │   └── garment-mask.svg        # Silhouette mask
│   └── video/
│       └── founder-loop.mp4        # (Add your video)
├── includes/
│   └── class-product-config.php    # Product data helper
└── README.md
```

## Development

### Local Testing

The plugin includes demo mode when no product ID is set:
- Shows placeholder product data
- Size buttons work (XL shows as sold out)
- Add to cart simulates success and redirects to /checkout/

### Customization

**Colors**: Edit CSS custom properties in `drop-01.css`:
```css
:root {
    --tid-black: #000000;
    --tid-silver: #c0c0c0;
    --tid-white: #ffffff;
}
```

**Particles**: Adjust in `visual-field.js`:
```javascript
const CONFIG = {
    particleCount: { mobile: 3000, desktop: 8000 },
    // ...
};
```

## Troubleshooting

**Canvas not rendering**
- Check browser console for errors
- Verify GSAP CDN is accessible
- Try in incognito mode (extensions can interfere)

**Add to cart fails**
- Verify WooCommerce is active
- Check product ID exists and is published
- Ensure variations have stock

**Tapstitch order not syncing**
- Verify integration is connected in Tapstitch dashboard
- Check product mapping matches Woo variation IDs
- Review Tapstitch webhook logs

## License

Proprietary - True Impulse
