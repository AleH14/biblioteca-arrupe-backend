const PrestamoRepository = require("./prestamo.repository");
const Libro = require("../libros/libro.model");
const Usuario = require("../usuarios/usuario.model");
const LibroRepository = require("../libros/libro.repository");

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
      
      return {
        id: prestamo._id,
        alumno: {
          nombre: prestamo.usuarioId.nombre,
          email: prestamo.usuarioId.email
        },
        libro: {
          titulo: prestamo.ejemplarId.titulo,
          autor: prestamo.ejemplarId.autor,
          isbn: prestamo.ejemplarId.isbn
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
    
    return prestamos.map(prestamo => {
      const fechaActual = new Date();
      let estadoCalculado = prestamo.estado;
      let diasRetraso = 0;

      // Determinar si está atrasado
      if (prestamo.estado === 'activo' && fechaActual > prestamo.fechaDevolucionEstimada) {
        estadoCalculado = 'atrasado';
        diasRetraso = Math.floor((fechaActual - prestamo.fechaDevolucionEstimada) / (1000 * 60 * 60 * 24));
      }

      return {
        id: prestamo._id,
        alumno: {
          nombre: prestamo.usuarioId.nombre,
          email: prestamo.usuarioId.email,
          telefono: prestamo.usuarioId.telefono
        },
        libro: {
          titulo: prestamo.ejemplarId.titulo,
          autor: prestamo.ejemplarId.autor,
          isbn: prestamo.ejemplarId.isbn
        },
        fechaPrestamo: prestamo.fechaPrestamo,
        fechaVencimiento: prestamo.fechaDevolucionEstimada,
        fechaDevolucionReal: prestamo.fechaDevolucionReal,
        estado: estadoCalculado,
        diasRetraso: diasRetraso
      };
    });
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
    await Libro.updateOne(
      { 'ejemplares._id': prestamo.ejemplarId },
      { $set: { 'ejemplares.$.estado': 'disponible' } }
    );
    
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
        id: prestamo.ejemplarId._id,
        titulo: prestamo.ejemplarId.titulo,
        autor: prestamo.ejemplarId.autor,
        isbn: prestamo.ejemplarId.isbn,
        editorial: prestamo.ejemplarId.editorial,
        fechaPublicacion: prestamo.ejemplarId.fechaPublicacion,
        categoria: prestamo.ejemplarId.categoria
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
    const { ejemplarId, usuarioId, fechaDevolucionEstimada, tipoPrestamo } = datosPrestation;

    // Validar datos obligatorios
    if (!ejemplarId || !usuarioId || !tipoPrestamo) {
      throw new Error("Faltan datos obligatorios: ejemplarId, usuarioId, tipoPrestamo");
    }

    // Verificar que el ejemplar existe y está disponible
    const libro = await LibroRepository.findByEjemplarId(ejemplarId);
    if (!libro) {
      throw new Error("Ejemplar no encontrado");
    }
    

    // Verificar que no existe un préstamo activo para este ejemplar
    const prestamoExistente = await PrestamoRepository.existePrestamoActivo(ejemplarId);
    if (prestamoExistente) {
      throw new Error("Ya existe un préstamo activo para este ejemplar");
    }

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
      ejemplarId,
      usuarioId,
      fechaDevolucionEstimada: fechaDevolucion,
      estado: 'activo',
      tipoPrestamo: tipoPrestamo
    });

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
      ejemplarId, 
      usuarioId, 
      fechaPrestamo, 
      fechaDevolucionEstimada 
    } = datosPrestation;

    // Verificar que el ejemplar existe y está disponible
    const libro = await Libro.findOne({
      'ejemplares._id': ejemplarId
    });

    if (!libro) {
      throw new Error("Ejemplar no encontrado");
    }

    const ejemplar = libro.ejemplares.id(ejemplarId);
    if (!ejemplar) {
      throw new Error("Ejemplar no encontrado");
    }

    if (ejemplar.estado !== 'disponible') {
      throw new Error(`El ejemplar no está disponible. Estado actual: ${ejemplar.estado}`);
    }

    // Verificar que el usuario existe y está activo
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    if (!usuario.activo) {
      throw new Error("El usuario no está activo");
    }

    // Verificar que no existe un préstamo activo para este ejemplar
    const prestamoExistente = await PrestamoRepository.existePrestamoActivo(ejemplarId);
    if (prestamoExistente) {
      throw new Error("Ya existe un préstamo activo para este ejemplar");
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


    const fechaDevolucionDate = new Date(nuevaFechaDevolucionEstimada);
    const fechaPrestamoDate = new Date(prestamo.fechaDevolucionEstimada);

    // Validar fecha válida
    if (isNaN(fechaPrestamoDate.getTime())) {
      throw new Error("La nueva fecha de devolución estimada no es válida");
    }

    if (fechaDevolucionDate <= fechaPrestamoDate) {
      throw new Error("La nueva fecha debe ser posterior a la fecha de devolución estimada actual");
    }

    // Crear el préstamo
    const nuevoPrestamo = await PrestamoRepository.crear({
      ejemplarId,
      usuarioId,
      fechaPrestamo: fechaPrestamoFinal,
      fechaDevolucionEstimada: fechaDevolucionFinal,
      estado: 'activo'
    });

    // Actualizar el estado del ejemplar a "prestado"
    await Libro.updateOne(
      { 'ejemplares._id': ejemplarId },
      { $set: { 'ejemplares.$.estado': 'prestado' } }
    );

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
}

module.exports = new PrestamoService();