exports.validarPeriodo = async (req, res, next) => {
    const periodo = req.query.periodo;
    if (!periodo) {
        const error = new Error("Debe seleccionar periodo: anual, mensual, hoy");
        error.status = 400;
        throw error;
    }
    next();
}