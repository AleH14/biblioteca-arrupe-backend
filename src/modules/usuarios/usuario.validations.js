const UsuarioRepository = require("./usuario.repository");

// -----------------------------------
// Helpers de validación
// -----------------------------------

async function validarNombre(nombre, errores) {
    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
        errores.push("El nombre es requerido y debe ser una cadena no vacía");
        return;
    }

    const usuarioPorNombre = await UsuarioRepository.findByName(nombre);
    if (usuarioPorNombre.length > 0) {
        errores.push("El nombre ya está en uso");
    }
}

async function validarEmail(email, errores) {
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!email || !emailRegex.test(email)) {
        errores.push("El email es requerido y debe tener un formato válido");
        return;
    }

    const usuarioPorEmail = await UsuarioRepository.findByEmail(email);
    if (usuarioPorEmail.length > 0) {
        errores.push("El email ya está en uso");
    }
}

function validarPassword(password, errores) {
    if (!password || typeof password !== "string" || password.length < 6) {
        errores.push("La contraseña es requerida y debe tener al menos 6 caracteres");
    }
}

function validarRol(rol, errores) {
    const rolesValidos = ["estudiante", "profesor", "admin"];

    if (!rol || !rolesValidos.includes(rol)) {
        errores.push(`El rol es requerido y debe ser uno de los siguientes: ${rolesValidos.join(", ")}`);
    }
}

// -----------------------------------
// Middlewares exportados
// -----------------------------------

module.exports.validarCreacionUsuario = async (req, res, next) => {
    const { nombre, email, password, rol } = req.body;
    const errores = [];

    await validarNombre(nombre, errores);
    await validarEmail(email, errores);
    validarPassword(password, errores);
    validarRol(rol, errores);

    if (errores.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Datos de entrada inválidos",
            errores
        });
    }

    next();
};


module.exports.validarEdicionUsuario = async (req, res, next) => {
    const { nombre, email, password, rol } = req.body;
    const errores = [];

    if (nombre) await validarNombre(nombre, errores);
    if (email) await validarEmail(email, errores);
    if (password) validarPassword(password, errores);
    if (rol) validarRol(rol, errores);

    if (errores.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Datos de entrada inválidos",
            errores
        });
    }

    next();
};
