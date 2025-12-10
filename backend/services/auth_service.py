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
            
            # Validar que el usuario tiene perfil (debe existir en la tabla profiles)
            if not profile:
                raise Exception("Perfil de usuario no encontrado")
            
            # Crear token JWT personalizado con role_id del perfil
            role_name = "usuario"
            role_id = profile.get("role_id", 2)  # Usar role_id del perfil
            
            # Obtener el nombre del rol si existe role_id
            if role_id:
                try:
                    role_response = self.service_supabase.table("roles").select("name").eq("id", role_id).execute()
                    if role_response.data:
                        role_name = role_response.data[0].get("name", "usuario")
                except Exception:
                    role_name = "usuario"
            
            token_data = {
                "sub": user.id,
                "email": user.email,
                "role": role_name
            }
            access_token = create_access_token(token_data)
            
            result = {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "profile": profile
                }
            }
            
            # Solo agregar session si existe
            if session:
                result["session"] = {
                    "access_token": session.access_token,
                    "refresh_token": session.refresh_token
                }
            
            return result
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
            print(f"[REGISTER] Iniciando registro para: {email}")
            
            # Registrar en Supabase Auth sin confirmación de email
            # El trigger handle_new_user() en Supabase creará el perfil automáticamente
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name
                    }
                }
            })
            
            if not response.user:
                raise Exception("Error al crear usuario en Supabase Auth")
            
            user = response.user
            print(f"[REGISTER] Usuario creado en Auth con id: {user.id}")
            
            # Auto-confirmar email usando service role para que pueda login inmediatamente
            try:
                self.service_supabase.auth.admin.update_user_by_id(
                    user.id,
                    {"email_confirm": True}
                )
                print(f"[REGISTER] Email auto-confirmado para usuario: {user.id}")
            except Exception as confirm_error:
                print(f"[REGISTER] Error al confirmar email: {str(confirm_error)}")
                # Continuar aunque falle la confirmación
            
            # El trigger en Supabase crea el perfil automáticamente
            
            return {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": full_name
                },
                "message": "Usuario registrado exitosamente"
            }
        except Exception as e:
            print(f"[REGISTER] Error en registro: {str(e)}")
            import traceback
            traceback.print_exc()
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
        """(Obsoleto) Antes se usaba una tabla user_roles; ahora usamos profiles.role_id.
        Este método se mantiene como fallback pero no realiza cambios.
        """
        return

