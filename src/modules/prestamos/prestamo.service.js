const PrestamoRepository = require("./prestamo.repository");
const Libro = require("../libros/libro.model");
const Usuario = require("../usuarios/usuario.model");
const LibroRepository = require("../libros/libro.repository");
const mongoose = require("mongoose");

class PrestamoService {

  // Buscar préstamos por nombre de alumno
  async buscarPorNombreAlumno(nombre) {
    if (!nombre || nombre.trim().length === 0) {
      throw new Error("El nombre del alumno es requerido");
    }

    const prestamos = await PrestamoRepository.buscarPorNombreUsuario(nombre.trim());
    
    // Formatear la respuesta con información específica solicitada
    return prestamos.map(prestamo => {
      const esAtrasado = prestamo.estado === 'activo' && 
                        new Date() > prestamo.fechaDevolucionEstimada;
      const ejemplar = prestamo.libroId.ejemplares.id(prestamo.ejemplarId);
      
      return {
        id: prestamo._id,
        alumno: {
          nombre: prestamo.usuarioId.nombre,
          email: prestamo.usuarioId.email
        },
        libro: {
          titulo: prestamo.libroId.titulo,
          autor: prestamo.libroId.autor,
          isbn: prestamo.libroId.isbn
        },
        ejemplar: {
          id: prestamo.ejemplarId,
          cdu: ejemplar.cdu,
          ubicacionFisica: ejemplar.ubicacionFisica,
          edificio: ejemplar.edificio
        },
        fechaPrestamo: prestamo.fechaPrestamo,
        fechaVencimiento: prestamo.fechaDevolucionEstimada,
        estado: esAtrasado ? 'atrasado' : prestamo.estado,
        diasRetraso: esAtrasado ? 
          Math.floor((new Date() - prestamo.fechaDevolucionEstimada) / (1000 * 60 * 60 * 24)) : 0
      };
    });
  }


// Obtener préstamos clasificados por estado
async obtenerPorClasificacion(clasificacion) {
  const estadosValidos = ['todos', 'activos', 'atrasados', 'cerrados'];
  
  if (!estadosValidos.includes(clasificacion)) {
    throw new Error(`Clasificación inválida. Estados válidos: ${estadosValidos.join(', ')}`);
  }

  const prestamos = await PrestamoRepository.obtenerPorEstado(clasificacion);

  // Mapeo asíncrono con Promise.all
  return Promise.all(
    prestamos.map(async (prestamo) => {
      const fechaActual = new Date();
      let estadoCalculado = prestamo.estado;
      let diasRetraso = 0;

      let libro = await LibroRepository.findById(prestamo.libroId);
      if(!libro) {
        libro = await LibroRepository.findByEjemplarId(prestamo.ejemplarId);
      }
      const ejemplar = await LibroRepository.findEjemplarbyId(prestamo.ejemplarId);

      // Determinar si está atrasado
      if (prestamo.estado === 'activo' && fechaActual > prestamo.fechaDevolucionEstimada) {
        estadoCalculado = 'atrasado';
        diasRetraso = Math.floor(
          (fechaActual - prestamo.fechaDevolucionEstimada) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        id: prestamo._id,
        alumno: {
          nombre: prestamo.usuarioId.nombre,
          email: prestamo.usuarioId.email,
          telefono: prestamo.usuarioId.telefono
        },
        libro: {
          titulo: libro.titulo,
          autor: libro.autor,
          isbn: libro.isbn,
        },
        ejemplar: {
            id: prestamo.ejemplarId,
            cdu: ejemplar.cdu,
            ubicacionFisica: ejemplar.ubicacionFisica,
            edificio: ejemplar.edificio
          },
        reserva: prestamo.reserva,
        fechaPrestamo: prestamo.fechaPrestamo,
        fechaVencimiento: prestamo.fechaDevolucionEstimada,
        fechaDevolucionReal: prestamo.fechaDevolucionReal,
        estado: estadoCalculado,
        diasRetraso: diasRetraso
      };
    })
  );
}


  // Cambiar estado a cerrado/finalizado
  async cerrarPrestamo(prestamoId, fechaDevolucionReal) {
    const prestamo = await PrestamoRepository.obtenerPorId(prestamoId);
    
    if (!prestamo) {
      throw new Error("Préstamo no encontrado");
    }

    if (prestamo.estado === 'cerrado') {
      throw new Error("El préstamo ya está finalizado");
    }

    const fechaDevolucion = fechaDevolucionReal ? new Date(fechaDevolucionReal) : new Date();
    
    const prestamoActualizado = await PrestamoRepository.finalizarPrestamo(prestamoId, fechaDevolucion);
    
    // Liberar el ejemplar (cambiar estado a disponible)
    await LibroRepository.setEjemplarDisponibilidad(prestamo.ejemplarId, 'disponible');
    
    return {
      id: prestamoActualizado._id,
      estado: prestamoActualizado.estado,
      fechaDevolucionReal: prestamoActualizado.fechaDevolucionReal,
      mensaje: "Préstamo cerrado exitosamente"
    };
  }

  // Obtener detalles completos de un préstamo
  async obtenerDetalles(prestamoId) {
    const prestamo = await PrestamoRepository.obtenerPorId(prestamoId);
    
    if (!prestamo) {
      throw new Error("Préstamo no encontrado");
    }

    const fechaActual = new Date();
    let estadoCalculado = prestamo.estado;
    let diasRetraso = 0;
    let diasRestantes = 0;

    if (prestamo.estado === 'activo') {
      if (fechaActual > prestamo.fechaDevolucionEstimada) {
        estadoCalculado = 'atrasado';
        diasRetraso = Math.floor((fechaActual - prestamo.fechaDevolucionEstimada) / (1000 * 60 * 60 * 24));
      } else {
        diasRestantes = Math.floor((prestamo.fechaDevolucionEstimada - fechaActual) / (1000 * 60 * 60 * 24));
      }
    }

    const ejemplar = await LibroRepository.findByEjemplarId(prestamo.ejemplarId);
    let libro = await LibroRepository.findById(prestamo.libroId);
      if(!libro) {
        libro = await LibroRepository.findByEjemplarId(prestamo.ejemplarId);
      }

    return {
      id: prestamo._id,
      usuario: {
        id: prestamo.usuarioId._id,
        nombre: prestamo.usuarioId.nombre,
        email: prestamo.usuarioId.email,
        telefono: prestamo.usuarioId.telefono,
        rol: prestamo.usuarioId.rol
      },
      libro: {
        id: libro._id,
        titulo: libro.titulo,
        autor: libro.autor,
        isbn: libro.isbn,
        editorial: libro.editorial,
        fechaPublicacion: libro.fechaPublicacion,
        categoria: libro.categoria
      },
      ejemplar: {
        id: prestamo.ejemplarId,
        cdu: ejemplar.cdu,
        ubicacionFisica: ejemplar.ubicacionFisica,
        estado: ejemplar.estado
      },
      fechaPrestamo: prestamo.fechaPrestamo,
      fechaDevolucionEstimada: prestamo.fechaDevolucionEstimada,
      fechaDevolucionReal: prestamo.fechaDevolucionReal,
      estado: estadoCalculado,
      diasRetraso: diasRetraso,
      diasRestantes: diasRestantes,
      notificaciones: prestamo.notificaciones,
      fechaCreacion: prestamo.createdAt,
      fechaActualizacion: prestamo.updatedAt
    };
  }

  // Crear nuevo préstamo
  async crearPrestamo(datosPrestation) {
    const { libroId, usuarioId, fechaDevolucionEstimada, tipoPrestamo } = datosPrestation;

    // Validar datos obligatorios
    if (!libroId || !usuarioId || !tipoPrestamo) {
      throw new Error("Faltan datos obligatorios: libroId, usuarioId, tipoPrestamo");
    }

    // Verificar que el ejemplar existe y está disponible
    const libro = await LibroRepository.findById(libroId);
    if (!libro) {
      throw new Error("Libro no encontrado");
    }

    //Verificar que hay ejemplares disponibles
    const ejemplaresDisponibles = await LibroRepository.findAvailableEjemplares(libroId);
    if (ejemplaresDisponibles.length === 0) {
      throw new Error("No hay ejemplares disponibles para este libro");
    }
    const ejemplar = ejemplaresDisponibles[0]; // Tomar el primer ejemplar disponible
    
    const ejemplarId = ejemplar._id;

    // Establecer fecha de devolución estimada si no se proporciona (por defecto 15 días)
    let fechaDevolucion = fechaDevolucionEstimada;
    if (!fechaDevolucion) {
      fechaDevolucion = new Date();
      fechaDevolucion.setDate(fechaDevolucion.getDate() + 15); // 15 días por defecto
    }

    // Validar que el usuario exista
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    const nuevoPrestamo = await PrestamoRepository.crear({
      libroId,
      ejemplarId,
      usuarioId,
      fechaDevolucionEstimada: fechaDevolucion,
      estado: 'activo',
      tipoPrestamo: tipoPrestamo
    });

    // Actualizar el estado del ejemplar a "prestado"
    await LibroRepository.setEjemplarDisponibilidad(ejemplarId, 'prestado');

    return await this.obtenerDetalles(nuevoPrestamo._id);
  }

  // Buscar libros por nombre para crear préstamo
  async buscarLibrosParaPrestamo(nombreLibro) {
    if (!nombreLibro || nombreLibro.trim().length === 0) {
      throw new Error("El nombre del libro es requerido");
    }

    const regex = new RegExp(nombreLibro.trim(), 'i');
    
    const libros = await Libro.find({
      $or: [
        { titulo: regex },
        { autor: regex }
      ]
    }).populate('categoria', 'nombre');

    // Filtrar solo libros que tengan ejemplares disponibles
    const librosConEjemplaresDisponibles = libros.map(libro => {
      const ejemplaresDisponibles = libro.ejemplares.filter(
        ejemplar => ejemplar.estado === 'disponible'
      );
      
      if (ejemplaresDisponibles.length > 0) {
        return {
          id: libro._id,
          titulo: libro.titulo,
          autor: libro.autor,
          isbn: libro.isbn,
          categoria: libro.categoria.nombre,
          ejemplaresDisponibles: ejemplaresDisponibles.map(ejemplar => ({
            id: ejemplar._id,
            cdu: ejemplar.cdu,
            ubicacionFisica: ejemplar.ubicacionFisica,
            estado: ejemplar.estado
          }))
        };
      }
      return null;
    }).filter(libro => libro !== null);

    return librosConEjemplaresDisponibles;
  }

  // Buscar usuarios por nombre para crear préstamo
  async buscarUsuariosParaPrestamo(nombreUsuario) {
    if (!nombreUsuario || nombreUsuario.trim().length === 0) {
      throw new Error("El nombre del usuario es requerido");
    }

    const regex = new RegExp(nombreUsuario.trim(), 'i');
    
    const usuarios = await Usuario.find({
      $or: [
        { nombre: regex },
        { email: regex }
      ],
      activo: true
    }).select('nombre email telefono rol');

    return usuarios.map(usuario => ({
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono,
      rol: usuario.rol
    }));
  }

  // Crear préstamo con datos más amigables
  async crearPrestamoConBusqueda(datosPrestation) {
    const { 
      libroId, 
      usuarioId, 
      fechaPrestamo, 
      fechaDevolucionEstimada,
      tipoPrestamo
    } = datosPrestation;

       // Verificar que el ejemplar existe y está disponible
    const libro = await LibroRepository.findById(libroId);
    if (!libro) {
      throw new Error("Libro no encontrado");
    }

    //Verificar que hay ejemplares disponibles
    const ejemplaresDisponibles = await LibroRepository.findAvailableEjemplares(libroId);
    if (ejemplaresDisponibles.length === 0) {
      throw new Error("No hay ejemplares disponibles para este libro");
    }
    const ejemplar = ejemplaresDisponibles[0]; // Tomar el primer ejemplar disponible
    
    const ejemplarId = ejemplar._id;

    // Verificar que el usuario existe y está activo
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    if (!usuario.activo) {
      throw new Error("El usuario no está activo");
    }
    
    // Establecer fechas
    const fechaPrestamoFinal = fechaPrestamo ? new Date(fechaPrestamo) : new Date();
    let fechaDevolucionFinal = fechaDevolucionEstimada;
    
    if (!fechaDevolucionFinal) {
      fechaDevolucionFinal = new Date(fechaPrestamoFinal);
      fechaDevolucionFinal.setDate(fechaDevolucionFinal.getDate() + 15); // 15 días por defecto
    } else {
      fechaDevolucionFinal = new Date(fechaDevolucionFinal);
    }


    const fechaDevolucionDate = new Date(fechaDevolucionFinal);
    const fechaPrestamoDate = new Date(fechaPrestamoFinal);

    // Validar fecha válida
    if (isNaN(fechaPrestamoDate.getTime())) {
      throw new Error("La nueva fecha de devolución estimada no es válida");
    }

    if (fechaDevolucionDate <= fechaPrestamoDate) {
      throw new Error("La nueva fecha debe ser posterior a la fecha de devolución estimada actual");
    }

    // Crear el préstamo
    const nuevoPrestamo = await PrestamoRepository.crear({
      libroId,
      ejemplarId,
      usuarioId,
      fechaPrestamo: fechaPrestamoFinal,
      fechaDevolucionEstimada: fechaDevolucionFinal,
      estado: 'activo',
      tipoPrestamo: tipoPrestamo
    });

    // Actualizar el estado del ejemplar a "prestado"
    await LibroRepository.setEjemplarDisponibilidad(ejemplarId, 'prestado');

    return await this.obtenerDetalles(nuevoPrestamo._id);
  }

  // Obtener resumen de préstamos
  async obtenerResumen() {
    const [todos, activos, atrasados, cerrados] = await Promise.all([
      PrestamoRepository.obtenerPorEstado('todos'),
      PrestamoRepository.obtenerPorEstado('activos'),
      PrestamoRepository.obtenerPorEstado('atrasados'),
      PrestamoRepository.obtenerPorEstado('cerrados')
    ]);

    return {
      total: todos.length,
      activos: activos.length,
      atrasados: atrasados.length,
      cerrados: cerrados.length,
      porcentajeAtrasados: activos.length > 0 ? Math.round((atrasados.length / activos.length) * 100) : 0
    };
  }

  //Renovar un préstamo existente
  async renovarPrestamo(prestamoId, nuevaFechaDevolucionEstimada) {
    const prestamo = await PrestamoRepository.obtenerPorId(prestamoId);
    
    if (!prestamo) {
      throw new Error("Préstamo no encontrado");
    }

    if (prestamo.estado === 'cerrado') {
      throw new Error("No se puede renovar un préstamo cerrado");
    }

    //Validar que haya una nueva fecha de devolución estimada
    if (!nuevaFechaDevolucionEstimada) {
      throw new Error("Se requiere una nueva fecha de devolución estimada para renovar el préstamo");
    }

    const fechaNueva = new Date(nuevaFechaDevolucionEstimada);
    const fechaActual = new Date(prestamo.fechaDevolucionEstimada);

    // Validar fecha válida
    if (isNaN(fechaNueva.getTime())) {
      throw new Error("La nueva fecha de devolución estimada no es válida");
    }

    if (fechaNueva <= fechaActual) {
      throw new Error("La nueva fecha debe ser posterior a la fecha de devolución estimada actual");
    }

    const prestamoRenovado = await PrestamoRepository.renovarPrestamo(prestamoId, nuevaFechaDevolucionEstimada);

    return {
      id: prestamoRenovado._id,
      nuevaFechaDevolucionEstimada: prestamoRenovado.fechaDevolucionEstimada,
      mensaje: "Préstamo renovado exitosamente"
    };
  }

async obtenerTodasLasReservas() {
  const reservas = await PrestamoRepository.obtenerTodasLasReservas();

  return reservas.map(r => {
    const ejemplar = r.libroId.ejemplares.id(r.ejemplarId);

    return {
      id: r._id,
      usuario: {
        id: r.usuarioId._id,
        nombre: r.usuarioId.nombre,
        email: r.usuarioId.email
      },
      libro: {
        id: r.libroId._id,
        titulo: r.libroId.titulo,
        autor: r.libroId.autor,
        isbn: r.libroId.isbn
      },
      ejemplar: {
        id: ejemplar._id,
        cdu: ejemplar.cdu,
        ubicacionFisica: ejemplar.ubicacionFisica,
        estado: ejemplar.estado
      },
      reserva: {
        fechaReserva: r.reserva.fechaReserva,
        fechaExpiracion: r.reserva.fechaExpiracion
      }
    };
  });
}



  // Obtener reservas vigentes
  async obtenerReservasVigentes() {
    const reservas = await PrestamoRepository.obtenerReservasVigentes();
    console.log(reservas);
    return reservas.map(r => {
    const ejemplar = r.libroId.ejemplares.id(r.ejemplarId);

    return {
      id: r._id,
      usuario: {
        id: r.usuarioId._id,
        nombre: r.usuarioId.nombre,
        email: r.usuarioId.email
      },
      libro: {
        id: r.libroId._id,
        titulo: r.libroId.titulo,
        autor: r.libroId.autor,
        isbn: r.libroId.isbn
      },
      ejemplar: {
        id: ejemplar._id,
        cdu: ejemplar.cdu,
        ubicacionFisica: ejemplar.ubicacionFisica,
        estado: ejemplar.estado
      },
      reserva: {
        fechaReserva: r.reserva.fechaReserva,
        fechaExpiracion: r.reserva.fechaExpiracion
      }
    };
  });
  }

  // Obtener reservas expiradas
  async obtenerReservasExpiradas() {
    const reservas = await PrestamoRepository.obtenerReservasExpiradas();

    return reservas.map(r => {
    const ejemplar = r.libroId.ejemplares.id(r.ejemplarId);

    return {
      id: r._id,
      usuario: {
        id: r.usuarioId._id,
        nombre: r.usuarioId.nombre,
        email: r.usuarioId.email
      },
      libro: {
        id: r.libroId._id,
        titulo: r.libroId.titulo,
        autor: r.libroId.autor,
        isbn: r.libroId.isbn
      },
      ejemplar: {
        id: ejemplar._id,
        cdu: ejemplar.cdu,
        ubicacionFisica: ejemplar.ubicacionFisica,
        estado: ejemplar.estado
      },
      reserva: {
        fechaReserva: r.reserva.fechaReserva,
        fechaExpiracion: r.reserva.fechaExpiracion
      }
    };
  });
  }

  // Obtener reservas de un usuario específico
  async obtenerReservasPorUsuario(usuarioId) {
    const reservas = await PrestamoRepository.obtenerReservasPorUsuario(usuarioId);

    return reservas.map(r => {
    const ejemplar = r.libroId.ejemplares.id(r.ejemplarId);

    return {
      id: r._id,
      usuario: {
        id: r.usuarioId._id,
        nombre: r.usuarioId.nombre,
        email: r.usuarioId.email
      },
      libro: {
        id: r.libroId._id,
        titulo: r.libroId.titulo,
        autor: r.libroId.autor,
        isbn: r.libroId.isbn
      },
      ejemplar: {
        id: ejemplar._id,
        cdu: ejemplar.cdu,
        ubicacionFisica: ejemplar.ubicacionFisica,
        estado: ejemplar.estado
      },
      reserva: {
        fechaReserva: r.reserva.fechaReserva,
        fechaExpiracion: r.reserva.fechaExpiracion
      }
    };
  });
  }

  // Obtener detalles de una reserva específica
  async obtenerDetallesReserva(prestamoId) {
    const reserva = await PrestamoRepository.obtenerPorId(prestamoId);
    
    if (!reserva) {
      throw new Error("Reserva no encontrada");
    }

    if (reserva.estado !== 'reserva') {
      throw new Error("El préstamo no es una reserva");
    }

    const ejemplar = await LibroRepository.findEjemplarbyId(reserva.ejemplarId);

    return {
      id: reserva._id,
      usuario: {
        id: reserva.usuarioId._id,
        nombre: reserva.usuarioId.nombre,
        email: reserva.usuarioId.email
      },
      libro: {
        id: reserva.libroId._id,
        titulo: reserva.libroId.titulo,
        autor: reserva.libroId.autor,
        isbn: reserva.libroId.isbn,
        editorial: reserva.libroId.editorial
      },
      ejemplar: {
        id: reserva.ejemplarId,
        cdu: ejemplar.cdu,
        ubicacionFisica: ejemplar.ubicacionFisica,
        estado: ejemplar.estado
      },
      fechaReserva: reserva.reserva.fechaReserva,
      fechaExpiracion: reserva.reserva.fechaExpiracion
    };
  }

  // Crear una nueva reserva para un libro
  async reservarLibro(datosReserva) {
    //Crear prestamo de reserva
    const { libroId, usuarioId, fechaExpiracion, tipoPrestamo} = datosReserva;

    const fechaExpiracionDate = new Date(fechaExpiracion);

    if (isNaN(fechaExpiracionDate.getTime())) {
      throw new Error("La fecha de expiración no es válida");
    }

    // Validaciones básicas antes de continuar
    if (!libroId || !usuarioId) {
      throw new Error("libroId y usuarioId son requeridos para crear una reserva");
    }
    if (!fechaExpiracion) {
      throw new Error("La fecha de expiración es requerida para la reserva");
    }

    const nuevoPrestamoDetalles = await this.crearPrestamoConBusqueda({
      libroId,
      usuarioId,
      fechaPrestamo: null,
      fechaDevolucionEstimada: null,
      tipoPrestamo
    });

    const prestamoId = nuevoPrestamoDetalles.id;

    if (!prestamoId) {
      throw new Error("No se pudo obtener el id del préstamo creado");
    }

    const prestamo = await PrestamoRepository.obtenerPorId(prestamoId);
    
    if (!prestamo) {
      throw new Error("Préstamo no encontrado");
    }


    // Cambiar estado a reserva
    await PrestamoRepository.cambiarEstadoPrestamo(prestamoId, 'reserva');
    
    //Fecha actual
    const fechaReserva = new Date();

    const reservaCreada = await PrestamoRepository.crearReserva(
      prestamoId, 
      {
        fechaReserva, 
        fechaExpiracion: fechaExpiracionDate
      }
    );

    return {
      id: reservaCreada._id,
      fechaReserva: reservaCreada.fechaReserva,
      fechaExpiracion: reservaCreada.fechaExpiracion
    };
  }

  // Activar una reserva y convertirla en préstamo
  async activarReserva(prestamoId) {
    const prestamo = await PrestamoRepository.obtenerPorId(prestamoId);
    
    if (!prestamo) {
      throw new Error("Préstamo no encontrado");
    }

    if (prestamo.estado !== 'reserva') {
      throw new Error("Solo se pueden activar reservas en estado 'reserva'");
    }

    //Comprobar que la reserva no ha expirado
    const fechaActual = new Date();
    if (prestamo.reserva.fechaExpiracion < fechaActual) {
      throw new Error("No se puede activar una reserva que ha expirado");
    }

    const prestamoActivado = await PrestamoRepository.transformarReservaAPrestamo(prestamoId);

    // Actualizar el estado del ejemplar a "prestado"
    await LibroRepository.setEjemplarDisponibilidad(prestamo.ejemplarId, 'prestado');

    return {
      id: prestamoActivado._id,
      estado: prestamoActivado.estado,
      fechaPrestamo: prestamoActivado.fechaPrestamo,
      fechaDevolucionEstimada: prestamoActivado.fechaDevolucionEstimada,
      mensaje: "Reserva activada y convertida en préstamo exitosamente"
    };
  }

  // Cancelar una reserva existente
  async cancelarReserva(prestamoId) {
    const prestamo = await PrestamoRepository.obtenerPorId(prestamoId);
    
    if (!prestamo) {
      throw new Error("Préstamo no encontrado");
    }

    if (prestamo.estado !== 'reserva') {
      throw new Error("Solo se pueden cancelar reservas en estado 'reserva'");
    }

    const prestamoCancelado = await PrestamoRepository.cancelarReserva(prestamoId);

    return {
      id: prestamoCancelado._id,
      estado: prestamoCancelado.estado,
      mensaje: "Reserva cancelada exitosamente"
    };
  }

}

module.exports = new PrestamoService();