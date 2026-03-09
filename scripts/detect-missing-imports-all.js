// scripts/detect-missing-imports-all.js
// Detecta componentes JSX no importados en todos los archivos .js de frontend/src
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../frontend/src');

function getAllJsFiles(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllJsFiles(fullPath));
    } else if (file.endsWith('.js')) {
      files.push(fullPath);
    }
  });
  return files;
}

const files = getAllJsFiles(srcDir);

files.forEach(filePath => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const importRegex = /import\s+([\w{}*,\s]+)\s+from\s+['"][^'"]+['"]/g;
  const imports = new Set();
  let match;
  while ((match = importRegex.exec(fileContent))) {
    const names = match[1].replace(/[{}]/g, '').split(',').map(n => n.trim());
    names.forEach(n => n && imports.add(n));
  }

  const jsxRegex = /<([A-Z][A-Za-z0-9_]*)\b/g;
  const used = new Set();
  while ((match = jsxRegex.exec(fileContent))) {
    used.add(match[1]);
  }

  const missing = [...used].filter(c => !imports.has(c) && c !== 'Router' && c !== 'Routes' && c !== 'Route' && c !== 'Navigate' && c !== 'AuthProvider' && c !== 'CurrencyProvider');

  if (missing.length > 0) {
    console.log(`\n🚨 Imports faltantes en ${filePath}:`);
    missing.forEach(c => {
      console.log(`import ${c} from './ruta/${c}';`);
    });
  }
});

console.log('\n✅ Revisión completa.');
