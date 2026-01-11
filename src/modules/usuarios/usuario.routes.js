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
router.post("/crear-usuario", verificarRol("Administrativo"), validarCreacionUsuario, controller.crearUsuario);


// Obtener perfil del usuario autenticado
router.get("/perfil", verificarRol("Administrativo", "Colaborador", "Bibliotecario", "Estudiante", "Profesor"), controller.obtenerPerfilAutenticado);

// Actualizar perfil del usuario autenticado
router.put("/perfil", verificarRol("Administrativo", "Colaborador", "Bibliotecario", "Estudiante", "Profesor"), validarEdicionUsuario, controller.editarPerfilAutenticado);

// Buscar usuarios por nombre o email
router.get("/", verificarRol("Administrativo"), controller.buscarUsuarios);

// Ver detalles de un usuario por ID
router.get("/:id", verificarRol("Administrativo"), controller.obtenerUsuarioById);

// Actualizar usuario por ID
router.put("/:id", verificarRol("Administrativo"), validarEdicionUsuario, controller.editarUsuario);

// Deshabilitar usuario por ID
router.delete("/:id", verificarRol("Administrativo"), controller.deshabilitarUsuario);

module.exports = router;