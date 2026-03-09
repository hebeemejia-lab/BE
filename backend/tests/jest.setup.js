// jest.setup.js para cargar y limpiar fixtures en tests con Sequelize
const { sequelize } = require('../src/config/database');
const { Usuario, CirculoAhorro, CirculoMiembro, Aporte, Retiro } = require('../src/models');
const fixtures = require('./fixtures/fixtures.json');

// Helper para limpiar todas las tablas relevantes
async function limpiarTablas() {
  await Retiro.destroy({ where: {}, truncate: true, force: true });
  await Aporte.destroy({ where: {}, truncate: true, force: true });
  await CirculoMiembro.destroy({ where: {}, truncate: true, force: true });
  await CirculoAhorro.destroy({ where: {}, truncate: true, force: true });
  await Usuario.destroy({ where: {}, truncate: true, force: true });
}

// Helper para cargar los datos de fixtures
async function cargarFixtures() {
  await Usuario.bulkCreate(fixtures.usuarios);
  await CirculoAhorro.bulkCreate(fixtures.grupos);
  // Relacionar miembros
  for (const grupo of fixtures.grupos) {
    for (const userId of grupo.miembros) {
      await CirculoMiembro.create({ usuarioId: userId, circuloAhorroId: grupo.id });
    }
  }
  await Aporte.bulkCreate(fixtures.aportes);
  await Retiro.bulkCreate(fixtures.retiros);
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await limpiarTablas();
  await cargarFixtures();
});

afterAll(async () => {
  await limpiarTablas();
  await sequelize.close();
});
