"""
Servicio de autenticación
Maneja login, registro, recuperación de contraseña y validación de tokens
"""
from typing import Optional, Dict, Any
from supabase import Client
from backend.services.supabase_service import SupabaseService
from backend.utils.jwt_utils import create_access_token, verify_token
from datetime import datetime

class AuthService:
    """Servicio para operaciones de autenticación"""
    
    def __init__(self):
        self.supabase: Client = SupabaseService.get_client()
        self.service_supabase: Client = SupabaseService.get_service_client()
    
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Autentica un usuario en Supabase Auth
        
        Args:
            email: Email del usuario
            password: Contraseña del usuario
            
        Returns:
            Dict con token, usuario y datos de sesión
        """
        try:
            # Autenticar en Supabase Auth
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if not response.user:
                raise Exception("Credenciales inválidas")
            
            user = response.user
            session = response.session
            
            # Obtener perfil del usuario
            profile = self._get_user_profile(user.id)
            
            # Crear token JWT personalizado
            token_data = {
                "sub": user.id,
                "email": user.email,
                "role": profile.get("role", "usuario") if profile else "usuario"
            }
            access_token = create_access_token(token_data)
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "profile": profile
                },
                "session": {
                    "access_token": session.access_token,
                    "refresh_token": session.refresh_token
                }
            }
        except Exception as e:
            raise Exception(f"Error en login: {str(e)}")
    
    async def register(self, email: str, password: str, full_name: str) -> Dict[str, Any]:
        """
        Registra un nuevo usuario
        
        Args:
            email: Email del usuario
            password: Contraseña del usuario
            full_name: Nombre completo del usuario
            
        Returns:
            Dict con usuario creado
        """
        try:
            # Registrar en Supabase Auth
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            
            if not response.user:
                raise Exception("Error al crear usuario")
            
            user = response.user
            
            # Crear perfil en la tabla profiles
            profile_data = {
                "id": user.id,
                "email": user.email,
                "full_name": full_name,
                "role": "usuario",  # Rol por defecto
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Usar service key para crear el perfil
            self.service_supabase.table("profiles").insert(profile_data).execute()
            
            # Asignar rol por defecto
            self._assign_default_role(user.id)
            
            return {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": full_name
                },
                "message": "Usuario registrado exitosamente"
            }
        except Exception as e:
            raise Exception(f"Error en registro: {str(e)}")
    
    async def logout(self, access_token: str) -> Dict[str, Any]:
        """
        Cierra sesión del usuario
        
        Args:
            access_token: Token de acceso de Supabase
            
        Returns:
            Dict con mensaje de confirmación
        """
        try:
            self.supabase.auth.sign_out()
            return {"message": "Sesión cerrada exitosamente"}
        except Exception as e:
            raise Exception(f"Error en logout: {str(e)}")
    
    async def password_recovery(self, email: str) -> Dict[str, Any]:
        """
        Solicita recuperación de contraseña
        
        Args:
            email: Email del usuario
            
        Returns:
            Dict con mensaje de confirmación
        """
        try:
            self.supabase.auth.reset_password_for_email(email)
            return {"message": "Se ha enviado un email con instrucciones para recuperar tu contraseña"}
        except Exception as e:
            raise Exception(f"Error en recuperación de contraseña: {str(e)}")
    
    def verify_user_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verifica y decodifica un token JWT
        
        Args:
            token: Token JWT
            
        Returns:
            Dict con datos del usuario o None si es inválido
        """
        try:
            payload = verify_token(token)
            if payload is None:
                return None
            
            user_id = payload.get("sub")
            if not user_id:
                return None
            
            # Verificar que el usuario existe en Supabase
            profile = self._get_user_profile(user_id)
            if not profile:
                return None
            
            return {
                "id": user_id,
                "email": payload.get("email"),
                "role": payload.get("role", "usuario"),
                "profile": profile
            }
        except Exception as e:
            return None
    
    def _get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene el perfil del usuario desde la tabla profiles"""
        try:
            response = self.service_supabase.table("profiles").select("*").eq("id", user_id).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception:
            return None
    
    def _assign_default_role(self, user_id: str):
        """Asigna el rol por defecto 'usuario' al nuevo usuario"""
        try:
            # Buscar el rol 'usuario' en la tabla roles
            roles_response = self.service_supabase.table("roles").select("id").eq("name", "usuario").execute()
            
            if roles_response.data and len(roles_response.data) > 0:
                role_id = roles_response.data[0]["id"]
                
                # Asignar rol en user_roles
                user_role_data = {
                    "user_id": user_id,
                    "role_id": role_id,
                    "created_at": datetime.utcnow().isoformat()
                }
                self.service_supabase.table("user_roles").insert(user_role_data).execute()
        except Exception:
            # Si falla, continuar sin asignar rol (el sistema puede funcionar sin esto)
            pass

