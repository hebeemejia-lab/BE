console.log('🟢 [Vercel] Iniciando handler serverless...');
const serverless = require('serverless-http');
console.log('🟢 [Vercel] Requiriendo Express app...');
const app = require('../src/index');
console.log('🟢 [Vercel] Express app importada, exportando handler...');
module.exports = serverless(app);