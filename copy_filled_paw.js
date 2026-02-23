const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'vedio&picture', 'dogpaw_circle_filled_transparent.png');
const destPath = path.join(__dirname, 'apps', 'mobile', 'src', 'assets', 'ui', 'paw_filled.png');

try {
  fs.copyFileSync(srcPath, destPath);
  console.log(`Successfully copied to ${destPath}`);
} catch (err) {
  console.error('Error copying file:', err);
}
