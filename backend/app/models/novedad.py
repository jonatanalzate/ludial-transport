from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
from enum import Enum as PyEnum

class TipoNovedad(str, PyEnum):
    ACCIDENTE = "Accidente"
    AVERIA_MECANICA = "Avería Mecánica"
    TRAFICO = "Tráfico"
    PROBLEMA_RUTA = "Problema de Ruta"
    OTRO = "Otro"

class Novedad(Base):
    __tablename__ = "novedades"

    id = Column(Integer, primary_key=True, index=True)
    trayecto_id = Column(Integer, ForeignKey("trayectos.id"), nullable=False)
    conductor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(Enum(TipoNovedad), nullable=False)
    notas = Column(Text, nullable=True)
    fecha_reporte = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relaciones
    trayecto = relationship("Journey", back_populates="novedades")
    conductor = relationship("User", back_populates="novedades_reportadas")

    def __repr__(self):
        return f"<Novedad(id={self.id}, tipo={self.tipo}, trayecto_id={self.trayecto_id})>" 