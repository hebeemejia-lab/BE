const CirculoAhorro = require('../models/CirculoAhorro');
const CirculoMiembro = require('../models/CirculoMiembro');
const User = require('../models/User');

exports.crearCirculo = async (req, res) => {
  try {
    const { nombre, descripcion, montoAporte, miembrosMax } = req.body;
    const circulo = await CirculoAhorro.create({ nombre, descripcion, montoAporte, miembrosMax });
    await CirculoMiembro.create({ userId: req.usuario.id, circuloId: circulo.id, rol: 'admin', turno: 1 });
    res.json({ exito: true, circulo });
  } catch (err) {
    res.status(500).json({ exito: false, mensaje: err.message });
  }
};

exports.unirseCirculo = async (req, res) => {
  try {
    const circulo = await CirculoAhorro.findByPk(req.params.id);
    if (!circulo) return res.status(404).json({ exito: false, mensaje: 'Círculo no encontrado' });
    const miembros = await CirculoMiembro.count({ where: { circuloId: circulo.id } });
    if (miembros >= circulo.miembrosMax) return res.status(400).json({ exito: false, mensaje: 'Círculo lleno' });
    const yaMiembro = await CirculoMiembro.findOne({ where: { userId: req.usuario.id, circuloId: circulo.id } });
    if (yaMiembro) return res.status(400).json({ exito: false, mensaje: 'Ya eres miembro' });
    await CirculoMiembro.create({ userId: req.usuario.id, circuloId: circulo.id });
    res.json({ exito: true });
  } catch (err) {
    res.status(500).json({ exito: false, mensaje: err.message });
  }
};

exports.aportarACirculo = async (req, res) => {
  try {
    const { monto } = req.body;
    const miembro = await CirculoMiembro.findOne({ where: { userId: req.usuario.id, circuloId: req.params.id } });
    if (!miembro) return res.status(403).json({ exito: false, mensaje: 'No eres miembro' });
    miembro.aportado = Number(miembro.aportado) + Number(monto);
    await miembro.save();
    res.json({ exito: true, aportado: miembro.aportado });
  } catch (err) {
    res.status(500).json({ exito: false, mensaje: err.message });
  }
};

exports.retirarDeCirculo = async (req, res) => {
  try {
    const miembro = await CirculoMiembro.findOne({ where: { userId: req.usuario.id, circuloId: req.params.id } });
    if (!miembro) return res.status(403).json({ exito: false, mensaje: 'No eres miembro' });
    // Aquí deberías validar el turno y el monto disponible
    miembro.retirado = Number(miembro.retirado) + Number(req.body.monto);
    await miembro.save();
    res.json({ exito: true, retirado: miembro.retirado });
  } catch (err) {
    res.status(500).json({ exito: false, mensaje: err.message });
  }
};

exports.estadoCirculo = async (req, res) => {
  try {
    const circulo = await CirculoAhorro.findByPk(req.params.id, {
      include: [{ model: User, through: { attributes: ['rol', 'turno', 'aportado', 'retirado'] } }]
    });
    if (!circulo) return res.status(404).json({ exito: false, mensaje: 'Círculo no encontrado' });
    res.json({ exito: true, circulo });
  } catch (err) {
    res.status(500).json({ exito: false, mensaje: err.message });
  }
};
