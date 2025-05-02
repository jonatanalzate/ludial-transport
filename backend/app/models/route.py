from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base

class Route(Base):
    __tablename__ = "rutas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    origen = Column(String)
    destino = Column(String)

    trayectos = relationship("Journey", back_populates="ruta") 