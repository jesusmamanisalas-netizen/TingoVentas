# TingoVentas - Presentación del Proyecto

## Introducción
TingoVentas es una plataforma completa de gestión de ventas y e-commerce que integra un backend robusto con un frontend moderno. Fue desarrollada para demostrar el flujo completo de un proyecto de software: desde la concepción del código hasta el despliegue en producción.

---

## 1. TECNOLOGÍAS UTILIZADAS

### Backend
- **Framework:** FastAPI (Python)
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth + JWT personalizado
- **ORM/Validación:** Pydantic
- **Servidor:** Gunicorn + Uvicorn
- **Despliegue:** Render

### Frontend
- **Lenguaje:** HTML5, CSS3, JavaScript Vanilla
- **Framework CSS:** Tailwind CSS
- **Iconos:** FontAwesome 6.4
- **Gestión de Estado:** LocalStorage
- **API Client:** Fetch API

### DevOps & Infraestructura
- **Control de Versiones:** Git + GitHub
- **Base de Datos:** Supabase (PostgreSQL + Auth)
- **Hosting:** Render (Backend + Frontend estático)
- **Storage:** Supabase Storage (imágenes)

---

## 2. ARQUITECTURA DEL PROYECTO

### Estructura del Backend
```
backend/
├── main.py                 # Punto de entrada, configuración de FastAPI
├── config.py               # Variables de entorno
├── controllers/            # Manejadores de rutas
│   ├── auth_controller.py     # Login, registro, logout
│   ├── product_controller.py  # CRUD de productos
│   ├── role_controller.py     # Gestión de roles
│   └── audit_controller.py    # Auditoría y logs
├── services/               # Lógica de negocio
│   ├── auth_service.py        # Autenticación
│   ├── product_service.py     # Productos
│   ├── role_service.py        # Roles y permisos
│   ├── supabase_service.py    # Conexión a Supabase
│   └── audit_service.py       # Auditoría
├── models/                 # Esquemas Pydantic
│   └── schemas.py          # Validación de datos
├── middlewares/            # Autenticación y autorización
│   └── auth_middleware.py  # JWT validation, role checking
├── routes/                 # Agregación de rutas
│   └── api.py              # Registrar todos los routers
└── utils/                  # Utilidades
    └── jwt_utils.py        # Generación y validación de tokens
```

### Estructura del Frontend
```
frontend/
├── index.html              # Página principal
├── login.html              # Autenticación
├── tienda.html             # Tienda pública
├── carrito.html            # Carrito de compras
├── dashboard.html          # Panel de admin
├── productos.html          # CRUD de productos
├── usuarios.html           # Gestión de usuarios
├── config/
│   └── supabaseClient.js   # Cliente de Supabase
├── js/
│   ├── config.js           # Configuración centralizada
│   ├── auth.js             # Manejo de autenticación
│   ├── carrito.js          # Lógica del carrito (LocalStorage)
│   ├── tienda-public.js    # Carga de productos
│   └── [otras utilidades]
```

---

## 3. FLUJO DE DESARROLLO

### 3.1 Inicialización del Proyecto
```bash
# Crear estructura base
mkdir -p backend frontend
cd backend
pip install fastapi uvicorn pydantic python-dotenv supabase
```

**Archivos clave creados:**
- `requirements.txt` - Dependencias Python
- `pyproject.toml` - Configuración del proyecto
- `main.py` - Aplicación FastAPI

### 3.2 Desarrollo del Backend

#### Paso 1: Configuración de Supabase
```python
# backend/config.py
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")
```

#### Paso 2: Esquemas y Validación
```python
# backend/models/schemas.py
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

class ProductResponse(BaseModel):
    id: Union[str, int]
    name: str
    price: float
    current_stock: int
```

#### Paso 3: Servicios (Lógica de Negocio)
```python
# backend/services/auth_service.py
async def login(self, email: str, password: str):
    response = self.supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })
    profile = self._get_user_profile(response.user.id)
    token = create_access_token(token_data)
    return {"access_token": token, "user": profile}
```

#### Paso 4: Controladores (Rutas)
```python
# backend/controllers/auth_controller.py
@router.post("/login")
async def login(request: LoginRequest):
    result = await auth_service.login(request.email, request.password)
    return result
```

#### Paso 5: Middlewares (Seguridad)
```python
# backend/middlewares/auth_middleware.py
async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    user_id = payload.get("sub")
    return {"id": user_id, "role": payload.get("role")}
```

### 3.3 Desarrollo del Frontend

#### Paso 1: HTML Estático
```html
<!-- frontend/login.html -->
<form id="login-form">
    <input type="email" id="email" required>
    <input type="password" id="password" required>
    <button type="submit">Iniciar Sesión</button>
</form>
```

#### Paso 2: Configuración Centralizada
```javascript
// frontend/js/config.js
window.APP_CONFIG = {
    API_BASE_URL: 'https://tingoventas.onrender.com/api'
};
```

#### Paso 3: Módulos JavaScript
```javascript
// frontend/js/auth.js
async function login(email, password) {
    const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
}
```

#### Paso 4: Carrito con LocalStorage
```javascript
// frontend/js/carrito.js
function addToCart(product, quantity = 1) {
    let cart = getCart();
    cart.push({id: product.id, name: product.name, price: product.price, quantity});
    localStorage.setItem('shopping_cart', JSON.stringify(cart));
}
```

---

## 4. INTEGRACIÓN CON SUPABASE

