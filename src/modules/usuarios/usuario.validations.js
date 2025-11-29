// Validaciones para el módulo de usuarios

const isValidObjectId = require("mongoose").Types.ObjectId.isValid;

module.exports.validarCreacionUsuario = (req, res, next) => {
  const { nombre, email, password, rol } = req.body;
  const errores = [];
    // Validar nombre
    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
        errores.push("El nombre es requerido y debe ser una cadena no vacía");
    }

    // Validar email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email || !emailRegex.test(email)) {
        errores.push("El email es requerido y debe tener un formato válido");
    }
    // Validar password
    if (!password || typeof password !== "string" || password.length < 6) {
        errores.push("La contraseña es requerida y debe tener al menos 6 caracteres");
    }
    // Validar rol
    const rolesValidos = ["estudiante", "profesor", "admin"];
    if (rol && !rolesValidos.includes(rol)) {
        errores.push(`El rol debe ser uno de los siguientes: ${rolesValidos.join(", ")}`);
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

module.exports.validarEdicionUsuario = (req, res, next) => {
  const { nombre, email, password, rol } = req.body;
  const errores = [];
    // Validar nombre
    if (nombre && (typeof nombre !== "string" || nombre.trim().length === 0)) {
        errores.push("Si se proporciona, el nombre debe ser una cadena no vacía");
    }
    // Validar email
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (email && !emailRegex.test(email)) {
        errores.push("Si se proporciona, el email debe tener un formato válido");
    }
    // Validar password
    if (password && (typeof password !== "string" || password.length < 6)) {
        errores.push("Si se proporciona, la contraseña debe tener al menos 6 caracteres");
    }
    // Validar rol
    const rolesValidos = ["estudiante", "profesor", "admin"];
    if (rol && !rolesValidos.includes(rol)) {
        errores.push(`Si se proporciona, el rol debe ser uno de los siguientes: ${rolesValidos.join(", ")}`);
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

