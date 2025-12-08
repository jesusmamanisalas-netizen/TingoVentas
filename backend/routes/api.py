"""
Rutas principales del API
Agrupa todos los routers de los controladores
"""
from fastapi import APIRouter
from backend.controllers import auth_controller, product_controller, role_controller, audit_controller

api_router = APIRouter()

# Incluir todos los routers
api_router.include_router(auth_controller.router)
api_router.include_router(product_controller.router)
api_router.include_router(role_controller.router)
api_router.include_router(audit_controller.router)

