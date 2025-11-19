const PrestamoService = require('../src/modules/prestamos/prestamo.service');
const PrestamoRepository = require('../src/modules/prestamos/prestamo.repository');
const Usuario = require('../src/modules/usuarios/usuario.model');
const Libro = require('../src/modules/libros/libro.model');
const Categoria = require('../src/modules/libros/categoria/categoria.model');


// Mock del repositorio para las pruebas
jest.mock('../src/modules/prestamos/prestamo.repository');

describe('PrestamoService', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buscarPorNombreAlumno', () => {
    it('debería buscar préstamos por nombre de alumno', async () => {
      const mockPrestamos = [
        {
          _id: '507f1f77bcf86cd799439011',
          usuarioId: {
            nombre: 'Juan Pérez',
            email: 'juan@email.com'
          },
          ejemplarId: {
            titulo: 'El Principito',
            autor: 'Antoine de Saint-Exupéry',
            isbn: '978-1234567890'
          },
          fechaPrestamo: new Date('2025-10-01'),
          fechaDevolucionEstimada: new Date('2025-10-16'),
          estado: 'activo'
        }
      ];

      PrestamoRepository.buscarPorNombreUsuario.mockResolvedValue(mockPrestamos);

      const resultado = await PrestamoService.buscarPorNombreAlumno('Juan');

      expect(PrestamoRepository.buscarPorNombreUsuario).toHaveBeenCalledWith('Juan');
      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toHaveProperty('alumno');
      expect(resultado[0]).toHaveProperty('libro');
      expect(resultado[0].alumno.nombre).toBe('Juan Pérez');
    });

    it('debería lanzar error si no se proporciona nombre', async () => {
      await expect(PrestamoService.buscarPorNombreAlumno('')).rejects.toThrow('El nombre del alumno es requerido');
    });
  });

  describe('obtenerPorClasificacion', () => {
    it('debería obtener préstamos por estado válido', async () => {
      const mockPrestamos = [];
      PrestamoRepository.obtenerPorEstado.mockResolvedValue(mockPrestamos);

      const resultado = await PrestamoService.obtenerPorClasificacion('activos');

      expect(PrestamoRepository.obtenerPorEstado).toHaveBeenCalledWith('activos');
      expect(Array.isArray(resultado)).toBe(true);
    });

    it('debería lanzar error para clasificación inválida', async () => {
      await expect(PrestamoService.obtenerPorClasificacion('invalido')).rejects.toThrow('Clasificación inválida');
    });
  });

  describe('cerrarPrestamo', () => {
    it('debería cerrar un préstamo activo', async () => {
      const mockPrestamo = {
        _id: '507f1f77bcf86cd799439011',
        estado: 'activo'
      };

      const mockPrestamoActualizado = {
        _id: '507f1f77bcf86cd799439011',
        estado: 'cerrado',
        fechaDevolucionReal: new Date()
      };

      PrestamoRepository.obtenerPorId.mockResolvedValue(mockPrestamo);
      PrestamoRepository.finalizarPrestamo.mockResolvedValue(mockPrestamoActualizado);

      const resultado = await PrestamoService.cerrarPrestamo('507f1f77bcf86cd799439011');

      expect(resultado.estado).toBe('cerrado');
      expect(resultado.mensaje).toBe('Préstamo cerrado exitosamente');
    });

    it('debería lanzar error si el préstamo no existe', async () => {
      PrestamoRepository.obtenerPorId.mockResolvedValue(null);

      await expect(PrestamoService.cerrarPrestamo('507f1f77bcf86cd799439011')).rejects.toThrow('Préstamo no encontrado');
    });

    it('debería lanzar error si el préstamo ya está cerrado', async () => {
      const mockPrestamo = {
        _id: '507f1f77bcf86cd799439011',
        estado: 'cerrado'
      };

      PrestamoRepository.obtenerPorId.mockResolvedValue(mockPrestamo);

      await expect(PrestamoService.cerrarPrestamo('507f1f77bcf86cd799439011')).rejects.toThrow('El préstamo ya está finalizado');
    });
  });

  describe('crearPrestamo', () => {
    it('debería crear un nuevo préstamo', async () => {
      const usuario = await Usuario.create({
        nombre: "Test Usuario",
        email: "test@test.com",
        password: "hashed"
      });

      const categoria = await Categoria.create({ descripcion: "Ficción" });

      const libro = await Libro.create({
        autor: "Autor Test",
        isbn: "1234567890",
        titulo: "Libro Test",
        ejemplares: [{ cdu: "QA123", estado: "disponible", ubicacionFisica: "Estante 1", edificio: "C", origen: "Donado" }],
        categoria: categoria.id,
      });

      const ejemplarId = libro.ejemplares[0]._id;

      const datosPrestation = {
        ejemplarId: ejemplarId,
        usuarioId: usuario.id,
        tipoPrestamo: "estudiante"
      };

      const mockPrestamoCreado = {
        _id: '507f1f77bcf86cd799439011',
        ...datosPrestation,
        estado: 'activo'
      };

      PrestamoRepository.existePrestamoActivo.mockResolvedValue(null);
      PrestamoRepository.crear.mockResolvedValue(mockPrestamoCreado);
      PrestamoRepository.obtenerPorId.mockResolvedValue({
        ...mockPrestamoCreado,
        usuarioId: { nombre: 'Juan', email: 'juan@email.com' },
        ejemplarId: { titulo: 'Test', autor: 'Test Author' }
      });

      const resultado = await PrestamoService.crearPrestamo(datosPrestation);

      expect(PrestamoRepository.existePrestamoActivo).toHaveBeenCalledWith(datosPrestation.ejemplarId);
      expect(PrestamoRepository.crear).toHaveBeenCalled();
      expect(resultado).toHaveProperty('id');
    });

    it('debería lanzar error si ya existe un préstamo activo para el ejemplar', async () => {
      const usuario = await Usuario.create({
        nombre: "Test Usuario",
        email: "test@test.com",
        password: "hashed"
      });

      const categoria = await Categoria.create({ descripcion: "Ficción" });

      const libro = await Libro.create({
        autor: "Autor Test",
        isbn: "1234567890",
        titulo: "Libro Test",
        ejemplares: [{ cdu: "QA123", estado: "disponible", ubicacionFisica: "Estante 1", edificio: "C", origen: "Donado" }],
        categoria: categoria.id,
      });

      const ejemplarId = libro.ejemplares[0]._id;

      const datosPrestation = {
        ejemplarId: ejemplarId,
        usuarioId: usuario.id,
        tipoPrestamo: "estudiante"
      };

      PrestamoRepository.existePrestamoActivo.mockResolvedValue({ _id: 'existing' });

      await expect(PrestamoService.crearPrestamo(datosPrestation)).rejects.toThrow('Ya existe un préstamo activo para este ejemplar');
    });
  });

  describe('renovarPrestamo', () => {
    it('debería renovar un préstamo activo', async () => {
      const mockPrestamo = {
        _id: '507f1f77bcf86cd799439011',
        estado: 'activo',
        fechaDevolucionEstimada: new Date('2025-10-16')
      };

      const nuevaFechaDevolucion = new Date('2025-10-31');

      const mockPrestamoRenovado = {
        ...mockPrestamo,
        fechaDevolucionEstimada: nuevaFechaDevolucion
      };

      PrestamoRepository.obtenerPorId.mockResolvedValue(mockPrestamo);
      PrestamoRepository.renovarPrestamo.mockResolvedValue(mockPrestamoRenovado);

      const resultado = await PrestamoService.renovarPrestamo('507f1f77bcf86cd799439011', nuevaFechaDevolucion);

      expect(PrestamoRepository.obtenerPorId).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(PrestamoRepository.renovarPrestamo).toHaveBeenCalledWith('507f1f77bcf86cd799439011', nuevaFechaDevolucion);
      expect(resultado.nuevaFechaDevolucionEstimada).toEqual(nuevaFechaDevolucion);
    });

    it('debería lanzar error si el préstamo no existe', async () => {
      PrestamoRepository.obtenerPorId.mockResolvedValue(null);

      await expect(PrestamoService.renovarPrestamo('507f1f77bcf86cd799439011', new Date())).rejects.toThrow('Préstamo no encontrado');
    });

    it('debería lanzar error si el préstamo está cerrado', async () => {
      const mockPrestamo = {
        _id: '507f1f77bcf86cd799439011',
        estado: 'cerrado'
      };

      PrestamoRepository.obtenerPorId.mockResolvedValue(mockPrestamo);

      await expect(PrestamoService.renovarPrestamo('507f1f77bcf86cd799439011', new Date())).rejects.toThrow('No se puede renovar un préstamo cerrado');
    });
  });
});

module.exports = {};