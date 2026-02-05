const toNumber = (value, fallback) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const RECARGA_COMISION_FIJA = toNumber(process.env.RECARGA_COMISION_FIJA, 0.99);
const RETIRO_COMISION_FIJA = toNumber(process.env.RETIRO_COMISION_FIJA, 0.99);

const calcularComisionRecarga = () => Math.max(0, RECARGA_COMISION_FIJA);
const calcularComisionRetiro = () => Math.max(0, RETIRO_COMISION_FIJA);

const calcularMontoNeto = (monto, comision) => {
  const montoNum = Number(monto);
  const comisionNum = Number(comision || 0);
  
  // Validación: Monto debe ser número válido
  if (!Number.isFinite(montoNum)) {
    console.error('❌ calcularMontoNeto: Monto inválido:', monto);
    return 0;
  }
  
  // Validación: Comisión debe ser número válido
  if (!Number.isFinite(comisionNum) || comisionNum < 0) {
    console.error('❌ calcularMontoNeto: Comisión inválida:', comision);
    return 0;
  }
  
  const neto = montoNum - comisionNum;
  
  // Validación: Monto neto debe ser positivo
  if (neto <= 0) {
    console.error('⚠️  calcularMontoNeto: Monto neto inválido');
    console.error('   Monto:', montoNum, 'Comisión:', comisionNum, 'Neto:', neto);
    return 0; // Retorna 0, lo que causa problemas en PayPal
  }
  
  const resultado = Number(neto.toFixed(2));
  console.log('✅ calcularMontoNeto: Monto:', montoNum, '- Comisión:', comisionNum, '= Neto:', resultado);
  return resultado;
};

module.exports = {
  RECARGA_COMISION_FIJA,
  RETIRO_COMISION_FIJA,
  calcularComisionRecarga,
  calcularComisionRetiro,
  calcularMontoNeto,
};
