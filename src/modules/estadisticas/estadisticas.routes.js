// src/modules/estadisticas/estadisticas.routes.js
// Define los endpoints y enlaza con el controlador.

const express = require("express");
const router = express.Router();
const controller = require("./estadisticas.controller");
const authMiddleware = require("../../core/middlewares/auth.middleware");
const {verificarRol} = require("../../core/middlewares/roles.middleware");

// Validar token para todas las rutas de libros
router.use(authMiddleware.verifyToken);

// GET api/estadisticas/libros/categoria-porcentaje
// Obtener metricas de categoria
router.get("/categorias", verificarRol("admin", "profesor"), controller.getMetricasCategoria);

// GET api/estadisiticas/metricas
router.get("/metricas", verificarRol("admin", "profesor"), controller.getMetricas);

// GET api/estadisticas/tendencias
router.get("/tendencias", verificarRol("admin", "profesor"), controller.getTendencias);

// GET api/estadisticas/libros/top?orden=
// Obtener libros más/menos prestados
router.get("/libros/top", verificarRol("admin", "profesor"), controller.getLibrosPorOrden);

// GET api/estadisticas/libro
// Obtener estadísticas de un libro especifico
router.get("/libro", verificarRol("admin", "profesor"), controller.getEstadisticasLibro)

module.exports = router;    


