const fs = require('fs');
const path = require('path');

console.log('Building WA Marketing Web Extension...');

// Check required files
const requiredFiles = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'popup.css',
  'content.js',
  'content.css',
  'background.js',
  'utils.js'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing file: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`✓ Found: ${file}`);
  }
});

// Check icons directory
if (!fs.existsSync('icons')) {
  console.warn('⚠️  Icons directory not found. Creating...');
  fs.mkdirSync('icons');
}

const iconFiles = ['icon16.png', 'icon48.png', 'icon128.png'];
iconFiles.forEach(icon => {
  const iconPath = path.join('icons', icon);
  if (!fs.existsSync(iconPath)) {
    console.warn(`⚠️  Missing icon: ${icon}`);
    console.log('   Please convert icons/icon.svg to PNG format');
  } else {
    console.log(`✓ Found: icons/${icon}`);
  }
});

if (allFilesExist) {
  console.log('\n✅ Build check complete! Extension is ready.');
  console.log('\nNext steps:');
  console.log('1. Convert SVG icons to PNG (16x16, 48x48, 128x128)');
  console.log('2. Load extension in browser:');
  console.log('   - Chrome: chrome://extensions/ (Enable Developer mode)');
  console.log('   - Firefox: about:debugging#/runtime/this-firefox');
  console.log('3. Test on https://web.whatsapp.com');
} else {
  console.error('\n❌ Build check failed. Please fix missing files.');
  process.exit(1);
}
