# 🛒 Tingo Ventas - Sistema de Gestión de Ventas

Sistema web completo para gestión de ventas desarrollado con arquitectura MVC, Python (FastAPI), Supabase y frontend HTML/CSS/JS.

## 📋 Características

### Módulo de Seguridad
- ✅ Login y autenticación con JWT
- ✅ Registro de usuarios
- ✅ Gestión de roles y permisos
- ✅ Recuperación de contraseña
- ✅ Control de acceso y sesiones
- ✅ Auditoría de actividades

### Módulo de Productos
- ✅ CRUD completo de productos
- ✅ Búsqueda y filtrado
- ✅ Control de stock mínimo
- ✅ Carga de imágenes a Supabase Storage
- ✅ Gestión de categorías

## 🏗️ Arquitectura

El proyecto sigue una arquitectura MVC (Modelo-Vista-Controlador):

```
/backend
    /controllers      # Lógica de negocio y endpoints
    /models          # Esquemas Pydantic
    /views           # Respuestas JSON (opcional)
    /routes          # Configuración de rutas
    /services        # Servicios de negocio (Supabase, Auth, etc.)
    /utils           # Utilidades (JWT, helpers)
    /middlewares     # Autenticación y permisos
    main.py          # Punto de entrada
    config.py        # Configuración
    requirements.txt  # Dependencias

/frontend
    index.html       # Página principal (redirección)
    login.html       # Login y registro
    dashboard.html   # Dashboard con estadísticas
    productos.html   # Gestión de productos
    /js              # JavaScript modular
        auth.js
        dashboard.js
        productos.js
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Python 3.8+
- Node.js (opcional, para desarrollo)
- Cuenta de Supabase con las tablas configuradas

### Backend

1. **Instalar dependencias:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configurar variables de entorno:**
Crea un archivo `.env` en la raíz del proyecto con:
```env
SUPABASE_URL=https://gabjabikqvjavjnqfvyc.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_KEY=tu_service_key
JWT_SECRET=tu_jwt_secret
DEBUG=False
```

3. **Ejecutar servidor:**
```bash
# Desarrollo
python backend/main.py

# Producción (con Gunicorn)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
```

### Frontend

1. **Configurar URL del API:**
Edita los archivos en `frontend/js/` y actualiza `API_BASE_URL` con la URL de tu backend.

2. **Servir archivos estáticos:**
Puedes usar cualquier servidor HTTP estático:
```bash
# Con Python
cd frontend
python -m http.server 8080

# Con Node.js (http-server)
npx http-server -p 8080
```

## 📡 Endpoints del API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/password-recovery` - Recuperar contraseña

### Productos
- `GET /api/productos/listar` - Listar productos (con filtros opcionales)
- `POST /api/productos/crear` - Crear producto
- `PUT /api/productos/editar/{id}` - Actualizar producto
- `DELETE /api/productos/eliminar/{id}` - Eliminar producto
- `GET /api/productos/stock-minimo` - Productos con stock mínimo
- `POST /api/productos/subir-imagen/{id}` - Subir imagen

### Roles
- `GET /api/roles/listar` - Listar roles
- `POST /api/roles/asignar` - Asignar rol (solo admin)

### Auditoría
- `GET /api/auditoria/listar` - Listar registros (solo admin)

## 🗄️ Estructura de Base de Datos (Supabase)

El sistema utiliza las siguientes tablas (ya deben existir en tu Supabase):

- `profiles` - Perfiles de usuario
- `roles` - Roles del sistema
- `user_roles` - Asignación de roles a usuarios
- `products` - Productos
- `audit_logs` - Registros de auditoría

## 🚢 Despliegue en Render.com

1. **Conectar repositorio:**
   - Sube el código a GitHub
   - Conecta el repositorio en Render.com

2. **Configurar servicio:**
   - Tipo: Web Service
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`

3. **Variables de entorno:**
   - Configura todas las variables de entorno en Render.com
   - O usa el archivo `render.yaml` incluido

4. **Desplegar:**
   - Render detectará automáticamente el `render.yaml` si está en la raíz

## 🔒 Seguridad

- Autenticación JWT
- Middleware de autenticación en todas las rutas protegidas
- Validación de roles y permisos
- Auditoría de todas las acciones importantes
- Variables de entorno para datos sensibles

## 📝 Notas

- El frontend debe actualizar `API_BASE_URL` en los archivos JS con la URL de producción
- Asegúrate de configurar CORS correctamente en producción
- El bucket de Supabase Storage debe llamarse "productos" o actualizar en `config.py`

## 🛠️ Tecnologías Utilizadas

- **Backend:** FastAPI, Python, Supabase
- **Frontend:** HTML5, Tailwind CSS, JavaScript (Vanilla)
- **Autenticación:** JWT, Supabase Auth
- **Base de Datos:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Despliegue:** Render.com, Gunicorn

## 📄 Licencia

Este proyecto es de uso privado.

---

Desarrollado con ❤️ para Tingo Ventas

