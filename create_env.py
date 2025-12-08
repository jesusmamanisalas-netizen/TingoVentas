#!/usr/bin/env python3
"""
Script para crear el archivo .env automáticamente
Ejecuta: python create_env.py
"""
import os

env_content = """# ============================================
# Configuración de Tingo Ventas
# ============================================
# Este archivo contiene las variables de entorno del sistema
# NO subas este archivo al repositorio (está en .gitignore)

# ============================================
# Supabase Configuration
# ============================================
SUPABASE_URL=https://gabjabikqvjavjnqfvyc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYmphYmlrcXZqYXZqbnFmdnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODU5NDUsImV4cCI6MjA4MDQ2MTk0NX0.14QgMRiLbgDNltXl3VVRv833_tDFsbMNLCnZ_SebGfE
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYmphYmlrcXZqYXZqbnFmdnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4NTk0NSwiZXhwIjoyMDgwNDYxOTQ1fQ.TjTIlepyLFYzkSE4IyD8R8pKKnsT7dfl4rFboURfrN8
JWT_SECRET=/XyvTqRQC/X58F1OTUjinU5998b7umlvmg7R87l8pVu86QprSoE9O2DqGsnYbN/QCKjX/H0XVMYRjoMMZemWPQ==

# ============================================
# Application Configuration
# ============================================
# DEBUG=True para desarrollo, False para producción
DEBUG=False 

# ============================================
# Notas:
# ============================================
# 1. El archivo .env debe estar en la raíz del proyecto
# 2. python-dotenv cargará automáticamente estas variables
# 3. El backend/config.py usa estos valores como fallback si no están en .env
# 4. Para producción (Render.com), configura estas variables en el panel de Render
"""

def create_env_file():
    """Crea el archivo .env si no existe"""
    env_path = ".env"
    
    if os.path.exists(env_path):
        response = input(f"El archivo {env_path} ya existe. ¿Deseas sobrescribirlo? (s/n): ")
        if response.lower() != 's':
            print("Operación cancelada.")
            return
    
    try:
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_content)
        print(f"✅ Archivo {env_path} creado exitosamente!")
        print(f"📁 Ubicación: {os.path.abspath(env_path)}")
        print("\n💡 Recuerda:")
        print("   - El archivo .env está en .gitignore (no se subirá al repositorio)")
        print("   - Puedes modificar los valores según tus necesidades")
        print("   - Para producción, configura estas variables en Render.com")
    except Exception as e:
        print(f"❌ Error al crear el archivo: {e}")

if __name__ == "__main__":
    create_env_file()

