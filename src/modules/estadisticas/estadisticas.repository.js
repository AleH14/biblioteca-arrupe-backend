// src/modules/estadisticas/estadisticas.repository.js

const Libro = require("../libros/libro.model");
const Prestamo = require("../prestamos/prestamo.model");
const mongoose = require("mongoose");

class EstadisticasRepository {

    // 📘 Total de libros sin rango de fechas
    async librosTotales() {
  return await Libro.countDocuments({
  });
}

    // 📗 Total de reservas
    async reservasTotales(rangoFecha = {}) {
  return await Prestamo.countDocuments({
    estado: "reserva",
    "reserva.fechaReserva": rangoFecha
  });
}


    // 📘 Reservas activas
    async reservasActivas(rangoFecha = {}) {
  const hoy = new Date();

  return await Prestamo.countDocuments({
    estado: "reserva",
    "reserva.fechaReserva": rangoFecha,
    "reserva.fechaExpiracion": { $gte: hoy }
  });
}


    // Total de préstamos 
   async prestamosTotales(rangoFecha = {}) {
  return await Prestamo.countDocuments({
    fechaPrestamo: rangoFecha
  });
}


    // 📘 Préstamos activos
    async prestamosActivos(rangoFecha = {}) {
  return await Prestamo.countDocuments({
    estado: { $in: ["activo", "atrasado"] },
    fechaPrestamo: rangoFecha
  });
}


   

async totalLibrosPorCategoria() {
  const libros = await Libro.find()
    .populate("categoria", "descripcion")
    .lean();

  return libros.map(libro => ({
    ...libro,
    categoriaId: libro.categoria?._id?.toString()
  }));
}


    async totalEjemplaresPorCategoria() {
        return await Libro.aggregate([
            {
                $group: {
                    _id: "$categoria",
                    totalEjemplares: { $sum: { $size: "$ejemplares" } }
                }
            },
            {
                $lookup: {
                    from: "categorias",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoria"
                }
            },
            { $unwind: "$categoria" },
            {
                $project: {
                    _id: 0,
                    categoriaId: "$categoria._id",
                    categoria: "$categoria.descripcion",
                    totalEjemplares: 1
                }
            }
        ]);
    }

    async totalPrestamosPorCategoria() {
        return await Prestamo.aggregate([
            {
                $lookup: {
                    from: "libros",
                    localField: "libroId",
                    foreignField: "_id",
                    as: "libro"
                }
            },
            { $unwind: "$libro" },
            {
                $group: {
                    _id: "$libro.categoria",
                    totalPrestamos: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "categorias",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoria"
                }
            },
            { $unwind: "$categoria" },
            {
                $project: {
                    _id: 0,
                    categoriaId: "$categoria._id",
                    categoria: "$categoria.descripcion",
                    totalPrestamos: 1
                }
            }
        ]);
    }

