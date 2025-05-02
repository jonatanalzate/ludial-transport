from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base

class Driver(Base):
    __tablename__ = "conductores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    licencia = Column(String, unique=True, index=True)
    telefono = Column(String)

    trayectos = relationship("Journey", back_populates="conductor") 