const mongoose = require("mongoose");

const notificacionSchema = new mongoose.Schema({
  asunto: { type: String, required: true },
  fechaEnvio: { type: Date, required: true },
  mensaje: { type: String, required: true }
}, { _id: true });

const reservaSchema = new mongoose.Schema({
  fechaReserva: { type: Date, required: true, default: Date.now },
  fechaExpiracion: { type: Date, required: true }
}, { _id: false });

const prestamoSchema = new mongoose.Schema({

  // 🔵 ID del libro al que pertenece el ejemplar
  libroId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Libro",
    required: true
  },

  // 🔵 ID del ejemplar (subdocumento dentro de Libro)
  ejemplarId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  usuarioId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Usuario",
    required: true 
  },

  estado: { 
    type: String, 
    enum: ["activo", "reserva", "cerrado", "atrasado", "cancelado"], 
    default: "activo" 
  },

  reserva: { type: reservaSchema, default: null },

  fechaPrestamo: { type: Date, required: true, default: Date.now },
  fechaDevolucionEstimada: { type: Date, required: true },
  fechaDevolucionReal: { type: Date, default: null },

  notificaciones: { 
    type: [notificacionSchema], 
    default: [] 
  },

  tipoPrestamo: { 
    type: String, 
    enum: ["estudiante", "docente", "otro"],
    required: true 
  }

}, { timestamps: true });

module.exports = mongoose.model("Prestamo", prestamoSchema);
