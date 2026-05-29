# PNN Icons

This directory contains app icons for PNN PWA.

## Required Icon Sizes

For full PWA support, the following icon sizes should be generated from the master SVG:

- `icon-72.png` - Safari pinned tab
- `icon-96.png` - Android LDPI
- `icon-128.png` - Chrome Web Store
- `icon-144.png` - Android MDPI
- `icon-152.png` - iPad home screen
- `icon-180.png` - iPhone home screen (most important for iOS)
- `icon-192.png` - Android home screen
- `icon-384.png` - Android notification
- `icon-512.png` - Google Play Store

## Generation

Use a tool like Sketch, Figma, or online converter to generate PNG files from `icon.svg`.

For iOS home screen icon (180x180):
1. Open icon.svg in your vector editor
2. Export as PNG at 180x180 pixels
3. Save as `icon-180.png`

Repeat for all required sizes.

## Notes

- Icons should have no transparency for iOS home screen
- For iOS, the system will automatically apply rounded corners
- Keep important content within the center 60% to avoid cropping
