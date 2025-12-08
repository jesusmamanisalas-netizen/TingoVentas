"""
Controlador de productos
Maneja las peticiones relacionadas con productos
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from typing import List, Dict, Any, Optional
from backend.models.schemas import (
    ProductCreate, ProductUpdate, ProductResponse, MessageResponse
)
from backend.services.product_service import ProductService
from backend.services.audit_service import AuditService
from backend.middlewares.auth_middleware import AuthMiddleware

router = APIRouter(prefix="/productos", tags=["Productos"])

product_service = ProductService()
audit_service = AuditService()
auth_middleware = AuthMiddleware()

# ========== ENDPOINTS PÚBLICOS ==========

@router.get("/publicos", response_model=List[ProductResponse])
async def list_public_products(
    search: Optional[str] = Query(None, description="Búsqueda por nombre, descripción, SKU o marca"),
    category_id: Optional[str] = Query(None, description="Filtrar por ID de categoría")
) -> List[Dict[str, Any]]:
    """
    Endpoint PÚBLICO para listar productos (sin autenticación)
    Para usuarios que quieren ver productos sin iniciar sesión
    """
    try:
        products = await product_service.list_products(
            search=search,
            category_id=category_id,
            public=True  # Solo productos activos
        )
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categorias")
async def list_categories() -> List[Dict[str, Any]]:
    """
    Endpoint PÚBLICO para listar categorías
    """
    try:
        categories = await product_service.list_categories()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========== ENDPOINTS PROTEGIDOS ==========

@router.get("/listar", response_model=List[ProductResponse])
async def list_products(
    search: Optional[str] = Query(None, description="Búsqueda por nombre o descripción"),
    category_id: Optional[str] = Query(None, description="Filtrar por ID de categoría"),
    min_stock: Optional[bool] = Query(None, description="Solo productos con stock mínimo"),
    user: dict = Depends(auth_middleware.get_current_user)
) -> List[Dict[str, Any]]:
    """
    Endpoint para listar productos (requiere autenticación)
    REQ_010: Consulta y listado de productos
    REQ_011: Búsqueda y filtrado de productos
    """
    try:
        products = await product_service.list_products(
            search=search,
            category_id=category_id,
            min_stock=min_stock,
            public=False
        )
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/crear", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    user: dict = Depends(auth_middleware.get_current_user)
) -> Dict[str, Any]:
    """
    Endpoint para crear producto
    REQ_007: Registro de productos
    """
    try:
        product_data = product.dict(by_alias=True, exclude_none=True)
        result = await product_service.create_product(product_data)
        
        # Registrar en auditoría
        await audit_service.log_activity(
            user_id=user["id"],
            action="CREATE",
            resource="product",
            record_id=result.get("id")
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/editar/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    product: ProductUpdate,
    user: dict = Depends(auth_middleware.get_current_user)
) -> Dict[str, Any]:
    """
    Endpoint para actualizar producto
    REQ_008: Edición de productos
    """
    try:
        # Filtrar solo campos que no son None
        product_data = product.dict(by_alias=True, exclude_none=True)
        
        if not product_data:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")
        
        result = await product_service.update_product(product_id, product_data)
        
        # Registrar en auditoría
        await audit_service.log_activity(
            user_id=user["id"],
            action="UPDATE",
            resource="product",
            record_id=product_id
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/eliminar/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: str,
    user: dict = Depends(auth_middleware.get_current_user)
) -> Dict[str, Any]:
    """
    Endpoint para eliminar (desactivar) producto
    REQ_009: Eliminación o desactivación de productos
    """
    try:
        result = await product_service.delete_product(product_id)
        
        # Registrar en auditoría
        await audit_service.log_activity(
            user_id=user["id"],
            action="DELETE",
            resource="product",
            record_id=product_id
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stock-minimo", response_model=List[ProductResponse])
async def get_low_stock_products(
    user: dict = Depends(auth_middleware.get_current_user)
) -> List[Dict[str, Any]]:
    """
    Endpoint para obtener productos con stock mínimo
    REQ_012: Control de stock mínimo
    """
    try:
        products = await product_service.get_low_stock_products()
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subir-imagen/{product_id}", response_model=MessageResponse)
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    user: dict = Depends(auth_middleware.get_current_user)
) -> Dict[str, Any]:
    """
    Endpoint para subir imagen de producto
    REQ_013: Carga de imagen de producto
    """
    try:
        # Validar que es una imagen
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
        
        # Leer el archivo
        image_bytes = await file.read()
        
        # Subir a Supabase Storage
        result = await product_service.upload_product_image(
            product_id=product_id,
            image_file=image_bytes,
            filename=file.filename or "image.jpg"
        )
        
        # Registrar en auditoría
        await audit_service.log_activity(
            user_id=user["id"],
            action="UPLOAD_IMAGE",
            resource="product_image",
            record_id=product_id
        )
        
        return {"message": result["message"], "image_url": result["image_url"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

