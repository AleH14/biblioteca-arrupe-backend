const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  infoDispositivo: {
    ip: String,
    userAgent: String,
  },
  fechaExpiracion: {
    type: Date,
    required: true,
    index: { expires: 0 }   
  },
  reemplazadoPor: {
    type: String,
  },
  fechaRevocacion: {
    type: Date,
  }
},
{
  timestamps: true,
});

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
