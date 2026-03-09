const request = require('supertest');
const app = require('../src/app');
const fixtures = require('./fixtures/fixtures.json');

async function loginYObtenToken(email, password) {
  const res = await request(app)
    .post('/auth/login')
    .send({ email, password });
  return res.body.token;
}

describe('Casos límite y errores en Tu grupo', () => {
  let tokenAna, tokenLuis, grupoId;

  beforeAll(async () => {
    tokenAna = await loginYObtenToken('ana@test.com', 'test1234');
    tokenLuis = await loginYObtenToken('luis@test.com', 'test1234');
    grupoId = fixtures.grupos[0].id;
  });

  test('No permite crear grupo con campos vacíos', async () => {
    const res = await request(app)
      .post('/groups')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({ nombre: '', montoAporte: '', frecuencia: '', miembrosMax: '' });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/requerido|inválido/i);
  });

  test('No permite aporte con monto negativo', async () => {
    const res = await request(app)
      .post(`/groups/${grupoId}/contribute`)
      .set('Authorization', `Bearer ${tokenLuis}`)
      .send({ monto: -100 });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/monto/i);
  });

  test('No permite retirar fuera de turno', async () => {
    // Simula que Luis no está en turno
    const res = await request(app)
      .post(`/groups/${grupoId}/withdraw`)
      .set('Authorization', `Bearer ${tokenLuis}`)
      .send({ monto: 100 });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/no es tu turno/i);
  });

  test('No permite aportar dos veces seguidas', async () => {
    // Primer aporte válido
    await request(app)
      .post(`/groups/${grupoId}/contribute`)
      .set('Authorization', `Bearer ${tokenLuis}`)
      .send({ monto: 100 });
    // Segundo aporte inmediato (debería fallar si la lógica lo impide)
    const res = await request(app)
      .post(`/groups/${grupoId}/contribute`)
      .set('Authorization', `Bearer ${tokenLuis}`)
      .send({ monto: 100 });
    expect([400, 409]).toContain(res.status);
    expect(res.body.mensaje).toMatch(/ya realizaste/i);
  });

  test('No permite acciones con token inválido', async () => {
    const res = await request(app)
      .post(`/groups/${grupoId}/contribute`)
      .set('Authorization', 'Bearer token_invalido')
      .send({ monto: 100 });
    expect([401, 403]).toContain(res.status);
  });

  test('No permite crear grupo con miembros insuficientes', async () => {
    const res = await request(app)
      .post('/groups')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({ nombre: 'Grupo Pequeño', montoAporte: 100, frecuencia: 'semanal', miembrosMax: 1 });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/miembros/i);
  });

  test('No permite aportar si el monto supera el saldo', async () => {
    // Simula saldo bajo (ajusta según tu lógica de usuario)
    // Aquí se asume que el backend valida el saldo
    const res = await request(app)
      .post(`/groups/${grupoId}/contribute`)
      .set('Authorization', `Bearer ${tokenLuis}`)
      .send({ monto: 999999 });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/saldo/i);
  });

  test('No permite operar con ID de grupo inexistente', async () => {
    const res = await request(app)
      .post('/groups/999999/contribute')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({ monto: 100 });
    expect(res.status).toBe(404);
    expect(res.body.mensaje).toMatch(/no existe|inexistente/i);
  });
});
