// src/modules/estadisticas/estadisticas.repository.js

const Libro = require("../libros/libro.model");
const Prestamo = require("../prestamos/prestamo.model");
const mongoose = require("mongoose");

class EstadisticasRepository {

    // 📘 Total de libros (usa fechaRegistro)
    async librosTotales(periodo) {
        const filtro = periodo ? { fechaRegistro: periodo } : {};
        return await Libro.countDocuments(filtro);
    }

    // 📗 Total de reservas
    async reservasTotales(periodo) {
        const filtro = periodo 
            ? { 
                estado: "reserva",
                "reserva.fechaReserva": periodo 
              }
            : { estado: "reserva" };

        return await Prestamo.countDocuments(filtro);
    }

    // 📘 Reservas activas
    async reservasActivas(periodo) {
        const hoy = new Date();

        const filtro = periodo 
            ? { 
                estado: "reserva",
                "reserva.fechaExpiracion": { $gte: hoy },
                "reserva.fechaReserva": periodo 
              }
            : { 
                estado: "reserva",
                "reserva.fechaExpiracion": { $gte: hoy }
              };

        return await Prestamo.countDocuments(filtro);
    }

    // Total de préstamos 
    async prestamosTotales(periodo) {
        const filtro = periodo ? { fechaPrestamo: periodo } : {};
        return await Prestamo.countDocuments(filtro);
    }

    // 📘 Préstamos activos
    async prestamosActivos(periodo) {
        const filtro = periodo 
            ? { 
                estado: { $in: ["activo", "atrasado"] },
                fechaPrestamo: periodo 
              }
            : { estado: { $in: ["activo", "atrasado"] } };

        return await Prestamo.countDocuments(filtro);
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

async obtenerLibrosPorOrden(orden = "desc", limite = 5) {
    const direccion = orden === "asc" ? 1 : -1;

    return await Prestamo.aggregate([
        {
            $group: {
                _id: "$libroId",
                totalPrestamos: { $sum: 1 }
            }
        },
        { $sort: { totalPrestamos: direccion } },
        { $limit: limite },
        {
            $lookup: {
                from: "libros",
                localField: "_id",
                foreignField: "_id",
                as: "libro"
            }
        },
        { $unwind: "$libro" },
        {
            $project: {
                _id: 0,
                libroId: "$libro._id",
                titulo: "$libro.titulo",
                autor: "$libro.autor",
                totalPrestamos: 1
            }
        }
    ]);
}
async resumenBiblioteca() {
  const hoy = new Date();

  // =========================
  // DEVOLUCIONES ATRASADAS
  // =========================
  const prestamosAtrasados = await Prestamo.find({
    estado: "atrasado"
  })
    .populate("estudianteId", "nombre grado")
    .populate("libroId", "titulo")
    .lean();

  const devolucionesAtrasadas = prestamosAtrasados.map(p => {
    const fechaEsperada = p.fechaDevolucionEsperada
      ? new Date(p.fechaDevolucionEsperada)
      : hoy;

    const diasAtraso = Math.max(
      0,
      Math.ceil((hoy - fechaEsperada) / (1000 * 60 * 60 * 24))
    );

    return {
      _id: p._id,
      estudiante: p.estudianteId?.nombre ?? "Desconocido",
      grado: p.estudianteId?.grado ?? "-",
      libro: p.libroId?.titulo ?? "Sin título",
      diasAtraso
    };
  });

  // =========================
  // LIBROS RESERVADOS
  // =========================
  const reservas = await Prestamo.find({
    estado: "reserva"
  })
    .populate("libroId", "titulo")
    .lean();

  const librosReservados = reservas.map(r => ({
    _id: r._id,
    estudiante: r.estudiante?.nombre ?? "No registrado",
    grado: r.estudiante?.grado ?? "-",
    libro: r.libroId?.titulo ?? "Sin título",
    fechaReserva: r.reserva?.fechaReserva
      ? new Date(r.reserva.fechaReserva).toISOString().split("T")[0]
      : "-"
  }));


  // =========================
  // COSTO Y EJEMPLARES
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
