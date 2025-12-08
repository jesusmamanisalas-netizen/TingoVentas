# 🚀 Guía de Despliegue - Tingo Ventas

## Despliegue en Render.com

### Paso 1: Preparar el Repositorio

1. **Subir código a GitHub:**
```bash
git init
git add .
git commit -m "Initial commit: Tingo Ventas"
git remote add origin https://github.com/tu-usuario/tingo-ventas.git
git push -u origin main
```

### Paso 2: Configurar Render.com

1. **Crear nuevo Web Service:**
   - Ve a [Render.com](https://render.com)
   - Click en "New" → "Web Service"
   - Conecta tu repositorio de GitHub

2. **Configuración del Servicio:**
   - **Name:** `tingo-ventas-backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:$PORT`

3. **Variables de Entorno:**
   Agrega las siguientes variables de entorno en Render:
   ```
   SUPABASE_URL=https://gabjabikqvjavjnqfvyc.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   JWT_SECRET=/XyvTqRQC/X58F1OTUjinU5998b7umlvmg7R87l8pVu86QprSoE9O2DqGsnYbN/QCKjX/H0XVMYRjoMMZemWPQ==
   DEBUG=False
   ```

4. **Usar render.yaml (Opcional):**
   - Si tienes el archivo `render.yaml` en la raíz, Render lo detectará automáticamente
   - Puedes omitir la configuración manual si usas el archivo YAML

### Paso 3: Configurar Frontend

1. **Actualizar URL del API:**
   - Edita `frontend/js/config.js`
   - Cambia `API_BASE_URL` a la URL de tu backend en Render:
   ```javascript
   const API_BASE_URL = 'https://tingo-ventas-backend.onrender.com/api';
   ```

2. **Desplegar Frontend:**
   - Opción 1: Usar Render Static Site
     - Crea un nuevo "Static Site" en Render
     - Conecta el mismo repositorio
     - Build Command: (vacío o `echo "No build needed"`)
     - Publish Directory: `frontend`
   
   - Opción 2: Usar otro servicio (Netlify, Vercel, etc.)
   - Opción 3: Servir desde el mismo backend (configurar FastAPI para servir archivos estáticos)

### Paso 4: Configurar Supabase Storage

1. **Crear Bucket:**
   - Ve a tu proyecto en Supabase
   - Storage → Create Bucket
   - Nombre: `productos`
   - Público: `true` (para que las imágenes sean accesibles)

2. **Configurar Políticas RLS (Row Level Security):**
   - Asegúrate de que las políticas permitan lectura/escritura según tus necesidades

### Paso 5: Verificar Despliegue

1. **Verificar Backend:**
   - Visita: `https://tu-backend.onrender.com/health`
   - Debe responder: `{"status": "healthy", "service": "Tingo Ventas"}`

2. **Verificar API:**
   - Visita: `https://tu-backend.onrender.com/api/`
   - Debe mostrar la documentación de FastAPI

3. **Probar Frontend:**
   - Abre tu frontend desplegado
   - Intenta hacer login
   - Verifica que las peticiones al API funcionen

## Despliegue Local (Desarrollo)

### Backend

```bash
# Instalar dependencias
cd backend
pip install -r requirements.txt

# Crear archivo .env con las variables de entorno
cp ../.env.example .env

# Ejecutar servidor
python main.py
# O con uvicorn directamente:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
# Opción 1: Servidor HTTP simple de Python
cd frontend
python -m http.server 8080

# Opción 2: Con Node.js
npx http-server -p 8080

# Opción 3: Con Live Server (VS Code extension)
# Click derecho en index.html → "Open with Live Server"
```

## Solución de Problemas

### Error: "Module not found"
- Verifica que todas las dependencias estén en `requirements.txt`
- Ejecuta `pip install -r requirements.txt` nuevamente

### Error: "Connection refused" en frontend
- Verifica que `API_BASE_URL` en `config.js` sea correcta
- Verifica que el backend esté corriendo
- Verifica CORS en el backend

### Error: "401 Unauthorized"
- Verifica que el token JWT esté siendo enviado correctamente
- Verifica que `JWT_SECRET` sea el correcto
- Verifica que el usuario exista en Supabase

### Error: "Bucket not found" al subir imágenes
- Verifica que el bucket "productos" exista en Supabase Storage
- Verifica que el bucket sea público o que las políticas RLS permitan acceso

## URLs de Producción

Después del despliegue, actualiza estas URLs:

- **Backend API:** `https://tu-backend.onrender.com/api`
- **Frontend:** `https://tu-frontend.onrender.com` (o tu dominio)
- **Documentación API:** `https://tu-backend.onrender.com/docs`

---

¡Listo! Tu sistema Tingo Ventas debería estar funcionando en producción. 🎉

