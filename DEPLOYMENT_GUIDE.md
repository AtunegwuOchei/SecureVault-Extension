# SecureVault Extension Deployment Guide

This guide will walk you through the process of packaging and deploying your SecureVault browser extension to various browsers and platforms.

## Prerequisites

- Node.js and npm installed
- Access to developer accounts for browser extension stores (if publishing publicly)
- Basic knowledge of terminal/command-line operations

## Step 1: Build Your Extension

After completing development, you'll need to build your extension for production:

```bash
# Build the React application
npm run build

# Run the extension build script
node scripts/build-extension.js

# Package the extensions for distribution
bash scripts/package-extension.sh
```

This will create distribution packages in the `packages` directory.

## Step 2: Browser-Specific Deployment

### Google Chrome

1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Click "New Item" to upload a new extension
4. Upload the `securevault-chrome.zip` file from your packages directory
5. Fill in the required metadata:
   - Extension name: "SecureVault"
   - Description
   - Category: "Productivity"
   - Screenshots (at least 1280x800 resolution)
   - Promotional images
6. Set pricing and distribution options
7. Submit for review (approval usually takes 24-48 hours)

### Mozilla Firefox

1. Go to the [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
2. Sign in or create a Firefox account
3. Click "Submit a New Add-on"
4. Upload the `securevault-firefox.zip` file
5. Fill in the required information:
   - Name: "SecureVault"
   - Summary and description
   - Choose categories and add-on type
   - Upload screenshots (1280x800 or 1200x900)
6. Submit for review (can take several weeks for new developers)

### Microsoft Edge

1. Go to the [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/)
2. Sign in with your Microsoft account
3. Navigate to "Microsoft Edge Add-ons"
4. Click "Create new extension"
5. Upload the `securevault-edge.zip` file
6. Complete the product details:
   - Name: "SecureVault"
   - Short description and detailed description
   - Categories and Privacy policy URL
   - Screenshots (at least 1280x800)
7. Submit for certification (typically takes 1-5 business days)

### Opera

1. Go to the [Opera Add-ons Developer Dashboard](https://addons.opera.com/developer/)
2. Sign in with your Opera account
3. Click "Upload Add-on"
4. Upload the `securevault-opera.zip` file
5. Fill in the product details:
   - Title: "SecureVault"
   - Summary and description
   - Categories
   - Screenshots (at least 1280x800)
6. Submit for review (usually takes 1-2 business days)

### Safari

Safari extensions require a more complex process:

1. You need a paid Apple Developer account ($99/year)
2. Create a Safari Web Extension project in Xcode
3. Import your extension files into the project
4. Configure the extension settings in Xcode
5. Build the project for macOS
6. Submit to App Store Connect
7. Apple will review the extension (can take 1-2 weeks)

## Step 3: Testing Your Extension

Before submitting to stores, test your extension:

### Chrome/Edge/Opera Testing

1. Go to `chrome://extensions/` (or equivalent)
2. Enable "Developer mode"
3. Click "Load unpacked" and select your extension's build directory
4. Test all functionality

### Firefox Testing

1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select the manifest.json from your extension's build directory

### Safari Testing

1. In Xcode, run your Safari extension project
2. Test in Safari on your Mac

## Step 4: Distribution to Users

### Private Distribution

If you're distributing the extension within your organization:

#### Chrome/Edge Enterprise Distribution

1. Create a group policy in your organization
2. Configure force-installed extensions with your extension ID
3. Host your extension package on an internal server
4. Point the policy to your hosted extension

#### Firefox Enterprise Distribution

1. Use the Enterprise Policy Generator
2. Configure extension installation via policy
3. Deploy through your organization's management tools

## Step 5: Maintenance

1. Keep your developer accounts active
2. Address user feedback
3. Update your extension regularly
4. Test compatibility with new browser versions

## Browser Compatibility Notes

- **Chrome/Edge/Opera**: These Chromium-based browsers have similar extension APIs
- **Firefox**: Requires manifest v2 and some API adaptations
- **Safari**: Has the most restrictions and requires native app packaging

For more detailed information, refer to each browser's extension developer documentation.