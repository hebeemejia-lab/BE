// scripts/detect-missing-imports.js
// Detecta componentes JSX no importados en archivos React
const fs = require('fs');
const path = require('path');

const filePath = process.argv[2] || 'frontend/src/App.js';
const fileContent = fs.readFileSync(filePath, 'utf8');

// Extrae importaciones
const importRegex = /import\s+([\w{}*,\s]+)\s+from\s+['"][^'"]+['"]/g;
const imports = new Set();
let match;
while ((match = importRegex.exec(fileContent))) {
  const names = match[1].replace(/[{}]/g, '').split(',').map(n => n.trim());
  names.forEach(n => n && imports.add(n));
}

// Extrae componentes usados en JSX
const jsxRegex = /<([A-Z][A-Za-z0-9_]*)\b/g;
const used = new Set();
while ((match = jsxRegex.exec(fileContent))) {
  used.add(match[1]);
}

// Filtra los que no están importados
const missing = [...used].filter(c => !imports.has(c) && c !== 'Router' && c !== 'Routes' && c !== 'Route' && c !== 'Navigate' && c !== 'AuthProvider' && c !== 'CurrencyProvider');

if (missing.length === 0) {
  console.log('✅ No hay imports faltantes.');
} else {
  console.log('🚨 Imports faltantes:');
  missing.forEach(c => {
    console.log(`import ${c} from './ruta/${c}';`);
  });
}
