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
            if response.data:
                return response.data  # type: ignore
            return []
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
            # Obtener el perfil del usuario
            profile_response = self.supabase.table("profiles").select("id, role").eq("id", user_id).execute()
            
            if not profile_response.data:
                return []
            
            profile = profile_response.data[0]
            user_role = profile.get("role")
            
            if not user_role:
                return []
            
            # Obtener el rol completo desde la tabla roles
            role_response = self.supabase.table("roles").select("*").eq("name", user_role).execute()
            
            if role_response.data:
                return role_response.data
            
            return []
        except Exception as e:
            raise Exception(f"Error al obtener roles del usuario: {str(e)}")
    
    async def assign_role(self, user_id: str, role_id: str) -> Dict[str, Any]:
        """
        Asigna un rol a un usuario (actualiza el campo role en profiles)
        
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
            
            role = role_response.data[0]
            role_name = role.get("name")
            
            # Actualizar el campo role en profiles
            update_response = self.supabase.table("profiles").update({"role": role_name}).eq("id", user_id).execute()
            
            if update_response.data:
                return {
                    "message": "Rol asignado exitosamente",
                    "user_role": update_response.data[0]
                }
            raise Exception("Error al asignar rol")
        except Exception as e:
            raise Exception(f"Error al asignar rol: {str(e)}")
    
    async def remove_role(self, user_id: str, role_id: str) -> Dict[str, Any]:
        """
        Remueve un rol de un usuario (establece role como null en profiles)
        
        Args:
            user_id: ID del usuario
            role_id: ID del rol (opcional, para compatibilidad)
            
        Returns:
            Confirmación de remoción
        """
        try:
            # Establecer role como null
            response = self.supabase.table("profiles").update({"role": None}).eq("id", user_id).execute()
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
    
    async def list_users(self) -> List[Dict[str, Any]]:
        """
        Lista todos los usuarios con sus roles
        
        Returns:
            Lista de usuarios con sus roles
        """
        try:
            response = self.supabase.table("profiles").select("id, email, full_name, role, created_at").execute()
            if not response.data:
                return []
            
            # Enriquecer cada usuario con sus roles
            users: List[Dict[str, Any]] = []
            for user in response.data:
                if isinstance(user, dict):
                    user_id = user.get("id")
                    if user_id:
                        roles = await self.get_user_roles(str(user_id))
                        user["roles"] = roles
                    users.append(user)
            
            return users
        except Exception as e:
            raise Exception(f"Error al listar usuarios: {str(e)}")
    
    async def get_user(self, user_id: str) -> Dict[str, Any]:
        """
        Obtiene los detalles de un usuario con sus roles
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Datos del usuario con sus roles
        """
        try:
            response = self.supabase.table("profiles").select("id, email, full_name, role, created_at").eq("id", user_id).execute()
            
            if not response.data:
                raise Exception("Usuario no encontrado")
            
            user = response.data[0]
            roles = await self.get_user_roles(user_id)
            user["roles"] = roles
            
            return user
        except Exception as e:
            raise Exception(f"Error al obtener usuario: {str(e)}")
    
    async def update_user_role(self, user_id: str, new_role_id: str) -> Dict[str, Any]:
        """
        Actualiza el rol de un usuario
        
        Args:
            user_id: ID del usuario
            new_role_id: ID del nuevo rol
            
        Returns:
            Confirmación de actualización
        """
        try:
            # Verificar que el rol existe
            role_response = self.supabase.table("roles").select("*").eq("id", new_role_id).execute()
            if not role_response.data:
                raise Exception("Rol no encontrado")
            
            role = role_response.data[0]
            role_name = role.get("name")
            
            # Actualizar el rol directamente en profiles
            update_response = self.supabase.table("profiles").update({"role": role_name}).eq("id", user_id).execute()
            
            if update_response.data:
                return {"message": "Rol actualizado exitosamente"}
            
            raise Exception("Error al actualizar rol")
        except Exception as e:
            raise Exception(f"Error al actualizar rol: {str(e)}")


