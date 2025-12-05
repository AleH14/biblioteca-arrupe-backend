const LibroRepository = require("../libros/libro.repository");
const EstadisticasRepository = require("./estadisticas.repository");
const {isValidObjectId} = require("./../../core/middlewares/mongoose.middleware")

//Funciones auxiliares 
function obtenerFechaMetrica(periodo, campoFecha = "createdAt") {
    const hoy = new Date();
    
    switch (periodo) {
        case "hoy":
            return {
                [campoFecha]: {
                    $gte: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()),
                    $lte: hoy
                }
            };

        case "mensual":
            return {
                [campoFecha]: {
                    $gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
                    $lte: hoy
                }
            };

        case "anual":
            return {
                [campoFecha]: {
                    $gte: new Date(hoy.getFullYear(), 0, 1),
                    $lte: hoy
                }
            };

        default:
            return {}; // total sin filtro
    }
}

function obtenerRangosTendencias(periodo) {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = ahora.getMonth();
    const day = ahora.getDate();

    const rangos = [];

    switch (periodo) {

        // --- HOY: intervalos de 2 horas ---
        case "hoy": {
            const inicioDia = new Date(year, month, day, 0, 0, 0);
            for (let h = 0; h < 24; h += 2) {
                const desde = new Date(year, month, day, h, 0, 0);
                const hasta = new Date(year, month, day, h + 2, 0, 0);
                rangos.push({
                    etiqueta: `${String(h).padStart(2, "0")}:00`,
                    desde,
                    hasta
                });
            }
            break;
        }

        // --- MENSUAL: semanas ---
        case "mensual": {
            const inicioMes = new Date(year, month, 1);
            const finMes = new Date(year, month + 1, 0); // último día del mes
            let cursor = new Date(inicioMes);

            let numeroSemana = 1;
            while (cursor <= finMes) {
                const desde = new Date(cursor);
                const hasta = new Date(cursor);
                hasta.setDate(hasta.getDate() + 7);

                rangos.push({
                    etiqueta: `Sem ${numeroSemana}`,
                    desde,
                    hasta
                });

                cursor.setDate(cursor.getDate() + 7);
                numeroSemana++;
            }
            break;
        }

        // --- ANUAL: meses ---
        case "anual": {
            const nombresMeses = [
                "Ene", "Feb", "Mar", "Abr", "May", "Jun",
                "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
            ];

            for (let m = 0; m < 12; m++) {
                const desde = new Date(year, m, 1);
                const hasta = new Date(year, m + 1, 1);

                rangos.push({
                    etiqueta: nombresMeses[m],
                    desde,
                    hasta
                });
            }
            break;
        }

        default:
            return [];
    }

    return rangos;
}


class EstadisticasService{

    async obtenerMetricas(periodo){
        const fecha = obtenerFechaMetrica(periodo)
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
        }
    }

    async obtenerTendencias(periodo){
        const rangoTendencias = obtenerRangosTendencias(periodo);
        const tendencias = await Promise.all( 
            rangoTendencias.map(async (rango) =>
            {
                const fecha = {"createdAt": {"$gte": rango.desde, "$lte": rango.hasta}}
                const librosTotales = await EstadisticasRepository.librosTotales(fecha);
                const reservasTotales = await EstadisticasRepository.reservasTotales(fecha);
                const reservasActivas = await EstadisticasRepository.reservasActivas(fecha);
                const prestamosTotales = await EstadisticasRepository.prestamosTotales(fecha);
                const prestamosActivos = await EstadisticasRepository.prestamosActivos(fecha);

                return {
                    periodo: rango.etiqueta,
                    librosTotales,
                    prestamosTotales,
                    prestamosActivos,
                    reservasTotales,
                    reservasActivas            
                }
            }));
        return tendencias;
    }

    async obtenerLibrosPorOrden(orden, limite){
        const resultado = await EstadisticasRepository.obtenerLibrosMasPrestados({orden, limite});
        return resultado;
    }

    async obtenerMetricasCategoria(){
        const totalLibrosPorCategoria = await EstadisticasRepository.totalLibrosPorCategoria();
        const totalEjemplaresPorCategoria = await EstadisticasRepository.totalEjemplaresPorCategoria();
        const totalPrestamosPorCategoria = await EstadisticasRepository.totalPrestamosPorCategoria();
        const porcentajeCategorias = await EstadisticasRepository.porcentajeCategorias();

        return{
            totalLibrosPorCategoria,
            totalEjemplaresPorCategoria,
            totalPrestamosPorCategoria,
            porcentajeCategorias
        }
    }

    async obtenerEstadisticasLibro(id){
        if(!id || !isValidObjectId(id)){
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

}
module.exports = new EstadisticasService()