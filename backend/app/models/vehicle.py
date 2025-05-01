from sqlalchemy import Column, Integer, String
from ..database import Base

class Vehicle(Base):
    __tablename__ = "vehiculos"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String, unique=True, index=True)
    modelo = Column(String)
    capacidad = Column(Integer) 