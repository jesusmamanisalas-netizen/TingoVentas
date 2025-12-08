"""
Servicio de auditoría
Maneja el registro de actividades del sistema
"""
from typing import List, Dict, Any, Optional
from supabase import Client
from backend.services.supabase_service import SupabaseService
from datetime import datetime

class AuditService:
    """Servicio para operaciones de auditoría"""
    
    def __init__(self):
        self.supabase: Client = SupabaseService.get_service_client()
    
    async def log_activity(self, user_id: str, action: str, 
                          resource: str, details: Optional[Dict[str, Any]] = None,
                          record_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Registra una actividad en el log de auditoría
        
        Args:
            user_id: ID del usuario (profile_id en la tabla)
            action: Acción realizada (CREATE, UPDATE, DELETE, LOGIN, etc.)
            resource: Recurso afectado (se mapea a table_name)
            details: Detalles adicionales de la acción
            record_id: ID del registro afectado
            
        Returns:
            Registro de auditoría creado
        """
        try:
            # Mapear resource a table_name
            table_name_map = {
                "product": "products",
                "user": "profiles",
                "auth": "auth",
                "product_image": "product_images"
            }
            table_name = table_name_map.get(resource, resource)
            
            audit_data = {
                "profile_id": user_id,  # Usar profile_id en lugar de user_id
                "action": action,
                "table_name": table_name,
                "record_id": record_id,
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table("audit_logs").insert(audit_data).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            raise Exception("Error al crear registro de auditoría")
        except Exception as e:
            # No lanzar excepción en auditoría para no interrumpir el flujo principal
            print(f"Error en auditoría: {str(e)}")
            return {}
    
    async def list_audit_logs(self, user_id: Optional[str] = None,
                             table_name: Optional[str] = None,
                             action: Optional[str] = None,
                             limit: int = 100) -> List[Dict[str, Any]]:
        """
        Lista los registros de auditoría con filtros opcionales
        
        Args:
            user_id: Filtrar por profile_id
            table_name: Filtrar por nombre de tabla
            action: Filtrar por acción
            limit: Límite de resultados
            
        Returns:
            Lista de registros de auditoría
        """
        try:
            query = self.supabase.table("audit_logs").select("*, profiles(email, full_name)")
            
            if user_id:
                query = query.eq("profile_id", user_id)
            
            if table_name:
                query = query.eq("table_name", table_name)
            
            if action:
                query = query.eq("action", action)
            
            response = query.order("created_at", desc=True).limit(limit).execute()
            return response.data if response.data else []
        except Exception as e:
            raise Exception(f"Error al listar registros de auditoría: {str(e)}")
    
    async def get_audit_log(self, log_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un registro de auditoría por ID
        
        Args:
            log_id: ID del registro
            
        Returns:
            Registro de auditoría o None
        """
        try:
            response = self.supabase.table("audit_logs").select("*, profiles(email, full_name)").eq("id", log_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            raise Exception(f"Error al obtener registro de auditoría: {str(e)}")

