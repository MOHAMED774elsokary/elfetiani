const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = {
  '#FF5500': '#E8520D',
  '#ff5500': '#E8520D',
  '#FF8800': '#E57022',
  '#ff8800': '#E57022',
  '#050505': '#080706',
  '#050505/': '#080706/',
  '#111111': '#0d0c0b',
  '#0e0e0e': '#0f0e0d',
  '#070707': '#0a0908',
  '#FF6620': '#C9440A',
  '#E04B00': '#C9440A',
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.match(/\.(ts|tsx|css)$/)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [key, value] of Object.entries(replacements)) {
        if (content.includes(key)) {
          // Replace all occurrences
          content = content.split(key).join(value);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Color replacements complete.');
