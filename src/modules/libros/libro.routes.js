// src/modules/libros/libro.routes.js
// Define los endpoints y enlaza con el controlador.

const express = require("express");
const router = express.Router();
const controller = require("./libro.controller");
const authMiddleware = require("../../core/middlewares/auth.middleware");
const {verificarRol} = require("../../core/middlewares/roles.middleware");

// Validar token para todas las rutas de libros
router.use(authMiddleware.verifyToken);

// Rutas para categorías

router.get("/categorias", verificarRol("admin", "consultor", "docente", "estudiante"), controller.getAllCategorias);
router.get("/categorias/:id", verificarRol("admin", "consultor", "docente", "estudiante"), controller.getCategoriaById);
router.post("/categorias", verificarRol("admin"), controller.createCategoria);
router.put("/categorias/:id", verificarRol("admin"), controller.updateCategoria);
router.delete("/categorias/:id", verificarRol("admin"), controller.deleteCategoria);

// Rutas para libros

router.get("/", verificarRol("admin", "consultor", "docente", "estudiante"), controller.getLibros);
router.get("/:id", verificarRol("admin", "consultor", "docente", "estudiante"), controller.getLibroById);
router.post("/", verificarRol("admin"), controller.createLibro);
router.put("/:id", verificarRol("admin"), controller.updateLibro);
router.delete("/:id", verificarRol("admin"), controller.deleteLibro);

// Rutas para gestión de ejemplares

router.post("/:libroId/ejemplares", verificarRol("admin"), controller.addEjemplar);
router.delete("/:libroId/ejemplares/:ejemplarId", verificarRol("admin"), controller.removeEjemplar);


module.exports = router;    