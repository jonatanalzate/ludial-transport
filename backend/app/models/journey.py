from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum, String
from sqlalchemy.orm import relationship
from ..database import Base
import enum
from datetime import datetime

class EstadoTrayecto(str, enum.Enum):
    PROGRAMADO = "programado"
    EN_CURSO = "en_curso"
    COMPLETADO = "completado"
    CANCELADO = "cancelado"

class Journey(Base):
    __tablename__ = "trayectos"

    id = Column(Integer, primary_key=True, index=True)
    ruta_id = Column(Integer, ForeignKey("rutas.id"))
    conductor_id = Column(Integer, ForeignKey("conductores.id"))
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"))
    fecha_salida = Column(DateTime, nullable=True)
    fecha_llegada = Column(DateTime, nullable=True)
    cantidad_pasajeros = Column(Integer, default=0)
    estado = Column(Enum(EstadoTrayecto), default=EstadoTrayecto.PROGRAMADO)
    duracion_minutos = Column(Integer, nullable=True)
    duracion_actual = Column(Integer, nullable=True)

    # Relaciones para obtener los nombres
    ruta = relationship("Route", backref="trayectos")
    conductor = relationship("Driver", backref="trayectos")
    vehiculo = relationship("Vehicle", backref="trayectos") 