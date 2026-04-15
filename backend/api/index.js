console.log('[Vercel][DEBUG] Iniciando handler Express serverless...');
try {
	const serverless = require('serverless-http');
	console.log('[Vercel][DEBUG] Requiriendo app Express...');
	const app = require('../src/index');
	console.log('[Vercel][DEBUG] App Express importada, exportando handler...');
	module.exports = serverless(app);
} catch (err) {
	console.error('[Vercel][ERROR] Error al inicializar handler Express:', err);
	throw err;
}
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