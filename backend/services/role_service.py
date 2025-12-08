"""
Servicio de roles y permisos
Maneja la gestión de roles y asignación a usuarios
"""
from typing import List, Dict, Any, Optional
from supabase import Client
from backend.services.supabase_service import SupabaseService
from datetime import datetime

class RoleService:
    """Servicio para operaciones con roles"""
    
    def __init__(self):
        self.supabase: Client = SupabaseService.get_service_client()
    
    async def list_roles(self) -> List[Dict[str, Any]]:
        """
        Lista todos los roles disponibles
        
        Returns:
            Lista de roles
        """
        try:
            response = self.supabase.table("roles").select("*").execute()
            return response.data if response.data else []
        except Exception as e:
            raise Exception(f"Error al listar roles: {str(e)}")
    
    async def get_user_roles(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene los roles de un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de roles del usuario
        """
        try:
            response = self.supabase.table("user_roles").select("*, roles(*)").eq("user_id", user_id).execute()
            if response.data:
                return [item.get("roles") for item in response.data if item.get("roles")]
            return []
        except Exception as e:
            raise Exception(f"Error al obtener roles del usuario: {str(e)}")
    
    async def assign_role(self, user_id: str, role_id: str) -> Dict[str, Any]:
        """
        Asigna un rol a un usuario
        
        Args:
            user_id: ID del usuario
            role_id: ID del rol
            
        Returns:
            Confirmación de asignación
        """
        try:
            # Verificar que el rol existe
            role_response = self.supabase.table("roles").select("*").eq("id", role_id).execute()
            if not role_response.data:
                raise Exception("Rol no encontrado")
            
            # Verificar si el usuario ya tiene este rol
            existing = self.supabase.table("user_roles").select("*").eq("user_id", user_id).eq("role_id", role_id).execute()
            if existing.data:
                raise Exception("El usuario ya tiene este rol asignado")
            
            # Asignar rol
            user_role_data = {
                "user_id": user_id,
                "role_id": role_id,
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table("user_roles").insert(user_role_data).execute()
            
            if response.data:
                return {
                    "message": "Rol asignado exitosamente",
                    "user_role": response.data[0]
                }
            raise Exception("Error al asignar rol")
        except Exception as e:
            raise Exception(f"Error al asignar rol: {str(e)}")
    
    async def remove_role(self, user_id: str, role_id: str) -> Dict[str, Any]:
        """
        Remueve un rol de un usuario
        
        Args:
            user_id: ID del usuario
            role_id: ID del rol
            
        Returns:
            Confirmación de remoción
        """
        try:
            response = self.supabase.table("user_roles").delete().eq("user_id", user_id).eq("role_id", role_id).execute()
            return {"message": "Rol removido exitosamente"}
        except Exception as e:
            raise Exception(f"Error al remover rol: {str(e)}")
    
    def has_permission(self, user_roles: List[str], required_role: str) -> bool:
        """
        Verifica si un usuario tiene un permiso específico
        
        Args:
            user_roles: Lista de nombres de roles del usuario
            required_role: Rol requerido
            
        Returns:
            True si tiene el permiso, False en caso contrario
        """
        # Admin tiene todos los permisos
        if "admin" in user_roles:
            return True
        
        # Verificar rol específico
        return required_role in user_roles

