// src/modules/libros/libro.model.js
const mongoose = require("mongoose");

const ejemplarSchema = new mongoose.Schema({
  cdu: { type: String, required: true },
  estado: { 
    type: String, 
    enum: ["disponible", "prestado", "reservado", "fuera de servicio"], 
    default: "disponible" 
  },
  ubicacionFisica: { type: String},
  edificio: { type: String},
  origen: { type: String, enum: ["Comprado", "Donado"], required: true },
  precio: { type: Number, min: 0 },
  donado_por: { type: String }
}, { _id: true }); // Mongoose crea _id automático


const libroSchema = new mongoose.Schema({
  autor: { type: String, required: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: "Categoria", required: true },
  ejemplares: { type: [ejemplarSchema], default: [] },
  fechaRegistro: { type: Date, default: Date.now },
  imagenURL: { type: String, default: null },
  isbn: { type: String, required: true, unique: true },
  editorial: { type: String },
  titulo: { type: String, required: true },
  disponibilidad: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Libro", libroSchema);
