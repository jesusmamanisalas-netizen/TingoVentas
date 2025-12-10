"""
Controlador de roles
Maneja las peticiones relacionadas con roles y permisos
"""
from fastapi import APIRouter, HTTPException, Depends  # type: ignore[import]
from typing import List, Dict, Any
import logging
from backend.models.schemas import (
    RoleAssignRequest, RoleResponse, MessageResponse, UserResponse,
    UpdateUserRoleRequest, RemoveUserRoleRequest
)
from backend.services.role_service import RoleService
from backend.services.audit_service import AuditService
from backend.middlewares.auth_middleware import AuthMiddleware

# Configurar logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/roles", tags=["Roles"])

role_service = RoleService()
audit_service = AuditService()
auth_middleware = AuthMiddleware()

@router.get("/listar", response_model=List[RoleResponse])
async def list_roles(
    user: dict = Depends(auth_middleware.get_current_user)
) -> List[Dict[str, Any]]:
    """
    Endpoint para listar roles
    REQ_003: Gestión de roles y permisos
    """
    try:
        logger.info(f"Listando roles solicitado por: {user.get('id')}")
        roles = await role_service.list_roles()
        logger.info(f"Roles listados exitosamente: {len(roles)} roles")
        return roles
    except Exception as e:
        logger.error(f"Error al listar roles: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error al listar roles: {str(e)}")

@router.post("/asignar", response_model=MessageResponse)
async def assign_role(
    request: RoleAssignRequest,
    user: dict = Depends(auth_middleware.require_role("admin"))
) -> Dict[str, Any]:
    """
    Endpoint para asignar rol a usuario
    REQ_003: Gestión de roles y permisos
    Solo accesible para administradores
    """
    try:
        result = await role_service.assign_role(request.user_id, request.role_id)
        
        # Registrar en auditoría
        await audit_service.log_activity(
            user_id=user["id"],
            action="ASSIGN_ROLE",
            resource="user_role",
            details={
                "target_user_id": request.user_id,
                "role_id": request.role_id
            }
        )
        
        return {"message": result["message"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/usuarios", response_model=List[UserResponse])
async def list_users(
    user: dict = Depends(auth_middleware.require_role("admin"))
) -> List[Dict[str, Any]]:
    """
    Endpoint para listar todos los usuarios con sus roles
    REQ_003: Gestión de roles y permisos
    Solo accesible para administradores
    """
    try:
        logger.info(f"Listando usuarios solicitado por: {user.get('id')}")
        users = await role_service.list_users()
        logger.info(f"Usuarios listados exitosamente: {len(users)} usuarios")
        return users
    except Exception as e:
        logger.error(f"Error al listar usuarios: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error al listar usuarios: {str(e)}")

@router.get("/usuarios/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    user: dict = Depends(auth_middleware.require_role("admin"))
):
    """
    Endpoint para obtener detalles de un usuario
    REQ_003: Gestión de roles y permisos
    Solo accesible para administradores
    """
    try:
        logger.info(f"Obteniendo detalles de usuario {user_id} solicitado por: {user.get('id')}")
        user_data = await role_service.get_user(user_id)
        logger.info(f"Detalles de usuario {user_id} obtenidos exitosamente")
        return user_data
    except Exception as e:
        logger.error(f"Error al obtener usuario {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=404, detail=f"Error al obtener usuario: {str(e)}")

@router.put("/usuarios/{user_id}/rol", response_model=MessageResponse)
async def update_user_role(
    user_id: str,
    request: UpdateUserRoleRequest,
    current_user: dict = Depends(auth_middleware.require_role("admin"))
) -> Dict[str, Any]:
    """
    Endpoint para actualizar el rol de un usuario
    REQ_003: Gestión de roles y permisos
    Solo accesible para administradores
    """
    try:
        result = await role_service.update_user_role(user_id, request.role_id)
        
        # Registrar en auditoría
        await audit_service.log_activity(
            user_id=current_user["id"],
            action="UPDATE_USER_ROLE",
            resource="user_role",
            details={
                "target_user_id": user_id,
                "role_id": request.role_id
            }
        )
        
        return {"message": result["message"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/usuarios/{user_id}/rol", response_model=MessageResponse)
async def remove_user_role(
    user_id: str,
    request: RemoveUserRoleRequest,
    current_user: dict = Depends(auth_middleware.require_role("admin"))
) -> Dict[str, Any]:
    """
    Endpoint para remover un rol de un usuario
    REQ_003: Gestión de roles y permisos
    Solo accesible para administradores
    """
    try:
        result = await role_service.remove_role(user_id, request.role_id)
        
        # Registrar en auditoría
        await audit_service.log_activity(
            user_id=current_user["id"],
            action="REMOVE_USER_ROLE",
            resource="user_role",
            details={
                "target_user_id": user_id,
                "role_id": request.role_id
            }
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


