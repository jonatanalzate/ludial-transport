from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class TipoNovedadEnum(str, Enum):
    ACCIDENTE = "Accidente"
    AVERIA_MECANICA = "Avería Mecánica"
    TRAFICO = "Tráfico"
    PROBLEMA_RUTA = "Problema de Ruta"
    OTRO = "Otro"

class NovedadBase(BaseModel):
    trayecto_id: int
    tipo: TipoNovedadEnum
    notas: Optional[str] = None

class NovedadCreate(NovedadBase):
    conductor_id: int

class NovedadResponse(NovedadBase):
    id: int
    conductor_id: int
    fecha_reporte: datetime
    nombre_conductor: Optional[str] = None
    nombre_ruta: Optional[str] = None

    class Config:
        from_attributes = True

class NovedadStats(BaseModel):
    total: int
    por_tipo: dict[str, int]
    hoy: int 