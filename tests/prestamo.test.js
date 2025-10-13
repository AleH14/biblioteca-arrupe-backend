const Prestamo = require("../src/modules/prestamos/prestamo.model");
const Usuario = require("../src/modules/usuarios/usuario.model");
const Libro = require("../src/modules/libros/libro.model");

describe("Modelo Prestamo", () => {
  it("debe crear un préstamo válido con notificación", async () => {
    // Crear un usuario y un libro primero
    const usuario = await Usuario.create({
      nombre: "Carlos Test",
      email: "carlos@test.com",
      password: "hashed"
    });

    const libro = await Libro.create({
      autor: "Autor de prueba",
      categoria: { descripcion: "Test" },
      editorial: "Editorial Test",
      ejemplares: [{ cdu: "QA123", estado: "disponible", ubicacionFisica: "Estante 1" }],
      isbn: "111222333",
      precio: 15.5,
      titulo: "Libro Test"
    });

    const ejemplarId = libro.ejemplares[0]._id;

    // Crear el préstamo
    const prestamo = await Prestamo.create({
      ejemplarId,
      usuarioId: usuario._id,
      fechaPrestamo: new Date("2025-08-20"),
      fechaDevolucionEstimada: new Date("2025-09-20"),
      notificaciones: [
        {
          asunto: "Recordatorio de devolución",
          fechaEnvio: new Date("2025-09-15"),
          mensaje: "Tu libro debe devolverse antes del 20/09"
        }
      ]
    });

    expect(prestamo._id).toBeDefined();
    expect(prestamo.estado).toBe("activo");
    expect(prestamo.notificaciones[0].asunto).toBe("Recordatorio de devolución");
    expect(prestamo.usuarioId.toString()).toBe(usuario._id.toString());
  });
});
