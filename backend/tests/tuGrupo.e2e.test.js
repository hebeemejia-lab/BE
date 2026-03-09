const request = require('supertest');
const app = require('../src/app'); // Asegúrate de exportar tu app Express
const fixtures = require('./fixtures/fixtures.json');
const { CirculoAhorro, CirculoMiembro, Aporte } = require('../src/models');

// Helper para obtener token de autenticación (ajusta según tu lógica de login)
async function loginYObtenToken(email, password) {
  const res = await request(app)
    .post('/auth/login')
    .send({ email, password });
  return res.body.token;
}

describe('Flujo completo Tu grupo (E2E)', () => {
  let tokenAna, tokenLuis, grupoId;

  beforeAll(async () => {
    tokenAna = await loginYObtenToken('ana@test.com', 'test1234');
    tokenLuis = await loginYObtenToken('luis@test.com', 'test1234');
  });

  test('Crear grupo con datos de fixtures', async () => {
    const grupo = {
      nombre: 'Test E2E',
      montoAporte: 150,
      frecuencia: 'semanal',
      miembrosMax: 3
    };
    const res = await request(app)
      .post('/groups')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send(grupo);
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    grupoId = res.body.id;
  });

  test('Unirse al grupo con otro usuario', async () => {
    const res = await request(app)
      .post(`/groups/${grupoId}/join`)
      .set('Authorization', `Bearer ${tokenLuis}`)
      .send();
    expect(res.status).toBe(200);
    // Verifica que Luis ahora es miembro
    const miembro = await CirculoMiembro.findOne({ where: { usuarioId: 2, circuloAhorroId: grupoId } });
    expect(miembro).not.toBeNull();
  });

  test('Registrar aporte y verificar backend', async () => {
    const res = await request(app)
      .post(`/groups/${grupoId}/contribute`)
      .set('Authorization', `Bearer ${tokenLuis}`)
      .send({ monto: 150 });
    expect(res.status).toBe(200);
    // Verifica que el aporte se registró
    const aporte = await Aporte.findOne({ where: { usuarioId: 2, circuloAhorroId: grupoId, monto: 150 } });
    expect(aporte).not.toBeNull();
  });

  test('Consultar estado del grupo y validar turnos/aportes', async () => {
    const res = await request(app)
      .get(`/groups/${grupoId}/status`)
      .set('Authorization', `Bearer ${tokenAna}`);
    expect(res.status).toBe(200);
    expect(res.body.miembros.length).toBeGreaterThanOrEqual(2);
    expect(res.body.aportes.some(a => a.usuarioId === 2 && a.monto === 150)).toBe(true);
    // Puedes agregar más validaciones según la lógica de turnos
  });
});
