# API Endpoints - Módulo de Préstamos

Todos los endpoints requieren autenticación mediante token JWT en el header Authorization: `Bearer <token>`

## Base URL
```
/api/prestamos
```

## 🔄 Flujo Completo para Crear Préstamos

### Método Recomendado (Búsqueda Amigable):

1. **Buscar libro:** `GET /api/prestamos/buscar-libros?nombre=principito`
2. **Buscar usuario:** `GET /api/prestamos/buscar-usuarios?nombre=juan`
3. **Crear préstamo:** `POST /api/prestamos/crear` con los IDs obtenidos

### Ejemplo completo:

```bash
# 1. Buscar libro
GET /api/prestamos/buscar-libros?nombre=principito
# Respuesta: Obtienes el ejemplarId "ejemplar123"

# 2. Buscar usuario  
GET /api/prestamos/buscar-usuarios?nombre=juan
# Respuesta: Obtienes el usuarioId "12345..."

# 3. Crear préstamo
POST /api/prestamos/crear
{
  "ejemplarId": "ejemplar123",
  "usuarioId": "12345...",
  "fechaDevolucionEstimada": "2025-11-01T00:00:00.000Z"
}
```

## Endpoints Disponibles

### 1. Buscar préstamos por nombre de alumno
**GET** `/api/prestamos/buscar?nombre={nombreAlumno}`

**Descripción:** Busca préstamos por nombre de alumno y devuelve información básica del préstamo.

**Query Parameters:**
- `nombre` (string, requerido): Nombre del alumno a buscar

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": "67890...",
      "alumno": {
        "nombre": "Juan Pérez",
        "email": "juan.perez@email.com"
      },
      "libro": {
        "titulo": "El principito",
        "autor": "Antoine de Saint-Exupéry",
        "isbn": "978-1234567890"
      },
      "fechaPrestamo": "2025-10-01T00:00:00.000Z",
      "fechaVencimiento": "2025-10-16T00:00:00.000Z",
        "estado": "activo", // puede ser: activo, atrasado, cerrado
      "diasRetraso": 0
    }
  ],
  "total": 1
}
```

### 2. Obtener préstamos por clasificación de estado
**GET** `/api/prestamos/estado/{estado}`

**Descripción:** Obtiene préstamos clasificados por estado.

**Path Parameters:**
- `estado` (string): Puede ser `todos`, `activos`, `atrasados`, `cerrados`

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": "67890...",
      "alumno": {
        "nombre": "Juan Pérez",
        "email": "juan.perez@email.com",
        "telefono": "+1234567890"
      },
      "libro": {
        "titulo": "El principito",
        "autor": "Antoine de Saint-Exupéry",
        "isbn": "978-1234567890"
      },
      "fechaPrestamo": "2025-10-01T00:00:00.000Z",
      "fechaVencimiento": "2025-10-16T00:00:00.000Z",
      "fechaDevolucionReal": null,
      "estado": "activo",
      "diasRetraso": 0
    }
  ],
  "total": 1,
  "estado": "activos"
}
```

### 3. Obtener detalles completos de un préstamo
**GET** `/api/prestamos/{id}`

**Descripción:** Obtiene información detallada de un préstamo específico.

**Path Parameters:**
- `id` (string): ID del préstamo

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": "67890...",
    "usuario": {
      "id": "12345...",
      "nombre": "Juan Pérez",
      "email": "juan.perez@email.com",
      "telefono": "+1234567890",
      "rol": "estudiante"
    },
    "libro": {
      "id": "54321...",
      "titulo": "El principito",
      "autor": "Antoine de Saint-Exupéry",
      "isbn": "978-1234567890",
      "editorial": "Editorial Planeta",
      "fechaPublicacion": "1943-04-06T00:00:00.000Z",
      "categoria": "Literatura"
    },
    "fechaPrestamo": "2025-10-01T00:00:00.000Z",
    "fechaDevolucionEstimada": "2025-10-16T00:00:00.000Z",
    "fechaDevolucionReal": null,
    "estado": "activo",
    "diasRetraso": 0,
    "diasRestantes": 1,
    "notificaciones": [],
    "fechaCreacion": "2025-10-01T00:00:00.000Z",
    "fechaActualizacion": "2025-10-01T00:00:00.000Z"
  }
}
```

### 4. Cerrar/Finalizar un préstamo
**PUT** `/api/prestamos/{id}/cerrar`

**Descripción:** Cambia el estado del préstamo a "finalizado".

**Path Parameters:**
- `id` (string): ID del préstamo

**Body (opcional):**
```json
{
  "fechaDevolucionReal": "2025-10-15T00:00:00.000Z"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": "67890...",
    "estado": "finalizado",
    "fechaDevolucionReal": "2025-10-15T00:00:00.000Z",
    "mensaje": "Préstamo finalizado exitosamente"
  }
}
```

### 5. **🎯 Buscar libros para préstamo (NUEVO)**
**GET** `/api/prestamos/buscar-libros?nombre={nombreLibro}`

**Descripción:** Busca libros disponibles por nombre o autor para crear préstamos.

**Query Parameters:**
- `nombre` (string, requerido): Nombre del libro o autor a buscar

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": "54321...",
      "titulo": "El principito",
      "autor": "Antoine de Saint-Exupéry",
      "isbn": "978-1234567890",
      "categoria": "Literatura",
      "ejemplaresDisponibles": [
        {
          "id": "ejemplar123",
          "cdu": "FRA 863.1",
          "ubicacionFisica": "Estante A-3",
          "estado": "disponible"
        },
        {
          "id": "ejemplar124",
          "cdu": "FRA 863.2", 
          "ubicacionFisica": "Estante A-3",
          "estado": "disponible"
        }
      ]
    }
  ],
  "total": 1
}
```

