// backend/tests/estadisticas.service.test.js
const EstadisticasService = require("../src/modules/estadisticas/estadisticas.service");
const EstadisticasRepository = require("../src/modules/estadisticas/estadisticas.repository");
const LibroRepository = require("../src/modules/libros/libro.repository");

// Mock de los repositorios
jest.mock("../src/modules/estadisticas/estadisticas.repository");
jest.mock("../src/modules/libros/libro.repository");
jest.mock("../src/core/middlewares/mongoose.middleware");

const { isValidObjectId } = require("../src/core/middlewares/mongoose.middleware");

describe("EstadisticasService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("obtenerMetricas", () => {
    it("debería retornar métricas para un período dado", async () => {
      const mockPeriodo = "mensual";
      const mockMetricas = {
        librosTotales: 10,
        prestamosTotales: 50,
        prestamosActivos: 5,
        reservasTotales: 20,
        reservasActivas: 3
      };

      // Mock de las funciones del repositorio
      EstadisticasRepository.librosTotales.mockResolvedValue(mockMetricas.librosTotales);
      EstadisticasRepository.prestamosTotales.mockResolvedValue(mockMetricas.prestamosTotales);
      EstadisticasRepository.prestamosActivos.mockResolvedValue(mockMetricas.prestamosActivos);
      EstadisticasRepository.reservasTotales.mockResolvedValue(mockMetricas.reservasTotales);
      EstadisticasRepository.reservasActivas.mockResolvedValue(mockMetricas.reservasActivas);

      const resultado = await EstadisticasService.obtenerMetricas(mockPeriodo);

      expect(resultado).toEqual(mockMetricas);
      expect(EstadisticasRepository.librosTotales).toHaveBeenCalled();
      expect(EstadisticasRepository.prestamosTotales).toHaveBeenCalled();
      expect(EstadisticasRepository.prestamosActivos).toHaveBeenCalled();
      expect(EstadisticasRepository.reservasTotales).toHaveBeenCalled();
      expect(EstadisticasRepository.reservasActivas).toHaveBeenCalled();
    });

    it("debería retornar métricas sin período (total)", async () => {
      const mockMetricas = {
        librosTotales: 100,
        prestamosTotales: 500,
        prestamosActivos: 50,
        reservasTotales: 200,
        reservasActivas: 30
      };

      EstadisticasRepository.librosTotales.mockResolvedValue(mockMetricas.librosTotales);
      EstadisticasRepository.prestamosTotales.mockResolvedValue(mockMetricas.prestamosTotales);
      EstadisticasRepository.prestamosActivos.mockResolvedValue(mockMetricas.prestamosActivos);
      EstadisticasRepository.reservasTotales.mockResolvedValue(mockMetricas.reservasTotales);
      EstadisticasRepository.reservasActivas.mockResolvedValue(mockMetricas.reservasActivas);

      const resultado = await EstadisticasService.obtenerMetricas();

      expect(resultado).toEqual(mockMetricas);
      expect(EstadisticasRepository.librosTotales).toHaveBeenCalledWith({});
    });
  });

  describe("obtenerTendencias", () => {
    it("debería retornar tendencias para período hoy", async () => {
      const mockPeriodo = "hoy";

      // Mock de las funciones del repositorio para cada rango
      EstadisticasRepository.librosTotales.mockResolvedValue(2);
      EstadisticasRepository.prestamosTotales.mockResolvedValue(5);
      EstadisticasRepository.prestamosActivos.mockResolvedValue(1);
      EstadisticasRepository.reservasTotales.mockResolvedValue(3);
      EstadisticasRepository.reservasActivas.mockResolvedValue(1);

      const resultado = await EstadisticasService.obtenerTendencias(mockPeriodo);

      expect(resultado).toHaveLength(12); // 24 horas / 2 = 12 intervalos
      expect(resultado[0]).toMatchObject({
        periodo: expect.any(String),
        librosTotales: expect.any(Number),
        prestamosTotales: expect.any(Number),
        prestamosActivos: expect.any(Number),
        reservasTotales: expect.any(Number),
        reservasActivas: expect.any(Number)
      });
    });

    it("debería retornar array vacío para período inválido", async () => {
      const resultado = await EstadisticasService.obtenerTendencias("invalido");
      expect(resultado).toEqual([]);
    });
  });

  describe("obtenerLibrosPorOrden", () => {
    it("debería retornar libros ordenados por préstamos", async () => {
      const mockOrden = "desc";
      const mockLimite = 5;
      const mockResultado = [
        {
          libroId: "123",
          totalPrestamos: 10,
          libro: {
            titulo: "Libro 1",
            autor: "Autor 1"
          }
        }
      ];

      EstadisticasRepository.obtenerLibrosMasPrestados.mockResolvedValue(mockResultado);

      const resultado = await EstadisticasService.obtenerLibrosPorOrden(mockOrden, mockLimite);

      expect(resultado).toEqual(mockResultado);
      expect(EstadisticasRepository.obtenerLibrosMasPrestados).toHaveBeenCalledWith({
        orden: mockOrden,
        limite: mockLimite
      });
    });

    it("debería usar valores por defecto si no se proporcionan", async () => {
      const mockResultado = [];
      EstadisticasRepository.obtenerLibrosMasPrestados.mockResolvedValue(mockResultado);

      await EstadisticasService.obtenerLibrosPorOrden();

      expect(EstadisticasRepository.obtenerLibrosMasPrestados).toHaveBeenCalledWith({
        orden: undefined,
        limite: undefined
      });
    });
  });

  describe("obtenerMetricasCategoria", () => {
    it("debería retornar métricas por categoría", async () => {
      const mockResultado = {
        totalLibrosPorCategoria: [{ categoria: "Ficción", totalLibros: 10 }],
        totalEjemplaresPorCategoria: [{ categoria: "Ficción", totalEjemplares: 30 }],
        totalPrestamosPorCategoria: [{ categoria: "Ficción", totalPrestamos: 50 }],
        porcentajeCategorias: [{ categoria: "Ficción", porcentaje: 40 }]
      };

      EstadisticasRepository.totalLibrosPorCategoria.mockResolvedValue(
        mockResultado.totalLibrosPorCategoria
      );
      EstadisticasRepository.totalEjemplaresPorCategoria.mockResolvedValue(
        mockResultado.totalEjemplaresPorCategoria
      );
      EstadisticasRepository.totalPrestamosPorCategoria.mockResolvedValue(
        mockResultado.totalPrestamosPorCategoria
      );
      EstadisticasRepository.porcentajeCategorias.mockResolvedValue(
        mockResultado.porcentajeCategorias
      );

      const resultado = await EstadisticasService.obtenerMetricasCategoria();

      expect(resultado).toEqual(mockResultado);
      expect(EstadisticasRepository.totalLibrosPorCategoria).toHaveBeenCalled();
      expect(EstadisticasRepository.totalEjemplaresPorCategoria).toHaveBeenCalled();
      expect(EstadisticasRepository.totalPrestamosPorCategoria).toHaveBeenCalled();
      expect(EstadisticasRepository.porcentajeCategorias).toHaveBeenCalled();
    });
  });

  describe("obtenerEstadisticasLibro", () => {
    const mockLibroId = "507f1f77bcf86cd799439011";

    it("debería retornar estadísticas de un libro válido", async () => {
      const mockLibro = { _id: mockLibroId, titulo: "Libro Test" };
      const mockEstadisticas = {
        libroId: mockLibroId,
        titulo: "Libro Test",
        totalEjemplares: 5,
        totalPrestamos: 10
      };

      isValidObjectId.mockReturnValue(true);
      LibroRepository.findById.mockResolvedValue(mockLibro);
      EstadisticasRepository.obtenerEstadisticasLibro.mockResolvedValue(mockEstadisticas);

      const resultado = await EstadisticasService.obtenerEstadisticasLibro(mockLibroId);

      expect(resultado).toEqual(mockEstadisticas);
      expect(LibroRepository.findById).toHaveBeenCalledWith(mockLibroId);
      expect(EstadisticasRepository.obtenerEstadisticasLibro).toHaveBeenCalledWith(mockLibroId);
    });

    it("debería lanzar error si el ID no es válido", async () => {
      isValidObjectId.mockReturnValue(false);

      await expect(EstadisticasService.obtenerEstadisticasLibro("id-invalido"))
        .rejects
        .toThrow("El id del libro es requerido");
    });

    it("debería lanzar error si el ID está vacío", async () => {
      await expect(EstadisticasService.obtenerEstadisticasLibro())
        .rejects
        .toThrow("El id del libro es requerido");
    });

    it("debería lanzar error si el libro no existe", async () => {
      isValidObjectId.mockReturnValue(true);
      LibroRepository.findById.mockResolvedValue(null);

      await expect(EstadisticasService.obtenerEstadisticasLibro(mockLibroId))
        .rejects
        .toThrow("Libro no encontrado");
    });
  });

  // Pruebas para funciones auxiliares (no exportadas, probadas indirectamente)
  describe("Funciones auxiliares", () => {
    describe("obtenerFechaMetrica", () => {
      // Esta función no está expuesta, pero podemos probar su efecto
      // a través de obtenerMetricas
      it("debería generar filtro de fecha para hoy", async () => {
        const mockMetricas = {
          librosTotales: 5,
          prestamosTotales: 10,
          prestamosActivos: 2,
          reservasTotales: 3,
          reservasActivas: 1
        };

        EstadisticasRepository.librosTotales.mockResolvedValue(mockMetricas.librosTotales);
        EstadisticasRepository.prestamosTotales.mockResolvedValue(mockMetricas.prestamosTotales);
        EstadisticasRepository.prestamosActivos.mockResolvedValue(mockMetricas.prestamosActivos);
        EstadisticasRepository.reservasTotales.mockResolvedValue(mockMetricas.reservasTotales);
        EstadisticasRepository.reservasActivas.mockResolvedValue(mockMetricas.reservasActivas);

        await EstadisticasService.obtenerMetricas("hoy");

        // Verificamos que se llamó con un objeto que tiene propiedad createdAt
        expect(EstadisticasRepository.librosTotales).toHaveBeenCalledWith(
          expect.objectContaining({
            createdAt: expect.objectContaining({
              $gte: expect.any(Date),
              $lte: expect.any(Date)
            })
          })
        );
      });
    });
  });
});