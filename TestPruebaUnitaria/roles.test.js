// TestPruebaUnitaria/roles.test.js
const request = require('supertest');
const express = require('express');

// 🔹 Mock del middleware auth
jest.mock('../middlewares/auth', () => ({
  verifyToken: (req, res, next) => next(),
  onlyAdmin: (req, res, next) => next(),
}));

// 🔹 Importa el router después de los mocks
const rolesRoutes = require('../src/modulos/usuarios/routes');

describe('GET /roles', () => {
  let app;

  beforeEach(() => {
    app = express();

    // Middleware de conexión mockeada
    app.use((req, res, next) => {
      req.getConnection = (callback) => {
        const mockConn = {
          query: (sql, cb) => cb(null, [
            { id: 1, name: 'Admin' },
            { id: 2, name: 'User' },
          ])
        };
        callback(null, mockConn);
      };
      next();
    });

    app.use('/', rolesRoutes);
  });

  it('✅ debería devolver una lista de roles', async () => {
    const res = await request(app).get('/roles');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
    ]);
  });

  it('❌ debería manejar error de conexión a la BD', async () => {
    app = express();
    app.use((req, res, next) => {
      req.getConnection = (callback) => callback(new Error('Falla de conexión'));
      next();
    });
    app.use('/', rolesRoutes);

    const res = await request(app).get('/roles');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Error de conexión a la BD' });
  });

  it('❌ debería manejar error en la consulta SQL', async () => {
    app = express();
    app.use((req, res, next) => {
      req.getConnection = (callback) => {
        const mockConn = { query: (sql, cb) => cb(new Error('Error SQL')) };
        callback(null, mockConn);
      };
      next();
    });
    app.use('/', rolesRoutes);

    const res = await request(app).get('/roles');
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Error en la consulta SQL' });
  });
});
