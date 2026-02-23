const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'assets', 'ui');
const destDir = path.join(__dirname, 'apps', 'mobile', 'src', 'assets', 'ui');

// 找到源文件
const files = fs.readdirSync(srcDir);
const targetFile = files.find(f => f.startsWith('微信图片') && f.endsWith('.jpg'));

if (targetFile) {
  const srcPath = path.join(srcDir, targetFile);
  const destPath = path.join(destDir, 'paw_v2.jpg');
  
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied ${srcPath} to ${destPath}`);
} else {
  console.error('Source file not found!');
}
