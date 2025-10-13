// src/modules/auth/auth.repository.js
// Encargado de acceso a datos. No debe conocer ni bcrypt ni JWT; solo gestiona consultas de usuarios.

const Usuario = require("../usuarios/usuario.model");

const AuthRepository = {
  findByEmail: async (email) => {
    return await Usuario.findOne({ email: email.toLowerCase() });
  },
};

module.exports = AuthRepository;
