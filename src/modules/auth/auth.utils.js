const crypto = require('crypto');
const AuthRepository = require('./auth.repository');
const ACCESS_JWT_EXPIRES_IN = process.env.ACCESS_JWT_EXPIRES_IN || "15min";
const REFRESH_JWT_EXPIRES_IN = process.env.REFRESH_JWT_EXPIRES_IN || "7d";
const jwt = require("jsonwebtoken");
const ms = require("ms");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set. Set in environment for production.");
}

function generarFechaExpiracion(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) {
    const error = new Error(`Formato inválido de expiración: ${expiresIn}`);
    error.status = 500;
    throw error;
  }

  const valor = parseInt(match[1], 10);
  const unidad = match[2];

  const multiplicadores = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return new Date(Date.now() + valor * multiplicadores[unidad]);
}

exports.generarRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex"); // 128 chars
};

exports.hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

exports.refreshToken = async (usuario, ip, userAgent) => {
    // Revocar token anterior
    await AuthRepository.revocarUltimoRefreshToken(usuario._id);

    // Crear refreshToken 
    const refreshToken = this.generarRefreshToken();
    const hashedRefreshToken = this.hashToken(refreshToken);

    // Definir fecha de expiración
    const fechaExpiracion = generarFechaExpiracion(REFRESH_JWT_EXPIRES_IN)

    //Guardar el refreshToken
    await AuthRepository.createRefreshToken({
      usuarioId: usuario._id,
      tokenHash: hashedRefreshToken,
      infoDispositivo:{
        ip, 
        userAgent
      },
      fechaExpiracion: fechaExpiracion
    })

    // Limpiar refreshTokens antiguos
    await AuthRepository.limpiarTokensAntiguos(usuario._id)

    const payload = {
      sub: usuario._id.toString(),
      email: usuario.email,
      rol: usuario.rol,
    };

    // Generar accessToken
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_JWT_EXPIRES_IN });

    const json = {
      accessToken,
      user: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    }

    const cookies = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        path: "/",  // Cambiar de /api/auth/refreshToken a / para desarrollo
        maxAge: ms(REFRESH_JWT_EXPIRES_IN)
    }

    return {
    json,
    cookies,
    refreshToken
    };
};