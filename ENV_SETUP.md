# 🔧 Configuración del Archivo .env

## ¿Qué es el archivo .env?

El archivo `.env` contiene las variables de entorno necesarias para que el sistema funcione. Este archivo **NO debe subirse al repositorio** (está en `.gitignore`).

## 🚀 Crear el archivo .env

### Opción 1: Usar el script automático (Recomendado)

```bash
python create_env.py
```

Este script creará automáticamente el archivo `.env` con todas las variables necesarias.

### Opción 2: Crear manualmente

1. Crea un archivo llamado `.env` en la **raíz del proyecto** (mismo nivel que `backend/` y `frontend/`)

2. Copia y pega el siguiente contenido:

```env
# Supabase Configuration
SUPABASE_URL=https://gabjabikqvjavjnqfvyc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYmphYmlrcXZqYXZqbnFmdnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODU5NDUsImV4cCI6MjA4MDQ2MTk0NX0.14QgMRiLbgDNltXl3VVRv833_tDFsbMNLCnZ_SebGfE
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYmphYmlrcXZqYXZqbnFmdnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4NTk0NSwiZXhwIjoyMDgwNDYxOTQ1fQ.TjTIlepyLFYzkSE4IyD8R8pKKnsT7dfl4rFboURfrN8
JWT_SECRET=/XyvTqRQC/X58F1OTUjinU5998b7umlvmg7R87l8pVu86QprSoE9O2DqGsnYbN/QCKjX/H0XVMYRjoMMZemWPQ==

# Application Configuration
DEBUG=False
```

## 📋 Variables de Entorno Explicadas

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `SUPABASE_URL` | URL de tu proyecto Supabase | ✅ Sí |
| `SUPABASE_ANON_KEY` | Clave pública (anon key) de Supabase | ✅ Sí |
| `SUPABASE_SERVICE_KEY` | Clave de servicio (service key) de Supabase | ✅ Sí |
| `JWT_SECRET` | Secreto para firmar tokens JWT | ✅ Sí |
| `DEBUG` | Modo debug (True/False) | ❌ No (default: False) |

## 🔍 Verificar que el .env funciona

El archivo `backend/config.py` carga automáticamente las variables del `.env` usando `python-dotenv`.

**Ubicación del archivo:**
```
TINGO VENTAS/
├── .env              ← Aquí debe estar
├── backend/
├── frontend/
└── ...
```

## ⚠️ Importante

1. **NO subas el `.env` al repositorio** - Ya está en `.gitignore`
2. **El archivo debe estar en la raíz** - No dentro de `backend/` o `frontend/`
3. **Valores por defecto** - Si el `.env` no existe, `config.py` usa valores por defecto (pero es mejor tener el archivo)

## 🐛 Solución de Problemas

### El sistema no encuentra las variables

1. Verifica que el archivo `.env` esté en la raíz del proyecto
2. Verifica que `python-dotenv` esté instalado: `pip install python-dotenv`
3. Reinicia el servidor después de crear/modificar el `.env`

### Valores por defecto

Si no creas el archivo `.env`, el sistema usará los valores por defecto que están en `backend/config.py`, pero **es recomendable crear el archivo** para tener control total.

## 📝 Para Producción (Render.com)

En Render.com, configura estas variables en el panel de configuración del servicio, **NO uses el archivo .env** en producción.

---

✅ **Listo!** Una vez creado el `.env`, el sistema debería funcionar correctamente.

