"""
Servicio de conexión a Supabase
Maneja la conexión única a Supabase para toda la aplicación
"""
from supabase import create_client, Client
from backend.config import config

class SupabaseService:
    """Servicio singleton para conexión a Supabase"""
    
    _instance: Client = None
    _service_instance: Client = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Obtiene el cliente de Supabase con anon key (para operaciones del usuario)"""
        if cls._instance is None:
            cls._instance = create_client(
                config.SUPABASE_URL,
                config.SUPABASE_ANON_KEY
            )
        return cls._instance
    
    @classmethod
    def get_service_client(cls) -> Client:
        """Obtiene el cliente de Supabase con service key (para operaciones administrativas)"""
        if cls._service_instance is None:
            cls._service_instance = create_client(
                config.SUPABASE_URL,
                config.SUPABASE_SERVICE_KEY
            )
        return cls._service_instance
    
    @classmethod
    def reset_instances(cls):
        """Resetea las instancias (útil para testing)"""
        cls._instance = None
        cls._service_instance = None

