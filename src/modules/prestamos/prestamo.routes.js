// backend/src/modules/prestamos/prestamo.routes.js
// Define los endpoints y enlaza con el controlador.

const express = require("express");
const router = express.Router();
const controller = require("./prestamo.controller");
const { verifyToken } = require("../../core/middlewares/auth.middleware");
const { verificarRol } = require("../../core/middlewares/roles.middleware");
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

// =======================
// Busquedas específicas
// =======================

// GET /api/prestamos/buscar?nombre=NombreAlumno
// Buscar préstamos por nombre de alumno
router.get("/buscar", verificarRol("admin", "profesor"), controller.buscarPorNombreAlumno);

// GET /api/prestamos/buscar-libros?nombre=NombreLibro
// Buscar libros disponibles para préstamo
router.get("/buscar-libros", verificarRol("admin", "profesor", "estudiante"), controller.buscarLibrosParaPrestamo);

// GET /api/prestamos/buscar-usuarios?nombre=NombreUsuario
// Buscar usuarios para préstamo
router.get("/buscar-usuarios", verificarRol("admin", "profesor"), controller.buscarUsuariosParaPrestamo);

// =======================
// Resúmenes y listados
// =======================

// GET /api/prestamos/resumen
// Obtener resumen de préstamos
router.get("/resumen", verificarRol("admin", "profesor"), controller.obtenerResumen);

// GET /api/prestamos/mis-prestamos
// Obtener préstamos del usuario autenticado
router.get("/mis-prestamos", verificarRol("admin", "profesor", "estudiante"), controller.obtenerPrestamosDelUsuario);

// GET /api/prestamos/estado/:estado
// Obtener préstamos por clasificación: todos, activos, atrasados, cerrados
router.get("/estado/:estado", verificarRol("admin", "profesor"), validarEstado, controller.obtenerPorEstado);

// PUT /api/prestamos/:id/cerrar
// Cambiar estado del préstamo a cerrado/finalizado
router.put("/:id/cerrar", verificarRol("admin", "profesor"), validarCierrePrestamo, controller.cerrarPrestamo);

// POST /api/prestamos/crear
// Crear préstamo con búsqueda amigable
router.post("/crear", verificarRol("admin", "profesor"), validarCreacionPrestamoConBusqueda, controller.crearPrestamoConBusqueda);

// =======================
// Reservas (más específicas primero)
// =======================

//GET /api/prestamos/reservas
// Obtener todas las reservas
router.get("/reservas", verificarRol("admin", "profesor"), controller.obtenerTodasLasReservas);

// GET /api/prestamos/reservas/vigentes
// Obtener todas las reservas vigentes
router.get("/reservas/vigentes", verificarRol("admin", "profesor"), controller.obtenerReservasVigentes);

// GET /api/prestamos/reservas/expiradas
// Obtener todas las reservas expiradas
router.get("/reservas/expiradas", verificarRol("admin", "profesor"), controller.obtenerReservasExpiradas);

// GET /api/prestamos/reservas/mis-reservas/vigentes
// Obtener mis reservas vigentes
router.get("/reservas/mis-reservas/vigentes", verificarRol("admin", "profesor", "estudiante"), controller.obtenerMisReservasVigentes);

//GET /api/prestamos/reservas/mis-reservas/expiradas
// Obtener mis reservas expiradas
router.get("/reservas/mis-reservas/expiradas", verificarRol("admin", "profesor", "estudiante"), controller.obtenerMisReservasExpiradas);

// GET /api/prestamos/reservas/mis-reservas
// Obtener reservas del usuario autenticado
router.get("/reservas/mis-reservas", verificarRol("admin", "profesor", "estudiante"), controller.obtenerMisReservas);

// GET /api/prestamos/reservas/usuario/:usuarioId
// Obtener reservas de un usuario específico
router.get("/reservas/usuario/:usuarioId", verificarRol("admin", "profesor", "estudiante"), controller.obtenerReservasPorUsuario);

// GET /api/prestamos/reserva/:id
// Obtener detalles de una reserva específica
router.get("/reserva/:id", verificarRol("admin", "profesor", "estudiante"), validarId, controller.obtenerDetallesReserva);

// POST /api/prestamos/reservar-libro
// Crear una nueva reserva para un libro
router.post("/reservar-libro", verificarRol("admin", "profesor", "estudiante"), validarCreacionPrestamoConBusqueda, controller.reservarLibro);

// POST /api/prestamos/:id/activar-reserva
// Activar una reserva y convertirla en préstamo
router.post("/:id/activar-reserva", validarId, verificarRol("admin", "profesor"), controller.activarReserva);

// POST /api/prestamos/:id/cancelar-reserva
// Cancelar una reserva existente
router.post("/:id/cancelar-reserva", verificarRol("admin", "profesor", "estudiante"), validarId, controller.cancelarReserva);

//POST /api/prestamos/renovar/:id
// Renovar un préstamo existente
router.post("/renovar/:id", verificarRol("admin", "profesor"), validarId, controller.renovarPrestamo);

// =======================
// Rutas generales al final
// =======================

// GET /api/prestamos/:id
// Obtener detalles de un préstamo específico
router.get("/:id", verificarRol("admin", "profesor", "estudiante"), validarId, controller.obtenerDetalles);

// GET /api/prestamos
// Obtener todos los préstamos
router.get("/", verificarRol("admin", "profesor"), controller.obtenerTodos);

// POST /api/prestamos
// Crear nuevo préstamo (método original con IDs)
router.post("/", verificarRol("admin", "profesor"), validarCreacionPrestamo, controller.crearPrestamo);

module.exports = router;
