// src/modules/estadisticas/estadisticas.repository.js

const Libro = require("../libros/libro.model");
const Prestamo = require("../prestamos/prestamo.model");
const mongoose = require("mongoose");

class EstadisticasRepository {

    // 📘 Total de libros (usa fechaRegistro)
    async librosTotales(periodo) {
        const filtro = periodo.createdAt
            ? { fechaRegistro: periodo.createdAt }
            : {};
        return await Libro.countDocuments(filtro);
    }

    // 📗 Total de reservas
    async reservasTotales(periodo) {
        const filtroFecha = periodo.createdAt
            ? { "reserva.fechaReserva": periodo.createdAt }
            : {};

        return await Prestamo.countDocuments({
            estado: "reserva",
            ...filtroFecha
        });
    }

    // 📘 Reservas activas
    async reservasActivas(periodo) {
        const hoy = new Date();

        const filtroFecha = periodo.createdAt
            ? { "reserva.fechaReserva": periodo.createdAt }
            : {};

        return await Prestamo.countDocuments({
            estado: "reserva",
            "reserva.fechaExpiracion": { $gte: hoy },
            ...filtroFecha
        });
    }

    // Total de préstamos 
    async prestamosTotales(periodo) {
        const filtro = periodo.createdAt
            ? { fechaPrestamo: periodo.createdAt }
            : {};
        return await Prestamo.countDocuments(filtro);
    }

    // 📘 Préstamos activos
    async prestamosActivos(periodo) {
        const filtro = periodo.createdAt
            ? { fechaPrestamo: periodo.createdAt }
            : {};

        return await Prestamo.countDocuments({
            estado: { $in: ["activo", "atrasado"] },
            ...filtro
        });
    }

   

    async totalLibrosPorCategoria() {
        return await Libro.aggregate([
            { $group: { _id: "$categoria", totalLibros: { $sum: 1 } } },
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
                    totalLibros: 1
                }
            }
        ]);
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
  const devolucionesAtrasadas = await Prestamo.find({
    estado: "atrasado"
  }).select("_id");

  const librosReservados = await Prestamo.find({
    estado: "reserva"
  }).select("_id");

  const libros = await Libro.find();

  let costoTotal = 0;
  let totalEjemplares = 0;

  libros.forEach(libro => {
    libro.ejemplares.forEach(e => {
      totalEjemplares++;
      if (e.precio) costoTotal += e.precio;
    });
  });

  return {
    devolucionesAtrasadas,
    librosReservados,
    costoTotalLibros: costoTotal,
    totalEjemplares
  };
}


}

module.exports = new EstadisticasRepository();
