// Base de conocimiento del Bot FAQ - BE
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
- Banco: Banco Ejemplo
- Cuenta: XXXX-XXXX-XXXX-1234
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
    respuesta: `📊 **Comisiones de BE:**

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
    respuesta: `🔒 **Seguridad en BE:**

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
Contáctanos inmediatamente: ${process.env.ADMIN_EMAIL || 'bancoexclusivo@bancoexclusivo.lat'}`,
    categoria: 'seguridad'
  },

  // CUENTA
  {
    id: 8,
    keywords: ['crear cuenta', 'registro', 'registrarse', 'sign up', 'nueva cuenta'],
    pregunta: '¿Cómo creo una cuenta?',
    respuesta: `📝 **Registro en BE:**

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
- Contacta a soporte: ${process.env.ADMIN_EMAIL || 'bancoexclusivo@bancoexclusivo.lat'}`,
    categoria: 'cuenta'
  },

  // SOPORTE
  {
    id: 10,
    keywords: ['ayuda', 'soporte', 'contacto', 'problema', 'help', 'support'],
    pregunta: '¿Cómo contacto a soporte?',
    respuesta: `📞 **Canales de soporte:**

📧 **Email:** ${process.env.ADMIN_EMAIL || 'bancoexclusivo@bancoexclusivo.lat'}
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
    pregunta: '¿Qué es BE?',
    respuesta: `🏦 **BE** es una plataforma bancaria digital que te permite:

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

🚨 **Emergencias:** Escríbenos a ${process.env.ADMIN_EMAIL || 'bancoexclusivo@bancoexclusivo.lat'} en cualquier momento.`,
    categoria: 'informacion'
  },

  // INVERSIONES
  {
    id: 13,
    keywords: ['inversion', 'invertir', 'fondo riesgo', 'crecimiento', 'rendimiento', 'ganancias'],
    pregunta: '¿Cómo puedo invertir en BE?',
    respuesta: `💰 **Inversiones en BE:**

BE te permite invertir en nuestro **Fondo de Riesgo** supervisado por administradores:

1. Ve a "Mi Inversión" en tu dashboard
2. Contacta al administrador para asignar una inversión
3. Especifica el monto y plazo deseado
4. El administrador registra tu inversión
5. Monitorea el crecimiento en tiempo real

✅ **Ventajas:**
- Rendimientos competitivos (variables según mercado)
- Acceso 24/7 a tu portafolio
- Transparencia completa
- Retiros flexibles

📊 **Monitoreo:**
- Gráficas de crecimiento (diario, mensual, anual)
- Historial detallado de transacciones
- Proyecciones de ganancia

⚠️ **Nota:** Las inversiones tienen riesgo. Consulta con el administrador antes de invertir.`,
    categoria: 'inversiones'
  },
  {
    id: 14,
    keywords: ['rendimiento', 'ganancia', 'interes', 'crecimiento inversion', 'porciento'],
    pregunta: '¿Cuál es el rendimiento esperado de mis inversiones?',
    respuesta: `📈 **Rendimiento de Inversiones:**

El rendimiento del **Fondo de Riesgo** varía según:

🎯 **Factores:**
- Plazo de inversión (corto, mediano, largo plazo)
- Condiciones del mercado
- Composición del portafolio
- Tipo de objetivo (conservador, moderado, agresivo)

💹 **Rangos típicos:**
- Corto plazo (3-6 meses): 2-5% anualizado
- Mediano plazo (6-12 meses): 5-10% anualizado
- Largo plazo (1+ años): 8-15% anualizado

**Nota:** Rendimientos pasados no garantizan resultados futuros.

📞 **Consulta personalizada:**
Contacta a nuestro equipo para una recomendación ajustada a tu perfil: ${process.env.ADMIN_EMAIL || 'bancoexclusivo@bancoexclusivo.lat'}`,
    categoria: 'inversiones'
  },
  {
    id: 15,
    keywords: ['retirar inversion', 'sacar dinero inversion', 'liquidar', 'cerrar inversion'],
    pregunta: '¿Puedo retirar mi inversión antes de tiempo?',
    respuesta: `🏦 **Retiro de Inversión:**

✅ **Sí, es posible:**
- Las inversiones son flexibles y pueden retirarse en cualquier momento
- No hay penalización por retiro anticipado
- El dinero se acredita en tu saldo en 24-48 horas

📋 **Proceso:**
1. Ve a "Mi Inversión"
2. Selecciona la inversión a liquidar
3. Haz clic en "Retirar fondos"
4. Confirma la operación
5. El dinero se acredita en tu cuenta

⚠️ **Consideraciones:**
- Perderás los intereses generados después del retiro
- Es recomendable mantener la inversión el menor tiempo posible para maximizar ganancias
- Consulta con el administrador si tienes dudas

💡 **Tip:** Revisa el análisis de tu inversión antes de retirar para tomar la mejor decisión.`,
    categoria: 'inversiones'
  },

  // GASTOS PERSONALES
  {
    id: 16,
    keywords: ['gastos', 'gasto personal', 'presupuesto', 'categorias gasto', 'tracking'],
    pregunta: '¿Cómo uso la Gestión de Gastos Personales?',
    respuesta: `💸 **Gestión de Gastos Personales:**

Siguiente herramienta te ayuda a controlar y categorizar tus gastos:

📊 **Características:**
1. Registra ingresos y gastos
2. Categoriza por tipo (comida, transporte, servicios, etc.)
3. Visualiza gráficas de gastos (línea, barras, pastel)
4. Establece presupuestos máximos por categoría
5. Recibe alertas si excedes tu presupuesto

🎯 **Categorías disponibles:**
- Comida 🍔
- Transporte 🚗
- Servicios 💡
- Salud 🏥
- Entretenimiento 🎬
- Educación 📚
- Otros 📦

📈 **Reportes:**
- Resumen mensual por categoría
- Comparativa mes a mes
- Sugerencias de ahorro
- Análisis de patrones de gasto

⏱️ **Acceso:** Ve a "Gestión de Gastos" en tu dashboard.`,
    categoria: 'gastos'
  },
  {
    id: 17,
    keywords: ['presupuesto', 'limite gasto', 'alerta presupuesto'),
    pregunta: '¿Cómo establecer un presupuesto?',
    respuesta: `🎯 **Establecer Presupuestos:**

Controla tus gastos definiendo límites máximos:

1️⃣ **Crear presupuesto:**
- Ve a "Gestión de Gastos"
- Haz clic en "Nuevo Presupuesto"
- Selecciona categoría (ej: Comida, Transporte)
- Define el límite mensual (ej: $300)
- Confirma

2️⃣ **Monitoreo:**
- Visualiza el progreso en barras
- Banda verde: Dentro del presupuesto
- Banda roja: Has excedido el límite

3️⃣ **Alertas:**
- 🔔 Notificación al 80% del presupuesto
- ⚠️ Aviso cuando exceeds el límite
- 📊 Reporte semanal de progreso

💡 **Tips:**
- Establece presupuestos realistas
- Revisa regularmente tus gastos
- Ajusta según tus necesidades
- Usa los reportes para planificar

**Nota:** Los presupuestos son por categoría y se reinician cada mes.`,
    categoria: 'gastos'
  },

  // MI CARTERA
  {
    id: 18,
    keywords: ['cartera', 'saldo', 'balance', 'disponible', 'efectivo'],
    pregunta: '¿Qué es Mi Cartera?',
    respuesta: `👛 **Mi Cartera:**

Tu cartera es el resumen completo de tu situación financiera en BE:

📊 **Incluye:**
- **Saldo disponible:** Dinero que puedes usar ahora
- **Inversiones:** Fondos invertidos en el fondo de riesgo
- **Préstamos activos:** Montos pendientes de pagar
- **Historial:** Todas tus transacciones

💰 **Información mostrada:**
- Saldo total en cuenta
- Dinero invertido
- Ganancias acumuladas
- Pagos pendientes
- Transacciones recientes

🔐 **Seguridad:**
- Solo tú puedes ver tu cartera
- Acceso 24/7 desde tu dashboard
- Historial completo y auditado

📱 **Acceso:**
Todos los datos están disponibles en tu dashboard principal al iniciar sesión.`,
    categoria: 'cartera'
  },
  {
    id: 19,
    keywords: ['transferencia bancaria', 'vincular cuenta', 'cuenta bancaria', 'banco'],
    pregunta: '¿Cómo vinculo mi cuenta bancaria?',
    respuesta: `🏦 **Vincular Cuenta Bancaria:**

Para hacer retiros es necesario vincular tu cuenta bancaria:

📋 **Datos necesarios:**
- Nombre del titular
- Número de cuenta (IBAN o cuenta local)
- Código SWIFT (si es internacional)
- Banco (seleccionar de lista)
- País

🔐 **Proceso de verificación:**
1. Ingresa los datos de tu cuenta
2. BE realiza micro-depósitos (pequeñas cantidades)
3. Confirma los montos en tu banco
4. Tu cuenta es verificada
5. ¡Listo para realizar retiros!

⏱️ **Tiempo de verificación:**
Normalmente 24-48 horas

🚨 **Importante:**
- Solo podrás retirar a cuentas verificadas
- Puedes vincular múltiples cuentas
- Usa como cuenta principal la que uses frecuentemente

💡 **Tip:** Verifica que los datos sean exactos para evitar rechazos.`,
    categoria: 'cartera'
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
