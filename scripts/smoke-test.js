// scripts/smoke-test.js
const axios = require('axios');

async function checkBackend(url) {
  try {
    const res = await axios.get(url);
    if (res.status === 200 && res.data.status === "ok") {
      console.log(`✅ Backend responde correctamente con {status:"ok"}`);
      return true;
    } else {
      console.error(`❌ Backend no devolvió el contenido esperado:`, res.data);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error al conectar con backend:`, err.message);
    return false;
  }
}

async function checkFrontend(url) {
  try {
    const res = await axios.get(url);
    if (res.status === 200 && res.data.includes("<title>Tu Grupo</title>")) {
      console.log(`✅ Frontend responde correctamente y contiene <title>Tu Grupo</title>`);
      return true;
    } else {
      console.error(`❌ Frontend no contiene el título esperado o status != 200`);
      return false;
    }
  } catch (err) {
    console.error(`❌ Error al conectar con frontend:`, err.message);
    return false;
  }
}

(async () => {
  const backendOk = await checkBackend('http://localhost:4000/api/health');
  const frontendOk = await checkFrontend('http://localhost:3000');

  if (backendOk && frontendOk) {
    console.log("🚀 Smoke test avanzado completado con éxito");
    process.exit(0);
  } else {
    console.error("💥 Smoke test avanzado falló");
    process.exit(1);
  }
})();
