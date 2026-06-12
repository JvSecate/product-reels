# Product Reels

A WordPress plugin for displaying shoppable vertical video reels linked to WooCommerce products — similar to Instagram/TikTok reels, but on your own store.

---

## Features

- **Upload or source Video** — paste a direct video URL or upload a file to the WordPress Media Library
- **Thumbnail / poster image** — Select and extract a frame from the video via or upload your own image; prevents black screens while the video loads
- **Preview clips** — generate a short, muted, compressed version of each video that autoplays silently on the card;
- **Lightbox** — clicking a reel card opens the full video in an overlay (with audio and controls)
- **Drag-to-scroll carousel** — desktop and touch friendly, with prev/next buttons
- **WooCommerce integration** — link any product to show its image, name, and price below the reel
- **One-click FFmpeg download** — downloads a static FFmpeg binary directly to your server from the plugin settings page; no SSH or manual installation required

---

## Requirements

| Requirement | Minimum |
|---|---|
| WordPress | 6.0 |
| PHP | 8.0 |
| WooCommerce | 7.0 (optional, for product linking) |
| FFmpeg | Any recent version (optional, for thumbnail/preview generation) |

---

## Installation

1. Upload the `product-reels` folder to `/wp-content/plugins/`
2. Activate the plugin through **Plugins → Installed Plugins**
3. Go to **Product Reels → Settings** and download FFmpeg (recommended) or enter your server's FFmpeg path
4. Go to **Product Reels → Add New Reel** and add your first reel
5. Call `<?php product_reels_render_section(); ?>` in your theme where you want the carousel to appear

---

## FFmpeg Setup

FFmpeg is required for thumbnail extraction and preview clip generation. The plugin tries to find it automatically in common locations (`/usr/bin/ffmpeg`, `/usr/local/bin/ffmpeg`, etc.). If FFmpeg is unavailable the plugin still works with URL-only videos and manually uploaded thumbnails

### Option 1 — One-click download

Go to **Product Reels → Settings** and click **Download FFmpeg to this server**. The plugin will:

1. Detect your server architecture (amd64, arm64, armhf)
2. Download a static build (~40 MB) from [johnvansickle.com/ffmpeg](https://johnvansickle.com/ffmpeg/)
3. Extract the binary to `wp-content/uploads/product-reels-bin/ffmpeg`
4. Make it executable
5. Protect the directory from direct web access via `.htaccess`

Supported architectures: Linux x86_64, ARM64, ARMv7. Windows is not currently supported for auto-download.

### Option 2 — System installation

Install FFmpeg via your package manager and the plugin will auto-detect it:

```bash
# Debian / Ubuntu
sudo apt install ffmpeg

# CentOS / RHEL
sudo yum install ffmpeg

# macOS (Homebrew)
brew install ffmpeg
```

### Option 3 — Manual path

Enter the full path to your FFmpeg binary in **Product Reels → Settings → Option 2**.

---

## Adding Reels

1. Go to **Product Reels → Add New Reel**
2. Enter a title (admin-only, not shown on the front end)
3. Add a video via URL or file upload
4. Generate or upload a thumbnail to prevent black screens
5. Optionally enable and generate a preview clip
6. Link a WooCommerce product (optional)
7. Use **Menu Order** (in the right-hand panel) to control display order
8. Publish

---

## Theme Integration

Call this function anywhere in your theme to render the reels section:

```php
<?php product_reels_render_section(); ?>
```

Or use it in a custom page template:

```php
<?php
get_header();
product_reels_render_section();
get_footer();
```

The function outputs a `<section class="reels-section">` block. You can style it further with your theme's CSS using the `.reels-section`, `.reel-card`, `.reel-video`, and `.reel-product` selectors.

---

## Frequently Asked Questions

**Does this work without WooCommerce?**
Yes. Product linking is optional. Reels without a linked product display the video only.

**Can I use YouTube or Vimeo URLs?**
No. The `<video>` tag requires a direct file URL (`.mp4`, `.webm`, `.mov`). Use a direct link to your hosted video file.

**The download timed out — what do I do?**
Large file downloads can exceed PHP's default `max_execution_time`. Either increase it in your `php.ini` / `.htaccess`, or install FFmpeg manually via SSH and use the manual path option.

**Where is the downloaded binary stored?**
`wp-content/uploads/product-reels-bin/ffmpeg`. The directory is protected by an `.htaccess` file that denies direct HTTP access.

**Will the binary survive plugin updates?**
Yes — it's stored in the uploads directory, not inside the plugin folder.

