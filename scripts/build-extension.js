const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define paths
const distDir = path.resolve(__dirname, '../dist');
const extensionDir = path.resolve(__dirname, '../extension');
const clientDir = path.resolve(__dirname, '../client');

// Create browser-specific build directories
const browsers = ['chrome', 'firefox', 'edge', 'opera', 'safari'];
browsers.forEach(browser => {
  const browserDir = path.resolve(distDir, browser);
  if (!fs.existsSync(browserDir)) {
    fs.mkdirSync(browserDir, { recursive: true });
  }
});

// Build the React app
console.log('Building the React application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('React build completed successfully.');
} catch (error) {
  console.error('Failed to build React application:', error);
  process.exit(1);
}

// Copy extension files for each browser
console.log('Preparing browser extensions...');
browsers.forEach(browser => {
  const browserDir = path.resolve(distDir, browser);
  
  // Copy built React app
  console.log(`Copying React build to ${browser} directory...`);
  execSync(`cp -r ${distDir}/* ${browserDir}/`, { stdio: 'inherit' });
  
  // Copy extension-specific files
  console.log(`Copying extension files for ${browser}...`);
  fs.readdirSync(extensionDir).forEach(file => {
    if (file !== 'manifest.json') {
      const srcPath = path.resolve(extensionDir, file);
      const destPath = path.resolve(browserDir, file);
      
      if (fs.lstatSync(srcPath).isDirectory()) {
        execSync(`cp -r ${srcPath} ${browserDir}/`, { stdio: 'inherit' });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });
  
  // Copy and modify manifest for browser compatibility
  console.log(`Preparing manifest for ${browser}...`);
  const manifestPath = path.resolve(extensionDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Browser-specific modifications
  switch (browser) {
    case 'firefox':
      // Firefox uses manifest v2
      manifest.manifest_version = 2;
      manifest.browser_action = manifest.action;
      delete manifest.action;
      
      // Firefox uses different background format
      if (manifest.background) {
        manifest.background = {
          scripts: ['background.js'],
          persistent: false
        };
      }
      
      // Add Mozilla specific keys
      manifest.browser_specific_settings = {
        gecko: {
          id: "securevault@example.com",
          strict_min_version: "57.0"
        }
      };
      break;
      
    case 'safari':
      // Safari has specific requirements
      if (manifest.background) {
        // Safari doesn't support service workers the same way
        delete manifest.background.type;
      }
      break;
  }
  
  // Write the modified manifest
  fs.writeFileSync(
    path.resolve(browserDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`${browser} extension prepared successfully.`);
});

console.log('All browser extensions prepared successfully!');
console.log(`Extension packages available in: ${distDir}`);