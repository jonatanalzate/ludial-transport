from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Configuración de la base de datos
    DATABASE_URL: str = "postgresql://user:password@localhost/dbname"  # Cambiar en producción
    
    # Configuración de seguridad
    SECRET_KEY: str = "tu_clave_secreta_aqui"  # Cambiar en producción
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Configuración de la aplicación
    PROJECT_NAME: str = "Sistema de Transporte"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    class Config:
        case_sensitive = True
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings() 