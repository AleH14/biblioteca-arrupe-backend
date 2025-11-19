// src/modules/libro/libro.repository.js
// Encargado de acceso a datos. Solo gestiona consultas de libros.

const Libro = require("./libro.model");

const LibroRepository = {

    // Operaciones CRUD básicas
    findAll: () => Libro.find().populate('categoria'),
    findById: (id) => Libro.findById(id).populate('categoria'),
    create: (data) => Libro.create(data),
    update: (id, data) => Libro.findByIdAndUpdate(id, data, { new: true }),
    remove: (id) => Libro.findByIdAndDelete(id),

    //Búsquedas adicionales
    findByISBN: (isbn) => Libro.findOne({ isbn }).populate('categoria'),
    findByAuthor: (author) => Libro.find({ autor: new RegExp(author, 'i') }).populate('categoria'),
    findByTitle: (title) => Libro.find({ titulo: new RegExp(title, 'i') }).populate('categoria'),
    findbyCategory: (category) => Libro.find({ categoria: category }).populate('categoria'),
    findByEjemplarId: (ejemplarId) => Libro.findOne({ "ejemplares._id": ejemplarId }).populate('categoria'),
    
    // Gestión de ejemplares
    addEjemplar: (libroId, ejemplarData) =>
        Libro.findByIdAndUpdate(
            libroId,
            { $push: { ejemplares: ejemplarData } },
            { new: true }
        ),
    removeEjemplar: (libroId, ejemplarId) =>
        Libro.findByIdAndUpdate(
            libroId,
            { $pull: { ejemplares: { _id: ejemplarId } } },
            { new: true }
        )


};

module.exports = LibroRepository;
