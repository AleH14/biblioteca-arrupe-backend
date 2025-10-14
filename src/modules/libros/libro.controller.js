const LibroService = require("./libro.service");

exports.getLibros = async (req, res, next) => {
  try {
    const filtros = req.query;
    const libros = await LibroService.getLibros(filtros);
    res.json(libros);
  } catch (err) {
    next(err);
  }
};

exports.getLibroById = async (req, res, next) => {
  try {
    const libro = await LibroService.getLibroById(req.params.id);
    res.json(libro);
  } catch (err) {
    next(err);
  }
};
exports.createLibro = async (req, res, next) => {
  try {
    const newLibro = await LibroService.createLibro(req.body);
    res.status(201).json(newLibro);
  } catch (err) {
    next(err);
  }
};

exports.updateLibro = async (req, res, next) => {
  try {
    const updatedLibro = await LibroService.updateLibro(req.params.id, req.body);
    res.json(updatedLibro);
  } catch (err) {
    next(err);
  }
};

exports.deleteLibro = async (req, res, next) => {
  try {
    await LibroService.deleteLibro(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// Gestión de ejemplares

exports.addEjemplar = async (req, res, next) => {
  try {
    const updatedLibro = await LibroService.addEjemplar(req.params.libroId, req.body);
    res.status(201).json(updatedLibro);
  } catch (err) {
    next(err);
  }
};

exports.removeEjemplar = async (req, res, next) => {
  try {
    const updatedLibro = await LibroService.removeEjemplar(req.params.libroId, req.params.ejemplarId);
    res.json(updatedLibro);
  } catch (err) {
    next(err);
  }
};

// Gestión de categorías 

exports.getAllCategorias = async (req, res, next) => {
  try {
    const categorias = await LibroService.getAllCategorias();
    res.json(categorias);
  } catch (err) {
    next(err);
  }
};

exports.createCategoria = async (req, res, next) => {
  try {
    const newCategoria = await LibroService.createCategoria(req.body);
    res.status(201).json(newCategoria);
  } catch (err) {
    next(err);
  }
};

exports.getCategoriaById = async (req, res, next) => {
  try {
    const categoria = await LibroService.getCategoriaById(req.params.id);
    res.json(categoria);
  } catch (err) {
    next(err);
  }
};

exports.updateCategoria = async (req, res, next) => {
  try {
    const updatedCategoria = await LibroService.updateCategoria(req.params.id, req.body);
    res.json(updatedCategoria);
  } catch (err) {
    next(err);
  }
};

exports.deleteCategoria = async (req, res, next) => {
  try {
    await LibroService.deleteCategoria(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
    