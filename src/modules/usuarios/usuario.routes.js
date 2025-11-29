const express = require("express");
const router = express.Router();
const controller = require("./usuario.controller");
const { verifyToken } = require("../../core/middlewares/auth.middleware");
const { validarCreacionUsuario, validarEdicionUsuario } = require("./usuario.validations");

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Crear usuario
router.post("/crear-usuario", validarCreacionUsuario, controller.crearUsuario);

// Buscar usuarios por nombre o email
router.get("/", controller.buscarUsuarios);

// Ver detalles de un usuario por ID
router.get("/:id", controller.obtenerUsuarioById);

// Actualizar usuario por ID
router.put("/:id", validarEdicionUsuario, controller.editarUsuario);

// Deshabilitar usuario por ID
router.delete("/:id", controller.deshabilitarUsuario);

module.exports = router;