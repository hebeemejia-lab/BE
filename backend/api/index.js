const serverless = require('serverless-http');
const app = require('../src/index');
module.exports = serverless(app);
console.log('🟢 [Vercel] Iniciando handler serverless...');
try {
	const serverless = require('serverless-http');
	console.log('🟢 [Vercel] Requiriendo Express app...');
	const app = require('../src/index');
	console.log('🟢 [Vercel] Express app importada, exportando handler...');
	module.exports = serverless(app);
} catch (err) {
	console.error('🔴 [Vercel] Error en handler principal:', err);
	throw err;
}