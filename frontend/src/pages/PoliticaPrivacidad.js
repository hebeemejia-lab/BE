import React from 'react';
import './PoliticaPrivacidad.css';

const PoliticaPrivacidad = () => (
  <div className="policy-page">
    <header className="policy-hero">
      <div className="policy-hero-content">
        <span className="policy-kicker">Banco Exclusivo</span>
        <h1>Política de Privacidad y Términos de Uso</h1>
        <p>
          Tu información y tus transacciones están protegidas con estándares bancarios.
          Aquí explicamos cómo recopilamos, usamos y protegemos tus datos personales,
          así como los términos que rigen el uso de nuestra plataforma.
        </p>
      </div>
      <div className="policy-hero-accent"></div>
    </header>

    {/* ====== PRIVACIDAD ====== */}
    <div className="policy-chapter-title">Política de Privacidad</div>

    <section className="policy-section">
      <h2>1. Información que Recopilamos</h2>
      <ul>
        <li><strong>Datos de registro:</strong> nombre, apellido, correo electrónico, cédula/documento de identidad, teléfono y dirección.</li>
        <li><strong>Datos financieros:</strong> historial de transacciones, saldos, recargas, retiros y préstamos dentro de la plataforma.</li>
        <li><strong>Datos de uso:</strong> dirección IP, dispositivo, navegador, páginas visitadas y tiempo de sesión.</li>
        <li><strong>Datos de pago:</strong> al procesar pagos a través de PayPal, Rapyd u otros proveedores, esos servicios manejan sus propias políticas. Nosotros no almacenamos números de tarjeta ni CVV.</li>
        <li><strong>Datos de verificación:</strong> token de verificación de email para validar la autenticidad de tu cuenta.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>2. Uso de la Información</h2>
      <ul>
        <li>Operar y mantener tu cuenta activa dentro de la plataforma.</li>
        <li>Procesar transacciones, recargas, retiros, transferencias y préstamos.</li>
        <li>Enviarte notificaciones por correo electrónico sobre actividades en tu cuenta.</li>
        <li>Prevenir fraudes y actividades no autorizadas.</li>
        <li>Cumplir con obligaciones legales o requerimientos de autoridades competentes.</li>
        <li>Mejorar los servicios mediante análisis de uso anónimo y agregado.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>3. Seguridad de los Datos</h2>
      <ul>
        <li>Toda la comunicación entre tu dispositivo y nuestros servidores usa cifrado <strong>TLS 1.2/1.3 (HTTPS)</strong>.</li>
        <li>Las contraseñas se almacenan únicamente en forma de hash bcrypt; nunca en texto plano.</li>
        <li>La autenticación utiliza <strong>JWT (JSON Web Tokens)</strong> con tiempo de expiración limitado.</li>
        <li>Cumplimos con los lineamientos <strong>PCI DSS</strong> para el procesamiento de pagos con tarjeta.</li>
        <li>No almacenamos CVV, números completos de tarjeta ni credenciales bancarias directas.</li>
        <li>Los servidores están alojados en <strong>Render.com</strong> con bases de datos PostgreSQL en entornos aislados.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>4. Proveedores de Pago y Terceros</h2>
      <ul>
        <li><strong>PayPal:</strong> utilizado para recargas de saldo. Los pagos son procesados directamente por PayPal bajo sus propias políticas de privacidad (<a href="https://www.paypal.com/us/legalhub/privacy-full" target="_blank" rel="noopener noreferrer">ver política PayPal</a>).</li>
        <li><strong>Rapyd:</strong> proveedor de pagos internacionales. Aplican sus propios términos y políticas.</li>
        <li><strong>Google (reCAPTCHA / Sign-In):</strong> usamos reCAPTCHA para prevenir bots y Google Sign-In como opción de autenticación (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">política de Google</a>).</li>
        <li><strong>SendGrid / SMTP:</strong> servicios de entrega de correos electrónicos transaccionales.</li>
        <li>Ninguno de estos proveedores recibe tus datos para uso publicitario.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>5. Trading e Inversiones</h2>
      <ul>
        <li>La plataforma de trading usa datos de mercado en tiempo real proporcionados por <strong>Alpaca Markets</strong> y otras fuentes públicas.</li>
        <li>Las operaciones de compra/venta de activos se ejecutan con cargo directo a tu saldo dentro de la plataforma.</li>
        <li><strong>Riesgo:</strong> el trading implica riesgo de pérdida. Banco Exclusivo no garantiza rendimientos ni se hace responsable por pérdidas derivadas de operaciones de mercado.</li>
        <li>El historial de operaciones es almacenado en nuestra base de datos y accesible desde tu perfil.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>6. Comisiones y Transacciones</h2>
      <ul>
        <li>Pueden aplicarse comisiones en recargas, retiros o transferencias según la tarifa vigente.</li>
        <li>El monto de la comisión y el neto a acreditar se muestran siempre antes de confirmar cualquier operación.</li>
        <li>Las comisiones pueden variar según el método de pago o el tipo de transacción.</li>
        <li>Los préstamos tienen una tasa de interés anual del <strong>5%</strong> por defecto, salvo acuerdo diferente con el administrador.</li>
      </ul>
    </section>

    <section id="cookies" className="policy-section">
      <h2>7. Cookies y Tecnologías Similares</h2>
      <ul>
        <li>Usamos <strong>localStorage</strong> y <strong>sessionStorage</strong> del navegador para guardar tu sesión (token JWT) y preferencias de moneda e idioma.</li>
        <li>No usamos cookies de rastreo publicitario.</li>
        <li>reCAPTCHA de Google puede depositar cookies propias de Google en tu navegador para funcionar correctamente.</li>
        <li>Puedes limpiar tu almacenamiento local en cualquier momento desde la configuración de tu navegador.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>8. Sesión y Acceso</h2>
      <ul>
        <li>Las sesiones expiran automáticamente por seguridad. Cuando el token caduca se requiere nuevo inicio de sesión.</li>
        <li>Recomendamos usar contraseñas fuertes (≡ 8 caracteres, combinando mayúsculas, números y símbolos).</li>
        <li>No compartas tus credenciales con nadie. Banco Exclusivo nunca te solicitará tu contraseña por correo o chat.</li>
        <li>Si detectas actividad sospechosa, contacta inmediatamente a soporte@bancoexclusivo.com.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>9. Derechos del Usuario</h2>
      <ul>
        <li><strong>Acceso:</strong> puedes consultar todos tus datos, historial y movimientos desde tu perfil.</li>
        <li><strong>Rectificación:</strong> puedes actualizar tus datos personales desde la sección de Perfil.</li>
        <li><strong>Eliminación:</strong> puedes solicitar la eliminación de tu cuenta y datos personales escribiendo a soporte@bancoexclusivo.com.</li>
        <li><strong>Portabilidad:</strong> puedes solicitar un reporte de tus datos en formato estándar.</li>
        <li><strong>Revocación:</strong> puedes retirar tu consentimiento en cualquier momento; esto puede implicar la desactivación de tu cuenta.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>10. Retención de Datos</h2>
      <ul>
        <li>Los datos de cuenta activa se retienen mientras la cuenta esté vigente.</li>
        <li>Al eliminar la cuenta, los datos personales identificables se suprimen en un plazo máximo de <strong>30 días</strong>.</li>
        <li>Registros de transacciones pueden retenerse hasta <strong>5 años</strong> por cumplimiento normativo.</li>
      </ul>
    </section>

    {/* ====== TÉRMINOS ====== */}
    <div id="terminos" className="policy-chapter-title">Términos de Uso</div>

    <section className="policy-section">
      <h2>11. Elegibilidad</h2>
      <ul>
        <li>Debes tener al menos <strong>18 años</strong> para registrarte y usar los servicios.</li>
        <li>Debes proporcionar información veraz y actualizada durante el registro.</li>
        <li>Una persona puede mantener una única cuenta activa.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>12. Uso Aceptable</h2>
      <ul>
        <li>Está prohibido usar la plataforma para lavado de dinero, financiamiento del terrorismo o actividades ilegales.</li>
        <li>No está permitido intentar acceder a cuentas ajenas, explotar vulnerabilidades o realizar ataques técnicos.</li>
        <li>El abuso del sistema de soporte, carga masiva artificial u otras conductas de mala fe pueden resultar en suspensión de la cuenta.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>13. Limitación de Responsabilidad</h2>
      <ul>
        <li>Banco Exclusivo no es un banco regulado por entidades gubernamentales. Los servicios son digitales con propósitos de gestión financiera personal.</li>
        <li>No somos responsables por pérdidas derivadas de operaciones de trading, fluctuaciones de mercado o decisiones de inversión del usuario.</li>
        <li>No garantizamos disponibilidad ininterrumpida del servicio. Se realizan mantenimientos periódicos con previo aviso.</li>
        <li>Fallas en proveedores externos (PayPal, Rapyd, etc.) están fuera de nuestro control directo.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>14. Modificaciones</h2>
      <ul>
        <li>Banco Exclusivo puede actualizar estas políticas en cualquier momento.</li>
        <li>Los cambios importantes serán notificados por correo electrónico y/o mediante aviso en la plataforma.</li>
        <li>Continuar usando la plataforma después de la notificación implica aceptación de las nuevas políticas.</li>
      </ul>
    </section>

    <section id="pagos" className="policy-section">
      <h2>15. Política de Pagos y Reembolsos</h2>
      <ul>
        <li>Las recargas exitosas se acreditan de forma inmediata o en un plazo máximo de <strong>24 horas hábiles</strong>.</li>
        <li>Los retiros se procesan en un plazo de <strong>1 a 3 días hábiles</strong> según el método.</li>
        <li>Los reembolsos por errores técnicos comprobados se procesan en un plazo máximo de <strong>5 días hábiles</strong>.</li>
        <li>Transacciones fraudulentas o iniciadas bajo suplantación de identidad no son reembolsables una vez procesadas.</li>
      </ul>
    </section>

    <section className="policy-section">
      <h2>16. Contacto y Soporte</h2>
      <ul>
        <li>Soporte general: <a href="mailto:soporte@bancoexclusivo.com">soporte@bancoexclusivo.com</a></li>
        <li>Administración: <a href="mailto:admin@bancoexclusivo.lat">admin@bancoexclusivo.lat</a></li>
        <li>Horario de atención: lunes a viernes, 9:00 – 18:00 (hora del Este, ET).</li>
        <li>Para solicitudes de eliminación de datos o ejercicio de derechos GDPR/CCPA, escribe al correo de soporte con asunto: <em>"Solicitud de datos – [tu email]"</em>.</li>
      </ul>
    </section>

    <footer className="policy-footer">
      <span>Versión 2.0 &mdash; Última actualización: <strong>20 de marzo de 2026</strong></span>
      <br />
      <span style={{ fontSize: '11px', opacity: 0.7 }}>
        Al usar Banco Exclusivo aceptas estas políticas en su totalidad.
      </span>
    </footer>
  </div>
);

export default PoliticaPrivacidad;
