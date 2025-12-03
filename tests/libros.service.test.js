// libros.service.test.js
// Asume que este archivo está en la misma carpeta que libro.service.js
jest.mock("../src/modules/libros/libro.repository");
jest.mock("../src/modules/libros/categoria/categoria.repository");

const LibroService = require("../src/modules/libros/libro.service");
const LibroRepository = require("../src/modules/libros/libro.repository");
const CategoriaRepository = require("../src/modules/libros/categoria/categoria.repository");

describe("LibroService - unit tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("getLibros", () => {
    test("devuelve todos cuando no hay filtros", async () => {
      const all = [{ titulo: "A" }, { titulo: "B" }];
      LibroRepository.findAll.mockResolvedValue(all);

      const res = await LibroService.getLibros({});
      expect(LibroRepository.findAll).toHaveBeenCalled();
      expect(res).toBe(all);
    });

    test("filtra por ISBN usando findByISBN y devuelve array con el libro", async () => {
      const libro = { titulo: "Libro X", isbn: "123" };
      LibroRepository.findByISBN.mockResolvedValue(libro);

      const res = await LibroService.getLibros({ isbn: "123" });
      expect(LibroRepository.findByISBN).toHaveBeenCalledWith("123");
      expect(Array.isArray(res)).toBe(true);
      expect(res).toEqual([libro]);
    });

    test("filtra por autor usando findByAuthor", async () => {
      const expected = [{ titulo: "A" }];
      LibroRepository.findByAuthor.mockResolvedValue(expected);

      const res = await LibroService.getLibros({ autor: "autor" });
      expect(LibroRepository.findByAuthor).toHaveBeenCalledWith("autor");
      expect(res).toBe(expected);
    });

    test("filtra por título usando findByTitle", async () => {
      const expected = [{ titulo: "TituloX" }];
      LibroRepository.findByTitle.mockResolvedValue(expected);

      const res = await LibroService.getLibros({ titulo: "TituloX" });
      expect(LibroRepository.findByTitle).toHaveBeenCalledWith("TituloX");
      expect(res).toBe(expected);
    });

    test("filtra por categoría usando findbyCategory", async () => {
      const expected = [{ titulo: "CatBook" }];
      LibroRepository.findbyCategory.mockResolvedValue(expected);

      const res = await LibroService.getLibros({ categoria: "catid" });
      expect(LibroRepository.findbyCategory).toHaveBeenCalledWith("catid");
      expect(res).toBe(expected);
    });
  });

  describe("getLibroById", () => {
    test("devuelve libro cuando existe", async () => {
      const libro = { _id: "1", titulo: "X" };
      LibroRepository.findById.mockResolvedValue(libro);

      const res = await LibroService.getLibroById("1");
      expect(LibroRepository.findById).toHaveBeenCalledWith("1");
      expect(res).toBe(libro);
    });

    test("lanza error 404 cuando no existe", async () => {
      LibroRepository.findById.mockResolvedValue(null);

      await expect(LibroService.getLibroById("noex")).rejects.toMatchObject({
        message: "Libro no encontrado",
        status: 404,
      });
    });
  });

  describe("createLibro", () => {
    test("lanza 400 si faltan campos obligatorios", async () => {
      const datos = { titulo: "X", autor: "Y" }; // faltan isbn y categoria
      await expect(LibroService.createLibro(datos)).rejects.toMatchObject({
        message: "Faltan datos obligatorios: titulo, autor, isbn, categoria",
        status: 400,
      });
    });

    test("lanza 400 si la categoría no existe", async () => {
      const datos = { titulo: "X", autor: "Y", isbn: "111", categoria: "cat123" };
      CategoriaRepository.findById.mockResolvedValue(null);

      await expect(LibroService.createLibro(datos)).rejects.toMatchObject({
        message: "Categoría no encontrada",
        status: 400,
      });
      expect(CategoriaRepository.findById).toHaveBeenCalledWith("cat123");
    });

    test("crea libro cuando datos y categoría son válidos", async () => {
      const datos = { titulo: "X", autor: "Y", isbn: "111", categoria: "cat123" };
      const creado = { ...datos, _id: "lib1" };
      CategoriaRepository.findById.mockResolvedValue({ _id: "cat123", descripcion: "C" });
      LibroRepository.create.mockResolvedValue(creado);

      const res = await LibroService.createLibro(datos);
      expect(CategoriaRepository.findById).toHaveBeenCalledWith("cat123");
      expect(LibroRepository.create).toHaveBeenCalledWith(datos);
      expect(res).toBe(creado);
    });
  });

  describe("updateLibro", () => {
    test("lanza 400 si se pasa categoría que no existe", async () => {
      CategoriaRepository.findById.mockResolvedValue(null);
      const datos = { categoria: "no-cat" };

      await expect(LibroService.updateLibro("id1", datos)).rejects.toMatchObject({
        message: "Categoría no encontrada",
        status: 400,
      });
      expect(CategoriaRepository.findById).toHaveBeenCalledWith("no-cat");
    });

    test("lanza 404 si el Libro a actualizar no existe", async () => {
      CategoriaRepository.findById.mockResolvedValue({ _id: "c1" }); // si categoria viene, existe
      LibroRepository.update.mockResolvedValue(null);

      await expect(LibroService.updateLibro("id-no", { titulo: "nuevo" })).rejects.toMatchObject({
        message: "Libro no encontrado",
        status: 404,
      });
    });

    test("actualiza y devuelve el libro cuando todo es válido", async () => {
      CategoriaRepository.findById.mockResolvedValue({ _id: "c1" });
      const updated = { _id: "id1", titulo: "nuevo" };
      LibroRepository.update.mockResolvedValue(updated);

      const res = await LibroService.updateLibro("id1", { categoria: "c1", titulo: "nuevo" });
      expect(LibroRepository.update).toHaveBeenCalledWith("id1", { categoria: "c1", titulo: "nuevo" });
      expect(res).toBe(updated);
    });
  });

  describe("deleteLibro", () => {
    test("lanza 404 si libro no existe", async () => {
      LibroRepository.remove.mockResolvedValue(null);
      await expect(LibroService.deleteLibro("no")).rejects.toMatchObject({
        message: "Libro no encontrado",
        status: 404,
      });
    });

    test("elimina libro cuando existe", async () => {
      const removed = { _id: "ok", titulo: "X" };
      LibroRepository.remove.mockResolvedValue(removed);
      const res = await LibroService.deleteLibro("ok");
      expect(LibroRepository.remove).toHaveBeenCalledWith("ok");
      expect(res).toBe(removed);
    });
  });

  describe("ejemplares", () => {
    test("addEjemplar lanza 400 si faltan datos del ejemplar", async () => {
      // falta cdu/estado/origen
      await expect(LibroService.addEjemplar("lib", { cdu: "1" })).rejects.toMatchObject({
        message: "Faltan datos obligatorios del ejemplar: cdu, estado, ubicacionFisica, edificio, origen",
        status: 400,
      });
    });

    test("addEjemplar lanza 404 si libro no existe", async () => {
      LibroRepository.findById.mockResolvedValue(null);
      const ejemplar = { cdu: "1", estado: "nuevo", origen: "donacion" };

      await expect(LibroService.addEjemplar("no-lib", ejemplar)).rejects.toMatchObject({
        message: "Libro no encontrado",
        status: 404,
      });
      expect(LibroRepository.findById).toHaveBeenCalledWith("no-lib");
    });

    test("addEjemplar delega a repository cuando todo OK", async () => {
      const ejemplar = { cdu: "1", estado: "nuevo", origen: "donacion" };
      LibroRepository.findById.mockResolvedValue({ _id: "L1" });
      LibroRepository.addEjemplar.mockResolvedValue({ _id: "e1", ...ejemplar });

      const res = await LibroService.addEjemplar("L1", ejemplar);
      expect(LibroRepository.addEjemplar).toHaveBeenCalledWith("L1", ejemplar);
      expect(res).toEqual({ _id: "e1", ...ejemplar });
    });

    test("removeEjemplar lanza 404 si libro no existe", async () => {
      LibroRepository.findById.mockResolvedValue(null);
      await expect(LibroService.removeEjemplar("lib", "ej")).rejects.toMatchObject({
        message: "Libro no encontrado",
        status: 404,
      });
    });

    test("removeEjemplar lanza 404 si ejemplar no existe en libro", async () => {
      // Simulamos libro sin ejemplares
      LibroRepository.findById.mockResolvedValue({ _id: "lib", ejemplares: [] });
      await expect(LibroService.removeEjemplar("lib", "noej")).rejects.toMatchObject({
        message: "Ejemplar no encontrado en este libro",
      });
    });

    test("removeEjemplar delega a repository cuando todo OK", async () => {
      const libro = { _id: "lib", ejemplares: [{ _id: { toString: () => "ej1" } }] };
      LibroRepository.findById.mockResolvedValue(libro);
      LibroRepository.removeEjemplar.mockResolvedValue({ removed: true });

      const res = await LibroService.removeEjemplar("lib", "ej1");
      expect(LibroRepository.removeEjemplar).toHaveBeenCalledWith("lib", "ej1");
      expect(res).toEqual({ removed: true });
    });
  });

  describe("categorías", () => {
    test("createCategoria lanza 400 si ya existe descripción (case-insensitive)", async () => {
      CategoriaRepository.findAll.mockResolvedValue([{ descripcion: "Historia" }]);
      await expect(LibroService.createCategoria({ descripcion: "historia" })).rejects.toMatchObject({
        message: "Ya existe una categoría con esa descripción",
        status: 400,
      });
    });

    test("createCategoria delega a repository cuando no hay duplicado", async () => {
      CategoriaRepository.findAll.mockResolvedValue([]);
      CategoriaRepository.create.mockResolvedValue({ _id: "c1", descripcion: "Nueva" });

      const res = await LibroService.createCategoria({ descripcion: "Nueva" });
      expect(CategoriaRepository.create).toHaveBeenCalledWith({ descripcion: "Nueva" });
      expect(res).toEqual({ _id: "c1", descripcion: "Nueva" });
    });

    test("deleteCategoria lanza 404 si categoría no existe", async () => {
      CategoriaRepository.findById.mockResolvedValue(null);
      await expect(LibroService.deleteCategoria("c1")).rejects.toMatchObject({
        message: "Categoría no encontrada",
        status: 404,
      });
    });

    test("deleteCategoria lanza 400 si hay libros asociados", async () => {
      CategoriaRepository.findById.mockResolvedValue({ _id: "c1" });
      LibroRepository.findbyCategory.mockResolvedValue([ { titulo: "X" } ]);

      await expect(LibroService.deleteCategoria("c1")).rejects.toMatchObject({
        message: "No se puede eliminar la categoría porque hay libros asociados a ella",
        status: 400,
      });
    });

    test("deleteCategoria delega a repository cuando no hay libros asociados", async () => {
      CategoriaRepository.findById.mockResolvedValue({ _id: "c1" });
      LibroRepository.findbyCategory.mockResolvedValue([]);
      CategoriaRepository.remove.mockResolvedValue({ _id: "c1", descripcion: "C" });

      const res = await LibroService.deleteCategoria("c1");
      expect(CategoriaRepository.remove).toHaveBeenCalledWith("c1");
      expect(res).toEqual({ _id: "c1", descripcion: "C" });
    });
  });
});
