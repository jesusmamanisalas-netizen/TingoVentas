"""
Aplicación principal de Tingo Ventas
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import config
from backend.routes.api import api_router

app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    description="Sistema de gestión de ventas"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return JSONResponse({
        "message": f"Bienvenido a {config.APP_NAME}",
        "version": config.APP_VERSION,
        "status": "running"
    })

@app.get("/health")
async def health():
    return JSONResponse({
        "status": "healthy",
        "service": config.APP_NAME
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

