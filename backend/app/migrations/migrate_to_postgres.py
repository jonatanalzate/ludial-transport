import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_db_engines():
    """Obtener las conexiones a ambas bases de datos"""
    # SQLite (origen)
    sqlite_url = "sqlite:///./transporte.db"
    sqlite_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
    
    # PostgreSQL (destino)
    postgres_url = os.getenv("DATABASE_URL")
    if not postgres_url:
        raise ValueError("DATABASE_URL no está configurada")
    
    if postgres_url.startswith("postgres://"):
        postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)
    
    postgres_engine = create_engine(postgres_url)
    
    return sqlite_engine, postgres_engine

def create_tables(engine):
    """Crear las tablas en la base de datos destino"""
    from ..models.user import User
    from ..models.driver import Driver
    from ..models.vehicle import Vehicle
    from ..models.route import Route
    from ..models.journey import Journey
    from ..database import Base
    
    logger.info("Creando tablas en la base de datos destino...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tablas creadas exitosamente")

def migrate_data(sqlite_engine, postgres_engine):
    """Migrar los datos de SQLite a PostgreSQL"""
    # Crear sesiones
    SQLiteSession = sessionmaker(bind=sqlite_engine)
    PostgresSession = sessionmaker(bind=postgres_engine)
    
    sqlite_session = SQLiteSession()
    postgres_session = PostgresSession()
    
    try:
        # Migrar usuarios
        logger.info("Migrando usuarios...")
        usuarios = sqlite_session.execute(text("SELECT * FROM usuarios")).fetchall()
        for usuario in usuarios:
            postgres_session.execute(
                text("""
                INSERT INTO usuarios (id, username, email, nombre_completo, hashed_password, rol, activo)
                VALUES (:id, :username, :email, :nombre_completo, :hashed_password, :rol, :activo)
                ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": usuario[0],
                    "username": usuario[1],
                    "email": usuario[2],
                    "nombre_completo": usuario[3],
                    "hashed_password": usuario[4],
                    "rol": usuario[5],
                    "activo": bool(usuario[6])
                }
            )
        
        # Migrar conductores
        logger.info("Migrando conductores...")
        conductores = sqlite_session.execute(text("SELECT * FROM conductores")).fetchall()
        for conductor in conductores:
            postgres_session.execute(
                text("""
                INSERT INTO conductores (id, nombre, licencia, telefono)
                VALUES (:id, :nombre, :licencia, :telefono)
                ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": conductor[0],
                    "nombre": conductor[1],
                    "licencia": conductor[2],
                    "telefono": conductor[3]
                }
            )
        
        # Migrar vehículos
        logger.info("Migrando vehículos...")
        vehiculos = sqlite_session.execute(text("SELECT * FROM vehiculos")).fetchall()
        for vehiculo in vehiculos:
            postgres_session.execute(
                text("""
                INSERT INTO vehiculos (id, placa, modelo, capacidad)
                VALUES (:id, :placa, :modelo, :capacidad)
                ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": vehiculo[0],
                    "placa": vehiculo[1],
                    "modelo": vehiculo[2],
                    "capacidad": vehiculo[3]
                }
            )
        
        # Migrar rutas
        logger.info("Migrando rutas...")
        rutas = sqlite_session.execute(text("SELECT * FROM rutas")).fetchall()
        for ruta in rutas:
            postgres_session.execute(
                text("""
                INSERT INTO rutas (id, nombre, origen, destino)
                VALUES (:id, :nombre, :origen, :destino)
                ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": ruta[0],
                    "nombre": ruta[1],
                    "origen": ruta[2],
                    "destino": ruta[3]
                }
            )
        
        # Migrar trayectos
        logger.info("Migrando trayectos...")
        trayectos = sqlite_session.execute(text("SELECT * FROM trayectos")).fetchall()
        for trayecto in trayectos:
            postgres_session.execute(
                text("""
                INSERT INTO trayectos (
                    id, ruta_id, conductor_id, vehiculo_id, 
                    fecha_salida, fecha_llegada, cantidad_pasajeros,
                    estado, duracion_minutos, duracion_actual
                )
                VALUES (
                    :id, :ruta_id, :conductor_id, :vehiculo_id,
                    :fecha_salida, :fecha_llegada, :cantidad_pasajeros,
                    :estado, :duracion_minutos, :duracion_actual
                )
                ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": trayecto[0],
                    "ruta_id": trayecto[1],
                    "conductor_id": trayecto[2],
                    "vehiculo_id": trayecto[3],
                    "fecha_salida": trayecto[4],
                    "fecha_llegada": trayecto[5],
                    "cantidad_pasajeros": trayecto[6],
                    "estado": trayecto[7],
                    "duracion_minutos": trayecto[8],
                    "duracion_actual": trayecto[9]
                }
            )
        
        # Commit de todos los cambios
        postgres_session.commit()
        logger.info("Migración completada exitosamente")
        
    except Exception as e:
        logger.error(f"Error durante la migración: {str(e)}")
        postgres_session.rollback()
        raise
    finally:
        sqlite_session.close()
        postgres_session.close()

def main():
    """Función principal de migración"""
    try:
        logger.info("Iniciando proceso de migración...")
        
        # Obtener conexiones
        sqlite_engine, postgres_engine = get_db_engines()
        
        # Crear tablas en PostgreSQL
        create_tables(postgres_engine)
        
        # Migrar datos
        migrate_data(sqlite_engine, postgres_engine)
        
        logger.info("¡Migración completada con éxito!")
        
    except Exception as e:
        logger.error(f"Error en el proceso de migración: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 