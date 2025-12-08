"""
Aplicación principal de Tingo Ventas
Punto de entrada del servidor FastAPI
"""
from fastapi import FastAPI  # type: ignore[import]
from fastapi.middleware.cors import CORSMiddleware  # type: ignore[import]
from fastapi.responses import JSONResponse  # type: ignore[import]
from backend.config import config
from backend.routes.api import api_router

# Crear aplicación FastAPI
app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    description="Sistema de gestión de ventas Tingo Ventas"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas del API
app.include_router(api_router, prefix="/api")

# Ruta raíz
@app.get("/")
async def root():
    """Endpoint raíz"""
    return JSONResponse({
        "message": f"Bienvenido a {config.APP_NAME}",
        "version": config.APP_VERSION,
        "status": "running"
    })

# Ruta de salud
@app.get("/health")
async def health():
    """Endpoint de salud para monitoreo"""
    return JSONResponse({
        "status": "healthy",
        "service": config.APP_NAME
    })

if __name__ == "__main__":
    import uvicorn  # type: ignore[import]
    uvicorn.run(app, host="0.0.0.0", port=8000)

