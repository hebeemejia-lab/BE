const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, '../coverage/coverage-summary.json');
const outputPath = path.join(__dirname, '../../COVERAGE_MAP_TU_GRUPO.md');

const modules = [
  { file: 'backend/src/controllers/circulosController.js', label: 'Controlador de círculos' },
  { file: 'backend/src/models/CirculoAhorro.js', label: 'Modelo CirculoAhorro' },
  { file: 'backend/src/models/CirculoMiembro.js', label: 'Modelo CirculoMiembro' },
  { file: 'backend/src/routes/circulosRoutes.js', label: 'Rutas de círculos' },
  { file: 'backend/src/controllers/aporteController.js', label: 'Controlador de aportes' },
  { file: 'backend/src/controllers/retiroController.js', label: 'Controlador de retiros' },
  { file: 'backend/src/middleware/auth.js', label: 'Middleware de auth' },
  { file: 'backend/src/utils/validaciones.js', label: 'Utilidades de validación' }
];

const recomendaciones = {
  'backend/src/controllers/circulosController.js': 'Reforzar tests de validación y errores de negocio.',
  'backend/src/models/CirculoAhorro.js': 'Cubrir casos límite de atributos y relaciones.',
  'backend/src/models/CirculoMiembro.js': 'Añadir tests de integridad y pertenencia a grupo.',
  'backend/src/routes/circulosRoutes.js': 'Probar rutas con y sin autenticación, IDs inválidos.',
  'backend/src/controllers/aporteController.js': 'Agregar tests de montos negativos y saldo insuficiente.',
  'backend/src/controllers/retiroController.js': 'Cubrir retiros fuera de turno y errores de lógica.',
  'backend/src/middleware/auth.js': 'Validar expiración y manipulación de tokens.',
  'backend/src/utils/validaciones.js': 'Añadir tests para inputs vacíos y formatos incorrectos.'
};

function getCoverage(file, summary) {
  const entry = summary[file];
  if (!entry) return '0%';
  return `${entry.lines.pct}%`;
}

function main() {
  if (!fs.existsSync(summaryPath)) {
    console.error('No se encontró el reporte de cobertura.');
    process.exit(1);
  }
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  let md = `# 🗺️ Mapa de Cobertura - "Tu grupo"\n\n`;
  md += `| Módulo / Archivo | Cobertura (%) | Recomendaciones de acción |\n`;
  md += `|------------------|---------------|--------------------------|\n`;
  for (const m of modules) {
    md += `| ${m.file} | ${getCoverage(m.file, summary)} | ${recomendaciones[m.file]} |\n`;
  }
  md += `\n**Leyenda:**\n- Cobertura ideal: ≥90%\n- Prioridad alta: módulos <80% o con lógica crítica\n\n## Acciones sugeridas\n- Priorizar tests en controladores con menor cobertura (aportes, retiros).\n- Reforzar validaciones y mensajes de error en rutas y middleware.\n- Cubrir casos límite: montos extremos, usuarios no autorizados, grupos inexistentes.\n- Revisar el reporte de Codecov tras cada PR y actualizar este mapa periódicamente.\n\n---\n\n> Este archivo se actualiza automáticamente tras cada build de CI.\n`;
  fs.writeFileSync(outputPath, md, 'utf8');
  console.log('COVERAGE_MAP_TU_GRUPO.md actualizado.');
}

main();
