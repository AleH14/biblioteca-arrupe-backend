const mongoose = require("mongoose");

const notificacionSchema = new mongoose.Schema({
  asunto: { type: String, required: true },
  fechaEnvio: { type: Date, required: true },
  mensaje: { type: String, required: true }
}, { _id: true }); // Cada notificación tendrá su propio _id

const prestamoSchema = new mongoose.Schema({
  ejemplarId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Libro", // referencia al subdocumento "ejemplar" dentro de libros
    required: true 
  },
  usuarioId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Usuario", // referencia a un usuario (asumiendo que existe un modelo Usuario)
    required: true 
  },
  estado: { 
    type: String, 
    enum: ["activo", "cerrado", "atrasado"], 
    default: "activo" 
  },
  fechaPrestamo: { type: Date, required: true, default: Date.now },
  fechaDevolucionEstimada: { type: Date, required: true },
  fechaDevolucionReal: { type: Date, default: null },
  notificaciones: { type: [notificacionSchema], default: [],
  tipoPrestamo: { 
    type: String, 
    enum: ["estudiante", "docente", "otro"],
    required: true 
  }
   }
}, { timestamps: true });

module.exports = mongoose.model("Prestamo", prestamoSchema);
