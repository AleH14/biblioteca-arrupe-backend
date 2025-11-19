const express = require("express");
const router = express.Router();
const controller = require("./prestamo.controller");
const { verifyToken } = require("../../core/middlewares/auth.middleware");
const { 
  validarCreacionPrestamo, 
  validarCreacionPrestamoConBusqueda,
  validarCierrePrestamo, 
  validarEstado, 
  validarId 
} = require("./prestamo.validations");

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Rutas específicas primero (para evitar conflictos con parámetros)

// GET /api/prestamos/buscar?nombre=NombreAlumno
// Buscar préstamos por nombre de alumno
router.get("/buscar", controller.buscarPorNombreAlumno);

// GET /api/prestamos/buscar-libros?nombre=NombreLibro
// Buscar libros disponibles para préstamo
router.get("/buscar-libros", controller.buscarLibrosParaPrestamo);

// GET /api/prestamos/buscar-usuarios?nombre=NombreUsuario
// Buscar usuarios para préstamo
router.get("/buscar-usuarios", controller.buscarUsuariosParaPrestamo);

// GET /api/prestamos/resumen
// Obtener resumen de préstamos
router.get("/resumen", controller.obtenerResumen);

// GET /api/prestamos/estado/:estado
// Obtener préstamos por clasificación: todos, activos, atrasados, cerrados
router.get("/estado/:estado", validarEstado, controller.obtenerPorEstado);

// PUT /api/prestamos/:id/cerrar
// Cambiar estado del préstamo a cerrado/finalizado
router.put("/:id/cerrar", validarCierrePrestamo, controller.cerrarPrestamo);

// GET /api/prestamos/:id
// Obtener detalles de un préstamo específico
router.get("/:id", validarId, controller.obtenerDetalles);

// Rutas generales al final

// GET /api/prestamos
// Obtener todos los préstamos
router.get("/", controller.obtenerTodos);

// POST /api/prestamos
// Crear nuevo préstamo (método original con IDs)
router.post("/", validarCreacionPrestamo, controller.crearPrestamo);

// POST /api/prestamos/crear
// Crear préstamo con búsqueda amigable
router.post("/crear", validarCreacionPrestamoConBusqueda, controller.crearPrestamoConBusqueda);

//POST /api/prestamos/renovar/:id
// Renovar un préstamo existente
router.post("/renovar/:id", validarId, controller.renovarPrestamo); 

module.exports = router;