# Impulse Drop 01 - Deployment Setup

## Overview

This plugin uses a Git-based deployment workflow with WP Pusher for automatic updates.

## Architecture

```
Local Development
      │
      ▼
┌─────────────────┐
│  Symlink        │  ← Instant local changes
│  (Local Sites)  │
└─────────────────┘
      │
      ▼ git push
┌─────────────────┐
│  GitHub Repo    │  lukemanimala/impulse-drop-01
│  - main         │  ← staging branch
│  - production   │  ← production branch
└─────────────────┘
      │
      ▼ WP Pusher (push-to-deploy)
┌─────────────────┐     ┌─────────────────┐
│  Staging        │     │  Production     │
│  (Cloudways)    │     │  (Cloudways)    │
│  branch: main   │     │  branch: prod   │
└─────────────────┘     └─────────────────┘
```

## Local Development

### Symlink Setup (already configured)

The WordPress plugins folder symlinks to your source:

```
/Users/lukemanimala/Local Sites/impulse-clothing/app/public/wp-content/plugins/true-impulse-drop
  → /Users/lukemanimala/Projects/true-impulse-drop
```

**Result:** Edit files in `/Projects/true-impulse-drop`, refresh browser, see changes instantly.

### Running Locally

1. Open **Local** app
2. Start "impulse-clothing" site
3. Visit: http://impulse-clothing.local

## Deployment Workflow

### Deploy to Staging

```bash
cd /Users/lukemanimala/Projects/true-impulse-drop
git add .
git commit -m "Your change description"
git push origin main
```

WP Pusher auto-deploys to staging (if push-to-deploy enabled).

### Deploy to Production

```bash
git checkout production
git merge main
git push origin production
git checkout main
```

WP Pusher auto-deploys to production.

## Environment URLs

| Environment | URL | Branch |
|-------------|-----|--------|
| Local | http://impulse-clothing.local | (symlink) |
| Staging | https://wordpress-1670281-6667531.cloudwaysapps.com | main |
| Production | https://impulse.clothing | production |

## WP Pusher Configuration

### GitHub Token

- Token name: `WP Pusher`
- Scopes: `repo` (full control)
- Same token used on both staging and production

### Plugin Settings

| Setting | Staging | Production |
|---------|---------|------------|
| Repository | lukemanimala/impulse-drop-01 | lukemanimala/impulse-drop-01 |
| Branch | main | production |
| Push-to-Deploy | Enabled | Enabled |

## WordPress MCP (Optional)

For editing WordPress content (pages, shortcodes) via Claude Code, install a WordPress MCP:

### Option 1: wp-mcp (Community)

```bash
# Add to Claude Code MCP config
npx @anthropic/claude-code mcp add wp-mcp
```

GitHub: https://github.com/mcp-wp/mcp-wp

### Option 2: WP Engine MCP

If using WP Engine hosting, their Smart Search AI includes MCP support.

## Shortcode Reference

The drop experience is embedded via shortcode:

```
[true_impulse_drop products="66,67" tabs="01 TANK, 02 HOODIE"]
```

| Attribute | Description |
|-----------|-------------|
| products | Comma-separated WooCommerce product IDs |
| tabs | Comma-separated tab labels |
| product_id | Single product ID (legacy) |

## Version Bumping

When changing CSS/JS, bump the version to bust cache:

```php
// In true-impulse-drop.php
define('TID_VERSION', '1.3.2');  // Increment this
```

## Troubleshooting

### Changes not showing on staging/production

1. Check WP Pusher → Plugins → click "Update" manually
2. Verify push-to-deploy webhook is configured
3. Clear Cloudways Varnish cache

### Cache issues

The plugin sends no-cache headers automatically. If still caching:
- Cloudways: Application → Varnish → Purge
- Browser: Hard refresh (Cmd+Shift+R)

## File Structure

```
true-impulse-drop/
├── true-impulse-drop.php    # Main plugin file
├── includes/
│   └── class-product-config.php  # Product data handling
├── templates/
│   └── drop-01.php          # Main template
├── assets/
│   ├── css/
│   │   ├── drop-01.css      # Main styles
│   │   └── woo-cleanup.css  # WooCommerce overrides
│   ├── js/
│   │   ├── drop-01.js       # Main controller
│   │   └── procedural-field.js  # Canvas animation
│   └── img/                 # Product images, logos
├── DEPLOYMENT.md            # This file
├── README.md
└── STATUS.md
```
