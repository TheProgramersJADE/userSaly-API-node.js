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

  // Obtener un solo usuario por ID --------------------------------------------------------
routes.get('/:id', (req, res) => {
  const { id } = req.params;

  req.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: 'Error de conexión a la base de datos' });

    conn.query('SELECT id, username, email, role_id FROM users WHERE id = ?', [id], (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en la consulta SQL' });

      if (results.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      res.status(200).json(results[0]); // regresa solo el usuario encontrado
    });
  });
});


  //  LOGIN ----------------------------------------------------------------------------
routes.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Validación rápida
  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos (email y password)' });
  }

  req.getConnection((err, conn) => {
    if (err) return res.status(500).json({ error: 'Error de conexión a la BD' });

    // Buscar usuario por email
    conn.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Error en la consulta' });
      if (results.length === 0) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }

      const user = results[0];

      try {
        // Comparar password con bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

// Si todo bien, devolvemos usuario (sin contraseña)
const { password: _, username } = user;

res.json({
  mensaje: 'Inicio de sesión exitoso, bienvenido 🚀',
  user: { username } // 👉 solo se devuelve username
});

      } catch (err) {
        return res.status(500).json({ error: 'Error al verificar contraseña' });
      }
    });
  });
});
//----------------------------------------------------------------------
module.exports = routes