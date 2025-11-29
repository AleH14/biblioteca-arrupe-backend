const LibroService = require("./libro.service");

exports.getLibros = async (req, res, next) => {
  try {
    const filtros = req.query;
    const libros = await LibroService.getLibros(filtros);
    res.json({success: true, data: libros});
  } catch (err) {
    next(err);
  }
};

exports.getLibroById = async (req, res, next) => {
  try {
    const libro = await LibroService.getLibroById(req.params.id);
    res.json({success: true, data: libro});
  } catch (err) {
    next(err);
  }
};
exports.createLibro = async (req, res, next) => {
  try {
    const newLibro = await LibroService.createLibro(req.body);
    res.status(201).json({success: true, data: newLibro});
  } catch (err) {
    next(err);
  }
};

exports.updateLibro = async (req, res, next) => {
  try {
    const updatedLibro = await LibroService.updateLibro(req.params.id, req.body);
    res.json({success: true, data: updatedLibro});
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
    res.status(201).json({success: true, data: updatedLibro});
  } catch (err) {
    next(err);
  }
};

exports.removeEjemplar = async (req, res, next) => {
  try {
    const updatedLibro = await LibroService.removeEjemplar(req.params.libroId, req.params.ejemplarId);
    res.json({success: true, data: updatedLibro});
  } catch (err) {
    next(err);
  }
};

// Gestión de categorías 

exports.getAllCategorias = async (req, res, next) => {
  try {
    const categorias = await LibroService.getAllCategorias();
    res.json({success: true, data: categorias});
  } catch (err) {
    next(err);
  }
};

exports.createCategoria = async (req, res, next) => {
  try {
    const newCategoria = await LibroService.createCategoria(req.body);
    res.status(201).json({success: true, data: newCategoria});
  } catch (err) {
    next(err);
  }
};

exports.getCategoriaById = async (req, res, next) => {
  try {
    const categoria = await LibroService.getCategoriaById(req.params.id);
    res.json({success: true, data: categoria});
  } catch (err) {
    next(err);
  }
};

exports.updateCategoria = async (req, res, next) => {
  try {
    const updatedCategoria = await LibroService.updateCategoria(req.params.id, req.body);
    res.json({success: true, data: updatedCategoria});
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
    