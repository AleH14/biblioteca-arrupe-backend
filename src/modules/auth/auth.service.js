// src/modules/auth/auth.service.js
// Contiene la lógica de negocio del login: validaciones, comparación de contraseñas y generación del token.
// No maneja req ni res — solo datos y errores.

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AuthRepository = require("./auth.repository");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

if (!JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set. Set in environment for production.");
}

const AuthService = {
  async login(email, password) {
    if (!email || !password) {
      const error = new Error("Email y password son requeridos");
      error.status = 400;
      throw error;
    }

    const usuario = await AuthRepository.findByEmail(email);
    if (!usuario) {
      const error = new Error("Credenciales inválidas");
      error.status = 401;
      throw error;
    }

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      const error = new Error("Credenciales inválidas");
      error.status = 401;
      throw error;
    }

    if (!JWT_SECRET) {
      const error = new Error("JWT_SECRET no está configurado en el entorno del servidor");
      error.status = 500;
      throw error;
    }

    const payload = {
      sub: usuario._id.toString(),
      email: usuario.email,
      rol: usuario.rol,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
      token,
      user: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    };
  },
};

module.exports = AuthService;
