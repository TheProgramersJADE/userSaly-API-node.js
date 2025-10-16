// TestPruebaUnitaria/roles.test.js
const request = require('supertest');
const express = require('express');

//Mock del middleware auth
jest.mock('../middlewares/auth', () => ({
  verifyToken: (req, res, next) => next(),
  onlyAdmin: (req, res, next) => next(),
}));

//Se importa el router después de los mocks
const rolesRoutes = require('../src/modulos/usuarios/routes');

describe('GET /roles', () => {
  let app;

  beforeEach(() => {
    app = express();

  // Función para crear app con la conexión mockeada
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

  //TEST DE OBTENER TODOS LOS ROLES CORRECTAMENTE
  it('GET /roles - debe devolver una lista de roles correctamente', async () => {
    const res = await request(app).get('/roles');

    console.log('Response body:', res.body);
    console.log('Status code:', res.statusCode);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { id: 1, name: 'Admin' },
      { id: 2, name: 'User' },
    ]);
  });

  //TEST DE ERROR DE CONEXIÓN A LA BD
  it('GET /roles - debe manejar error de conexión a la BD', async () => {
    app = express();
    app.use((req, res, next) => {
      req.getConnection = (callback) => callback(new Error('Falla de conexión'));
      next();
    });
    app.use('/', rolesRoutes);

    const res = await request(app).get('/roles');

    console.log('Response body:', res.body);
    console.log('Status code:', res.statusCode);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Error de conexión a la BD' });
  });

//TEST DE ERROR EN LA CONSULTA SQL
it('GET /roles - debe manejar error en la consulta SQL', async () => {
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

    console.log('Response body:', res.body);
    console.log('Status code:', res.statusCode);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Error en la consulta SQL' });
  });
});
