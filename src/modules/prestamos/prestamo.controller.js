const PrestamoService = require("./prestamo.service");

// Buscar préstamos por nombre de alumno
exports.buscarPorNombreAlumno = async (req, res, next) => {
  try {
    const { nombre } = req.query;
    
    if (!nombre) {
      return res.status(400).json({ 
        success: false, 
        message: "El parámetro 'nombre' es requerido" 
      });
    }

    const prestamos = await PrestamoService.buscarPorNombreAlumno(nombre);
    
    res.json({
      success: true,
      data: prestamos,
      total: prestamos.length,
      mensaje: prestamos.length === 0 ? "No se encontraron préstamos para este alumno" : null
    });
  } catch (err) {
    next(err);
  }
};

// Obtener préstamos por clasificación de estado
exports.obtenerPorEstado = async (req, res, next) => {
  try {
    const { estado } = req.params;
    const prestamos = await PrestamoService.obtenerPorClasificacion(estado);
    
    res.json({
      success: true,
      data: prestamos,
      total: prestamos.length,
      estado: estado
    });
  } catch (err) {
    next(err);
  }
};

// Cambiar estado del préstamo a cerrado/finalizado
exports.cerrarPrestamo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fechaDevolucionReal } = req.body;
    
    const resultado = await PrestamoService.cerrarPrestamo(id, fechaDevolucionReal);
    
    res.json({
      success: true,
      data: resultado
    });
  } catch (err) {
    next(err);
  }
};

// Obtener detalles completos de un préstamo
exports.obtenerDetalles = async (req, res, next) => {
  try {
    const { id } = req.params;
    const prestamo = await PrestamoService.obtenerDetalles(id);
    
    res.json({
      success: true,
      data: prestamo
    });
  } catch (err) {
    next(err);
  }
};

// Buscar libros para crear préstamo
exports.buscarLibrosParaPrestamo = async (req, res, next) => {
  try {
    const { nombre } = req.query;
    
    if (!nombre) {
      return res.status(400).json({ 
        success: false, 
        message: "El parámetro 'nombre' es requerido" 
      });
    }

    const libros = await PrestamoService.buscarLibrosParaPrestamo(nombre);
    
    res.json({
      success: true,
      data: libros,
      total: libros.length,
      mensaje: libros.length === 0 ? "No se encontraron libros disponibles con ese nombre" : null
    });
  } catch (err) {
    next(err);
  }
};

// Buscar usuarios para crear préstamo
exports.buscarUsuariosParaPrestamo = async (req, res, next) => {
  try {
    const { nombre } = req.query;
    
    if (!nombre) {
      return res.status(400).json({ 
        success: false, 
        message: "El parámetro 'nombre' es requerido" 
      });
    }

    const usuarios = await PrestamoService.buscarUsuariosParaPrestamo(nombre);
    
    res.json({
      success: true,
      data: usuarios,
      total: usuarios.length,
      mensaje: usuarios.length === 0 ? "No se encontraron usuarios con ese nombre" : null
    });
  } catch (err) {
    next(err);
  }
};

// Crear préstamo con búsqueda amigable
exports.crearPrestamoConBusqueda = async (req, res, next) => {
  try {
    const prestamo = await PrestamoService.crearPrestamoConBusqueda(req.body);
    
    res.status(201).json({
      success: true,
      data: prestamo,
      message: "Préstamo creado exitosamente"
    });
  } catch (err) {
    next(err);
  }
};

// Crear nuevo préstamo
exports.crearPrestamo = async (req, res, next) => {
  try {
    const prestamo = await PrestamoService.crearPrestamo(req.body);

    res.status(201).json({
      success: true,
      data: prestamo,
      message: "Préstamo creado exitosamente"
    });
  } catch (err) {
    next(err);
  }
};

// Obtener resumen de préstamos
exports.obtenerResumen = async (req, res, next) => {
  try {
    const resumen = await PrestamoService.obtenerResumen();
    
    res.json({
      success: true,
      data: resumen
    });
  } catch (err) {
    next(err);
  }
};

// Obtener todos los préstamos (endpoint general)
exports.obtenerTodos = async (req, res, next) => {
  try {
    const prestamos = await PrestamoService.obtenerPorClasificacion('todos');
    
    res.json({
      success: true,
      data: prestamos,
      total: prestamos.length
    });
  } catch (err) {
    next(err);
  }
};

// Renovar un préstamo existente
exports.renovarPrestamo = async (req, res, next) => {
  try {
    const { id } = req.params;

    const prestamoRenovado = await PrestamoService.renovarPrestamo(id);

    res.json({
      success: true,
      data: prestamoRenovado,
      message: "Préstamo renovado exitosamente"
    });
  } catch (err) {
    next(err);
  }
};