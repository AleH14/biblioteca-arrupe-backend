// src/modules/auth/index.js
// Expone las interfaces públicas del módulo auth.

const routes = require("./auth.routes");
const { verifyToken } = require("./auth.middleware");

module.exports = {
  routes,
  verifyToken,
};
