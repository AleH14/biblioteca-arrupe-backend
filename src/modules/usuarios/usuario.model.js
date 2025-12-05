// src/modules/usuarios/usuario.model.js  
const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    match: [/^\S+@\S+\.\S+$/, "El formato del email no es válido"] 
  },
  password: { type: String, required: true }, // debería ir cifrado con bcrypt u otro método
  telefono: { type: String, default: null },
  rol: { 
    type: String, 
    enum: ["estudiante", "profesor", "admin"], 
    default: "estudiante" 
  },
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Usuario", usuarioSchema);
