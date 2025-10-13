// src/modules/auth/auth.controller.js
const AuthService = require("./auth.service");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (err) {
    console.error("Login error:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};
