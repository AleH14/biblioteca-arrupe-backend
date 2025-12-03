// backend/src/core/utils/hash.js
// Utilidades para hashing de contraseñas.

const bcrypt = require('bcrypt');

async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('La contraseña debe ser una cadena de texto válida');
  }
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hashed) {
  if (!password || typeof password !== 'string' || !hashed || typeof hashed !== 'string') {
    throw new Error('La contraseña y el hash deben ser cadenas de texto válidas');
  }
}

module.exports = { hashPassword, comparePassword };