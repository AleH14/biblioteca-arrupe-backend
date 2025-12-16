// src/modules/auth/auth.service.js
// Contiene la lógica de negocio del login: validaciones, comparación de contraseñas y generación del token.
// No maneja req ni res — solo datos y errores.

const AuthRepository = require("./auth.repository");
const UsuarioRepository = require("../usuarios/usuario.repository");
const AuthUtils = require("./auth.utils");
const {comparePassword} = require("../../core/utils/hash");

const JWT_SECRET = process.env.JWT_SECRET;

const AuthService = {
  //Inicio de sesión
  async login(email, password, ip, userAgent) {
    if (!email || !password) {
      const error = new Error("Email y password son requeridos");
      error.status = 400;
      throw error;
    }

    const usuario = await UsuarioRepository.findByEmailExact(email);
    if (!usuario) {
      const error = new Error("Credenciales inválidas");
      error.status = 401;
      throw error;
    }

    const match = await comparePassword(password, usuario.password);
    if (!match) {
      const error = new Error("Credenciales inválidas");
      error.status = 401;
      throw error;
    }

    if (!JWT_SECRET) {
      const error = new Error("JWT_SECRET no está configurado en el entorno del servidor");
      error.status = 500;
      throw error;
    }

    return await AuthUtils.refreshToken(usuario, ip, userAgent);

  },


  // Refrescar token de sesión
  async refreshToken(refreshToken, ip, userAgent){
    if(!refreshToken){
      const error = new Error("Refresh token no entregado");
      error.status = 400;
      throw error;
    }

    const givenToken = AuthUtils.hashToken(refreshToken)
    const savedToken = await AuthRepository.findbyHashToken(givenToken)
    if(!savedToken){
      const error = new Error("Refresh token no válido");
      error.status = 401;
      throw error;
    }
    if(savedToken.fechaRevocacion){
      const error = new Error("Refresh token no válido");
      error.status = 401;
      throw error;
    }
    if(new Date() > savedToken.fechaExpiracion){
      const error = new Error("Refresh token no válido");
      error.status = 401;
      throw error;
    }

    const usuario = await UsuarioRepository.findById(savedToken.usuarioId);
    if (!usuario) {
      const error = new Error("Refresh token no válido");
      error.status = 401;
      throw error;
    }
    
    return await AuthUtils.refreshToken(usuario, ip, userAgent);

  },

  // Cierre de sesión
  async logout(usuarioId){
    const usuario = await UsuarioRepository.findById(usuarioId);
    if (!usuario) {
      const error = new Error("Token no válido");
      error.status = 401;
      throw error;
    }
    // Revocamos los tokens
    AuthRepository.revocarTodosLosTokens(usuarioId);
    // El access token es eliminado desde el frontend
    return{
      user: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      }
    }
  }
};


module.exports = AuthService;
