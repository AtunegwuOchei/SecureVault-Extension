#!/bin/bash

# Script to package browser extensions for distribution
DIST_DIR="$(pwd)/dist"
PACKAGES_DIR="$(pwd)/packages"

# Create packages directory if it doesn't exist
mkdir -p "$PACKAGES_DIR"

# Function to create a zip package for a browser
package_extension() {
  local BROWSER=$1
  local SOURCE_DIR="$DIST_DIR/$BROWSER"
  local PACKAGE_FILE="$PACKAGES_DIR/securevault-$BROWSER.zip"
  
  echo "Packaging SecureVault for $BROWSER..."
  
  # Check if source directory exists
  if [ ! -d "$SOURCE_DIR" ]; then
    echo "Error: $BROWSER build directory not found!"
    return 1
  fi
  
  # Create the ZIP package
  cd "$SOURCE_DIR" && zip -r "$PACKAGE_FILE" * && cd - > /dev/null
  
  if [ $? -eq 0 ]; then
    echo "✓ Successfully created package: $PACKAGE_FILE"
  else
    echo "✗ Failed to create package for $BROWSER"
    return 1
  fi
}

# Ensure build-extension.js has been run first
if [ ! -d "$DIST_DIR/chrome" ]; then
  echo "Error: Build directories not found. Please run build-extension.js first."
  exit 1
fi

# Package for each browser
package_extension "chrome"
package_extension "firefox"
package_extension "edge" 
package_extension "opera"

# Safari requires special handling with Xcode
echo "Note: For Safari, you'll need to use Xcode to create a Safari App Extension."
echo "Follow the Safari Web Extension documentation for detailed instructions."

echo ""
echo "Packaging complete! Extension packages are available in: $PACKAGES_DIR"
echo ""
echo "Next steps for publishing:"
echo "• Chrome: Upload to Chrome Web Store (https://chrome.google.com/webstore/devconsole)"
echo "• Firefox: Upload to Firefox Add-ons (https://addons.mozilla.org/developers/)"
echo "• Edge: Upload to Microsoft Edge Add-ons (https://partner.microsoft.com/dashboard/microsoftedge/)"
echo "• Opera: Upload to Opera Add-ons (https://addons.opera.com/developer/)"
echo "• Safari: Build using Xcode and submit to App Store Connect"