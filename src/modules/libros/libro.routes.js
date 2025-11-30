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

router.get("/categorias", verificarRol("admin", "profesor", "estudiante"), controller.getAllCategorias);
router.get("/categorias/:id", verificarRol("admin", "profesor", "estudiante"), controller.getCategoriaById);
router.post("/categorias", verificarRol("admin", "profesor"), controller.createCategoria);
router.put("/categorias/:id", verificarRol("admin", "profesor"), controller.updateCategoria);
router.delete("/categorias/:id", verificarRol("admin", "profesor"), controller.deleteCategoria);

// Rutas para libros

router.get("/", verificarRol("admin", "profesor", "estudiante"), controller.getLibros);
router.get("/:id", verificarRol("admin", "profesor", "estudiante"), controller.getLibroById);
router.post("/", verificarRol("admin", "profesor"), controller.createLibro);
router.put("/:id", verificarRol("admin", "profesor"), controller.updateLibro);
router.delete("/:id", verificarRol("admin", "profesor"), controller.deleteLibro);

// Rutas para gestión de ejemplares

router.post("/:libroId/ejemplares", verificarRol("admin", "profesor"), controller.addEjemplar);
router.delete("/:libroId/ejemplares/:ejemplarId", verificarRol("admin", "profesor"), controller.removeEjemplar);


module.exports = router;    