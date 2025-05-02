from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime
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
    conductor_id = Column(Integer, ForeignKey("conductores.id", ondelete="SET NULL"))
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id", ondelete="SET NULL"))
    ruta_id = Column(Integer, ForeignKey("rutas.id", ondelete="SET NULL"))
    estado = Column(SQLAlchemyEnum(EstadoTrayecto), default=EstadoTrayecto.PROGRAMADO)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_salida = Column(DateTime, nullable=True)
    fecha_llegada = Column(DateTime, nullable=True)
    duracion_minutos = Column(Integer, nullable=True)
    cantidad_pasajeros = Column(Integer, nullable=True)

    # Relaciones
    conductor = relationship("Driver", back_populates="trayectos", lazy="joined")
    vehiculo = relationship("Vehicle", back_populates="trayectos", lazy="joined")
    ruta = relationship("Route", back_populates="trayectos", lazy="joined") 