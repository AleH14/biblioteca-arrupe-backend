// src/modules/libros/libro.routes.js
// Define los endpoints y enlaza con el controlador.

const express = require("express");
const router = express.Router();
const controller = require("./libro.controller");
const authMiddleware = require("../../core/middlewares/auth.middleware");

// Validar token para todas las rutas de libros
router.use(authMiddleware.verifyToken);

// Rutas para categorías

router.get("/categorias", controller.getAllCategorias);
router.get("/categorias/:id", controller.getCategoriaById);
router.post("/categorias", controller.createCategoria);
router.put("/categorias/:id", controller.updateCategoria);
router.delete("/categorias/:id", controller.deleteCategoria);

// Rutas para libros

router.get("/", controller.getLibros);
router.get("/:id", controller.getLibroById);
router.post("/", controller.createLibro);
router.put("/:id", controller.updateLibro);
router.delete("/:id", controller.deleteLibro);

// Rutas para gestión de ejemplares

router.post("/:libroId/ejemplares", controller.addEjemplar);
router.delete("/:libroId/ejemplares/:ejemplarId", controller.removeEjemplar);


module.exports = router;    