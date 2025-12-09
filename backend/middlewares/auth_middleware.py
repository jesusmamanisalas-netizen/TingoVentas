"""
Middleware de autenticación
Verifica tokens JWT y protege rutas
"""
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from backend.services.auth_service import AuthService
from backend.services.role_service import RoleService

security = HTTPBearer()

class AuthMiddleware:
    """Middleware para autenticación y autorización"""
    
    def __init__(self):
        self.auth_service = AuthService()
        self.role_service = RoleService()
    
    async def get_current_user(self, credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
        """
        Obtiene el usuario actual desde el token JWT
        
        Args:
            credentials: Credenciales HTTP Bearer
            
        Returns:
            Datos del usuario autenticado
            
        Raises:
            HTTPException: Si el token es inválido o no está presente
        """
        token = credentials.credentials
        user = self.auth_service.verify_user_token(token)
        
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="Token inválido o expirado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    
    def require_role(self, required_role: str = "admin"):
        """
        Crea un dependency para requerir un rol específico
        
        Args:
            required_role: Rol requerido (default: "admin")
            
        Returns:
            Función dependency para FastAPI
        """
        async def role_checker(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
            token = credentials.credentials
            user = self.auth_service.verify_user_token(token)
            
            if user is None:
                raise HTTPException(
                    status_code=401,
                    detail="Token inválido o expirado",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            try:
                user_roles_response = await self.role_service.get_user_roles(user["id"])
                user_roles = [role.get("name") for role in user_roles_response if isinstance(role, dict) and role.get("name")]
                
                # Admin tiene todos los permisos
                if "admin" in user_roles:
                    return user
                
                # Verificar rol específico
                if required_role not in user_roles:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Se requiere rol: {required_role}"
                    )
                
                return user
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error al verificar rol: {str(e)}"
                )
        
        return role_checker
    
    def get_optional_user(self, credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[dict]:
        """
        Obtiene el usuario si existe token, pero no lanza excepción si no hay
        
        Args:
            credentials: Credenciales HTTP Bearer opcionales
            
        Returns:
            Datos del usuario o None
        """
        if credentials is None:
            return None
        
        try:
            token = credentials.credentials
            user = self.auth_service.verify_user_token(token)
            return user
        except Exception:
            return None

