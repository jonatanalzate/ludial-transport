from sqlalchemy import Column, Integer, String, Date, Boolean, JSON
from sqlalchemy.orm import relationship
from ..database import Base

class Vehicle(Base):
    __tablename__ = "vehiculos"

    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String, unique=True, index=True)
    modelo = Column(String)
    capacidad = Column(Integer)
    soat_vencimiento = Column(Date, nullable=True)
    tecnomecanica_vencimiento = Column(Date, nullable=True)
    kit_vencimiento = Column(Date, nullable=True)
    pico_placa = Column(String, nullable=True)
    activo = Column(Boolean, default=True)

    trayectos = relationship("Journey", back_populates="vehiculo")

class PicoYPlacaConfig(Base):
    __tablename__ = "pico_y_placa_config"
    id = Column(Integer, primary_key=True, index=True)
    config = Column(JSON, nullable=False)  # {"1": ["0", "1"], ...} 