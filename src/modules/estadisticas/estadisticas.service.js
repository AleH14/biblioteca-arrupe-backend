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

function obtenerRangosMetricas(periodo) {
    if (!periodo) return {}; 

    // Configurar zona horaria de El Salvador (UTC-6)
    const EL_SALVADOR_OFFSET = -6; // UTC-6
    const ahora = new Date();
    
    // Ajustar a hora local de El Salvador
    const ahoraLocal = new Date(ahora.getTime() + (EL_SALVADOR_OFFSET * 60 * 60 * 1000));
    const year = ahoraLocal.getUTCFullYear();
    const month = ahoraLocal.getUTCMonth();
    const day = ahoraLocal.getUTCDate();

    let rango = null;

    switch (periodo) {
        case "hoy":
            // Inicio del día en El Salvador convertido a UTC
            const inicioDiaLocal = new Date();
            inicioDiaLocal.setUTCFullYear(year, month, day);
            inicioDiaLocal.setUTCHours(0, 0, 0, 0);
            const inicioDiaUTC = new Date(inicioDiaLocal.getTime() - (EL_SALVADOR_OFFSET * 60 * 60 * 1000));

            rango = {
                $gte: inicioDiaUTC,
                $lte: ahora
            };
            break;

        case "mensual":
            // Primer día del mes en El Salvador convertido a UTC
            const inicioMesLocal = new Date();
            inicioMesLocal.setUTCFullYear(year, month, 1);
            inicioMesLocal.setUTCHours(0, 0, 0, 0);
            const inicioMesUTC = new Date(inicioMesLocal.getTime() - (EL_SALVADOR_OFFSET * 60 * 60 * 1000));

            rango = {
                $gte: inicioMesUTC,
                $lte: ahora
            };
            break;

        case "anual":
            // Primer día del año en El Salvador convertido a UTC
            const inicioAnoLocal = new Date();
            inicioAnoLocal.setUTCFullYear(year, 0, 1);
            inicioAnoLocal.setUTCHours(0, 0, 0, 0);
            const inicioAnoUTC = new Date(inicioAnoLocal.getTime() - (EL_SALVADOR_OFFSET * 60 * 60 * 1000));

            rango = {
                $gte: inicioAnoUTC,
                $lte: ahora
            };
            break;

        default:
            return {};
    }

    return rango;
}

function obtenerRangosTendencias(periodo) {
    if (!periodo) return [];

    // Configurar zona horaria de El Salvador (UTC-6)
    const EL_SALVADOR_OFFSET = -6; // UTC-6
    const ahora = new Date();
    
    // Ajustar a hora local de El Salvador
    const ahoraLocal = new Date(ahora.getTime() + (EL_SALVADOR_OFFSET * 60 * 60 * 1000));
    const year = ahoraLocal.getUTCFullYear();
    const month = ahoraLocal.getUTCMonth();
    const day = ahoraLocal.getUTCDate();

    const rangos = [];

    switch (periodo) {
        case "hoy":
            // Generar rangos solo para horario operativo (7:00 AM - 7:00 PM)
            const horaInicio = 7;  // 7:00 AM
            const horaFin = 19;    // 7:00 PM
            
            for (let h = horaInicio; h <= horaFin; h++) {
                const desde = new Date();
                const hasta = new Date();
                
                // Crear fechas en UTC pero representando la hora local de El Salvador
                desde.setUTCFullYear(year, month, day);
                desde.setUTCHours(h, 0, 0, 0);
                
                hasta.setUTCFullYear(year, month, day);
                hasta.setUTCHours(h, 59, 59, 999);

                // Convertir de vuelta a UTC para las consultas de MongoDB
                const desdeUTC = new Date(desde.getTime() - (EL_SALVADOR_OFFSET * 60 * 60 * 1000));
                const hastaUTC = new Date(hasta.getTime() - (EL_SALVADOR_OFFSET * 60 * 60 * 1000));

                rangos.push({
                    etiqueta: `${String(h).padStart(2, "0")}:00`,
                    desde: desdeUTC,
                    hasta: hastaUTC
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
        const rangoFecha = obtenerRangosMetricas(periodo);

        const librosTotales = await EstadisticasRepository.librosTotales(rangoFecha);
        const reservasTotales = await EstadisticasRepository.reservasTotales(rangoFecha);
        const reservasActivas = await EstadisticasRepository.reservasActivas(rangoFecha);
        const prestamosTotales = await EstadisticasRepository.prestamosTotales(rangoFecha);
        const prestamosActivos = await EstadisticasRepository.prestamosActivos(rangoFecha);

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
                // Crear filtros específicos para cada campo de fecha
                const fechaPrestamo = {
                    $gte: rango.desde,
                    $lte: rango.hasta
                };

                const fechaRegistro = {
                    $gte: rango.desde,
                    $lte: rango.hasta
                };

                return {
                    periodo: rango.etiqueta,
                    librosTotales: await EstadisticasRepository.librosTotales(fechaRegistro),
                    prestamosTotales: await EstadisticasRepository.prestamosTotales(fechaPrestamo),
                    prestamosActivos: await EstadisticasRepository.prestamosActivos(fechaPrestamo),
                    reservasTotales: await EstadisticasRepository.reservasTotales(fechaPrestamo),
                    reservasActivas: await EstadisticasRepository.reservasActivas(fechaPrestamo)
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
