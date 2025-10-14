// src/modules/libro/categoria/categoria.repository.js
// Encargado de acceso a datos. Solo gestiona consultas de categoria.

const Categoria = require("./categoria.model");

const CategoriaRepository = {
  findAll: () => Categoria.find(),
  findById: (id) => Categoria.findById(id),
  create: (data) => Categoria.create(data),
  update: (id, data) => Categoria.findByIdAndUpdate(id, data, { new: true }),
  remove: (id) => Categoria.findByIdAndDelete(id)
};

module.exports = CategoriaRepository;
