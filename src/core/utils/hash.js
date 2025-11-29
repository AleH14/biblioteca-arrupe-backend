// backend/src/core/utils/hash.js
// Utilidades para hashing de contraseñas.

const bcrypt = require('bcrypt');

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hashed) {
  return bcrypt.compare(password, hashed);
}

module.exports = { hashPassword, comparePassword };