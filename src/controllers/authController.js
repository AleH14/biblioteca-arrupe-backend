// src/controllers/authController.js
const Usuario = require("../models/Usuario");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

if (!JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set. Set in environment for production.");
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email y password son requeridos" });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      // No dar pistas (no "usuario no existe")
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // comparar contraseña con bcrypt
    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // payload mínimo
    const payload = {
      sub: usuario._id.toString(),
      email: usuario.email,
      rol: usuario.rol
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Respuesta: token + información básica (sin campos sensibles)
    res.json({
      token,
      user: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
};