### 4.1 Configuración de la Base de Datos

#### Tablas Principales
```sql
-- Roles y permisos
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL
);

-- Perfiles de usuarios
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    role_id INTEGER REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Productos
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL,
    current_stock INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);
```

### 4.2 Trigger Automático
```sql
-- Crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role_id)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 
          (SELECT id FROM roles WHERE name = 'usuario' LIMIT 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### 4.3 Row Level Security (RLS)
```sql
-- Usuarios solo ven su propio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

---

## 5. FLUJO DE GIT Y CONTROL DE VERSIONES

### 5.1 Inicializar Repositorio
```bash
cd c:\Users\NITRO\Documents\TINGO_VENTAS
git init
git remote add origin https://github.com/usuario/TingoVentas.git
git branch -M master
```

### 5.2 Estructura de Commits
```bash
# Estructura general
git add backend/
git commit -m "Feature: implementar autenticación"

git add frontend/
git commit -m "Feature: crear tienda pública"

git add -A
git commit -m "Fix: validar emails en login"

git push origin master
```

### 5.3 Workflow Típico
```
1. Crear feature localmente
2. Hacer commits atómicos (1 feature = 1 commit)
3. git push (sube a GitHub)
4. GitHub webhook → Render redeploy automático
5. Verificar en producción
```

---

## 6. DESPLIEGUE EN RENDER

### 6.1 Conectar GitHub a Render
1. Abre Render: https://dashboard.render.com
2. Haz click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Selecciona branch "master"
5. Configura:
   - **Lenguaje:** Python
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app`

### 6.2 Variables de Entorno en Render
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
JWT_SECRET=tu_secreto_jwt
```

### 6.3 Deploy Automático
- Cada `git push` a `master` → Render detecta cambios → Redeploy automático
- Tiempo de deploy: 2-3 minutos
- Ver logs: Render dashboard → Web Service → Logs

### 6.4 Servir Frontend Estático
En `main.py`:
```python
from fastapi.staticfiles import StaticFiles

app.mount("/", StaticFiles(directory="frontend", html=True), name="static")
```

---

## 7. SEGURIDAD Y AUTENTICACIÓN

### 7.1 Flujo de Autenticación
```
1. Usuario ingresa email/password
2. Frontend POST /auth/login
3. Backend autentica con Supabase Auth
4. Backend crea JWT personalizado con role
5. Frontend guarda token en localStorage
6. Cada petición incluye header: Authorization: Bearer {token}
```

### 7.2 Protección de Rutas
```python
@router.post("/crear")
async def create_product(
    product: ProductCreate,
    user: dict = Depends(get_current_user)  # Requiere token
):
    return await product_service.create_product(product.dict())
```

### 7.3 RLS en Supabase
- El backend usa `service_role` (acceso total) para operaciones administrativas
- El frontend usa `anon_key` (acceso limitado por RLS)
- Ejemplo: usuarios solo ven productos públicos, admins ven todo

---

## 8. DESAFÍOS Y SOLUCIONES

| Desafío | Solución |
|---------|----------|
| Email de verificación no funciona | Auto-confirmar email con `admin.update_user_by_id()` |
| Perfil no se crea al registrarse | Crear trigger automático `on_auth_user_created` |
| CORS errors | Configurar CORS en FastAPI: `CORSMiddleware` |
| Tipo de datos inconsistentes (UUID vs int) | Usar `Union[str, int]` en Pydantic |
| Carrito se pierde al recargar | Guardar en `localStorage` |

---

## 9. FLUJO COMPLETO DE DESPLIEGUE

### Resumen paso a paso:
```
┌─────────────────────────────────────────────────────────────┐
│ 1. DESARROLLO LOCAL                                         │
│    - Backend: FastAPI + Supabase                            │
│    - Frontend: HTML/JS + Tailwind                           │
│    - Git: Commits atómicos                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. GIT PUSH                                                 │
│    git add -A                                               │
│    git commit -m "descripción"                              │
│    git push origin master                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GITHUB                                                   │
│    - Recibe push                                            │
│    - Dispara webhook a Render                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. RENDER DEPLOY                                            │
│    - Pull código de GitHub                                  │
│    - Instala dependencias (requirements.txt)               │
│    - Corre build command                                    │
│    - Inicia servidor (gunicorn + uvicorn)                 │
│    - Tiempo: 2-3 minutos                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. SUPABASE                                                 │
│    - Backend consulta datos                                 │
│    - RLS valida acceso                                      │
│    - Triggers ejecutan automáticamente                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. PRODUCCIÓN                                               │
│    - Frontend servido como estático                         │
│    - APIs disponibles en /api/                              │
│    - HTTPS seguro (Render)                                  │
│    - URL: https://tingoventas.onrender.com                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. CONCLUSIÓN

TingoVentas demuestra un flujo moderno y profesional de desarrollo:

✅ **Arquitectura escalable:** Backend desacoplado, frontend modular
✅ **Seguridad:** JWT, RLS, roles y permisos
✅ **Base de datos robusta:** Supabase con triggers automáticos
✅ **Despliegue continuo:** Git → GitHub → Render automático
✅ **Tecnologías actuales:** FastAPI, React-free, Tailwind, PostgreSQL

Este proyecto sirve como referencia para entender cómo funcionan las aplicaciones web modernas en producción.

---

## Recursos Útiles

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Render Docs](https://render.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [JWT.io](https://jwt.io/)
