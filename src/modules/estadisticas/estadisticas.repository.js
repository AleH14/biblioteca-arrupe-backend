// src/modules/estadisticas/estadisticas.repository.js

const Libro = require("../libros/libro.model");
const Prestamo = require("../prestamos/prestamo.model");
const Usuario = require("../usuarios/usuario.model");
const mongoose = require("mongoose");

class EstadisticasRepository {

    // 📘 Total de libros creados en el periodo
    async librosTotales(periodo) {
        return await Libro.countDocuments(periodo);
    }

    // 📗 Total de reservas realizadas por periodo
    // estado === "reserva"
    async reservasTotales(periodo) {
        return await Prestamo.countDocuments({
            estado: "reserva",
            ...periodo
        });
    }

    // 📘 Reservas activas (vigentes sin expirar)
    async reservasActivas(periodo) {
        const hoy = new Date();

        return await Prestamo.countDocuments({
            estado: "reserva",
            "reserva.fechaExpiracion": { $gte: hoy },
            ...periodo
        });
    }

    // 📗 Total de préstamos creados en el periodo
    async prestamosTotales(periodo) {
        return await Prestamo.countDocuments(periodo);
    }

    // 📘 Préstamos activos: estado === "activo" o "atrasado"
    async prestamosActivos(periodo) {

        return await Prestamo.countDocuments({
            estado: { $in: ["activo", "atrasado"] },
            ...periodo
        });
    }

    async totalLibrosPorCategoria() {
        return await Libro.aggregate([
            {
                $group: {
                    _id: "$categoria",
                    totalLibros: { $sum: 1 },
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
            {
                $group: {
                    _id: "$categoria",
                    total: { $sum: 1 }
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
                    totalLibros: "$total",
                    porcentaje: {
                        $multiply: [{ $divide: ["$total", totales] }, 100]
                    }
                }
            }
        ]);
    }



    async listaLibrosPorCategoria(categoriaId) {
        return await Libro.find({ categoria: categoriaId })
            .select("titulo autor editorial precio ejemplares");
    }


    async obtenerEstadisticasLibro(libroId) {
        const id = new mongoose.Types.ObjectId(libroId);

        const resultado = await Libro.aggregate([
            {
                // 1️⃣ Filtrar solo el libro solicitado
                $match: { _id: id }
            },

            {
                // 2️⃣ Traer categoría (populate)
                $lookup: {
                    from: "categorias",
                    localField: "categoria",
                    foreignField: "_id",
                    as: "categoria"
                }
            },
            { $unwind: "$categoria" },

            {
                // 3️⃣ Contar préstamos relacionados a este libro
                $lookup: {
                    from: "prestamos",
                    localField: "_id",
                    foreignField: "libroId",
                    as: "prestamos"
                }
            },

            {
                // 4️⃣ Formatear respuesta
                $project: {
                    _id: 0,                           
                    libroId: "$_id",

                    // Datos del libro
                    titulo: 1,
                    autor: 1,
                    isbn: 1,
                    editorial: 1,
                    imagenURL: 1,
                    fechaRegistro: 1,
                    precio: 1,
                    disponibilidad: 1,
                    createdAt: 1,
                    updatedAt: 1,

                    // Contadores
                    totalEjemplares: { $size: "$ejemplares" },
                    totalPrestamos: { $size: "$prestamos" },

                    // Categoría populada
                    categoria: {
                        _id: "$categoria._id",
                        categoria: "$categoria.descripcion"
                    }
                }
            }
        ]);

        return resultado[0] || null;
    }


    async obtenerLibrosMasPrestados({ orden = "desc", limite = 5 }) {
        const sortOrder = orden === "asc" ? 1 : -1;

        const resultado = await Prestamo.aggregate([
            {
                // Agrupar préstamos por libro
                $group: {
                    _id: "$libroId",
                    totalPrestamos: { $sum: 1 }
                }
            },
            {
                $sort: { totalPrestamos: sortOrder }
            },
            {
                $limit: limite
            },
            {
                // Traer datos del libro
                $lookup: {
                    from: "libros",
                    localField: "_id",
                    foreignField: "_id",
                    as: "libro"
                }
            },
            { $unwind: "$libro" },

            {
                // Populate de categoría
                $lookup: {
                    from: "categorias", 
                    localField: "libro.categoria",
                    foreignField: "_id",
                    as: "categoria"
                }
            },
            { $unwind: "$categoria" },

            {
                // Output final
                $project: {
                    _id: 0,
                    libroId: "$_id",
                    totalPrestamos: 1,
                    libro: {
                        titulo: "$libro.titulo",
                        autor: "$libro.autor",
                        isbn: "$libro.isbn",
                        imagenURL: "$libro.imagenURL",
                        totalEjemplares: { $size: "$libro.ejemplares" },
                    },
                    categoria: {
                        _id: "$categoria._id",
                        nombre: "$categoria.nombre",
                        descripcion: "$categoria.descripcion"
                    }
                }
            }
        ]);

        return resultado;
    }
}


module.exports = new EstadisticasRepository();
