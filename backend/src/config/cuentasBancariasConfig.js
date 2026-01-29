// Configuración de cuentas bancarias predeterminadas para retiros
// Estos son los datos bancarios del negocio donde se envían los retiros

const cuentasBancariasDefault = {
  // Cuenta principal para retiros en RD
  principal: {
    banco: 'BanReservas',
    tipoCuenta: 'Corriente',
    numeroCuenta: '9608141071', // Tu cuenta
    nombreTitular: 'Banco Exclusivo',
    cedula: '', // Cédula o RNC del negocio
    telefono: '',
    email: 'Hebelmejia2@gmail.com',
    iban: null,
    swift: null,
    activo: true,
    monedas: ['DOP', 'USD'],
    descripcion: 'Cuenta principal de retiros - BanReservas'
  },

  // Cuenta alternativa (opcional)
  alternativa: {
    banco: 'Banco Popular',
    tipoCuenta: 'Corriente',
    numeroCuenta: null, // Completar si existe
    nombreTitular: 'Banco Exclusivo',
    cedula: '',
    telefono: '',
    email: 'Hebelmejia2@gmail.com',
    iban: null,
    swift: null,
    activo: false,
    monedas: ['DOP'],
    descripcion: 'Cuenta secundaria (opcional)'
  }
};

module.exports = cuentasBancariasDefault;
