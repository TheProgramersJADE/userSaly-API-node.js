const express = require('express')
const routes = express.Router()

//para visualizar todos los registros de la tabla de users------------
 routes.get('/', (req, res)=>{
  req.getConnection((err, conn)=>{
       if(err)  return res.send(err)
       
        conn.query('SELECT * FROM users', (err, rows)=>{
          if(err)  return res.send(err)

            res.json(rows)
        })
     })
  })

// Insertar datos en la tabla de users ---------------------------------------
  routes.post('/', (req, res)=>{
    req.getConnection((err, conn)=>{
         if(err)  return res.send(err)
         
          conn.query('INSERT INTO users set ?', [req.body], (err, rows)=>{
            if(err)  return res.send(err)
  
              res.json({ mensaje: 'Registro agregado con éxito', id: rows.insertId });       
               })
       })
    })

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
  //Actualizar un registro
  routes.put('/:id', (req, res)=>{
    req.getConnection((err, conn)=>{
         if(err)  return res.send(err)
         
          conn.query('UPDATE users set ? WHERE id = ?', [req.body, req.params.id], (err, rows)=>{
            if(err)  return res.send(err)
  
              res.send('Registro actualizado con exito!')
          })
       })
    })
//----------------------------------------------------------------------
module.exports = routes