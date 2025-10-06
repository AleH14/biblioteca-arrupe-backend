# Biblioteca Arrupe Backend

API de gestión (backend) para la biblioteca digital del Colegio Arrupe. Maneja la lógica del negocio, la base de datos de libros y la autenticación, proporcionando los datos necesarios para la aplicación web.

## 📋 Descripción

Este proyecto es el backend de la biblioteca digital del Colegio Arrupe, desarrollado en JavaScript. Proporciona una API RESTful que gestiona toda la lógica del servidor, incluyendo la administración de libros, usuarios y autenticación.

Este repositorio es parte de un sistema completo de tres componentes:
- **Backend** (este repositorio) - API y lógica de negocio
- **[Frontend](https://github.com/AleH14/biblioteca-arrupe-frontend)** - Interfaz de usuario
- **[Infrastructure](https://github.com/AleH14/infrastructure-biblioteca-arrupe)** - Configuración Docker y despliegue

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────┐
│  infrastructure-biblioteca-arrupe               │
│  (Docker Compose + Configuración)               │
│                                                 │
│  ┌──────────────────┐  ┌────────────────────┐   │
│  │   Frontend       │  │    Backend         │   │
│  │   JavaScript     │◄─┤    JavaScript      │   │
│  │   CSS            │  │    Node.js         │   │
│  │   (React/Vue)    │  │    Express API     │   │
│  └──────────────────┘  └────────────────────┘   │
│                              ▲                  │
│                              │                  │
│                        ┌─────▼──────┐           │
│                        │  Database  │           │
│                        └────────────┘           │
└─────────────────────────────────────────────────┘
```

## 🚀 Características

- ✅ Gestión completa de libros (CRUD)
- 🔐 Sistema de autenticación y autorización
- 📚 API RESTful para la comunicación con el frontend
- 💾 Base de datos para almacenamiento de información
- 👥 Manejo de usuarios y permisos
- 🐳 Totalmente dockerizado para fácil despliegue

## 🛠️ Tecnologías

- **JavaScript** - Lenguaje principal
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **Docker** - Contenedorización
- **Base de datos** - Para almacenamiento persistente

## 📦 Instalación

### Opción 1: Desarrollo Local

1. Clona el repositorio:
```bash
git clone https://github.com/AleH14/biblioteca-arrupe-backend.git
cd biblioteca-arrupe-backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
# Edita el archivo .env con tus configuraciones
```

4. Inicia el servidor:
```bash
npm start
# o para desarrollo con hot-reload
npm run dev
```

### Opción 2: Con Docker (Recomendado)

Para ejecutar todo el sistema completo (Backend + Frontend + Base de datos), usa el repositorio de infraestructura:

```bash
git clone https://github.com/AleH14/infrastructure-biblioteca-arrupe.git
cd infrastructure-biblioteca-arrupe
docker-compose up -d
```

## 🔧 Configuración

Asegúrate de configurar las siguientes variables de entorno en tu archivo `.env`:

```env
# Configuración del servidor
PORT=4000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Configuración de MongoDB
MONGO_URI=mongodb://mongo:27017/biblioteca_arrupe_database
MONGO_URI_TEST=mongodb://mongo:27017/biblioteca_arrupe_test


# Configuración de autenticación
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# Configuración de logs
LOG_LEVEL=debug
```

## 📡 API Endpoints

### Autenticación
```
POST   /api/auth/login      - Iniciar sesión
POST   /api/auth/register   - Registrar usuario
POST   /api/auth/logout     - Cerrar sesión
GET    /api/auth/me         - Obtener usuario actual
```

### Libros
```
GET    /api/books           - Obtener todos los libros
GET    /api/books/:id       - Obtener un libro específico
POST   /api/books           - Crear un nuevo libro (requiere auth)
PUT    /api/books/:id       - Actualizar un libro (requiere auth)
DELETE /api/books/:id       - Eliminar un libro (requiere auth)
GET    /api/books/search    - Buscar libros por título/autor
```

### Usuarios
```
GET    /api/users           - Obtener todos los usuarios (admin)
GET    /api/users/:id       - Obtener un usuario específico
PUT    /api/users/:id       - Actualizar un usuario
DELETE /api/users/:id       - Eliminar un usuario (admin)
```

## 🔗 Repositorios Relacionados

Este proyecto forma parte de un ecosistema de tres repositorios:

| Repositorio | Descripción | Tecnologías | Link |
|------------|-------------|-------------|------|
| **Backend** | API y lógica de negocio | JavaScript, Node.js | [Este repo](https://github.com/AleH14/biblioteca-arrupe-backend) |
| **Frontend** | Interfaz de usuario | JavaScript (65.9%), CSS (28.5%) | [Ver repo](https://github.com/AleH14/biblioteca-arrupe-frontend) |
| **Infrastructure** | Docker Compose y despliegue | PowerShell, Docker | [Ver repo](https://github.com/AleH14/infrastructure-biblioteca-arrupe) |

## 🐳 Docker

Este servicio está incluido en el `docker-compose.yml` del repositorio de infraestructura. Para ejecutar solo el backend:

```bash
docker build -t biblioteca-arrupe-backend .
docker run -p 3000:3000 --env-file .env biblioteca-arrupe-backend
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Estructura del Proyecto

```
biblioteca-arrupe-backend/
├── src/
│   ├── controllers/     # Controladores de la API
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas de la API
│   ├── middleware/      # Middlewares (auth, validation, etc.)
│   ├── config/          # Configuración (DB, JWT, etc.)
│   └── utils/           # Utilidades y helpers
├── tests/               # Tests unitarios e integración
├── .env.example         # Ejemplo de variables de entorno
├── .dockerignore        # Archivos ignorados por Docker
├── Dockerfile           # Configuración Docker
├── package.json         # Dependencias del proyecto
└── README.md            # Este archivo
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.


## 🏫 Sobre el Proyecto

Este sistema fue desarrollado para el **Colegio Arrupe** con el objetivo de digitalizar y modernizar la gestión de su biblioteca, permitiendo a estudiantes y personal acceder al catálogo de libros de manera eficiente y desde cualquier dispositivo.

## 📞 Contacto

Para preguntas o sugerencias:
- Abre un [issue](https://github.com/AleH14/biblioteca-arrupe-backend/issues)
- Contacta al desarrollador a través de GitHub

## 🚀 Despliegue

Para desplegar el sistema completo en producción, consulta el repositorio de [infrastructure-biblioteca-arrupe](https://github.com/AleH14/infrastructure-biblioteca-arrupe) que contiene toda la configuración necesaria con Docker Compose.

---
