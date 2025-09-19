const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro';

// Middleware para verificar token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'No token provided' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Necesitas autorización para acceder a esta ruta' });

    req.userId = decoded.id;
    req.role_id = decoded.role_id;
    req.user = decoded; // para onlyAdmin
    next();
  });
}

// Middleware solo admin (role_id = 3)
function onlyAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No tienes acceso a esta ruta' });
  if (req.user.role_id !== 3) return res.status(403).json({ error: 'Acceso denegado: solo administradores' });
  next();
}

function onlyTrabajador(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No tienes acceso a esta ruta' });
  if (req.user.role_id !== 2) return res.status(403).json({ error: 'Acceso denegado: solo trabajadores' });
  next();
}
function onlyCliente(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'No tienes acceso a esta ruta' });
  if (req.user.role_id !== 1) return res.status(403).json({ error: 'Acceso denegado: solo cliente' });
  next();
}


// Exportar ambos middlewares correctamente
module.exports = { verifyToken, onlyAdmin, onlyTrabajador, onlyCliente };
