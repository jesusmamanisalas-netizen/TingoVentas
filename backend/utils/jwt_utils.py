"""
Utilidades para manejo de JWT
Generación y verificación de tokens JWT
"""
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from jose import JWTError, jwt
from backend.config import config

def create_access_token(data: Dict[str, Any]) -> str:
    """
    Crea un token JWT
    Args:
        data: Datos a incluir en el token
    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=config.JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifica y decodifica un token JWT.
    ESTA FUNCIÓN ESTÁ BIEN: Verifica la firma usando el SECRET.
    
    Args:
        token: Token JWT a verificar
    Returns:
        Payload del token o None si es inválido
    """
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodifica un token sin verificar (útil para debugging o leer datos en frontend).
    CORREGIDO: Usamos get_unverified_claims que es la forma correcta en python-jose.
    
    Args:
        token: Token JWT
    Returns:
        Payload del token o None si hay error
    """
    try:
        # CORRECCIÓN: Usamos este método que no pide key ni options
        return jwt.get_unverified_claims(token)
    except JWTError:
        return None