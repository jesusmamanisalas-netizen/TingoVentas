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
        Autentica un usuario en Supabase Auth y genera un JWT con role_id
        """
        try:
            # 1. Autenticar en Supabase Auth
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if not response.user:
                raise Exception("Credenciales inválidas")
            
            user = response.user
            session = response.session
            
            # 2. Obtener perfil del usuario desde 'public.profiles'
            profile = self._get_user_profile(user.id)
            
            if not profile:
                raise Exception("Perfil de usuario no encontrado (Error de sincronización)")
            
            # 3. Obtener el role_id (Asumimos 3=Usuario como fallback si es nulo)
            role_id = profile.get("role_id", 3)
            
            # 4. Crear token JWT que incluye el role_id
            token_data = {
                "sub": user.id,
                "email": user.email,
                "role_id": role_id  # <--- IMPORTANTE: Esto permite validar permisos en el Front/Back
            }
            
            access_token = create_access_token(token_data)
            
            # 5. Construir respuesta
            result = {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role_id": role_id,
                    "full_name": profile.get("full_name"),
                    "profile": profile
                }
            }
            
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
        Registra un nuevo usuario.
        El Trigger en BD se encarga de crear el perfil en 'public.profiles'
        usando la metadata enviada aquí.
        """
        try:
            print(f"[REGISTER] Iniciando registro para: {email}")
            
            # 1. Registrar en Supabase Auth enviando full_name en metadata
            # Esto dispara el Trigger 'on_auth_user_created' en Postgres
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
            
            # 2. Auto-confirmar email (Opcional, útil para desarrollo)
            try:
                self.service_supabase.auth.admin.update_user_by_id(
                    user.id,
                    {"email_confirm": True}
                )
                print(f"[REGISTER] Email auto-confirmado para usuario: {user.id}")
            except Exception as confirm_error:
                print(f"[REGISTER] Advertencia al confirmar email: {str(confirm_error)}")
            
            # Nota: No necesitamos insertar en 'profiles' manualmente, 
            # el Trigger SQL ya lo hizo leyendo 'full_name' de la metadata.
            
            return {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": full_name,
                    "role_id": 3 # Asumimos rol usuario por defecto visualmente
                },
                "message": "Usuario registrado exitosamente"
            }
        except Exception as e:
            print(f"[REGISTER] Error crítico: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Error en registro: {str(e)}")
    
    async def logout(self, access_token: str) -> Dict[str, Any]:
        """Cierra sesión del usuario"""
        try:
            self.supabase.auth.sign_out()
            return {"message": "Sesión cerrada exitosamente"}
        except Exception as e:
            raise Exception(f"Error en logout: {str(e)}")
    
    async def password_recovery(self, email: str) -> Dict[str, Any]:
        """Solicita recuperación de contraseña"""
        try:
            self.supabase.auth.reset_password_for_email(email)
            return {"message": "Se ha enviado un email con instrucciones"}
        except Exception as e:
            raise Exception(f"Error en recuperación de contraseña: {str(e)}")
    
    def verify_user_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verifica token y devuelve datos del usuario incluyendo role_id
        """
        try:
            payload = verify_token(token)
            if payload is None:
                return None
            
            user_id = payload.get("sub")
            if not user_id:
                return None
            
            # Verificar perfil
            profile = self._get_user_profile(user_id)
            if not profile:
                return None
            
            return {
                "id": user_id,
                "email": payload.get("email"),
                "role_id": payload.get("role_id", 3), # Recuperamos el ID numérico
                "profile": profile
            }
        except Exception:
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