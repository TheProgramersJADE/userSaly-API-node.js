const express = require('express')
const bcrypt = require('bcrypt');
const routes = express.Router()

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
//----------------------------------------------------------------------
module.exports = routes