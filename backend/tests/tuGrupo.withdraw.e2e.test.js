const request = require('supertest');
const app = require('../src/app');
const fixtures = require('./fixtures/fixtures.json');
const { CirculoAhorro, CirculoMiembro, Retiro } = require('../src/models');

async function loginYObtenToken(email, password) {
  const res = await request(app)
    .post('/auth/login')
    .send({ email, password });
  return res.body.token;
}

describe('Retiro de fondos en turno (E2E)', () => {
  let tokenAna, tokenLuis, grupoId;

  beforeAll(async () => {
    tokenAna = await loginYObtenToken('ana@test.com', 'test1234');
    tokenLuis = await loginYObtenToken('luis@test.com', 'test1234');
    // Usar grupo de fixtures donde Ana es miembro
    grupoId = fixtures.grupos[0].id;
  });

  test('Usuario en turno puede retirar fondos', async () => {
    // Simula que Ana está en turno (ajusta según tu lógica de turnos)
    const res = await request(app)
      .post(`/groups/${grupoId}/withdraw`)
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({ monto: 200 });
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toMatch(/retiro/i);
    // Verifica que el retiro se registró
    const retiro = await Retiro.findOne({ where: { usuarioId: 1, circuloAhorroId: grupoId, monto: 200 } });
    expect(retiro).not.toBeNull();
  });

  test('GET /groups/:id/status refleja el retiro', async () => {
    const res = await request(app)
      .get(`/groups/${grupoId}/status`)
      .set('Authorization', `Bearer ${tokenLuis}`);
    expect(res.status).toBe(200);
    // El historial debe incluir el retiro de Ana
    expect(res.body.retiros.some(r => r.usuarioId === 1 && r.monto === 200)).toBe(true);
    // Los aportes pendientes deben seguir correctos
    expect(Array.isArray(res.body.aportes)).toBe(true);
  });

  test('Usuario fuera de turno no puede retirar', async () => {
    // Simula que Luis no está en turno
    const res = await request(app)
      .post(`/groups/${grupoId}/withdraw`)
      .set('Authorization', `Bearer ${tokenLuis}`)
      .send({ monto: 200 });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/no es tu turno/i);
  });
});
