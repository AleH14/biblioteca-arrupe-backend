// src/modules/auth/auth.repository.js
// Encargado de acceso a datos. No debe conocer ni bcrypt ni JWT;
// solo gestiona consultas a Usuario y RefreshToken.
const RefreshToken = require("./auth.model");

const AuthRepository = {

  // ========================
  // REFRESH TOKENS
  // ========================

  createRefreshToken: async (data) => {
    return await RefreshToken.create(data);
  },

  /**
   * Revoca el refresh token activo más reciente de un usuario
   */
  revocarUltimoRefreshToken: async (
    usuarioId,
    fechaRevocacion = new Date(),
    reemplazadoPor = null
  ) => {
    return await RefreshToken.findOneAndUpdate(
      {
        usuarioId,
        fechaRevocacion: { $exists: false }
      },
      {
        $set: {
          fechaRevocacion,
          ...(reemplazadoPor && { reemplazadoPor })
        }
      },
      {
        sort: { createdAt: -1 },
        new: true
      }
    );
  },

  /**
   * Obtiene el refresh token ACTIVO del usuario:
   * - no revocado
   * - no expirado
   */
  findRefreshTokenActivo: async (usuarioId) => {
    return await RefreshToken.findOne({
      usuarioId,
      fechaRevocacion: { $exists: false },
      fechaExpiracion: { $gt: new Date() }
    }).sort({ createdAt: -1 });
  },

  /**
   * Elimina todos los refresh tokens antiguos,
   * manteniendo solo los 2 más recientes
   */
  limpiarTokensAntiguos: async (usuarioId) => {
    const tokensAntiguos = await RefreshToken.find({ usuarioId })
      .sort({ createdAt: -1 })
      .skip(2)
      .select("_id");

    if (!tokensAntiguos.length) return;

    await RefreshToken.deleteMany({
      _id: { $in: tokensAntiguos.map(t => t._id) }
    });
  },

  /**
   * Revoca TODOS los refresh tokens del usuario (logout global)
   */
  revocarTodosLosTokens: async (usuarioId, fechaRevocacion = new Date()) => {
    return await RefreshToken.updateMany(
      {
        usuarioId,
        fechaRevocacion: { $exists: false }
      },
      {
        $set: { fechaRevocacion }
      }
    );
  },

  findbyHashToken: async (tokenHash) => {return await RefreshToken.findOne({ tokenHash });}
};

module.exports = AuthRepository;
