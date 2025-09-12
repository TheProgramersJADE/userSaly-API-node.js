// middlewares/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'No token provided' });

  // Extrae el token si viene con "Bearer "
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });

    // Guardamos info del usuario para usar en las rutas protegidas
    req.userId = decoded.id;
    req.role_id = decoded.role_id;
    next();
  });
}

module.exports = { verifyToken };
