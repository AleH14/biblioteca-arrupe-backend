// src/modules/usuarios/usuario.service.js
const UsuarioRepository = require("./usuario.repository");
const hash = require("../../core/utils/hash");

class UsuarioService {

    // Regresar todo menos contraseña
    _sanitizeUsuario(usuario) {
        if (!usuario) return null;
        const usuarioObj = usuario.toObject();
        delete usuarioObj.password;
        return usuarioObj;
    }


    // Crear un nuevo usuario
    async crearUsuario(data) {
        // Hash de la contraseña antes de guardar
        if(data.password){
            data.password = await hash.hashPassword(data.password);
        }
        else
        {
            throw new Error("La contraseña es obligatoria");
        }

        const usuario = await UsuarioRepository.create(data);
        return this._sanitizeUsuario(usuario);
    }

    // Buscar usuarios por nombre o email
    async buscarUsuarios(query) {
        const { nombre, email } = query;
        let usuarios;
        if (nombre) {
            usuarios = await UsuarioRepository.findByName(nombre);
        } else if (email) {
            usuarios = await UsuarioRepository.findByEmail(email);
        } else {
            usuarios = await UsuarioRepository.findAll();
        }

        usuarios = Promise.all(usuarios.map(u => this._sanitizeUsuario(u)));
        return usuarios;
    }

    // Obtener usuario por ID
    async obtenerUsuarioById(id) {
        const usuario = await UsuarioRepository.findById(id);
        if (!usuario) {
            const error = new Error("Usuario no encontrado");
            error.status = 404;
            throw error;
        }
        return this._sanitizeUsuario(usuario);
    }

    // Editar usuario por ID
    async editarUsuario(id, data) {
        if(data.password){
            data.password = await hash.hashPassword(data.password);
        }
        const usuario = await UsuarioRepository.update(id, data);
        if (!usuario) {
            const error = new Error("Usuario no encontrado");
            error.status = 404;
            throw error;
        }
        return this._sanitizeUsuario(usuario);
    }



    // Deshabilitar usuario por ID
    async deshabilitarUsuario(id) {
        const usuario = await UsuarioRepository.disable(id);
        if (!usuario) {
            const error = new Error("Usuario no encontrado");
            error.status = 404;
            throw error;
        }
        return this._sanitizeUsuario(usuario);
    }
}

module.exports = new UsuarioService();
