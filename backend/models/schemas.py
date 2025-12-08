"""
Esquemas Pydantic para validación de datos
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# ========== AUTH SCHEMAS ==========

class LoginRequest(BaseModel):
    """Esquema para login"""
    email: EmailStr
    password: str = Field(..., min_length=6)

class RegisterRequest(BaseModel):
    """Esquema para registro"""
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)

class PasswordRecoveryRequest(BaseModel):
    """Esquema para recuperación de contraseña"""
    email: EmailStr

class AuthResponse(BaseModel):
    """Respuesta de autenticación"""
    access_token: str
    token_type: str
    user: Dict[str, Any]

# ========== PRODUCT SCHEMAS ==========

class ProductCreate(BaseModel):
    """Esquema para crear producto"""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    Sku: Optional[str] = None
    brand: Optional[str] = None
    price: float = Field(..., gt=0)
    current_stock: int = Field(default=0, ge=0, alias="stock")
    min_stock: int = Field(default=0, ge=0, alias="stock_minimo")
    category_id: Optional[int] = None        # <--- CORREGIDO
    image_url: Optional[str] = None
    is_active: bool = Field(default=True, alias="active")
    
    class Config:
        populate_by_name = True


class ProductUpdate(BaseModel):
    """Esquema para actualizar producto"""
    name: Optional[str] = None
    description: Optional[str] = None
    Sku: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    current_stock: Optional[int] = Field(None, ge=0, alias="stock")
    min_stock: Optional[int] = Field(None, ge=0, alias="stock_minimo")
    category_id: Optional[int] = None        # <--- CORREGIDO
    image_url: Optional[str] = None
    is_active: Optional[bool] = Field(None, alias="active")
    
    class Config:
        populate_by_name = True


class ProductResponse(BaseModel):
    """Respuesta de producto"""
    id: str
    name: str
    description: Optional[str]
    Sku: Optional[str] = None
    brand: Optional[str] = None
    price: float
    current_stock: int
    min_stock: int
    is_active: bool
    category_id: Optional[int] = None         # <--- CORREGIDO
    category: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ========== ROLE SCHEMAS ==========

class RoleAssignRequest(BaseModel):
    """Esquema para asignar rol"""
    user_id: str
    role_id: str

class RoleResponse(BaseModel):
    """Respuesta de rol"""
    id: str
    name: str
    description: Optional[str] = None
    created_at: Optional[str] = None

# ========== AUDIT SCHEMAS ==========

class AuditLogResponse(BaseModel):
    """Respuesta de registro de auditoría"""
    id: str
    user_id: str
    action: str
    resource: str
    details: Dict[str, Any]
    created_at: str

# ========== COMMON SCHEMAS ==========

class MessageResponse(BaseModel):
    """Respuesta genérica con mensaje"""
    message: str

class ErrorResponse(BaseModel):
    """Respuesta de error"""
    error: str
    detail: Optional[str] = None

