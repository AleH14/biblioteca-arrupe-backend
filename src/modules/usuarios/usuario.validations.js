const UsuarioRepository = require("./usuario.repository");

// -----------------------------------
// Helpers de validación
// -----------------------------------

async function validarNombre(nombre, errores) {
    if (!nombre || typeof nombre !== "string" || nombre.trim().length === 0) {
        errores.push("El nombre es requerido y debe ser una cadena no vacía");
        return;
    }

    const usuarioPorNombre = await UsuarioRepository.findByNameExact(nombre);
    if (usuarioPorNombre) {
        errores.push("El nombre ya está en uso");
    }
}

async function validarEmail(email, errores) {
    const emailRegex = /^\S+@\S+\.\S+$/;

    if (!email || !emailRegex.test(email)) {
        errores.push("El email es requerido y debe tener un formato válido");
        return;
    }

    const usuarioPorEmail = await UsuarioRepository.findByEmailExact(email);
    if (usuarioPorEmail) {
        errores.push("El email ya está en uso");
    }
}

function validarPassword(password, errores) {
    if (!password || typeof password !== "string" || password.length < 6) {
        errores.push("La contraseña es requerida y debe tener al menos 6 caracteres");
    }
}

function validarRol(rol, rolActual, errores) {
    const rolesValidos = ["estudiante", "profesor", "admin"];

    if(rolActual !== 'admin'){
        errores.push(`Solo un administrador puede modificar el rol del usuario`);
    }
    else if (!rol || !rolesValidos.includes(rol)) {
        errores.push(`El rol es requerido y debe ser uno de los siguientes: ${rolesValidos.join(", ")}`);
    }
}

function validarTelefono(telefono, errores) {
  const regex = /^\d{4}-\d{4}$/;
  if (!regex.test(telefono)) {
    errores.push("El teléfono debe tener el formato ####-####");
  }
}


// -----------------------------------
// Middlewares exportados
// -----------------------------------

module.exports.validarCreacionUsuario = async (req, res, next) => {
    const { nombre, email, password, rol, telefono } = req.body;
    const errores = [];

    await validarNombre(nombre, errores);
    await validarEmail(email, errores);
    validarPassword(password, errores);
    validarRol(rol, req.user.rol, errores);
    if(telefono) validarTelefono(telefono, errores);

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
    const { nombre, email, password, rol, telefono, activo} = req.body;
    const errores = [];
    const usuarioExistente = await UsuarioRepository.findById(req.params.id) || await UsuarioRepository.findById(req.user.sub);
    if (!usuarioExistente) {
        return res.status(404).json({
            success: false,
            message: "Usuario no encontrado"
        });
    }

    // Validar solo los campos que se están editando
    if (nombre != usuarioExistente.nombre) await validarNombre(nombre, errores);
    if (email != usuarioExistente.email) await validarEmail(email, errores);
    if (password) validarPassword(password, errores);
    if (rol) validarRol(rol, req.user.rol, errores);  
    if (telefono) validarTelefono(telefono, errores);
    if(activo && req.user.rol != "admin") 
        errores.push(`Solo un administrador puede modificar el estado del usuario`)

    if (errores.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Datos de entrada inválidos",
            errores
        });
    }

    next();
};
