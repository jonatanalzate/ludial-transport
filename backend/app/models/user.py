from sqlalchemy import Column, Integer, String, Boolean, Enum
import enum
from ..database import Base

class RolUsuario(str, enum.Enum):
    ADMINISTRADOR = "administrador"
    OPERADOR = "operador"
    SUPERVISOR = "supervisor"

    @classmethod
    def _missing_(cls, value):
        # Manejar valores que no coinciden exactamente
        value = value.lower() if isinstance(value, str) else value
        for member in cls:
            if member.value == value or member.name.lower() == value:
                return member
        # Si es 'admin' o 'ADMIN', devolver ADMINISTRADOR
        if value in ['admin', 'administrator']:
            return cls.ADMINISTRADOR
        return None

class User(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    nombre_completo = Column(String)
    hashed_password = Column(String)
    rol = Column(String)  # Cambiamos a String en lugar de Enum
    activo = Column(Boolean, default=True)

    @property
    def role_enum(self):
        """Convertir el rol string a enum"""
        return RolUsuario(self.rol.lower() if self.rol else 'operador')

    @role_enum.setter
    def role_enum(self, value):
        """Convertir el enum a string para almacenar"""
        if isinstance(value, RolUsuario):
            self.rol = value.value
        else:
            self.rol = str(value).lower() 