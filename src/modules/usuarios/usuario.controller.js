// src/modules/usuarios/usuario.controller.js
const UsuarioService = require('./usuario.service');

// Crear un nuevo usuario
exports.crearUsuario = async (req, res, next) => {
  try {
    const nuevoUsuario = await UsuarioService.crearUsuario(req.body);
    res.status(201).json({success: true, data:nuevoUsuario});
  } catch (err) {
    next(err);
  }
};

// Buscar usuarios por nombre o email
exports.buscarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await UsuarioService.buscarUsuarios(req.query);
    res.json({success: true, data: usuarios});
  } catch (err) {
    next(err);
  }
};

// Obtener usuario por ID
exports.obtenerUsuarioById = async (req, res, next) => {
  try {
    const usuario = await UsuarioService.obtenerUsuarioById(req.params.id);
    res.json({success: true, data: usuario});
  } catch (err) {
    next(err);
  }
};

// Editar usuario por ID
exports.editarUsuario = async (req, res, next) => {
  try {
    const usuarioActualizado = await UsuarioService.editarUsuario(req.params.id, req.body);
    res.json({success: true, data: usuarioActualizado});
  } catch (err) {
    next(err);
  }
};

// Deshabilitar usuario por ID
exports.deshabilitarUsuario = async (req, res, next) => {
  try {
    const usuarioDeshabilitado = await UsuarioService.deshabilitarUsuario(req.params.id);
    res.json({success: true, data: usuarioDeshabilitado});
  } catch (err) {
    next(err);
  }
};

// Obtener perfil del usuario autenticado
exports.obtenerPerfilAutenticado = async (req, res, next) => {
  try {
    const usuario = await UsuarioService.obtenerUsuarioById(req.user.sub);
    res.json({success: true, data: usuario});
  } catch (err) {
    next(err);
  }
};

// Editar perfil del usuario autenticado
exports.editarPerfilAutenticado = async (req, res, next) => {
  try {
    const usuarioActualizado = await UsuarioService.editarUsuario(req.user.sub, req.body);
    res.json({success: true, data: usuarioActualizado});
  } catch (err) {
    next(err);
  }
};