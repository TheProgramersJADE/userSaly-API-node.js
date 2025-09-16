const express = require('express');
const bcrypt = require('bcrypt');
const routes = express.Router();
const { verifyToken, onlyAdmin } = require('../../../middlewares/auth');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro';

// Registrar un usuario
routes.post('/', async (req, res) => {
  const { username, email, password, role_id } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      username,
      email,
      password: hashedPassword,
      role_id: role_id || null
    };

    req.getConnection((err, conn) => {
      if (err) return res.send(err);

      conn.query('INSERT INTO users SET ?', [newUser], (err, rows) => {
        if (err) return res.send(err);

        res.json({
          mensaje: 'Usuario agregado con éxito',
          id: rows.insertId
        });
      });
    });
  } catch (error) {
    res.status(500).send('Error al encriptar la contraseña');
  }
});

// Login
routes.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

  req.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: 'Error de conexión a la BD' });

    conn.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en la consulta' });
      if (results.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

      const user = results[0];

      try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign(
          { id: user.id, username: user.username, role_id: user.role_id },
          JWT_SECRET,
          { expiresIn: '8h' }
        );

        res.json({
          mensaje: 'Inicio de sesión exitoso',
          username: user.username,
          token
        });
      } catch (err) {
        return res.status(500).json({ error: 'Error al verificar contraseña' });
      }
    });
  });
});

// ----------------------------
// RUTAS PROTEGIDAS (ADMIN)
// ----------------------------

// Obtener todos los usuarios
routes.get('/', verifyToken, onlyAdmin, (req, res) => {
  req.getConnection((err, conn) => {
    if (err) return res.send(err);

    conn.query('SELECT id, username, email, role_id FROM users', (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al obtener los usuarios' });

      res.json(rows);
    });
  });
});

// Obtener todos los roles
routes.get('/roles', verifyToken, onlyAdmin, (req, res) => {
  req.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: 'Error de conexión a la BD' });

    conn.query('SELECT id, name FROM roles', (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en la consulta SQL' });
      res.json(results);
    });
  });
});

// Filtro de búsqueda por email y rol
routes.get('/buscar', verifyToken, onlyAdmin, (req, res) => {
  const { email, role_id } = req.query;

  req.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: 'Error de conexión a la BD' });

    let sql = `
      SELECT u.id, u.username, u.email, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `;
    const params = [];
    const where = [];

    if (email) {
      where.push('u.email LIKE ?');
      params.push(`%${email}%`);
    }

    if (role_id) {
      where.push('r.id = ?');
      params.push(role_id);
    }

    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }

    conn.query(sql, params, (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en la consulta SQL' });
      res.json(results);
    });
  });
});

// Obtener un usuario por ID
routes.get('/:id', verifyToken, onlyAdmin, (req, res) => {
  const { id } = req.params;

  req.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: 'Error de conexión a la base de datos' });

    conn.query('SELECT id, username, email, role_id FROM users WHERE id = ?', [id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en la consulta SQL' });
      if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

      res.status(200).json(results[0]);
    });
  });
});

// Actualizar usuario
routes.put('/:id', verifyToken, onlyAdmin, async (req, res) => {
  const { username, email, password, role_id } = req.body;

  try {
    let updatedUser = { username, email, role_id };

    if (password) {
      updatedUser.password = await bcrypt.hash(password, 10);
    }

    req.getConnection((err, conn) => {
      if (err) return res.send(err);

      conn.query(
        'UPDATE users SET ? WHERE id = ?',
        [updatedUser, req.params.id],
        (err, rows) => {
          if (err) return res.send(err);

          res.send('Usuario actualizado con éxito.');
        }
      );
    });
  } catch (error) {
    res.status(500).send('Error al actualizar usuario');
  }
});

// Eliminar usuario
routes.delete('/:id', verifyToken, onlyAdmin, (req, res) => {
  req.getConnection((err, conn) => {
    if (err) return res.send(err);

    conn.query('DELETE FROM users WHERE id = ?', [req.params.id], (err, rows) => {
      if (err) return res.send(err);

      res.send('Registro eliminado con éxito!');
    });
  });
});

module.exports = routes;
