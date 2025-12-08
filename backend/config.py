"""
Configuración del sistema Tingo Ventas
Maneja variables de entorno y configuración de Supabase
"""
import os
from dotenv import load_dotenv  # type: ignore[import]

load_dotenv()

class Config:
    """Configuración de la aplicación"""
    
    # Supabase Configuration
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://gabjabikqvjavjnqfvyc.supabase.co")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYmphYmlrcXZqYXZqbnFmdnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODU5NDUsImV4cCI6MjA4MDQ2MTk0NX0.14QgMRiLbgDNltXl3VVRv833_tDFsbMNLCnZ_SebGfE")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYmphYmlrcXZqYXZqbnFmdnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4NTk0NSwiZXhwIjoyMDgwNDYxOTQ1fQ.TjTIlepyLFYzkSE4IyD8R8pKKnsT7dfl4rFboURfrN8")
    JWT_SECRET = os.getenv("JWT_SECRET", "/XyvTqRQC/X58F1OTUjinU5998b7umlvmg7R87l8pVu86QprSoE9O2DqGsnYbN/QCKjX/H0XVMYRjoMMZemWPQ==")
    
    # JWT Configuration
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_HOURS = 24
    
    # CORS Configuration
    CORS_ORIGINS = ["*"]  # En producción, especificar dominios permitidos
    
    # Storage Configuration
    STORAGE_BUCKET = "productos"  # Bucket de Supabase Storage para imágenes
    
    # App Configuration
    APP_NAME = "Tingo Ventas"
    APP_VERSION = "1.0.0"
    CORS_ORIGINS = ["*"]

    DEBUG = os.getenv("DEBUG", "False").lower() == "true"

config = Config()

