const PrestamoService = require('../src/modules/prestamos/prestamo.service');
const PrestamoRepository = require('../src/modules/prestamos/prestamo.repository');
const Usuario = require('../src/modules/usuarios/usuario.model');
const Libro = require('../src/modules/libros/libro.model');
const Categoria = require('../src/modules/libros/categoria/categoria.model');
const LibroRepository = require('../src/modules/libros/libro.repository');
const UsuarioRepository = require('../src/modules/usuarios/usuario.repository');

// Mock del repositorio para las pruebas
jest.mock('../src/modules/prestamos/prestamo.repository');
jest.mock('../src/modules/libros/libro.repository');
jest.mock('../src/modules/usuarios/usuario.model');

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
            _id: 'u-juan',
            nombre: 'Juan Pérez',
            email: 'juan@email.com'
          },
          libroId: {
            titulo: 'El Principito',
            autor: 'Antoine de Saint-Exupéry',
            isbn: '978-1234567890',
            ejemplares: {
              id: (id) => ({ _id: id, cdu: 'CDU-123', ubicacionFisica: 'Estantería 1', edificio: 'Central' })
            }
          },
          ejemplarId: 'ej1',
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
      // comprobar que se mapeó el ejemplar correctamente
      expect(resultado[0]).toHaveProperty('ejemplar');
      expect(resultado[0].ejemplar.cdu).toBe('CDU-123');
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

  describe('crearPrestamoConBusqueda', () => {
    beforeEach(() => {
      // Asegurar mocks limpios (ya tienes jest.clearAllMocks en el beforeEach global)
      jest.clearAllMocks();

      // Asegurar que los métodos existen como jest.fn para poder mockearlos
      LibroRepository.findById = LibroRepository.findById || jest.fn();
      LibroRepository.findAvailableEjemplares = LibroRepository.findAvailableEjemplares || jest.fn();
      LibroRepository.setEjemplarDisponibilidad = LibroRepository.setEjemplarDisponibilidad || jest.fn();

      Usuario.findById = Usuario.findById || jest.fn();
    });

    it('debería crear un préstamo correctamente y devolver los detalles', async () => {
      const datos = {
        libroId: 'lib1',
        usuarioId: 'user1',
        fechaPrestamo: '2025-11-01',
        fechaDevolucionEstimada: '2025-11-16',
        tipoPrestamo: 'normal'
      };

      // Mocks
      LibroRepository.findById.mockResolvedValue({ _id: 'lib1', titulo: 'Libro X' });
      LibroRepository.findAvailableEjemplares.mockResolvedValue([{ _id: 'ej1' }]);
      Usuario.findById.mockResolvedValue({ _id: 'user1', activo: true });
      PrestamoRepository.crear.mockResolvedValue({ _id: 'prest1' });
      LibroRepository.setEjemplarDisponibilidad.mockResolvedValue(true);

      // Como el servicio llama a this.obtenerDetalles, lo mockeamos para devolver los detalles finales
      jest.spyOn(PrestamoService, 'obtenerDetalles').mockResolvedValue({
        _id: 'prest1',
        libroId: 'lib1',
        ejemplarId: 'ej1',
        usuarioId: 'user1',
        estado: 'activo'
      });

      const resultado = await PrestamoService.crearPrestamoConBusqueda(datos);

      expect(LibroRepository.findById).toHaveBeenCalledWith('lib1');
      expect(LibroRepository.findAvailableEjemplares).toHaveBeenCalledWith('lib1');
      expect(Usuario.findById).toHaveBeenCalledWith('user1');
      expect(PrestamoRepository.crear).toHaveBeenCalledTimes(1);

      // Verificamos que el objeto pasado a crear contiene los campos esperados
      const crearArg = PrestamoRepository.crear.mock.calls[0][0];
      expect(crearArg).toHaveProperty('libroId', 'lib1');
      expect(crearArg).toHaveProperty('ejemplarId', 'ej1');
      expect(crearArg).toHaveProperty('usuarioId', 'user1');
      expect(crearArg).toHaveProperty('estado', 'activo');
      expect(crearArg).toHaveProperty('tipoPrestamo', 'normal');
      expect(crearArg.fechaPrestamo).toEqual(expect.any(Date));
      expect(crearArg.fechaDevolucionEstimada).toEqual(expect.any(Date));

      expect(LibroRepository.setEjemplarDisponibilidad).toHaveBeenCalledWith('ej1', 'prestado');
      expect(PrestamoService.obtenerDetalles).toHaveBeenCalledWith('prest1');
      expect(resultado).toHaveProperty('_id', 'prest1');
    });

    it('debería lanzar error si el libro no existe', async () => {
      LibroRepository.findById.mockResolvedValue(null);

      await expect(
        PrestamoService.crearPrestamoConBusqueda({
          libroId: 'noexiste',
          usuarioId: 'user1'
        })
      ).rejects.toThrow('Libro no encontrado');
    });

    it('debería lanzar error si no hay ejemplares disponibles', async () => {
      LibroRepository.findById.mockResolvedValue({ _id: 'lib1' });
      LibroRepository.findAvailableEjemplares.mockResolvedValue([]); // sin ejemplares

      await expect(
        PrestamoService.crearPrestamoConBusqueda({
          libroId: 'lib1',
          usuarioId: 'user1'
        })
      ).rejects.toThrow('No hay ejemplares disponibles para este libro');
    });

    it('debería lanzar error si el usuario no existe', async () => {
      LibroRepository.findById.mockResolvedValue({ _id: 'lib1' });
      LibroRepository.findAvailableEjemplares.mockResolvedValue([{ _id: 'ej1' }]);
      Usuario.findById.mockResolvedValue(null);

      await expect(
        PrestamoService.crearPrestamoConBusqueda({
          libroId: 'lib1',
          usuarioId: 'noexiste'
        })
      ).rejects.toThrow('Usuario no encontrado');
    });

    it('debería lanzar error si el usuario no está activo', async () => {
      LibroRepository.findById.mockResolvedValue({ _id: 'lib1' });
      LibroRepository.findAvailableEjemplares.mockResolvedValue([{ _id: 'ej1' }]);
      Usuario.findById.mockResolvedValue({ _id: 'user1', activo: false });

      await expect(
        PrestamoService.crearPrestamoConBusqueda({
          libroId: 'lib1',
          usuarioId: 'user1'
        })
      ).rejects.toThrow('El usuario no está activo');
    });

    it('debería lanzar error si la fecha de préstamo no es válida', async () => {
      LibroRepository.findById.mockResolvedValue({ _id: 'lib1' });
      LibroRepository.findAvailableEjemplares.mockResolvedValue([{ _id: 'ej1' }]);
      Usuario.findById.mockResolvedValue({ _id: 'user1', activo: true });

      await expect(
        PrestamoService.crearPrestamoConBusqueda({
          libroId: 'lib1',
          usuarioId: 'user1',
          fechaPrestamo: 'fecha-invalida'
        })
      ).rejects.toThrow('La nueva fecha de devolución estimada no es válida');
    });

    it('debería lanzar error si la fecha de devolución es anterior o igual a la fecha de préstamo', async () => {
      LibroRepository.findById.mockResolvedValue({ _id: 'lib1' });
      LibroRepository.findAvailableEjemplares.mockResolvedValue([{ _id: 'ej1' }]);
      Usuario.findById.mockResolvedValue({ _id: 'user1', activo: true });

      // fechaDevolucion anterior a fechaPrestamo
      await expect(
        PrestamoService.crearPrestamoConBusqueda({
          libroId: 'lib1',
          usuarioId: 'user1',
          fechaPrestamo: '2025-11-10',
          fechaDevolucionEstimada: '2025-11-05'
        })
      ).rejects.toThrow('La nueva fecha debe ser posterior a la fecha de devolución estimada actual');
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

  describe('Reservas (PrestamoService)', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Asegurar que los métodos de repositorios existen y son mockeables
      PrestamoRepository.obtenerReservasVigentes = PrestamoRepository.obtenerReservasVigentes || jest.fn();
      PrestamoRepository.obtenerReservasExpiradas = PrestamoRepository.obtenerReservasExpiradas || jest.fn();
      PrestamoRepository.obtenerReservasPorUsuario = PrestamoRepository.obtenerReservasPorUsuario || jest.fn();
      PrestamoRepository.obtenerPorId = PrestamoRepository.obtenerPorId || jest.fn();
      PrestamoRepository.cambiarEstadoPrestamo = PrestamoRepository.cambiarEstadoPrestamo || jest.fn();
      PrestamoRepository.crearReserva = PrestamoRepository.crearReserva || jest.fn();
      PrestamoRepository.transformarReservaAPrestamo = PrestamoRepository.transformarReservaAPrestamo || jest.fn();
      PrestamoRepository.cancelarReserva = PrestamoRepository.cancelarReserva || jest.fn();

      LibroRepository.setEjemplarDisponibilidad = LibroRepository.setEjemplarDisponibilidad || jest.fn();
      LibroRepository.findEjemplarbyId = LibroRepository.findEjemplarbyId || jest.fn();
    });

    describe('obtenerReservasVigentes / expiradas / por usuario', () => {
      it('debería mapear correctamente reservas vigentes', async () => {
        const mock = [
          {
            _id: 'r1',
            usuarioId: { _id: 'u1', nombre: 'Ana', email: 'ana@mail.com' },
            libroId: {
              _id: 'l1', titulo: 'Libro A', autor: 'Autor A', isbn: '111',
              ejemplares: { id: (id) => ({ _id: id, cdu: 'CDU-001', ubicacionFisica: 'Estantería A1', estado: 'disponible' }) }
            },
            ejemplarId: 'ej1',
            reserva: { fechaReserva: new Date('2025-11-01'), fechaExpiracion: new Date('2025-11-10') }
          }
        ];

        PrestamoRepository.obtenerReservasVigentes.mockResolvedValue(mock);

        const resultado = await PrestamoService.obtenerReservasVigentes();

        expect(PrestamoRepository.obtenerReservasVigentes).toHaveBeenCalled();
        expect(Array.isArray(resultado)).toBe(true);
        expect(resultado[0]).toEqual({
          id: 'r1',
          usuario: { id: 'u1', nombre: 'Ana', email: 'ana@mail.com' },
          libro: { id: 'l1', titulo: 'Libro A', autor: 'Autor A', isbn: '111' },
          ejemplar: { id: 'ej1', cdu: 'CDU-001', ubicacionFisica: 'Estantería A1', estado: 'disponible' },
          reserva: {
            fechaReserva: mock[0].reserva.fechaReserva,
            fechaExpiracion: mock[0].reserva.fechaExpiracion
          }
        });
      });

      it('debería mapear correctamente reservas expiradas', async () => {
        const mock = [
          {
            _id: 'r2',
            usuarioId: { _id: 'u2', nombre: 'Luis', email: 'luis@mail.com' },
            libroId: {
              _id: 'l2', titulo: 'Libro B', autor: 'Autor B', isbn: '222',
              ejemplares: { id: (id) => ({ _id: id, cdu: 'CDU-002', ubicacionFisica: 'Estantería B1', estado: 'disponible' }) }
            },
            ejemplarId: 'ej2',
            reserva: { fechaReserva: new Date('2025-09-01'), fechaExpiracion: new Date('2025-09-10') }
          }
        ];

        PrestamoRepository.obtenerReservasExpiradas.mockResolvedValue(mock);

        const resultado = await PrestamoService.obtenerReservasExpiradas();

        expect(PrestamoRepository.obtenerReservasExpiradas).toHaveBeenCalled();
        expect(resultado[0].libro.titulo).toBe('Libro B');
        expect(resultado[0].ejemplar.cdu).toBe('CDU-002');
      });

      it('debería obtener reservas por usuario', async () => {
        const mock = [
          {
            _id: 'r3',
            usuarioId: { _id: 'u3', nombre: 'Pedro', email: 'pedro@mail.com' },
            libroId: {
              _id: 'l3', titulo: 'Libro C', autor: 'Autor C', isbn: '333',
              ejemplares: { id: (id) => ({ _id: id, cdu: 'CDU-003', ubicacionFisica: 'Estantería C1', estado: 'disponible' }) }
            },
            ejemplarId: 'ej3',
            reserva: { fechaReserva: new Date('2025-10-01'), fechaExpiracion: new Date('2025-10-10') }
          }
        ];

        PrestamoRepository.obtenerReservasPorUsuario.mockResolvedValue(mock);

        const resultado = await PrestamoService.obtenerReservasPorUsuario('u3');

        expect(PrestamoRepository.obtenerReservasPorUsuario).toHaveBeenCalledWith('u3');
        expect(resultado[0].usuario.nombre).toBe('Pedro');
        expect(resultado[0].ejemplar.cdu).toBe('CDU-003');
      });
    });

    describe('obtenerDetallesReserva', () => {
      it('debería devolver detalles de reserva válida', async () => {
        const mock = {
          _id: 'r4',
          estado: 'reserva',
          usuarioId: { _id: 'u4', nombre: 'María', email: 'maria@mail.com' },
          libroId: {
            _id: 'l4', titulo: 'Libro D', autor: 'Autor D', isbn: '444', editorial: 'Ed D'
          },
          ejemplarId: 'ej4',
          reserva: { fechaReserva: new Date('2025-11-02'), fechaExpiracion: new Date('2025-11-12') }
        };

        // Mock para LibroRepository.findEjemplarbyId
        LibroRepository.findEjemplarbyId.mockResolvedValue({
          _id: 'ej4',
          cdu: 'CDU-004',
          ubicacionFisica: 'Estantería D1',
          estado: 'reservado'
        });

        PrestamoRepository.obtenerPorId.mockResolvedValue(mock);

        const resultado = await PrestamoService.obtenerDetallesReserva('r4');

        expect(PrestamoRepository.obtenerPorId).toHaveBeenCalledWith('r4');
        expect(LibroRepository.findEjemplarbyId).toHaveBeenCalledWith('ej4');
        expect(resultado.libro.editorial).toBe('Ed D');
        expect(resultado.id).toBe('r4');
        expect(resultado.ejemplar.cdu).toBe('CDU-004');
      });

      it('debería lanzar error si no existe la reserva', async () => {
        PrestamoRepository.obtenerPorId.mockResolvedValue(null);

        await expect(PrestamoService.obtenerDetallesReserva('no-existe')).rejects.toThrow('Reserva no encontrada');
      });

      it('debería lanzar error si el préstamo no es una reserva', async () => {
        const mock = { _id: 'r5', estado: 'activo' };
        PrestamoRepository.obtenerPorId.mockResolvedValue(mock);

        await expect(PrestamoService.obtenerDetallesReserva('r5')).rejects.toThrow('El préstamo no es una reserva');
      });
    });

    describe('reservarLibro', () => {
      it('debería crear una reserva correctamente', async () => {
        const fechaExp = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // dentro de 7 días
        // Mockear crearPrestamoConBusqueda para devolver id
        jest.spyOn(PrestamoService, 'crearPrestamoConBusqueda').mockResolvedValue({ id: 'prest-123' });

        // obtenerPorId debe devolver el préstamo recién creado
        PrestamoRepository.obtenerPorId.mockResolvedValue({
          _id: 'prest-123',
          estado: 'activo'
        });

        PrestamoRepository.cambiarEstadoPrestamo.mockResolvedValue({ _id: 'prest-123', estado: 'reserva' });
        PrestamoRepository.crearReserva.mockResolvedValue({
          _id: 'res-1',
          fechaReserva: new Date(),
          fechaExpiracion: fechaExp
        });

        const resultado = await PrestamoService.reservarLibro({
          libroId: 'lX',
          usuarioId: 'uX',
          fechaExpiracion: fechaExp.toISOString(),
          tipoPrestamo: 'reserva'
        });

        expect(PrestamoService.crearPrestamoConBusqueda).toHaveBeenCalled();
        expect(PrestamoRepository.obtenerPorId).toHaveBeenCalledWith('prest-123');
        expect(PrestamoRepository.cambiarEstadoPrestamo).toHaveBeenCalledWith('prest-123', 'reserva');
        expect(PrestamoRepository.crearReserva).toHaveBeenCalled();
        expect(resultado).toHaveProperty('id', 'res-1');
        expect(resultado).toHaveProperty('fechaExpiracion');
      });

      it('debería lanzar error si la fecha de expiración no es válida', async () => {
        await expect(
          PrestamoService.reservarLibro({
            libroId: 'lX',
            usuarioId: 'uX',
            fechaExpiracion: 'fecha-invalida',
            tipoPrestamo: 'reserva'
          })
        ).rejects.toThrow('La fecha de expiración no es válida');
      });

      it('debería lanzar error si faltan libroId o usuarioId', async () => {
        const fechaExp = new Date(Date.now() + 1000 * 60 * 60 * 24);
        await expect(
          PrestamoService.reservarLibro({
            libroId: null,
            usuarioId: null,
            fechaExpiracion: fechaExp.toISOString()
          })
        ).rejects.toThrow('libroId y usuarioId son requeridos para crear una reserva');
      });

      it('debería lanzar error si crearPrestamoConBusqueda no retorna id', async () => {
        jest.spyOn(PrestamoService, 'crearPrestamoConBusqueda').mockResolvedValue({}); // sin id

        await expect(
          PrestamoService.reservarLibro({
            libroId: 'lX',
            usuarioId: 'uX',
            fechaExpiracion: new Date().toISOString()
          })
        ).rejects.toThrow('No se pudo obtener el id del préstamo creado');
      });

      it('debería lanzar error si no se encuentra el préstamo después de crearlo', async () => {
        jest.spyOn(PrestamoService, 'crearPrestamoConBusqueda').mockResolvedValue({ id: 'prest-404' });
        PrestamoRepository.obtenerPorId.mockResolvedValue(null);

        await expect(
          PrestamoService.reservarLibro({
            libroId: 'lX',
            usuarioId: 'uX',
            fechaExpiracion: new Date().toISOString()
          })
        ).rejects.toThrow('Préstamo no encontrado');
      });
    });

    describe('activarReserva', () => {
      it('debería activar una reserva correctamente', async () => {
        const futura = new Date(Date.now() + 1000 * 60 * 60 * 24); // mañana
        const prestamoMock = {
          _id: 'pres-act',
          estado: 'reserva',
          reserva: { fechaExpiracion: futura },
          ejemplarId: 'ej-1'
        };

        PrestamoRepository.obtenerPorId.mockResolvedValue(prestamoMock);
        PrestamoRepository.transformarReservaAPrestamo.mockResolvedValue({
          _id: 'pres-act',
          estado: 'activo',
          fechaPrestamo: new Date(),
          fechaDevolucionEstimada: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15)
        });
        LibroRepository.setEjemplarDisponibilidad.mockResolvedValue(true);

        const resultado = await PrestamoService.activarReserva('pres-act');

        expect(PrestamoRepository.obtenerPorId).toHaveBeenCalledWith('pres-act');
        expect(PrestamoRepository.transformarReservaAPrestamo).toHaveBeenCalledWith('pres-act');
        expect(LibroRepository.setEjemplarDisponibilidad).toHaveBeenCalledWith('ej-1', 'prestado');
        expect(resultado).toHaveProperty('mensaje', 'Reserva activada y convertida en préstamo exitosamente');
      });

      it('debería lanzar error si el préstamo no existe', async () => {
        PrestamoRepository.obtenerPorId.mockResolvedValue(null);

        await expect(PrestamoService.activarReserva('no-existe')).rejects.toThrow('Préstamo no encontrado');
      });

      it('debería lanzar error si el estado no es reserva', async () => {
        PrestamoRepository.obtenerPorId.mockResolvedValue({ _id: 'p1', estado: 'activo' });

        await expect(PrestamoService.activarReserva('p1')).rejects.toThrow("Solo se pueden activar reservas en estado 'reserva'");
      });

      it('debería lanzar error si la reserva ha expirado', async () => {
        const pasada = new Date(Date.now() - 1000 * 60 * 60 * 24); // ayer
        PrestamoRepository.obtenerPorId.mockResolvedValue({
          _id: 'p2',
          estado: 'reserva',
          reserva: { fechaExpiracion: pasada }
        });

        await expect(PrestamoService.activarReserva('p2')).rejects.toThrow('No se puede activar una reserva que ha expirado');
      });
    });

    describe('cancelarReserva', () => {
      it('debería cancelar una reserva correctamente', async () => {
        const prestamoMock = { _id: 'p-c', estado: 'reserva' };
        PrestamoRepository.obtenerPorId.mockResolvedValue(prestamoMock);
        PrestamoRepository.cancelarReserva.mockResolvedValue({ _id: 'p-c', estado: 'cancelado' });

        const resultado = await PrestamoService.cancelarReserva('p-c');

        expect(PrestamoRepository.obtenerPorId).toHaveBeenCalledWith('p-c');
        expect(PrestamoRepository.cancelarReserva).toHaveBeenCalledWith('p-c');
        expect(resultado).toHaveProperty('estado', 'cancelado');
        expect(resultado).toHaveProperty('mensaje', 'Reserva cancelada exitosamente');
      });

      it('debería lanzar error si el préstamo no existe', async () => {
        PrestamoRepository.obtenerPorId.mockResolvedValue(null);

        await expect(PrestamoService.cancelarReserva('no-existe')).rejects.toThrow('Préstamo no encontrado');
      });

      it('debería lanzar error si el estado no es reserva', async () => {
        PrestamoRepository.obtenerPorId.mockResolvedValue({ _id: 'p-ok', estado: 'activo' });

        await expect(PrestamoService.cancelarReserva('p-ok')).rejects.toThrow("Solo se pueden cancelar reservas en estado 'reserva'");
      });
    });
  });
});

module.exports = {};
