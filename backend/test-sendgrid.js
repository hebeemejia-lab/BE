// Script de prueba para verificar configuración de SendGrid
require('dotenv').config();
const axios = require('axios');

async function testSendGrid() {
  console.log('🔍 PRUEBA DE SENDGRID\n');
  
  // Verificar configuración
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  const fromEmail = process.env.SENDGRID_FROM?.trim();
  
  console.log('📋 Configuración:');
  console.log(`   API Key: ${apiKey ? `${apiKey.substring(0, 10)}...` : '❌ NO CONFIGURADA'}`);
  console.log(`   API Key Length: ${apiKey?.length || 0} caracteres`);
  console.log(`   From Email: ${fromEmail || '❌ NO CONFIGURADO'}`);
  console.log();
  
  if (!apiKey) {
    console.error('❌ ERROR: SENDGRID_API_KEY no está configurada en .env');
    process.exit(1);
  }
  
  if (!fromEmail) {
    console.error('❌ ERROR: SENDGRID_FROM no está configurado en .env');
    process.exit(1);
  }
  
  // Intentar enviar email de prueba
  console.log('📤 Enviando email de prueba...\n');
  
  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: 'test@example.com' }],
            subject: 'Prueba de SendGrid - Banco Exclusivo',
          },
        ],
        from: {
          email: fromEmail,
          name: 'Banco Exclusivo',
        },
        content: [
          {
            type: 'text/html',
            value: '<h1>Email de prueba</h1><p>Si recibes esto, SendGrid está funcionando correctamente.</p>',
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ ÉXITO: Email enviado correctamente');
    console.log(`   Status: ${response.status}`);
    console.log(`   Message ID: ${response.headers['x-message-id']}`);
    console.log('\n✨ SendGrid está funcionando correctamente!\n');
    
  } catch (error) {
    console.error('❌ ERROR al enviar email:\n');
    
    if (error.response) {
      console.error(`   Status Code: ${error.response.status}`);
      console.error(`   Error:`, JSON.stringify(error.response.data, null, 2));
      
      // Diagnosticar errores comunes
      if (error.response.status === 401) {
        console.error('\n⚠️  DIAGNÓSTICO: API Key inválida o expirada');
        console.error('   Solución: Genera una nueva API Key en https://app.sendgrid.com/settings/api_keys');
      } else if (error.response.status === 403) {
        console.error('\n⚠️  DIAGNÓSTICO: Sender no verificado');
        console.error(`   Solución: Verifica el email "${fromEmail}" en SendGrid`);
        console.error('   Ve a: https://app.sendgrid.com/settings/sender_auth/senders');
      } else if (error.response.data?.errors) {
        error.response.data.errors.forEach((err, i) => {
          console.error(`\n   Error ${i + 1}:`, err.message);
          if (err.field) console.error(`   Campo: ${err.field}`);
        });
      }
    } else {
      console.error('   Error de conexión:', error.message);
    }
    
    console.error('\n❌ SendGrid NO está funcionando correctamente\n');
    process.exit(1);
  }
}

testSendGrid();
