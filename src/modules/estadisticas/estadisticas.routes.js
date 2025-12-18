// src/modules/estadisticas/estadisticas.routes.js
// Define los endpoints y enlaza con el controlador.

const express = require("express");
const router = express.Router();
const controller = require("./estadisticas.controller");
const authMiddleware = require("../../core/middlewares/auth.middleware");
const {verificarRol} = require("../../core/middlewares/roles.middleware");
const {validarPeriodo} = require("./estadisticas.validations");

// Validar token para todas las rutas de estadísticas
router.use(authMiddleware.verifyToken);

// GET api/estadisticas/libros/categoria-porcentaje
// Obtener metricas de categoria
router.get("/categorias", verificarRol("admin", "consultor"), controller.getMetricasCategoria);

// GET api/estadisticas/metricas
router.get("/metricas", verificarRol("admin", "consultor"), validarPeriodo, controller.getMetricas);

// GET api/estadisticas/tendencias
router.get("/tendencias", verificarRol("admin", "consultor"), validarPeriodo, controller.getTendencias);

// GET api/estadisticas/libros/top?orden=
// Obtener libros más/menos prestados
router.get("/libros/top", verificarRol("admin", "consultor"), controller.getLibrosPorOrden);

// GET api/estadisticas/libro
// Obtener estadísticas de un libro específico
router.get("/libro", verificarRol("admin", "consultor"), controller.getEstadisticasLibro);

module.exports = router;    


