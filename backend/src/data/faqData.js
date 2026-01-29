// Base de conocimiento del Bot FAQ - Banco Exclusivo
// Respuestas automáticas sin necesidad de APIs

const faqData = [
  // RECARGAS
  {
    id: 1,
    keywords: ['recargar', 'recarga', 'depositar', 'dinero', 'agregar saldo', 'cargar'],
    pregunta: '¿Cómo puedo recargar dinero a mi cuenta?',
    respuesta: `Para recargar saldo a tu cuenta tienes varias opciones:

📱 **Recargas en línea:**
- Tarjeta de crédito/débito (Rapyd, Stripe, 2Checkout)
- PayPal y otros medios digitales

🏦 **Depósito bancario:**
- Banco: ${process.env.BANCO_NOMBRE || 'Banco Barenvas'}
- Cuenta: ${process.env.BANCO_CUENTA || '9608141071'}
- Después del depósito, envía el comprobante para aprobar tu recarga

Las recargas se acreditan inmediatamente (pagos en línea) o en 24-48 horas (depósitos bancarios).`,
    categoria: 'recargas'
  },
  {
    id: 2,
    keywords: ['tiempo recarga', 'demora', 'cuando llega', 'cuanto tarda'],
    pregunta: '¿Cuánto tiempo tarda una recarga?',
    respuesta: `El tiempo de acreditación depende del método:

⚡ **Inmediato:**
- Recargas con tarjeta (Rapyd/Stripe/2Checkout)
- Transferencias digitales

🕐 **24-48 horas:**
- Depósitos bancarios (requiere verificación manual)
- Transferencias internacionales

Recibirás una notificación cuando el saldo esté disponible.`,
    categoria: 'recargas'
  },

  // TRANSFERENCIAS
  {
    id: 3,
    keywords: ['transferir', 'enviar dinero', 'transferencia', 'envio', 'mandar'],
    pregunta: '¿Cómo puedo transferir dinero?',
    respuesta: `Puedes realizar dos tipos de transferencias:

💸 **Transferencias Internas** (entre usuarios del banco):
1. Ve a "Transferencias"
2. Ingresa el correo del destinatario
3. Especifica el monto
4. Confirma - ¡Es instantáneo!

🌍 **Transferencias Internacionales**:
1. Ve a "Transferencias Internacionales"
2. Completa los datos del beneficiario
3. Selecciona país y divisa
4. Confirma el envío

**Importante:** Las transferencias internas no tienen comisión, las internacionales tienen una comisión según el país destino.`,
    categoria: 'transferencias'
  },
  {
    id: 4,
    keywords: ['comision', 'costo', 'tarifa', 'cobro', 'precio'],
    pregunta: '¿Cuáles son las comisiones?',
    respuesta: `📊 **Comisiones de Banco Exclusivo:**

✅ **GRATIS:**
- Transferencias entre usuarios del banco
- Consultas de saldo
- Retiros a cuenta propia

💰 **Con comisión:**
- Transferencias internacionales: 2-5% según país
- Recargas con tarjeta: 3% del monto
- Retiros a terceros: 1.5%

**Nota:** Los métodos de pago pueden aplicar sus propias comisiones adicionales.`,
    categoria: 'tarifas'
  },

  // RETIROS
  {
    id: 5,
    keywords: ['retirar', 'retiro', 'sacar dinero', 'extraer', 'withdrawal'],
    pregunta: '¿Cómo puedo retirar mi dinero?',
    respuesta: `Para retirar fondos de tu cuenta:

🏦 **Retiro a cuenta bancaria:**
1. Ve a "Retiros"
2. Ingresa los datos de tu cuenta bancaria
3. Especifica el monto (mínimo $10)
4. Confirma la operación

⏱️ **Tiempo de procesamiento:**
- 1-3 días hábiles para cuentas nacionales
- 3-5 días para cuentas internacionales

💡 **Límites:**
- Mínimo: $10 USD
- Máximo: $10,000 USD por día
- Debes tener saldo suficiente + comisión`,
    categoria: 'retiros'
  },

  // PRÉSTAMOS
  {
    id: 6,
    keywords: ['prestamo', 'credito', 'pedir prestado', 'loan', 'financiamiento'],
    pregunta: '¿Cómo solicitar un préstamo?',
    respuesta: `🏦 **Solicitud de Préstamo:**

1. Ve a la sección "Préstamos"
2. Selecciona el monto que necesitas
3. Elige el plazo de pago (3, 6 o 12 meses)
4. Revisa la tasa de interés
5. Acepta los términos y condiciones

📋 **Requisitos:**
- Cuenta activa con al menos 30 días
- Historial de transacciones positivo
- No tener préstamos vencidos

✅ **Aprobación:**
- Respuesta en 24-48 horas
- El dinero se acredita en tu cuenta una vez aprobado`,
    categoria: 'prestamos'
  },

  // SEGURIDAD
  {
    id: 7,
    keywords: ['seguro', 'seguridad', 'proteccion', 'hack', 'robo', 'fraude'],
    pregunta: '¿Mi dinero está seguro?',
    respuesta: `🔒 **Seguridad en Banco Exclusivo:**

✅ **Protección de cuenta:**
- Encriptación de datos SSL/TLS
- Autenticación JWT segura
- Contraseñas hasheadas (bcrypt)

✅ **Protección de fondos:**
- Base de datos PostgreSQL con backups diarios
- Servidor en Render (infraestructura segura)
- Monitoreo 24/7

✅ **Buenas prácticas:**
- No compartas tu contraseña
- Cierra sesión en dispositivos compartidos
- Revisa tu historial regularmente

🚨 **¿Actividad sospechosa?**
Contáctanos inmediatamente: ${process.env.ADMIN_EMAIL || 'soporte@bancoexclusivo.lat'}`,
    categoria: 'seguridad'
  },

  // CUENTA
  {
    id: 8,
    keywords: ['crear cuenta', 'registro', 'registrarse', 'sign up', 'nueva cuenta'],
    pregunta: '¿Cómo creo una cuenta?',
    respuesta: `📝 **Registro en Banco Exclusivo:**

1. Haz clic en "Registrarse"
2. Completa el formulario:
   - Nombre completo
   - Correo electrónico
   - Contraseña segura (mín. 8 caracteres)
3. Acepta los términos y condiciones
4. Verifica tu correo electrónico
5. ¡Listo! Ya puedes iniciar sesión

✅ **Inmediatamente recibes:**
- Cuenta bancaria virtual
- Número de cuenta único
- $0 de saldo inicial (recarga cuando quieras)

🎁 **Bono de bienvenida:** Primer recarga con 5% extra (consulta términos)`,
    categoria: 'cuenta'
  },
  {
    id: 9,
    keywords: ['olvide contraseña', 'recuperar', 'reset password', 'cambiar clave'],
    pregunta: '¿Olvidé mi contraseña, qué hago?',
    respuesta: `🔑 **Recuperar contraseña:**

1. En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?"
2. Ingresa tu correo electrónico registrado
3. Revisa tu bandeja de entrada (y spam)
4. Haz clic en el enlace de recuperación
5. Crea una nueva contraseña segura

⏱️ **El enlace expira en 1 hora**

❌ **¿No recibiste el correo?**
- Verifica que usaste el correo correcto
- Revisa la carpeta de spam
- Contacta a soporte: ${process.env.ADMIN_EMAIL || 'soporte@bancoexclusivo.lat'}`,
    categoria: 'cuenta'
  },

  // SOPORTE
  {
    id: 10,
    keywords: ['ayuda', 'soporte', 'contacto', 'problema', 'help', 'support'],
    pregunta: '¿Cómo contacto a soporte?',
    respuesta: `📞 **Canales de soporte:**

📧 **Email:** ${process.env.ADMIN_EMAIL || 'soporte@bancoexclusivo.lat'}
⏰ **Horario:** Lunes a Viernes, 9:00 AM - 6:00 PM

💬 **Chat en vivo:** Estoy aquí para ayudarte con preguntas frecuentes

📱 **Redes sociales:**
- Twitter: @BancoExclusivo
- Facebook: Banco Exclusivo

🕐 **Tiempo de respuesta:**
- Chat/FAQ: Inmediato
- Email: 24-48 horas
- Problemas urgentes: Prioridad alta

**Tip:** Este bot puede resolver la mayoría de tus dudas al instante. ¡Pregúntame!`,
    categoria: 'soporte'
  },

  // INFORMACIÓN GENERAL
  {
    id: 11,
    keywords: ['que es', 'banco', 'quienes son', 'about', 'informacion'],
    pregunta: '¿Qué es Banco Exclusivo?',
    respuesta: `🏦 **Banco Exclusivo** es una plataforma bancaria digital que te permite:

✅ **Gestionar tu dinero:**
- Recargas instantáneas
- Transferencias nacionales e internacionales
- Retiros a tu cuenta bancaria

✅ **Servicios financieros:**
- Préstamos personales
- Tarjetas virtuales
- Pagos de servicios

✅ **Ventajas:**
- 100% en línea, sin sucursales
- Tarifas competitivas
- Atención 24/7
- Tecnología segura

**Misión:** Democratizar el acceso a servicios financieros de calidad para todos.`,
    categoria: 'informacion'
  },
  {
    id: 12,
    keywords: ['horario', 'cuando', 'disponible', 'abierto'],
    pregunta: '¿Cuál es el horario de atención?',
    respuesta: `⏰ **Disponibilidad:**

🌐 **Plataforma web:** 24/7
- Puedes acceder a tu cuenta en cualquier momento
- Recargas y transferencias disponibles siempre

👥 **Soporte humano:**
- Lunes a Viernes: 9:00 AM - 6:00 PM
- Sábados: 10:00 AM - 2:00 PM
- Domingos: Cerrado

🤖 **Este chatbot:** 24/7
- Siempre disponible para responder tus preguntas frecuentes

🚨 **Emergencias:** Escríbenos a ${process.env.ADMIN_EMAIL || 'soporte@bancoexclusivo.lat'} en cualquier momento.`,
    categoria: 'informacion'
  }
];

