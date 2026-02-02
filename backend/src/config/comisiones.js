const toNumber = (value, fallback) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const RECARGA_COMISION_FIJA = toNumber(process.env.RECARGA_COMISION_FIJA, 0.99);
const RETIRO_COMISION_FIJA = toNumber(process.env.RETIRO_COMISION_FIJA, 0.99);

const calcularComisionRecarga = () => Math.max(0, RECARGA_COMISION_FIJA);
const calcularComisionRetiro = () => Math.max(0, RETIRO_COMISION_FIJA);

const calcularMontoNeto = (monto, comision) => {
  const neto = Number(monto) - Number(comision || 0);
  return Number(neto.toFixed(2));
};

module.exports = {
  RECARGA_COMISION_FIJA,
  RETIRO_COMISION_FIJA,
  calcularComisionRecarga,
  calcularComisionRetiro,
  calcularMontoNeto,
};
