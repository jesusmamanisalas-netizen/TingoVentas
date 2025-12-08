# ⚡ Inicio Rápido - Tingo Ventas

## 🚀 Inicio en 5 minutos

### 1. Instalar Dependencias del Backend

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto (o copia `.env.example`):

```env
SUPABASE_URL=https://gabjabikqvjavjnqfvyc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYmphYmlrcXZqYXZqbnFmdnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODU5NDUsImV4cCI6MjA4MDQ2MTk0NX0.14QgMRiLbgDNltXl3VVRv833_tDFsbMNLCnZ_SebGfE
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYmphYmlrcXZqYXZqbnFmdnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4NTk0NSwiZXhwIjoyMDgwNDYxOTQ1fQ.TjTIlepyLFYzkSE4IyD8R8pKKnsT7dfl4rFboURfrN8
JWT_SECRET=/XyvTqRQC/X58F1OTUjinU5998b7umlvmg7R87l8pVu86QprSoE9O2DqGsnYbN/QCKjX/H0XVMYRjoMMZemWPQ==
DEBUG=False
```

### 3. Iniciar el Backend

```bash
# Desde la raíz del proyecto
cd backend
python main.py
```

El servidor estará disponible en: `http://localhost:8000`

### 4. Iniciar el Frontend

En otra terminal:

```bash
cd frontend
python -m http.server 8080
```

El frontend estará disponible en: `http://localhost:8080`

### 5. Acceder a la Aplicación

1. Abre tu navegador en: `http://localhost:8080`
2. Serás redirigido a la página de login
3. Crea una cuenta nueva o inicia sesión

## 📋 Verificación Rápida

### Verificar Backend

- Health Check: `http://localhost:8000/health`
- API Docs: `http://localhost:8000/docs`
- API Root: `http://localhost:8000/api/`

### Verificar Frontend

- Login: `http://localhost:8080/login.html`
- Dashboard: `http://localhost:8080/dashboard.html` (requiere login)
- Productos: `http://localhost:8080/productos.html` (requiere login)

## 🔧 Configuración Adicional

### Supabase Storage (Para imágenes de productos)

1. Ve a tu proyecto en Supabase
2. Storage → Create Bucket
3. Nombre: `productos`
4. Público: `true`

### Primer Usuario Administrador

Para crear un usuario administrador, necesitas:

1. Registrar un usuario normalmente desde el frontend
2. En Supabase, asignar el rol "admin" manualmente en la tabla `user_roles`

O crear un script de inicialización (opcional).

## 🐛 Problemas Comunes

### "Module not found"
```bash
pip install -r backend/requirements.txt
```

### "Connection refused" en frontend
- Verifica que el backend esté corriendo en el puerto 8000
- Verifica `API_BASE_URL` en `frontend/js/config.js`

### "401 Unauthorized"
- Verifica que las credenciales de Supabase sean correctas
- Verifica que el usuario exista en Supabase Auth

## 📚 Próximos Pasos

- Lee el [README.md](README.md) para más detalles
- Lee el [DEPLOY.md](DEPLOY.md) para desplegar en producción
- Explora la documentación del API en `/docs` cuando el servidor esté corriendo

---

¡Listo para empezar! 🎉

