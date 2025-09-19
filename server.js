const express = require('express');
const mysql = require('mysql2');
const myconn = require('express-myconnection');
const routes = require('./src/modulos/usuarios/routes')
const path = require('path');
const app = express();
const port = parseInt(process.env.PORT) || process.argv[3] || 8080;

const dbOptions = {
  host: 'mysql-10406947-emilyflores-7171.b.aivencloud.com',
  port: '11292',
  user: 'avnadmin',
  password: 'tu contrasenna',
  database: 'UsuariosSaly'
}

// middlewares ---------------------------------------------------
app.use(myconn(mysql, dbOptions, 'single'))
app.use(express.json())

app.use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs');
  
  // Rutas -------------------------------------------------------
  app.get('/', (req, res) => {
    res.send('API DE USERSALY!');
  });

  app.use('/usuarioslist', routes )

// Prueba par aver si la conneccion a la base funciona--------------------------
  app.get('/test-db', (req, res) => {
    req.getConnection((err, conn) => {
      if (err) return res.status(500).send('Error de conexión a la base de datos');
      conn.query('SELECT 1 + 1 AS resultado', (err, rows) => {
        if (err) return res.status(500).send('Error en la consulta SQL');
        res.send(`Resultado de prueba: ${rows[0].resultado}`);
      });
    });
  });
  // Hasta aqui ----------------------------------------------------------------


  //Server running ----------------------------------------------
app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
})