// backend/src/modules/usuarios/usuario.routes.js
// Define los endpoints y enlaza con el controlador.

const express = require("express");
const router = express.Router();
const controller = require("./usuario.controller");
const { verifyToken } = require("../../core/middlewares/auth.middleware");
const { validarCreacionUsuario, validarEdicionUsuario } = require("./usuario.validations");
const {verificarRol} = require("../../core/middlewares/roles.middleware");

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Crear usuario
router.post("/crear-usuario", verificarRol("admin"), validarCreacionUsuario, controller.crearUsuario);


// Obtener perfil del usuario autenticado
router.get("/perfil", verificarRol("admin", "profesor", "estudiante"), controller.obtenerPerfilAutenticado);

// Actualizar perfil del usuario autenticado
router.put("/perfil", verificarRol("admin", "profesor", "estudiante"), validarEdicionUsuario, controller.editarPerfilAutenticado);

// Buscar usuarios por nombre o email
router.get("/", verificarRol("admin"), controller.buscarUsuarios);

// Ver detalles de un usuario por ID
router.get("/:id", verificarRol("admin", "profesor"), controller.obtenerUsuarioById);

// Actualizar usuario por ID
router.put("/:id", verificarRol("admin", "profesor"), validarEdicionUsuario, controller.editarUsuario);

// Deshabilitar usuario por ID
router.delete("/:id", verificarRol("admin"), controller.deshabilitarUsuario);

module.exports = router;