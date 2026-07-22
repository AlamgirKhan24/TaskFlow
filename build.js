const fs   = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src,  entry.name);
    const destPath = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
  }
}

copyDir('src/js', 'dist/js');

fs.mkdirSync('dist', { recursive: true });
const pages = fs.readdirSync('src/pages').filter((f) => f.endsWith('.html'));
for (const file of pages) {
  let html = fs.readFileSync(path.join('src/pages', file), 'utf8');
  html = html
    .replace(/\.\.\/\.\.\/dist\/css\/style\.css/g, 'css/style.css')
    .replace(/\.\.\/js\//g, 'js/');
  fs.writeFileSync(path.join('dist', file), html);
}

console.log(`Built ${pages.length} pages + JS modules → dist/`);
