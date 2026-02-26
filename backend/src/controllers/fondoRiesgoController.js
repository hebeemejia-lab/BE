const FondoRiesgo = require('../models/FondoRiesgo');
const User = require('../models/User');

// Obtener análisis de inversión por cliente
exports.getAnalysis = async (req, res) => {
  try {
    const { clientId } = req.params;
    const fondos = await FondoRiesgo.findAll({ where: { usuarioId: clientId } });
    res.json(fondos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Asignar fondo a cliente
exports.assignFund = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, porcentaje, fechaRegistro } = req.body;
    const fondo = await FondoRiesgo.create({ usuarioId: id, monto, porcentaje, fechaRegistro });
    res.status(201).json(fondo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar fondo de cliente
exports.updateFund = async (req, res) => {
  try {
    const { id } = req.params;
    const { porcentaje, fechaGanancia } = req.body;
    const fondo = await FondoRiesgo.findOne({ where: { usuarioId: id } });
    if (!fondo) return res.status(404).json({ mensaje: 'Fondo no encontrado' });
    fondo.porcentaje = porcentaje || fondo.porcentaje;
    fondo.fechaGanancia = fechaGanancia || fondo.fechaGanancia;
    await fondo.save();
    res.json(fondo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Retirar inversión del cliente
exports.deleteFund = async (req, res) => {
  try {
    const { id } = req.params;
    const fondo = await FondoRiesgo.findOne({ where: { usuarioId: id } });
    if (!fondo) return res.status(404).json({ mensaje: 'Fondo no encontrado' });
    await fondo.destroy();
    res.json({ mensaje: 'Inversión retirada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
