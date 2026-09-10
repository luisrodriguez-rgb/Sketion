const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../excalidraw/public');
const destDir = path.join(__dirname, '../excalidraw/excalidraw-app/public');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);

files.forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);

  if (fs.statSync(srcFile).isFile()) {
    try {
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied: ${file}`);
    } catch (e) {
      console.log(`Error copying ${file}: ${e.message}`);
    }
  }
});
