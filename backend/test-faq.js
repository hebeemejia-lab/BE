// Test directo del FAQ sin servidor
const { buscarRespuesta, obtenerPopulares } = require('./src/data/faqData');

console.log('🧪 Probando FAQ Data...\n');

// Test 1: Preguntas populares
console.log('1️⃣ Preguntas populares:');
const populares = obtenerPopulares();
console.log(`   - Total: ${populares.length}`);
populares.forEach((p, i) => {
  console.log(`   ${i+1}. ${p.pregunta}`);
});

// Test 2: Buscar respuesta sobre recargas
console.log('\n2️⃣ Buscar: "como recargar"');
const respuesta1 = buscarRespuesta('como recargar');
if (respuesta1) {
  console.log('   ✅ Encontrado:');
  console.log(`   Pregunta: ${respuesta1.pregunta}`);
  console.log(`   Respuesta: ${respuesta1.respuesta.substring(0, 100)}...`);
} else {
  console.log('   ❌ No encontrado');
}

// Test 3: Buscar respuesta sobre transferencias
console.log('\n3️⃣ Buscar: "enviar dinero"');
const respuesta2 = buscarRespuesta('enviar dinero');
if (respuesta2) {
  console.log('   ✅ Encontrado:');
  console.log(`   Pregunta: ${respuesta2.pregunta}`);
  console.log(`   Categoría: ${respuesta2.categoria}`);
} else {
  console.log('   ❌ No encontrado');
}

// Test 4: Buscar sin coincidencia
console.log('\n4️⃣ Buscar: "algo que no existe xyz123"');
const respuesta3 = buscarRespuesta('algo que no existe xyz123');
console.log(`   Resultado: ${respuesta3 ? '✅ Encontrado (no debería)' : '❌ No encontrado (correcto)'}`);

console.log('\n✅ Tests completados');
