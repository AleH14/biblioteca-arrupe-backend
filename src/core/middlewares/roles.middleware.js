// roles.middleware.js
exports.verificarRol = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ message: "No tienes permisos para acceder" });
    }

    next();
  };
};