// Función para buscar respuestas según palabras clave
function buscarRespuesta(query) {
  if (!query) return null;
  
  const queryLower = query.toLowerCase().trim();
  
  // Búsqueda exacta por keywords
  const resultadoExacto = faqData.find(faq => 
    faq.keywords.some(keyword => queryLower.includes(keyword))
  );
  
  if (resultadoExacto) return resultadoExacto;
  
  // Búsqueda por similitud en pregunta
  const resultadoSimilar = faqData.find(faq => 
    faq.pregunta.toLowerCase().includes(queryLower) ||
    queryLower.includes(faq.pregunta.toLowerCase().split(' ').slice(0, 3).join(' '))
  );
  
  return resultadoSimilar;
}

// Obtener preguntas frecuentes por categoría
function obtenerPorCategoria(categoria) {
  return faqData.filter(faq => faq.categoria === categoria);
}

// Obtener todas las categorías
function obtenerCategorias() {
  const categorias = [...new Set(faqData.map(faq => faq.categoria))];
  return categorias.map(cat => ({
    id: cat,
    nombre: cat.charAt(0).toUpperCase() + cat.slice(1),
    cantidad: faqData.filter(faq => faq.categoria === cat).length
  }));
}

// Obtener preguntas populares (las primeras 5)
function obtenerPopulares() {
  return faqData.slice(0, 5);
}

module.exports = {
  faqData,
  buscarRespuesta,
  obtenerPorCategoria,
  obtenerCategorias,
  obtenerPopulares
};
