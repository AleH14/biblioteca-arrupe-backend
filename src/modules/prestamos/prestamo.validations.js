// Validaciones para el módulo de préstamos
const {isValidObjectId} = require("./../../core/middlewares/mongoose.middleware")

const validarCreacionPrestamo = (req, res, next) => {
  const { libroId, usuarioId, fechaDevolucionEstimada, tipoPrestamo } = req.body;
  const errores = [];

  // Validar libroId
  if (!libroId) {
    errores.push("El libroId es requerido");
  } else if (!isValidObjectId(libroId)) {
    errores.push("El libroId no es válido");
  }

  // Validar usuarioId
  if (!usuarioId) {
    errores.push("El usuarioId es requerido");
  } else if (!isValidObjectId(usuarioId)) {
    errores.push("El usuarioId no es válido");
  }

  //Validar tipo Prestamo
  const tiposValidos = ["estudiante", "docente", "otro"];
  if (!tipoPrestamo) {
    errores.push("El tipoPrestamo es requerido");
  } else if (!tiposValidos.includes(tipoPrestamo)) {
    errores.push(`El tipoPrestamo debe ser uno de los siguientes: ${tiposValidos.join(", ")}`);
  }

  // Validar fechaDevolucionEstimada si se proporciona
  if (fechaDevolucionEstimada) {
    const fecha = new Date(fechaDevolucionEstimada);
    if (isNaN(fecha.getTime())) {
      errores.push("La fechaDevolucionEstimada no es una fecha válida");
    } else if (fecha <= new Date()) {
      errores.push("La fechaDevolucionEstimada debe ser posterior a la fecha actual");
    }
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Datos de entrada inválidos",
      errores: errores
    });
  }

  next();
};

const validarCierrePrestamo = (req, res, next) => {
  const { id } = req.params;
  const errores = [];

  // Validar ID del préstamo
  if (!isValidObjectId(id)) {
    errores.push("El ID del préstamo no es válido");
  }

  // Validar fechaDevolucionReal si se proporciona
  if (req.body && req.body.fechaDevolucionReal) {
    const fecha = new Date(req.body.fechaDevolucionReal);
    if (isNaN(fecha.getTime())) {
      errores.push("La fechaDevolucionReal no es una fecha válida");
    }
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Datos de entrada inválidos",
      errores: errores
    });
  }

  next();
};

const validarEstado = (req, res, next) => {
  const { estado } = req.params;
  const estadosValidos = ['todos', 'activos', 'atrasados', 'cerrados'];

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({
      success: false,
      message: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`
    });
  }

  next();
};

const validarId = (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "ID no válido"
    });
  }

  next();
};

const validarCreacionPrestamoConBusqueda = (req, res, next) => {
  const { libroId, usuarioId, fechaPrestamo, fechaDevolucionEstimada, tipoPrestamo } = req.body;
  const errores = [];

  // Validar libroId
  if (!libroId) {
    errores.push("El libroId es requerido");
  } else if (!isValidObjectId(libroId)) {
    errores.push("El libroId no es válido");
  }

  // Validar usuarioId
  if (!usuarioId) {
    errores.push("El usuarioId es requerido");
  } else if (!isValidObjectId(usuarioId)) {
    errores.push("El usuarioId no es válido");
  }

  // Validar fechaPrestamo si se proporciona
  if (fechaPrestamo) {
    const fecha = new Date(fechaPrestamo);
    if (isNaN(fecha.getTime())) {
      errores.push("La fechaPrestamo no es una fecha válida");
    }
  }

  // Validar fechaDevolucionEstimada si se proporciona
  if (fechaDevolucionEstimada) {
    const fecha = new Date(fechaDevolucionEstimada);
    if (isNaN(fecha.getTime())) {
      errores.push("La fechaDevolucionEstimada no es una fecha válida");
    }
    
    // Validar que sea posterior a fechaPrestamo o fecha actual
    const fechaComparacion = fechaPrestamo ? new Date(fechaPrestamo) : new Date();
    if (fecha <= fechaComparacion) {
      errores.push("La fechaDevolucionEstimada debe ser posterior a la fecha de préstamo");
    }
  }

  //Validar tipo Prestamo
  const tiposValidos = ["estudiante", "docente", "otro"];
  if (!tipoPrestamo) {
    errores.push("El tipoPrestamo es requerido");
  } else if (!tiposValidos.includes(tipoPrestamo)) {
    errores.push(`El tipoPrestamo debe ser uno de los siguientes: ${tiposValidos.join(", ")}`);
  }

  if (errores.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Datos de entrada inválidos",
      errores: errores
    });
  }

  next();
};


module.exports = {
  validarCreacionPrestamo,
  validarCreacionPrestamoConBusqueda,
  validarCierrePrestamo,
  validarEstado,
  validarId
};