// src/modules/libro/libro.service.js
// Contiene la lógica de negocio del catalogo: validaciones, consultas y actualizaciones.
// No maneja req ni res — solo datos y errores.

const LibroRepository = require("./libro.repository");
const CategoriaRepository = require("./categoria/categoria.repository");

const LibroService = {

    // Operaciones CRUD básicas
    getLibros: async (filtros) => {
        // si hay filtros, usa el método apropiado del repositorio
        if (filtros.isbn) return [await LibroRepository.findByISBN(filtros.isbn)];
        if (filtros.autor) return await LibroRepository.findByAuthor(filtros.autor);
        if (filtros.titulo) return await LibroRepository.findByTitle(filtros.titulo);
        if (filtros.categoria) return await LibroRepository.findbyCategory(filtros.categoria);


        // si no hay filtros, devuelve todo
        return await LibroRepository.findAll();
    },
    getLibroById: async (id) => {
        const libro = await LibroRepository.findById(id);
        if (!libro) {
            const error = new Error("Libro no encontrado");
            error.status = 404;
            throw error;
        }
        return libro;
    },
    createLibro: async (data) => {
        //validar datos obligatorios
        if (!data.titulo || !data.autor || !data.isbn || !data.categoria) {
            const error = new Error("Faltan datos obligatorios: titulo, autor, isbn, categoria");
            error.status = 400;
            throw error;
        }
        // Validar que la categoría exista
        const categoria = await CategoriaRepository.findById(data.categoria);
        if (!categoria) {
            const error = new Error("Categoría no encontrada");
            error.status = 400;
            throw error;
        }
        return await LibroRepository.create(data);
    },
    updateLibro: async (id, data) => {
        if (data.categoria) {
            const categoria = await CategoriaRepository.findById(data.categoria);
            if (!categoria) {
                const error = new Error("Categoría no encontrada");
                error.status = 400;
                throw error;
            }
        }
        const updatedLibro = await LibroRepository.update(id, data);
        if (!updatedLibro) {
            const error = new Error("Libro no encontrado");
            error.status = 404;
            throw error;
        }
        return updatedLibro;
    },
    deleteLibro: async (id) => {
        const deletedLibro = await LibroRepository.remove(id);
        if (!deletedLibro) {
            const error = new Error("Libro no encontrado");
            error.status = 404;
            throw error;
        }
        return deletedLibro;
    },


    // Gestión de ejemplares

    addEjemplar: async (libroId, ejemplarData) => {
        const libro = await LibroRepository.findById(libroId);
        if (!libro) {
            const error = new Error("Libro no encontrado");
            error.status = 404;
            throw error;
        }
        return await LibroRepository.addEjemplar(libroId, ejemplarData);
    },
    removeEjemplar: async (libroId, ejemplarId) => {
        const libro = await LibroRepository.findById(libroId);
        if (!libro) {
            const error = new Error("Libro no encontrado");
            error.status = 404;
            throw error;
        }
        const ejemplarExists = libro.ejemplares.some(e => e._id.toString() === ejemplarId);
        if (!ejemplarExists) {
            const error = new Error("Ejemplar no encontrado en este libro");
            error.status = 404;
            throw error;
        }
        return await LibroRepository.removeEjemplar(libroId, ejemplarId);
    },

    // Operaciones CRUD básicas de categorías
    getAllCategorias: async () => {
        return await CategoriaRepository.findAll();
    },
    getCategoriaById: async (id) => {
        const categoria = await CategoriaRepository.findById(id);
        if (!categoria) {
            const error = new Error("Categoría no encontrada");
            error.status = 404;
            throw error;
        }
        return categoria;
    },
    createCategoria: async (data) => {
        // Validar que no exista ya una categoría con la misma descripción
        const existingCategorias = await CategoriaRepository.findAll();
        if (existingCategorias.some(cat => cat.descripcion.toLowerCase() === data.descripcion.toLowerCase())) {
            const error = new Error("Ya existe una categoría con esa descripción");
            error.status = 400;
            throw error;
        }
        return await CategoriaRepository.create(data);
    },
    updateCategoria: async (id, data) => {
        const updatedCategoria = await CategoriaRepository.update(id, data);
        if (!updatedCategoria) {
            const error = new Error("Categoría no encontrada");
            error.status = 404;
            throw error;
        }
        // Validar que no exista ya una categoría con la misma descripción
        const existingCategorias = await CategoriaRepository.findAll();
        if (existingCategorias.some(cat => cat.descripcion.toLowerCase() === data.descripcion.toLowerCase() && cat._id.toString() !== id)) {
            const error = new Error("Ya existe una categoría con esa descripción");
            error.status = 400;
            throw error;
        }
        return updatedCategoria;
    },
    deleteCategoria: async (id) => {
        try {
            // Verificar que la categoría existe
            const categoria = await CategoriaRepository.findById(id);
            if (!categoria) {
                const error = new Error("Categoría no encontrada");
                error.status = 404;
                throw error;
            }

            // Verificar si hay libros asociados
            const librosConCategoria = await LibroRepository.findbyCategory(id);
            if (librosConCategoria.length > 0) {
                const error = new Error("No se puede eliminar la categoría porque hay libros asociados a ella");
                error.status = 400;
                throw error;
            }

            // Eliminar la categoría
            const deletedCategoria = await CategoriaRepository.remove(id);

            console.log(`Se elimino.....`);

            console.log(`Categoría ${deletedCategoria.descripcion} eliminada correctamente.`);
            return deletedCategoria;

        } catch (error) {
            console.error("Error en deleteCategoria:", error);
            throw error;
        }
    }
};

module.exports = LibroService;