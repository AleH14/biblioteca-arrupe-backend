// src/modules/libro/libro.repository.js
// Encargado de acceso a datos. Solo gestiona consultas de libros.

const { set } = require("../../config/app");
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
        ),

    findAvailableEjemplares: async (libroId) => {
        const libro = await Libro.findById(libroId);
        if (!libro) {
            return [];
        }
        return libro.ejemplares.filter(ejemplar => ejemplar.estado === 'disponible');
    },

    findEjemplarbyId: async (ejemplarId) => {
        const libro = await Libro.findOne({ "ejemplares._id": ejemplarId });
        if (!libro) {
            return null;
        }
        return libro.ejemplares.id(ejemplarId);
    },

    // Disponibilidad de libro

    isLibroDisponible: async (libroId) => {
        const libro = await Libro.findById(libroId);
        if (!libro) {
            return false;
        }
        return libro.ejemplares.some(ejemplar => ejemplar.estado === 'disponible');
    },

    setLibroDisponibilidad: async (libroId, disponibilidad) => {
        return await Libro.findByIdAndUpdate(
            libroId,
            { disponibilidad: disponibilidad },
            { new: true }
        );
    },

    setEjemplarDisponibilidad: async (ejemplarId, nuevoEstado) => {
    // 1. Buscar el libro al que pertenece el ejemplar
    const libro = await Libro.findOne({ "ejemplares._id": ejemplarId });
    if (!libro) return null;

    // 2. Actualizar estado del ejemplar dentro del array
    const libroActualizado = await Libro.findOneAndUpdate(
        { _id: libro._id, "ejemplares._id": ejemplarId },
        { $set: { "ejemplares.$.estado": nuevoEstado } },
        { new: true }
    );

    // 3. Comprobar si quedan ejemplares disponibles
    const ejemplaresDisponibles = libroActualizado.ejemplares.some(
        e => e.estado === "disponible"
    );

    // 4. Actualizar disponibilidad del libro
    await LibroRepository.setLibroDisponibilidad(
        libro._id,
        ejemplaresDisponibles
    );

    // 5. Devolver el libro actualizado
    return libroActualizado;
}


};

module.exports = LibroRepository;
