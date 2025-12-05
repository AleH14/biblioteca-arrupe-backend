// src/module/estadisticas/estadisticas.controller.js
const EstadisticasService = require("./estadisticas.service");

exports.getMetricas = async (req, res, next) => {
    try {
        const periodo = req.query.periodo;
        const metricas = await EstadisticasService.obtenerMetricas(periodo);
        res.json({
          success: true,
          data: metricas,
        });
      } catch (err) {
        next(err);
      }
}

exports.getTendencias = async (req, res, next) => {
    try {
        const periodo = req.query.periodo;
        const tendencias = await EstadisticasService.obtenerTendencias(periodo);
        res.json({
          success: true,
          data: tendencias,
        });
      } catch (err) {
        next(err);
      }
}

exports.getLibrosPorOrden = async (req, res, next) => {
    try {
        const orden = req.query.orden;
        const limite = req.query.limite;
        const resultado = await EstadisticasService.obtenerLibrosPorOrden(orden, limite);
        res.json({
          success: true,
          data: resultado,
        });
      } catch (err) {
        next(err);
      }
}


exports.getMetricasCategoria = async (req, res, next) => {
    try {
        const resultado = await EstadisticasService.obtenerMetricasCategoria();
        res.json({
          success: true,
          data: resultado,
        });
      } catch (err) {
        next(err);
      }
}


exports.getEstadisticasLibro = async (req, res, next) => {
    try {
        const id = req.query.id;
        const resultado = await EstadisticasService.obtenerEstadisticasLibro(id);
        res.json({
          success: true,
          data: resultado,
        });
      } catch (err) {
        next(err);
      }
}
