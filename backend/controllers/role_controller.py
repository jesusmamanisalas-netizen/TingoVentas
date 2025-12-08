"""
Controlador de roles
Maneja las peticiones relacionadas con roles y permisos
"""
from fastapi import APIRouter, HTTPException, Depends  # type: ignore[import]
from typing import List, Dict, Any
from backend.models.schemas import RoleAssignRequest, RoleResponse, MessageResponse
from backend.services.role_service import RoleService
from backend.services.audit_service import AuditService
from backend.middlewares.auth_middleware import AuthMiddleware

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
        roles = await role_service.list_roles()
        return roles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

