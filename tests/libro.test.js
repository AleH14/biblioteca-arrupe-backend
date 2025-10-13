const Libro = require("../src/modules/libros/libro.model");

describe("Modelo Libro", () => {
  it("debe crear un libro con ejemplares", async () => {
    const libro = await Libro.create({
      autor: "Robert C. Martin",
      categoria: { descripcion: "Programación" },
      editorial: "Prentice Hall",
      ejemplares: [
        { cdu: "QA76.76", estado: "disponible", ubicacionFisica: "Estante 3" },
        { cdu: "QA76.77", estado: "prestado", ubicacionFisica: "Estante 3" }
      ],
      isbn: "9780132350884",
      precio: 29.99,
      titulo: "Clean Code"
    });

    expect(libro._id).toBeDefined();
    expect(libro.titulo).toBe("Clean Code");
    expect(libro.ejemplares.length).toBe(2);
    expect(libro.ejemplares[0].estado).toBe("disponible");
  });

  it("no debe permitir precio negativo", async () => {
    expect.assertions(1);
    try {
      await Libro.create({
        autor: "Autor",
        categoria: { descripcion: "Test" },
        editorial: "Editorial",
        isbn: "1234567890",
        precio: -10,
        titulo: "Libro inválido"
      });
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  it("debe permitir agregar nuevos ejemplares a un libro existente", async () => {
    // 1. Crear un libro con un ejemplar inicial
    const libroCreado = await Libro.create({
      autor: "Autor de prueba",
      categoria: { descripcion: "Ciencia" },
      editorial: "Editorial X",
      ejemplares: [
        { cdu: "QA100", estado: "disponible", ubicacionFisica: "Estante 1" }
      ],
      isbn: "222333444",
      precio: 19.99,
      titulo: "Libro de prueba"
    });

    expect(libroCreado.ejemplares.length).toBe(1);

    // 2. Usar findByIdAndUpdate para agregar el nuevo ejemplar de forma atómica
    const libroActualizado = await Libro.findByIdAndUpdate(
      libroCreado._id,
      {
        $push: {
          ejemplares: {
            cdu: "QA101",
            estado: "disponible",
            ubicacionFisica: "Estante 2"
          }
        }
      },
      { new: true } // Retorna el documento actualizado
    );

    // 3. Verificar que ahora tiene 2 ejemplares
    expect(libroActualizado.ejemplares.length).toBe(2);
    expect(libroActualizado.ejemplares[1].cdu).toBe("QA101");
  });
});
