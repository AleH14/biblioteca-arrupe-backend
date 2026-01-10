const LibroRepository = require("../libros/libro.repository");
const EstadisticasRepository = require("./estadisticas.repository");
const { isValidObjectId } = require("./../../core/middlewares/mongoose.middleware");

// -------------------------------
// Funciones auxiliares
// -------------------------------

function obtenerFechaMetrica(periodo, campoFecha = "createdAt") {
    if (!periodo) return {}; 

    const hoy = new Date();
    let rango = null;

    switch (periodo) {
        case "hoy":
            rango = {
                $gte: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()),
                $lte: hoy
            };
            break;

        case "mensual":
            rango = {
                $gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
                $lte: hoy
            };
            break;

        case "anual":
            rango = {
                $gte: new Date(hoy.getFullYear(), 0, 1),
                $lte: hoy
            };
            break;

        default:
            return {};
    }


    return {
        $and: [
            { [campoFecha]: { $exists: true } },
            { [campoFecha]: rango }
        ]
    };
}

function obtenerRangosTendencias(periodo) {
    if (!periodo) return [];

    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = ahora.getMonth();
    const day = ahora.getDate();

    const rangos = [];

    switch (periodo) {
        case "hoy":
            for (let h = 0; h < 24; h += 2) {
                rangos.push({
                    etiqueta: `${String(h).padStart(2, "0")}:00`,
                    desde: new Date(year, month, day, h, 0, 0),
                    hasta: new Date(year, month, day, h + 2, 0, 0)
                });
            }
            break;

        case "mensual": {
            let cursor = new Date(year, month, 1);
            let semana = 1;

            while (cursor.getMonth() === month) {
                const desde = new Date(cursor);
                const hasta = new Date(cursor);
                hasta.setDate(hasta.getDate() + 7);

                rangos.push({
                    etiqueta: `Sem ${semana++}`,
                    desde,
                    hasta
                });

                cursor.setDate(cursor.getDate() + 7);
            }
            break;
        }

        case "anual":
            const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
            for (let m = 0; m < 12; m++) {
                rangos.push({
                    etiqueta: meses[m],
                    desde: new Date(year, m, 1),
                    hasta: new Date(year, m + 1, 1)
                });
            }
            break;

        default:
            return [];
    }

    return rangos;
}

// -------------------------------
// Servicio
// -------------------------------

class EstadisticasService {

    async obtenerMetricas(periodo) {
        const fecha = obtenerFechaMetrica(periodo);

        const librosTotales = await EstadisticasRepository.librosTotales(fecha);
        const reservasTotales = await EstadisticasRepository.reservasTotales(fecha);
        const reservasActivas = await EstadisticasRepository.reservasActivas(fecha);
        const prestamosTotales = await EstadisticasRepository.prestamosTotales(fecha);
        const prestamosActivos = await EstadisticasRepository.prestamosActivos(fecha);

        return {
            librosTotales,
            prestamosTotales,
            prestamosActivos,
            reservasTotales,
            reservasActivas
        };
    }

    async obtenerTendencias(periodo) {
        const rangos = obtenerRangosTendencias(periodo);

        if (!rangos.length) return [];

        return Promise.all(
            rangos.map(async (rango) => {
                const fecha = {
                    $and: [
                        { createdAt: { $exists: true } },
                        { createdAt: { $gte: rango.desde, $lte: rango.hasta } }
                    ]
                };

                return {
                    periodo: rango.etiqueta,
                    librosTotales: await EstadisticasRepository.librosTotales(fecha),
                    prestamosTotales: await EstadisticasRepository.prestamosTotales(fecha),
                    prestamosActivos: await EstadisticasRepository.prestamosActivos(fecha),
                    reservasTotales: await EstadisticasRepository.reservasTotales(fecha),
                    reservasActivas: await EstadisticasRepository.reservasActivas(fecha)
                };
            })
        );
    }

    async obtenerLibrosPorOrden(orden = "desc", limite = 5) {
    return await EstadisticasRepository.obtenerLibrosPorOrden(orden, limite);
}


    async obtenerMetricasCategoria() {
        return {
            totalLibrosPorCategoria: await EstadisticasRepository.totalLibrosPorCategoria(),
            totalEjemplaresPorCategoria: await EstadisticasRepository.totalEjemplaresPorCategoria(),
            totalPrestamosPorCategoria: await EstadisticasRepository.totalPrestamosPorCategoria(),
            porcentajeCategorias: await EstadisticasRepository.porcentajeCategorias()
        };
    }

    async obtenerEstadisticasLibro(id) {
        if (!id || !isValidObjectId(id)) {
            const error = new Error("El id del libro es requerido");
            error.status = 400;
            throw error;
        }

        const libro = await LibroRepository.findById(id);
        if (!libro) {
            const error = new Error("Libro no encontrado");
            error.status = 404;
            throw error;
        }

        return await EstadisticasRepository.obtenerEstadisticasLibro(id);
    }
    async obtenerResumenBiblioteca() {
  return await EstadisticasRepository.resumenBiblioteca();
}

}

module.exports = new EstadisticasService();
