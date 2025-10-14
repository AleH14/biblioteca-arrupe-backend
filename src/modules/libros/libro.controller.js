const LibroService = require("./libro.service");

exports.getLibros = async (req, res) => {
  try {
    const filtros = req.query;
    const libros = await LibroService.getLibros(filtros);
    res.json(libros);
  } catch (err) {
    console.error("Error fetching libros:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
};

exports.getLibroById = async (req, res) => {
  try {
    const libro = await LibroService.getLibroById(req.params.id);
    res.json(libro);
  } catch (err) {
    console.error("Error fetching libro:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};
exports.createLibro = async (req, res) => {
  try {
    const newLibro = await LibroService.createLibro(req.body);
    res.status(201).json(newLibro);
  } catch (err) {
    console.error("Error creating libro:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};

exports.updateLibro = async (req, res) => {
  try {
    const updatedLibro = await LibroService.updateLibro(req.params.id, req.body);
    res.json(updatedLibro);
  } catch (err) {
    console.error("Error updating libro:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};

exports.deleteLibro = async (req, res) => {
  try {
    await LibroService.deleteLibro(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting libro:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};

// Gestión de ejemplares

exports.addEjemplar = async (req, res) => {
  try {
    const updatedLibro = await LibroService.addEjemplar(req.params.libroId, req.body);
    res.status(201).json(updatedLibro);
  } catch (err) {
    console.error("Error adding ejemplar:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};

exports.removeEjemplar = async (req, res) => {
  try {
    const updatedLibro = await LibroService.removeEjemplar(req.params.libroId, req.params.ejemplarId);
    res.json(updatedLibro);
  } catch (err) {
    console.error("Error removing ejemplar:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};

// Gestión de categorías 

exports.getAllCategorias = async (req, res) => {
  try {
    const categorias = await LibroService.getAllCategorias();
    res.json(categorias);
  } catch (err) {
    console.error("Error fetching categorias:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
};

exports.createCategoria = async (req, res) => {
  try {
    const newCategoria = await LibroService.createCategoria(req.body);
    res.status(201).json(newCategoria);
  } catch (err) {
    console.error("Error adding categoria:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};

exports.getCategoriaById = async (req, res) => {
  try {
    const categoria = await LibroService.getCategoriaById(req.params.id);
    res.json(categoria);
  } catch (err) {
    console.error("Error fetching categoria:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};

exports.updateCategoria = async (req, res) => {
  try {
    const updatedCategoria = await LibroService.updateCategoria(req.params.id, req.body);
    res.json(updatedCategoria);
  } catch (err) {
    console.error("Error updating categoria:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};

exports.deleteCategoria = async (req, res) => {
  try {
    await LibroService.deleteCategoria(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("Error deleting categoria:", err);
    res.status(err.status || 500).json({ message: err.message || "Error del servidor" });
  }
};
    