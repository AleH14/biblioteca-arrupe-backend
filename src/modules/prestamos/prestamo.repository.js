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
        path: 'libroId',
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
        path: 'libroId',
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
        path: 'libroId',
        select: 'titulo autor isbn editorial ejemplares'
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
        path: 'libroId',
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
      path: 'libroId',
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
      path: 'libroId',
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

//Reservas



// Crear reserva
  async crearReserva(prestamoId, datosReserva) {
    const prestamoActualizado = await Prestamo.findByIdAndUpdate(
    prestamoId,
    { 
      estado: 'reserva',
      reserva: datosReserva
    },
    { new: true }
  );

  // Retornar SOLO el objeto reserva
  return prestamoActualizado?.reserva || null;
}

// Cancelar reserva
  async cancelarReserva(id) {
    return await Prestamo.findByIdAndUpdate(
      id,
      { 
        estado: 'cancelado',
        reserva: null
      },
      { new: true }
    );
  }

  async cambiarEstadoPrestamo(id, nuevoEstado) {
    return await Prestamo.findByIdAndUpdate(
      id,
      { estado: nuevoEstado },
      { new: true }
    );
  }

  // Transformar reserva en préstamo activo
  async transformarReservaAPrestamo(id, nuevaFechaDevolucionEstimada) {
    return await Prestamo.findByIdAndUpdate(
      id,
      { 
        estado: 'activo',
        fechaDevolucionEstimada: nuevaFechaDevolucionEstimada
      },
      { new: true }
    );
  }

  // Obtener todas las reservas
  async obtenerTodasLasReservas() {
    return await Prestamo.find({
      reserva: { $ne: null }     //validación
    })
    .populate({
    path: 'usuarioId',
    select: 'nombre email telefono rol'
  })
  .populate({
    path: 'libroId',
    select: 'titulo autor isbn ejemplares'
  });
};


// Obtener reservas de un usuario específico
async obtenerReservasPorUsuario(usuarioId) {
  return await Prestamo.find({
    usuarioId: usuarioId,
    estado: 'reserva',
    reserva: { $ne: null }     //validación
  })
  .populate({
    path: 'usuarioId',
    select: 'nombre email telefono rol'
  })
  .populate({
    path: 'libroId',
    select: 'titulo autor isbn editorial ejemplares'
  });
};

  
  // Obtener detalles de una reserva específica
  async obtenerDetallesReserva(id) {
    return await Prestamo.findById(id).populate({
        path: 'usuarioId',
        select: 'nombre email telefono rol'
      })
      .populate({
        path: 'libroId',
        select: 'titulo autor isbn editorial ejemplares'
      });
  };  


  //obtener reservas vigentes
  async obtenerReservasVigentes() {
    const fechaActual = new Date();
    return await Prestamo.find({
      estado: 'reserva',
      reserva: { $ne: null },     //validación
      'reserva.fechaExpiracion': { $gt: fechaActual }
    }).populate({
        path: 'usuarioId',
        select: 'nombre email telefono rol'
      })
      .populate({
        path: 'libroId',
        select: 'titulo autor isbn editorial ejemplares'
      });
  };

  //obtener reservas expiradas
  async obtenerReservasExpiradas() {
    const fechaActual = new Date();
    return await Prestamo.find({
      estado: 'reserva',
      reserva: { $ne: null },
      'reserva.fechaExpiracion': { $lte: fechaActual }
    }).populate({
        path: 'usuarioId',
        select: 'nombre email telefono rol'
      })
      .populate({
        path: 'libroId',
        select: 'titulo autor isbn editorial ejemplares'
      });
  };

}

module.exports = new PrestamoRepository();