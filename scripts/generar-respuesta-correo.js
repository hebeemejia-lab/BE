const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] : null;
};

const orden = getArg('--orden');
const to = getArg('--to');
const from = getArg('--from') || 'soporte@bancoexclusivo.lat';

if (!orden || !to) {
  console.error('Uso: node scripts/generar-respuesta-correo.js --orden "<orden>" --to "<email>" [--from "<email>"]');
  process.exit(1);
}

const subject = `Aclaracion sobre consulta - Orden ${orden}`;
const body = `Hola ${to},\n\nGracias por tu mensaje.\n\nPara poder ayudarte mejor, necesitamos que especifiques el objetivo exacto de tu consulta y el uso que deseas dar al proceso. El formulario ya incluye la opcion correspondiente registrada; por eso es importante entender el fin que buscas para no duplicar flujos o generar inconsistencias.\n\nCuando puedas, indicanos:\n- El objetivo final del flujo\n- En que parte del proceso lo necesitas\n- Cualquier requisito adicional (validacion, medio de pago, etc.)\n\nQuedamos atentos.\n\nSaludos,\nBanco Exclusivo\nSoporte\n${from}\n`;

const output = [
  `To: ${to}`,
  `From: ${from}`,
  `Subject: ${subject}`,
  '',
  body,
].join('\n');

const outDir = path.join(__dirname, 'salidas');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `correo-${Date.now()}.txt`);
fs.writeFileSync(outFile, output, 'utf8');

console.log('Correo generado:');
console.log(output);
console.log(`\nArchivo: ${outFile}`);
