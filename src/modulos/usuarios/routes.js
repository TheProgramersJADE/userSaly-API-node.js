const express = require('express')
const bcrypt = require('bcrypt');
const routes = express.Router()
const { verifyToken } = require('../../../middlewares/auth');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro';

//para visualizar todos los registros de la tabla de users------------
 routes.get('/', (req, res)=>{
  req.getConnection((err, conn)=>{
       if(err)  return res.send(err)
       
        conn.query('SELECT id, username, email, role_id FROM users', (err, rows) => {
          if (err) return res.status(500).json({ error: 'Error al obtener los usuarios' });

            res.json(rows)
        })
     })
  })

// Insertar usuario con contraseña encriptada --------------------------------
routes.post('/', async (req, res) => {
  const { username, email, password, role_id } = req.body;

  try {
    // 1) Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2) Crear el objeto del nuevo usuario
    const newUser = {
      username,
      email,
      password: hashedPassword, // 👈 aquí guardamos el hash, no el texto plano
      role_id: role_id || null
    };

    // 3) Guardar en la base de datos
    req.getConnection((err, conn) => {
      if (err) return res.send(err);

      conn.query('INSERT INTO users SET ?', [newUser], (err, rows) => {
        if (err) return res.send(err);

        res.json({
          mensaje: 'Usuario agregado con éxito 🚀',
          id: rows.insertId
        });
      });
    });
  } catch (error) {
    res.status(500).send('Error al encriptar la contraseña');
  }
});


 // Eliminar un registro de la tabla de users----------------------------------
 routes.delete('/:id', (req, res)=>{
  req.getConnection((err, conn)=>{
       if(err)  return res.send(err)
       
        conn.query('DELETE FROM users WHERE id = ?', [req.params.id], (err, rows)=>{
          if(err)  return res.send(err)

            res.send('Registro eliminado con exito!')
        })
     })
  })

  //Actualizar un registro.----------------------------------------------------
  routes.put('/:id', async (req, res) => {
    const { username, email, password, role_id } = req.body;
  
    try {
      // Creamos un objeto solo con los campos que siempre queremos actualizar
      let updatedUser = { username, email, role_id };
  
      // Si el password viene en el body, lo encriptamos y lo agregamos
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
//Obtener un solo usuario por ID.----------------------------------------------------------------
  routes.get('/:id', verifyToken, (req, res) => {
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
  

// Ruta login
routes.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

  req.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: 'Error de conexión a la BD' });

    // Verificar si el usuario existe
    conn.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en la consulta' });
      if (results.length === 0) return res.status(401).json({ error: 'Usuario no encontrado' });

      const user = results[0];

      try {

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Contraseña incorrecta' });

        // Generar token
        const token = jwt.sign(
          { id: user.id, username: user.username, role_id: user.role_id },
          JWT_SECRET,
          { expiresIn: '8h' }
        );

        res.json({
          mensaje: 'Inicio de sesión exitoso ',
          username: user.username,
          token
        });
      } catch (err) {
        return res.status(500).json({ error: 'Error al verificar contraseña' });
      }
    });
  });
});
//----------------------------------------------------------------------
module.exports = routes