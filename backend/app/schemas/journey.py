from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.journey import EstadoTrayecto

class JourneyBase(BaseModel):
    ruta_id: int
    conductor_id: int
    vehiculo_id: int
    fecha_salida: Optional[datetime] = None
    fecha_llegada: Optional[datetime] = None
    cantidad_pasajeros: Optional[int] = None
    estado: EstadoTrayecto = EstadoTrayecto.PROGRAMADO
    duracion_minutos: Optional[int] = None
    duracion_actual: Optional[int] = None

class JourneyCreate(JourneyBase):
    pass

class Journey(JourneyBase):
    id: int
    
    class Config:
        from_attributes = True 