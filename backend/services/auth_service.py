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
            
            # Crear token JWT personalizado con role_id del perfil
            role_name = "usuario"
            role_id = None
            if profile:
                role_id = profile.get("role_id")
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
            # Registrar en Supabase Auth
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            
            if not response.user:
                raise Exception("Error al crear usuario en Supabase Auth")
            
            user = response.user
            
            # Determinar el role_id por defecto ('usuario')
            # Si no existe el rol, intentar con ID = 2 (asumiendo que 2 es 'usuario')
            role_id = 2  # Valor por defecto seguro
            try:
                roles_response = self.service_supabase.table("roles").select("id").eq("name", "usuario").execute()
                if roles_response.data and len(roles_response.data) > 0:
                    role_id = roles_response.data[0].get("id")
                    print(f"Role encontrado: {role_id}")
                else:
                    print(f"Rol 'usuario' no encontrado, usando role_id = 2")
            except Exception as e:
                print(f"Error al obtener rol por defecto: {str(e)}, usando role_id = 2")

            # Crear perfil en la tabla profiles con role_id requerido
            profile_data = {
                "id": user.id,
                "email": user.email,
                "full_name": full_name or email.split('@')[0],  # Usar email antes del @ si no hay nombre
                "role_id": role_id,  # Siempre incluir role_id
                "created_at": datetime.utcnow().isoformat()
            }

            # Usar service key para crear el perfil
            try:
                print(f"Intentando insertar perfil: {profile_data}")
                insert_response = self.service_supabase.table("profiles").insert(profile_data).execute()
                print(f"Perfil creado exitosamente: {insert_response.data}")
            except Exception as profile_error:
                print(f"Error detallado al crear perfil: {str(profile_error)}")
                import traceback
                traceback.print_exc()
                # Si falla crear el perfil, al menos el usuario se registró en Auth
                print(f"Datos que se intentaron insertar: {profile_data}")
                raise Exception(f"Error al crear perfil: {str(profile_error)}")
            
            return {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "full_name": full_name
                },
                "message": "Usuario registrado exitosamente"
            }
        except Exception as e:
            print(f"Error completo en registro: {str(e)}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Error en registro: {str(e)}")
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

