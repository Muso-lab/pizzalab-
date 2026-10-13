const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..');
const destDir = path.resolve(srcDir, 'android-app', 'app', 'src', 'main', 'assets', 'www');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'android-app' && entry.name !== 'scripts') {
        copyRecursive(srcPath, destPath);
      }
    } else {
      if (['index.html', 'manifest.webmanifest', 'sw.js'].includes(entry.name)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Ensure specific folders
function copyFolder(folderName) {
  const s = path.join(srcDir, folderName);
  const d = path.join(destDir, folderName);
  if (fs.existsSync(s)) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    for (const f of fs.readdirSync(s)) {
      fs.copyFileSync(path.join(s, f), path.join(d, f));
    }
  }
}

console.log("Sincronizzazione asset web verso android-app/app/src/main/assets/www...");
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(path.join(srcDir, 'index.html'), path.join(destDir, 'index.html'));
fs.copyFileSync(path.join(srcDir, 'manifest.webmanifest'), path.join(destDir, 'manifest.webmanifest'));
fs.copyFileSync(path.join(srcDir, 'sw.js'), path.join(destDir, 'sw.js'));

copyFolder('css');
copyFolder('js');
copyFolder('icons');

console.log("✅ Asset web sincronizzati con successo!");
