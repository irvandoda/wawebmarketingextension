const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const extensionName = 'wamarketingweb';
const version = require('./package.json').version;
const zipName = `${extensionName}-v${version}.zip`;

console.log(`Creating distribution package: ${zipName}`);

// Files to include in distribution
const filesToInclude = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'popup.css',
  'content.js',
  'content.css',
  'background.js',
  'utils.js',
  'README.md',
  'icons/'
];

// Create dist directory if not exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Check if zip command is available
try {
  if (process.platform === 'win32') {
    // Windows - use PowerShell Compress-Archive
    const files = filesToInclude.join(' ');
    execSync(`powershell Compress-Archive -Path ${files} -DestinationPath dist/${zipName} -Force`);
  } else {
    // Unix-like systems
    const files = filesToInclude.join(' ');
    execSync(`zip -r dist/${zipName} ${files}`);
  }
  
  console.log(`✅ Package created: dist/${zipName}`);
  console.log('\nYou can now:');
  console.log('1. Upload to Chrome Web Store');
  console.log('2. Submit to Firefox Add-ons');
  console.log('3. Distribute manually');
  
} catch (error) {
  console.error('❌ Failed to create zip package');
  console.error('Please create zip manually with these files:');
  filesToInclude.forEach(file => console.log(`  - ${file}`));
}
