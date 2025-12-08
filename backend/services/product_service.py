"""
Servicio de productos
Maneja CRUD de productos y operaciones relacionadas
"""
from typing import List, Optional, Dict, Any
from supabase import Client
from backend.services.supabase_service import SupabaseService
from datetime import datetime

class ProductService:
    """Servicio para operaciones con productos"""
    
    def __init__(self):
        self.supabase: Client = SupabaseService.get_service_client()
    
    async def list_products(self, search: Optional[str] = None, 
                          category_id: Optional[str] = None,
                          min_stock: Optional[bool] = None,
                          public: bool = False) -> List[Dict[str, Any]]:
        """
        Lista todos los productos con filtros opcionales
        
        Args:
            search: Término de búsqueda (nombre, descripción, SKU, brand)
            category_id: Filtrar por ID de categoría
            min_stock: Si es True, solo productos con stock mínimo
            public: Si es True, solo productos activos (para vista pública)
            
        Returns:
            Lista de productos
        """
        try:
            # Incluir relación con categorías e imágenes
            query = self.supabase.table("products").select("*, categories(*), product_images(*)")
            
            # Si es vista pública, solo productos activos
            if public:
                query = query.eq("is_active", True)
            
            # Aplicar filtros
            if search:
                query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%,Sku.ilike.%{search}%,brand.ilike.%{search}%")
            
            if category_id:
                query = query.eq("category_id", category_id)
            
            response = query.order("created_at", desc=True).execute()
            products = response.data if response.data else []
            
            # Filtrar productos con stock mínimo si se solicita
            if min_stock is not None:
                products = [p for p in products if p.get("current_stock", 0) <= p.get("min_stock", 0)]
            
            # Formatear productos para respuesta
            formatted_products = []
            for product in products:
                # Obtener primera imagen si existe
                images = product.get("product_images", [])
                image_url = images[0].get("image_url") if images and len(images) > 0 else None
                
                formatted_product = {
                    "id": product.get("id"),
                    "name": product.get("name"),
                    "description": product.get("description"),
                    "Sku": product.get("Sku"),
                    "brand": product.get("brand"),
                    "price": product.get("price"),
                    "current_stock": product.get("current_stock", 0),
                    "min_stock": product.get("min_stock", 0),
                    "is_active": product.get("is_active", True),
                    "category_id": product.get("category_id"),
                    "category": product.get("categories", {}).get("name") if product.get("categories") else None,
                    "image_url": image_url,
                    "created_at": product.get("created_at"),
                    "updated_at": product.get("updated_at")
                }
                formatted_products.append(formatted_product)
            
            return formatted_products
        except Exception as e:
            raise Exception(f"Error al listar productos: {str(e)}")
    
    async def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene un producto por ID
        
        Args:
            product_id: ID del producto
            
        Returns:
            Producto o None si no existe
        """
        try:
            response = self.supabase.table("products").select("*, categories(*), product_images(*)").eq("id", product_id).execute()
            if response.data and len(response.data) > 0:
                product = response.data[0]
                
                # Formatear producto
                images = product.get("product_images", [])
                image_url = images[0].get("image_url") if images and len(images) > 0 else None
                
                return {
                    "id": product.get("id"),
                    "name": product.get("name"),
                    "description": product.get("description"),
                    "Sku": product.get("Sku"),
                    "brand": product.get("brand"),
                    "price": product.get("price"),
                    "current_stock": product.get("current_stock", 0),
                    "min_stock": product.get("min_stock", 0),
                    "is_active": product.get("is_active", True),
                    "category_id": product.get("category_id"),
                    "category": product.get("categories", {}).get("name") if product.get("categories") else None,
                    "image_url": image_url,
                    "images": [img.get("image_url") for img in images],
                    "created_at": product.get("created_at"),
                    "updated_at": product.get("updated_at")
                }
            return None
        except Exception as e:
            raise Exception(f"Error al obtener producto: {str(e)}")
    
    async def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Crea un nuevo producto
        
        Args:
            product_data: Datos del producto
            
        Returns:
            Producto creado
        """
        try:
            # Mapear campos del schema a la estructura real de Supabase
            supabase_data = {
                "name": product_data.get("name"),
                "description": product_data.get("description"),
                "Sku": product_data.get("Sku") or product_data.get("sku"),
                "brand": product_data.get("brand"),
                "price": product_data.get("price"),
                "current_stock": product_data.get("current_stock") or product_data.get("stock", 0),
                "min_stock": product_data.get("min_stock") or product_data.get("stock_minimo", 0),
                "is_active": product_data.get("is_active", True),
                "category_id": product_data.get("category_id")
            }
            
            # Remover None values
            supabase_data = {k: v for k, v in supabase_data.items() if v is not None}
            
            response = self.supabase.table("products").insert(supabase_data).execute()
            
            if response.data and len(response.data) > 0:
                product = response.data[0]
                
                # Si hay imagen, crear registro en product_images
                if product_data.get("image_url"):
                    await self._add_product_image(product["id"], product_data["image_url"])
                
                return await self.get_product(product["id"])
            raise Exception("Error al crear producto")
        except Exception as e:
            raise Exception(f"Error al crear producto: {str(e)}")
    
    async def _add_product_image(self, product_id: str, image_url: str):
        """Agrega una imagen a un producto"""
        try:
            self.supabase.table("product_images").insert({
                "product_id": product_id,
                "image_url": image_url
            }).execute()
        except Exception:
            pass  # Si falla, continuar sin la imagen
    
    async def update_product(self, product_id: str, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Actualiza un producto
        
        Args:
            product_id: ID del producto
            product_data: Datos a actualizar
            
        Returns:
            Producto actualizado
        """
        try:
            # Mapear campos del schema a la estructura real de Supabase
            supabase_data = {}
            
            if "name" in product_data:
                supabase_data["name"] = product_data["name"]
            if "description" in product_data:
                supabase_data["description"] = product_data["description"]
            if "Sku" in product_data or "sku" in product_data:
                supabase_data["Sku"] = product_data.get("Sku") or product_data.get("sku")
            if "brand" in product_data:
                supabase_data["brand"] = product_data["brand"]
            if "price" in product_data:
                supabase_data["price"] = product_data["price"]
            if "current_stock" in product_data or "stock" in product_data:
                supabase_data["current_stock"] = product_data.get("current_stock") or product_data.get("stock")
            if "min_stock" in product_data or "stock_minimo" in product_data:
                supabase_data["min_stock"] = product_data.get("min_stock") or product_data.get("stock_minimo")
            if "is_active" in product_data or "active" in product_data:
                supabase_data["is_active"] = product_data.get("is_active") or product_data.get("active")
            if "category_id" in product_data:
                supabase_data["category_id"] = product_data["category_id"]
            
            if not supabase_data:
                raise Exception("No hay datos para actualizar")
            
            response = self.supabase.table("products").update(supabase_data).eq("id", product_id).execute()
            
            if response.data and len(response.data) > 0:
                # Si hay nueva imagen, agregarla
                if product_data.get("image_url"):
                    await self._add_product_image(product_id, product_data["image_url"])
                
                return await self.get_product(product_id)
            raise Exception("Producto no encontrado")
        except Exception as e:
            raise Exception(f"Error al actualizar producto: {str(e)}")
    
    async def delete_product(self, product_id: str) -> Dict[str, Any]:
        """
        Elimina (desactiva) un producto
        
        Args:
            product_id: ID del producto
            
        Returns:
            Mensaje de confirmación
        """
        try:
            # En lugar de eliminar, desactivamos el producto
            response = self.supabase.table("products").update({
                "is_active": False
            }).eq("id", product_id).execute()
            
            if response.data:
                return {"message": "Producto eliminado (desactivado) exitosamente"}
            raise Exception("Producto no encontrado")
        except Exception as e:
            raise Exception(f"Error al eliminar producto: {str(e)}")
    
    async def get_low_stock_products(self) -> List[Dict[str, Any]]:
        """
        Obtiene productos con stock mínimo o menor
        
        Returns:
            Lista de productos con stock bajo
        """
        try:
            # Obtener todos los productos activos y filtrar en Python
            # porque Supabase no permite comparar columnas directamente
            response = self.supabase.table("products").select("*, categories(*), product_images(*)").eq("is_active", True).execute()
            products = response.data if response.data else []
            
            # Filtrar productos donde current_stock <= min_stock
            low_stock = [
                p for p in products 
                if p.get("current_stock", 0) <= p.get("min_stock", 0)
            ]
            
            # Formatear productos
            formatted_products = []
            for product in low_stock:
                images = product.get("product_images", [])
                image_url = images[0].get("image_url") if images and len(images) > 0 else None
                
                formatted_products.append({
                    "id": product.get("id"),
                    "name": product.get("name"),
                    "description": product.get("description"),
                    "Sku": product.get("Sku"),
                    "brand": product.get("brand"),
                    "price": product.get("price"),
                    "current_stock": product.get("current_stock", 0),
                    "min_stock": product.get("min_stock", 0),
                    "is_active": product.get("is_active", True),
                    "category_id": product.get("category_id"),
                    "category": product.get("categories", {}).get("name") if product.get("categories") else None,
                    "image_url": image_url,
                    "created_at": product.get("created_at"),
                    "updated_at": product.get("updated_at")
                })
            
            return formatted_products
        except Exception as e:
            raise Exception(f"Error al obtener productos con stock mínimo: {str(e)}")
    
    async def upload_product_image(self, product_id: str, image_file: bytes, filename: str) -> Dict[str, Any]:
        """
        Sube una imagen de producto a Supabase Storage
        
        Args:
            product_id: ID del producto
            image_file: Bytes de la imagen
            filename: Nombre del archivo
            
        Returns:
            URL de la imagen subida
        """
        try:
            from backend.config import config
            
            # Generar nombre único para el archivo
            import uuid
            file_extension = filename.split(".")[-1] if "." in filename else "jpg"
            unique_filename = f"{product_id}/{uuid.uuid4()}.{file_extension}"
            
            # Subir a Supabase Storage
            storage = self.supabase.storage.from_(config.STORAGE_BUCKET)
            response = storage.upload(unique_filename, image_file, file_options={"content-type": f"image/{file_extension}"})
            
            # Obtener URL pública
            public_url = storage.get_public_url(unique_filename)
            
            # Crear registro en product_images
            self.supabase.table("product_images").insert({
                "product_id": product_id,
                "image_url": public_url
            }).execute()
            
            return {
                "image_url": public_url,
                "message": "Imagen subida exitosamente"
            }
        except Exception as e:
            raise Exception(f"Error al subir imagen: {str(e)}")
    
    async def list_categories(self) -> List[Dict[str, Any]]:
        """
        Lista todas las categorías
        
        Returns:
            Lista de categorías
        """
        try:
            response = self.supabase.table("categories").select("*").order("name").execute()
            return response.data if response.data else []
        except Exception as e:
            raise Exception(f"Error al listar categorías: {str(e)}")

