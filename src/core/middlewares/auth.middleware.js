// src/modules/auth/auth.middleware.js
// Middleware para proteger rutas, verificando JWT.

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyToken = (req, res, next) => {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ message: "Token no proporcionado" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token inválido o expirado" });

    req.user = decoded;
    next();
  });
};
