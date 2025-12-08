"""
Controlador de autenticación
Maneja las peticiones relacionadas con autenticación
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from backend.models.schemas import (
    LoginRequest, RegisterRequest, PasswordRecoveryRequest,
    AuthResponse, MessageResponse
)
from backend.services.auth_service import AuthService
from backend.services.audit_service import AuditService
from backend.middlewares.auth_middleware import AuthMiddleware

router = APIRouter(prefix="/auth", tags=["Autenticación"])

auth_service = AuthService()
audit_service = AuditService()
auth_middleware = AuthMiddleware()

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest) -> Dict[str, Any]:
    """
    Endpoint de login
    REQ_001: Logeo en el sistema
    """
    try:
        result = await auth_service.login(request.email, request.password)
        
        # Registrar en auditoría
        await audit_service.log_activity(
            user_id=result["user"]["id"],
            action="LOGIN",
            resource="auth",
            details={"email": request.email}
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/register", response_model=MessageResponse)
async def register(request: RegisterRequest) -> Dict[str, Any]:
    """
    Endpoint de registro
    REQ_002: Registro de usuarios
    """
    try:
        result = await auth_service.register(
            request.email,
            request.password,
            request.full_name
        )
        
        # Registrar en auditoría
        await audit_service.log_activity(
            user_id=result["user"]["id"],
            action="REGISTER",
            resource="user",
            details={"email": request.email, "full_name": request.full_name}
        )
        
        return {"message": result["message"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/logout", response_model=MessageResponse)
async def logout(user: dict = Depends(auth_middleware.get_current_user)) -> Dict[str, Any]:
    """
    Endpoint de logout
    REQ_005: Cierre de sesión
    """
    try:
        # Registrar en auditoría
        await audit_service.log_activity(
            user_id=user["id"],
            action="LOGOUT",
            resource="auth"
        )
        
        return {"message": "Sesión cerrada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/password-recovery", response_model=MessageResponse)
async def password_recovery(request: PasswordRecoveryRequest) -> Dict[str, Any]:
    """
    Endpoint de recuperación de contraseña
    REQ_004: Recuperación de contraseña
    """
    try:
        result = await auth_service.password_recovery(request.email)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

