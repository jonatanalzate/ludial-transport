from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from ..database import Base
from enum import Enum

class EstadoTrayecto(str, Enum):
    PENDIENTE = "PENDIENTE"
    PROGRAMADO = "PROGRAMADO"
    EN_CURSO = "EN_CURSO"
    COMPLETADO = "COMPLETADO"
    CANCELADO = "CANCELADO"

class Journey(Base):
    __tablename__ = "trayectos"

    id = Column(Integer, primary_key=True, index=True)
    ruta_id = Column(Integer, ForeignKey("rutas.id"))
    conductor_id = Column(Integer, ForeignKey("usuarios.id"))
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"))
    fecha_salida = Column(DateTime)
    fecha_llegada = Column(DateTime)
    cantidad_pasajeros = Column(Integer)
    estado = Column(SQLAlchemyEnum(EstadoTrayecto), default=EstadoTrayecto.PROGRAMADO)
    duracion_minutos = Column(Integer)
    duracion_actual = Column(Integer)

    # Relaciones
    ruta = relationship("Route", back_populates="trayectos")
    conductor = relationship("User")
    vehiculo = relationship("Vehicle", back_populates="trayectos") 