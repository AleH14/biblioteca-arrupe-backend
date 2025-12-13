// src/routes/auth.js
// Define los endpoints y enlaza con el controlador.

const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");
const {verifyToken} = require("../../core/middlewares/auth.middleware");


router.post("/login", controller.login);

router.post("/refreshToken", controller.refreshToken);

router.post("/logout", verifyToken, controller.logout);

module.exports = router;
