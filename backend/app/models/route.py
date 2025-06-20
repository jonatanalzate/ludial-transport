from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship
from ..database import Base

class Route(Base):
    __tablename__ = "rutas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    origen = Column(String)
    destino = Column(String)
    distancia = Column(Float, nullable=True)  # en km
    tiempo_estimado = Column(Integer, nullable=True)  # en minutos
    activa = Column(Boolean, default=True)

    trayectos = relationship("Journey", back_populates="ruta") 