### 6. **👤 Buscar usuarios para préstamo (NUEVO)**
**GET** `/api/prestamos/buscar-usuarios?nombre={nombreUsuario}`

**Descripción:** Busca usuarios activos por nombre o email para crear préstamos.

**Query Parameters:**
- `nombre` (string, requerido): Nombre del usuario o email a buscar

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": "12345...",
      "nombre": "Juan Pérez",
      "email": "juan.perez@email.com",
      "telefono": "+1234567890",
      "rol": "estudiante"
    }
  ],
  "total": 1
}
```

### 7. **✨ Crear préstamo con búsqueda amigable (NUEVO)**
**POST** `/api/prestamos/crear`

**Descripción:** Crea un nuevo préstamo usando los IDs obtenidos de las búsquedas anteriores.

**Body:**
```json
{
  "ejemplarId": "ejemplar123",
  "usuarioId": "12345...",
  "fechaPrestamo": "2025-10-15T00:00:00.000Z", // opcional, por defecto hoy
  "fechaDevolucionEstimada": "2025-10-30T00:00:00.000Z" // opcional, por defecto +15 días
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    // Objeto completo del préstamo con todos los detalles
    "id": "67890...",
    "usuario": {
      "id": "12345...",
      "nombre": "Juan Pérez",
      "email": "juan.perez@email.com",
      "telefono": "+1234567890",
      "rol": "estudiante"
    },
    "libro": {
      "id": "54321...",
      "titulo": "El principito",
      "autor": "Antoine de Saint-Exupéry",
      "isbn": "978-1234567890",
      "editorial": "Editorial Planeta"
    },
    "fechaPrestamo": "2025-10-15T00:00:00.000Z",
    "fechaDevolucionEstimada": "2025-10-30T00:00:00.000Z",
    "estado": "activo",
    "diasRestantes": 15
  },
  "message": "Préstamo creado exitosamente"
}
```

### 8. Crear nuevo préstamo (método directo con IDs)
**POST** `/api/prestamos`

**Descripción:** Crea un nuevo préstamo.

**Body:**
```json
{
  "ejemplarId": "54321...",
  "usuarioId": "12345...",
  "fechaDevolucionEstimada": "2025-10-30T00:00:00.000Z" // opcional, por defecto 15 días
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    // Objeto completo del préstamo (igual que el endpoint de detalles)
  },
  "message": "Préstamo creado exitosamente"
}
```

### 9. Obtener resumen de préstamos
**GET** `/api/prestamos/resumen`

**Descripción:** Obtiene estadísticas generales de los préstamos.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "activos": 45,
    "atrasados": 12,
    "cerrados": 93,
    "porcentajeAtrasados": 27
  }
}
```

### 10. Obtener todos los préstamos
**GET** `/api/prestamos`

**Descripción:** Obtiene todos los préstamos del sistema.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    // Array de préstamos (igual formato que clasificación por estado)
  ],
  "total": 150
}
```

## Códigos de Error

- `400 Bad Request`: Parámetros faltantes o inválidos
- `401 Unauthorized`: Token no proporcionado
- `403 Forbidden`: Token inválido o expirado
- `404 Not Found`: Préstamo no encontrado
- `500 Internal Server Error`: Error del servidor

## Notas Importantes

1. **Clasificación automática de estados:**
   - `activo`: Préstamo en curso dentro de la fecha límite
   - `atrasado`: Préstamo activo que ha superado la fecha de devolución estimada
   - `cerrado`: Préstamo finalizado con fecha de devolución real

2. **Manejo automático de ejemplares:**
   - Al crear un préstamo: el ejemplar cambia automáticamente a estado "prestado"
   - Al cerrar un préstamo: el ejemplar regresa automáticamente a estado "disponible"
   - Solo se pueden prestar ejemplares en estado "disponible"

3. **Validaciones automáticas:**
   - No se permite crear préstamos de ejemplares ya prestados
   - Solo usuarios activos pueden recibir préstamos
   - Las fechas de devolución deben ser posteriores a las de préstamo

4. **Fechas:** Todas las fechas están en formato ISO 8601 (UTC)

5. **Autenticación:** Todos los endpoints requieren token JWT válido

6. **Búsqueda:** La búsqueda por nombre es case-insensitive y busca coincidencias parciales