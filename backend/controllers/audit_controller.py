"""
Controlador de auditoría
Maneja las peticiones relacionadas con auditoría
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from backend.models.schemas import AuditLogResponse
from backend.services.audit_service import AuditService
from backend.middlewares.auth_middleware import AuthMiddleware

router = APIRouter(prefix="/auditoria", tags=["Auditoría"])

audit_service = AuditService()
auth_middleware = AuthMiddleware()

@router.get("/listar", response_model=List[AuditLogResponse])
async def list_audit_logs(
    user_id: Optional[str] = Query(None, description="Filtrar por profile_id"),
    table_name: Optional[str] = Query(None, description="Filtrar por nombre de tabla"),
    action: Optional[str] = Query(None, description="Filtrar por acción"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de resultados"),
    user: dict = Depends(auth_middleware.require_role("admin"))
) -> List[Dict[str, Any]]:
    """
    Endpoint para listar registros de auditoría
    REQ_006: Auditoría de actividades (bitácora)
    Solo accesible para administradores
    """
    try:
        logs = await audit_service.list_audit_logs(
            user_id=user_id,
            table_name=table_name,
            action=action,
            limit=limit
        )
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

