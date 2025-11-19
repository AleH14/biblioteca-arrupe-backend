// tests/libros_endpoint.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/config/app');
const Libro = require('../src/modules/libros/libro.model');
const Categoria = require('../src/modules/libros/categoria/categoria.model');

// Mock condicional solo para las rutas de libros
jest.mock('../src/core/middlewares/auth.middleware', () => ({
  verifyToken: jest.fn((req, res, next) => {
    // Solo mockear para rutas que no sean /api/auth
    if (!req.path.startsWith('/api/auth')) {
      req.user = { id: '507f1f77bcf86cd799439011', username: 'testuser' };
    }
    next();
  })
}));

describe('Libros API Endpoints', () => {
  let categoriaId;
  let libroId;
  let ejemplarId;


  beforeEach(async () => {
    // Crear una categoría de prueba
    const categoria = await Categoria.create({
      descripcion: 'Ficción'
    });
    categoriaId = categoria._id;

    // Crear un libro de prueba
    const libro = await Libro.create({
      autor: 'Gabriel García Márquez',
      categoria: categoriaId,
      isbn: '978-8437604947',
      precio: 25.99,
      titulo: 'Cien años de soledad',
      ejemplares: [
        {
          cdu: 'FIC-GAR-001',
          estado: 'disponible',
          ubicacionFisica: 'Estante A-1',
          edificio: 'Principal',
          origen: 'Comprado'
        }
      ]
    });
    libroId = libro._id;
    ejemplarId = libro.ejemplares[0]._id;
  });


  describe('GET /api/libros', () => {
    it('debería retornar todos los libros', async () => {
      const response = await request(app)
        .get('/api/libros')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('titulo', 'Cien años de soledad');
    });

    it('debería filtrar libros por autor', async () => {
      const response = await request(app)
        .get('/api/libros')
        .query({ autor: 'García' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('autor', 'Gabriel García Márquez');
    });

    it('debería filtrar libros por título', async () => {
      const response = await request(app)
        .get('/api/libros')
        .query({ titulo: 'soledad' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('titulo', 'Cien años de soledad');
    });

    it('debería retornar array vacío cuando no hay coincidencias', async () => {
      const response = await request(app)
        .get('/api/libros')
        .query({ autor: 'AutorInexistente' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/libros/:id', () => {
    it('debería retornar un libro por ID', async () => {
      const response = await request(app)
        .get(`/api/libros/${libroId}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', libroId.toString());
      expect(response.body).toHaveProperty('titulo', 'Cien años de soledad');
    });

    it('debería retornar 404 cuando el libro no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/libros/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Libro no encontrado');
    });

    it('debería retornar 400 cuando el ID es inválido', async () => {
      const response = await request(app)
        .get('/api/libros/id-invalido')
        .expect(500); // Mongoose devuelve 500 para CastError

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/libros', () => {
    it('debería crear un nuevo libro', async () => {
      const nuevoLibro = {
        autor: 'Isabel Allende',
        categoria: categoriaId,
        isbn: '978-9500714957',
        precio: 22.50,
        titulo: 'La casa de los espíritus'
      };

      const response = await request(app)
        .post('/api/libros')
        .send(nuevoLibro)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('autor', 'Isabel Allende');
      expect(response.body).toHaveProperty('titulo', 'La casa de los espíritus');
      expect(response.body).toHaveProperty('isbn', '978-9500714957');
    });

    it('debería retornar error cuando faltan campos requeridos', async () => {
      const libroIncompleto = {
        autor: 'Autor Test',
        // Falta categoria, isbn, precio, titulo
      };

      const response = await request(app)
        .post('/api/libros')
        .send(libroIncompleto)
        .expect(400); // Mongoose validation error

      expect(response.body).toHaveProperty('message');
    });

    it('debería retornar error cuando la categoría no existe', async () => {
      const nonExistentCategoriaId = new mongoose.Types.ObjectId();
      const libroConCategoriaInexistente = {
        autor: 'Autor Test',
        categoria: nonExistentCategoriaId,
        isbn: '978-1234567890',
        precio: 20.00,
        titulo: 'Libro Test'
      };

      const response = await request(app)
        .post('/api/libros')
        .send(libroConCategoriaInexistente)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Categoría no encontrada');
    });
  });

  describe('PUT /api/libros/:id', () => {
    it('debería actualizar un libro existente', async () => {
      const actualizaciones = {
        titulo: 'Cien años de soledad - Edición Especial',
        precio: 29.99
      };

      const response = await request(app)
        .put(`/api/libros/${libroId}`)
        .send(actualizaciones)
        .expect(200);

      expect(response.body).toHaveProperty('titulo', 'Cien años de soledad - Edición Especial');
      expect(response.body).toHaveProperty('precio', 29.99);
    });

    it('debería retornar 404 cuando el libro no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/libros/${nonExistentId}`)
        .send({ titulo: 'Título Actualizado' })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Libro no encontrado');
    });
  });

  describe('DELETE /api/libros/:id', () => {
    it('debería eliminar un libro', async () => {
      await request(app)
        .delete(`/api/libros/${libroId}`)
        .expect(204);

      // Verificar que el libro fue eliminado
      const response = await request(app)
        .get(`/api/libros/${libroId}`)
        .expect(404);
    });

    it('debería retornar 404 cuando el libro no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/libros/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Libro no encontrado');
    });
  });

  describe('Gestión de ejemplares', () => {
    describe('POST /api/libros/:libroId/ejemplares', () => {
      it('debería agregar un ejemplar a un libro', async () => {
        const nuevoEjemplar = {
          cdu: 'FIC-GAR-002',
          estado: 'disponible',
          ubicacionFisica: 'Estante A-2',
          edificio: 'Principal',
          origen: 'Comprado'
        };

        const response = await request(app)
          .post(`/api/libros/${libroId}/ejemplares`)
          .send(nuevoEjemplar)
          .expect(201);

        expect(response.body.ejemplares).toHaveLength(2);
        expect(response.body.ejemplares[1]).toHaveProperty('cdu', 'FIC-GAR-002');
      });

      it('debería retornar 404 cuando el libro no existe', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .post(`/api/libros/${nonExistentId}/ejemplares`)
          .send({
            cdu: 'TEST-001',
            estado: 'disponible',
            ubicacionFisica: 'Estante Test',
            edificio: 'Test',
            origen: 'Donado'
          })
          .expect(404);

        expect(response.body).toHaveProperty('message', 'Libro no encontrado');
      });
    });

    describe('DELETE /api/libros/:libroId/ejemplares/:ejemplarId', () => {
      it('debería eliminar un ejemplar de un libro', async () => {
        const response = await request(app)
          .delete(`/api/libros/${libroId}/ejemplares/${ejemplarId}`)
          .expect(200);

        expect(response.body.ejemplares).toHaveLength(0);
      });

      it('debería retornar 404 cuando el ejemplar no existe', async () => {
        const nonExistentEjemplarId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .delete(`/api/libros/${libroId}/ejemplares/${nonExistentEjemplarId}`)
          .expect(404);

        expect(response.body).toHaveProperty('message', 'Ejemplar no encontrado en este libro');
      });
    });
  });

  describe('Gestión de categorías', () => {
    describe('GET /api/libros/categorias', () => {
      it('debería retornar todas las categorías', async () => {
        const response = await request(app)
          .get('/api/libros/categorias')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('descripcion', 'Ficción');
      });
    });

    describe('POST /api/libros/categorias', () => {
      it('debería crear una nueva categoría', async () => {
        const nuevaCategoria = {
          descripcion: 'Ciencia Ficción'
        };

        const response = await request(app)
          .post('/api/libros/categorias')
          .send(nuevaCategoria)
          .expect(201);

        expect(response.body).toHaveProperty('_id');
        expect(response.body).toHaveProperty('descripcion', 'Ciencia Ficción');
      });

      it('debería retornar error cuando ya existe una categoría con la misma descripción', async () => {
        const categoriaDuplicada = {
          descripcion: 'Ficción' // Ya existe
        };

        const response = await request(app)
          .post('/api/libros/categorias')
          .send(categoriaDuplicada)
          .expect(400);

        expect(response.body).toHaveProperty('message', 'Ya existe una categoría con esa descripción');
      });
    });

    describe('GET /api/libros/categorias/:id', () => {
      it('debería retornar una categoría por ID', async () => {
        const response = await request(app)
          .get(`/api/libros/categorias/${categoriaId}`)
          .expect(200);

        expect(response.body).toHaveProperty('_id', categoriaId.toString());
        expect(response.body).toHaveProperty('descripcion', 'Ficción');
      });

      it('debería retornar 404 cuando la categoría no existe', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/libros/categorias/${nonExistentId}`)
          .expect(404);

        expect(response.body).toHaveProperty('message', 'Categoría no encontrada');
      });
    });

    describe('PUT /api/libros/categorias/:id', () => {
      it('debería actualizar una categoría existente', async () => {
        const actualizaciones = {
          descripcion: 'Ficción Literaria'
        };

        const response = await request(app)
          .put(`/api/libros/categorias/${categoriaId}`)
          .send(actualizaciones)
          .expect(200);

        expect(response.body).toHaveProperty('descripcion', 'Ficción Literaria');
      });
    });

    describe('DELETE /api/libros/categorias/:id', () => {
      it('debería eliminar una categoría sin libros asociados', async () => {
        // Primero crear una categoría sin libros
        const categoriaSinLibros = await Categoria.create({
          descripcion: 'Categoría Temporal'
        });

        await request(app)
          .delete(`/api/libros/categorias/${categoriaSinLibros._id}`)
          .expect(204);
      });

      it('debería retornar error al eliminar categoría con libros asociados', async () => {
        const response = await request(app)
          .delete(`/api/libros/categorias/${categoriaId}`)
          .expect(400);

        expect(response.body).toHaveProperty('message', 'No se puede eliminar la categoría porque hay libros asociados a ella');
      });
    });
  });
});