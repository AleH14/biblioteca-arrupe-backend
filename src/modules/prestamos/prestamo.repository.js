const Prestamo = require("./prestamo.model");

class PrestamoRepository {
  
  // Buscar préstamos por nombre de usuario con información completa
  async buscarPorNombreUsuario(nombre) {
    const regex = new RegExp(nombre, 'i'); // búsqueda case-insensitive
    
    return await Prestamo.find()
      .populate({
        path: 'usuarioId',
        match: { nombre: regex },
        select: 'nombre email telefono rol'
      })
      .populate({
        path: 'ejemplarId',
        select: 'titulo autor isbn estado ejemplares'
      })
      .exec()
      .then(prestamos => prestamos.filter(prestamo => prestamo.usuarioId !== null));
  }

  // Obtener préstamos por estado con clasificación de atrasados
  async obtenerPorEstado(estado) {
    let query = {};
    const fechaActual = new Date();

    switch (estado) {
      case 'activos':
        query = { estado: 'activo' };
        break;
      case 'atrasados':
        query = { 
          estado: 'activo',
          fechaDevolucionEstimada: { $lt: fechaActual }
        };
        break;
      case 'cerrados':
        query = { estado: 'cerrado' };
        break;
      case 'todos':
      default:
        query = {};
        break;
    }

    return await Prestamo.find(query)
      .populate({
        path: 'usuarioId',
        select: 'nombre email telefono rol'
      })
      .populate({
        path: 'ejemplarId',
        select: 'titulo autor isbn estado ejemplares'
      })
      .sort({ fechaPrestamo: -1 });
  }

  // Obtener préstamo por ID con detalles completos
  async obtenerPorId(id) {
    return await Prestamo.findById(id)
      .populate({
        path: 'usuarioId',
        select: 'nombre email telefono rol'
      })
      .populate({
        path: 'ejemplarId',
        select: 'titulo autor isbn editorial fechaPublicacion categoria ejemplares'
      });
  }

  // Cambiar estado del préstamo a cerrado
  async finalizarPrestamo(id, fechaDevolucionReal = new Date()) {
    return await Prestamo.findByIdAndUpdate(
      id,
      { 
        estado: 'cerrado',
        fechaDevolucionReal: fechaDevolucionReal
      },
      { new: true }
    );
  }

  // Crear nuevo préstamo
  async crear(datosPrestation) {
    const prestamo = new Prestamo(datosPrestation);
    return await prestamo.save();
  }

  // Obtener todos los préstamos con paginación
  async obtenerTodos(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const prestamos = await Prestamo.find()
      .populate({
        path: 'usuarioId',
        select: 'nombre email telefono rol'
      })
      .populate({
        path: 'ejemplarId',
        select: 'titulo autor isbn estado ejemplares'
      })
      .sort({ fechaPrestamo: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Prestamo.countDocuments();

    return {
      prestamos,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  // Verificar si existe un préstamo activo para un ejemplar específico
  async existePrestamoActivo(ejemplarId) {
    return await Prestamo.findOne({
      ejemplarId: ejemplarId,
      estado: 'activo'
    });
  }

  // Obtener préstamos activos de un usuario
  async obtenerPrestamosActivosUsuario(usuarioId) {
    return await Prestamo.find({
      usuarioId: usuarioId,
      estado: 'activo'
    })
    .populate({
      path: 'ejemplarId',
      select: 'titulo autor isbn'
    })
    .sort({ fechaPrestamo: -1 });
  }

  // Obtener préstamos próximos a vencer (para notificaciones)
  async obtenerProximosAVencer(diasAnticipacion = 3) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAnticipacion);
    
    return await Prestamo.find({
      estado: 'activo',
      fechaDevolucionEstimada: { $lte: fechaLimite }
    })
    .populate({
      path: 'usuarioId',
      select: 'nombre email'
    })
    .populate({
      path: 'ejemplarId',
      select: 'titulo autor'
    });
  }

  //Renovar préstamo
  async renovarPrestamo(id, nuevaFechaDevolucionEstimada) {
    return await Prestamo.findByIdAndUpdate(
      id,
      { 
        fechaDevolucionEstimada: nuevaFechaDevolucionEstimada
      },
      { new: true }
    );
  }
}

module.exports = new PrestamoRepository();