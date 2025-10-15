// src/routes/auth.js
// Define los endpoints y enlaza con el controlador.

const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");

router.post("/login", controller.login);

module.exports = router;
