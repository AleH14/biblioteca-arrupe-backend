// src/modules/libros/categoria/categoria.model.js
// Define el modelo de datos para categorías.

const mongoose = require("mongoose");

const categoriaSchema = new mongoose.Schema({
  descripcion: { type: String, required: true }
}, { _id: true }); // no necesitamos _id adicional aquí

module.exports = mongoose.model("Categoria", categoriaSchema);