    async porcentajeCategorias() {
        const totales = await Libro.countDocuments();

        return await Libro.aggregate([
            { $group: { _id: "$categoria", total: { $sum: 1 } } },
            {
                $lookup: {
                    from: "categorias",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoria"
                }
            },
            { $unwind: "$categoria" },
            {
                $project: {
                    _id: 0,
                    categoriaId: "$categoria._id",
                    categoria: "$categoria.descripcion",
                    totalLibros: "$total",
                    porcentaje: {
                        $multiply: [{ $divide: ["$total", totales] }, 100]
                    }
                }
            }
        ]);
    }

async obtenerLibrosPorOrden(orden = "desc", limite = 10) { 
    const direccion = orden === "asc" ? 1 : -1;

    // Primero obtenemos todos los libros
    const todosLosLibros = await Libro.find()
        .select("titulo autor _id")
        .lean();

    // Luego obtenemos los préstamos agrupados por libro
    const prestamosPorLibro = await Prestamo.aggregate([
        {
            $group: {
                _id: "$libroId",
                totalPrestamos: { $sum: 1 }
            }
        }
    ]);

    // Convertimos a un mapa para búsqueda rápida
    const prestamosMap = new Map();
    prestamosPorLibro.forEach(item => {
        prestamosMap.set(item._id.toString(), item.totalPrestamos);
    });

    // Combinamos libros con sus préstamos (0 si no tiene)
    const librosConPrestamos = todosLosLibros.map(libro => {
        const libroId = libro._id.toString();
        const totalPrestamos = prestamosMap.get(libroId) || 0;
        
        return {
            libroId: libro._id,
            titulo: libro.titulo,
            autor: libro.autor,
            totalPrestamos: totalPrestamos
        };
    });

    // Ordenamos según el parámetro
    librosConPrestamos.sort((a, b) => {
        if (orden === "asc") {
            return a.totalPrestamos - b.totalPrestamos;
        } else {
            return b.totalPrestamos - a.totalPrestamos;
        }
    });

    // Limitamos a los n primeros
    return librosConPrestamos.slice(0, limite);
}

async resumenBiblioteca() {
  const hoy = new Date();

  // =========================
  // DEVOLUCIONES ATRASADAS (CORREGIDO)
  // =========================
  const prestamosActivos = await Prestamo.find({
    estado: { $in: ["activo", "atrasado"] }
  })
    .populate("usuarioId", "nombre grado")  // CAMBIADO: usuarioId en lugar de estudianteId
    .populate("libroId", "titulo")
    .lean();

  const devolucionesAtrasadas = prestamosActivos
    .filter(p => {
      if (!p.fechaDevolucionEstimada) return false;  // CAMBIADO: fechaDevolucionEstimada
      const fechaEsperada = new Date(p.fechaDevolucionEstimada);
      return fechaEsperada < hoy;
    })
    .map(p => {
      const fechaEsperada = new Date(p.fechaDevolucionEstimada);  // CAMBIADO
      const diasAtraso = Math.floor((hoy - fechaEsperada) / (1000 * 60 * 60 * 24));
      
      return {
        _id: p._id,
        estudiante: p.usuarioId?.nombre ?? "Desconocido",  // CAMBIADO: usuarioId
        grado: p.usuarioId?.grado ?? "-",  // CAMBIADO: usuarioId
        libro: p.libroId?.titulo ?? "Sin título",
        diasAtraso: Math.max(0, diasAtraso)
      };
    });

  // =========================
  // LIBROS RESERVADOS (CORREGIDO)
  // =========================
  const reservas = await Prestamo.find({
    estado: "reserva"
  })
    .populate({
      path: "usuarioId",  // CAMBIADO: usuarioId
      select: "nombre grado"
    })
    .populate("libroId", "titulo")
    .lean();

  const librosReservados = reservas.map(r => ({
    _id: r._id,
    estudiante: r.usuarioId?.nombre ?? "No registrado",  // CAMBIADO: usuarioId
    grado: r.usuarioId?.grado ?? "-",  // CAMBIADO: usuarioId
    libro: r.libroId?.titulo ?? "Sin título",
    fechaReserva: r.reserva?.fechaReserva
      ? new Date(r.reserva.fechaReserva).toISOString().split("T")[0]
      : "-"
  }));

  // =========================
  // COSTO Y EJEMPLARES (MANTENER)
  // =========================
  const libros = await Libro.find().lean();

  let costoTotalLibros = 0;
  let totalEjemplares = 0;

  libros.forEach(libro => {
    (libro.ejemplares || []).forEach(e => {
      totalEjemplares++;
      if (e.precio) costoTotalLibros += e.precio;
    });
  });

  // =========================
  // RESPUESTA FINAL
  // =========================
  return {
    devolucionesAtrasadas,
    librosReservados,
    costoTotalLibros,
    totalEjemplares
  };
}


}

module.exports = new EstadisticasRepository();
