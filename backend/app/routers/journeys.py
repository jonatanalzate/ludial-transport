from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.journey import Journey, EstadoTrayecto
from pydantic import BaseModel
from datetime import datetime

class JourneyBase(BaseModel):
    ruta_id: int
    conductor_id: int
    vehiculo_id: int
    cantidad_pasajeros: int = 0

class JourneyCreate(JourneyBase):
    pass

class JourneyResponse(BaseModel):
    id: int
    ruta_id: int
    conductor_id: int
    vehiculo_id: int
    fecha_salida: Optional[datetime]
    fecha_llegada: Optional[datetime]
    cantidad_pasajeros: int
    estado: EstadoTrayecto
    duracion_minutos: Optional[int]
    duracion_actual: Optional[int]
    nombre_ruta: str
    nombre_conductor: str
    placa_vehiculo: str

    class Config:
        from_attributes = True

class FinalizarTrayectoRequest(BaseModel):
    cantidad_pasajeros: int

router = APIRouter(
    prefix="/trayectos",
    tags=["Trayectos"]
)

def prepare_journey_response(trayecto: Journey) -> Journey:
    """Agrega los campos adicionales requeridos por JourneyResponse al objeto Journey."""
    trayecto.nombre_ruta = trayecto.ruta.nombre if trayecto.ruta else "Sin ruta"
    trayecto.nombre_conductor = trayecto.conductor.nombre if trayecto.conductor else "Sin conductor"
    trayecto.placa_vehiculo = trayecto.vehiculo.placa if trayecto.vehiculo else "Sin vehículo"
    
    if trayecto.estado == EstadoTrayecto.EN_CURSO and trayecto.fecha_salida:
        tiempo_transcurrido = datetime.now() - trayecto.fecha_salida
        trayecto.duracion_actual = int(tiempo_transcurrido.total_seconds() / 60)
    
    return trayecto

@router.post("/", response_model=JourneyResponse)
def crear_trayecto(trayecto: JourneyCreate, db: Session = Depends(get_db)):
    db_trayecto = Journey(**trayecto.dict())
    db.add(db_trayecto)
    db.commit()
    db.refresh(db_trayecto)
    return prepare_journey_response(db_trayecto)

@router.get("/", response_model=List[JourneyResponse])
def listar_trayectos(db: Session = Depends(get_db)):
    try:
        trayectos = db.query(Journey).all()
        return [prepare_journey_response(t) for t in trayectos]
    except Exception as e:
        print(f"Error al listar trayectos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{trayecto_id}/iniciar", response_model=JourneyResponse)
def iniciar_trayecto(trayecto_id: int, db: Session = Depends(get_db)):
    trayecto = db.query(Journey).filter(Journey.id == trayecto_id).first()
    if not trayecto:
        raise HTTPException(status_code=404, detail="Trayecto no encontrado")
    
    if trayecto.estado != EstadoTrayecto.PROGRAMADO:
        raise HTTPException(status_code=400, detail="El trayecto no está en estado PROGRAMADO")
    
    trayecto.estado = EstadoTrayecto.EN_CURSO
    trayecto.fecha_salida = datetime.now()
    db.commit()
    db.refresh(trayecto)
    return prepare_journey_response(trayecto)

@router.post("/{trayecto_id}/finalizar", response_model=JourneyResponse)
def finalizar_trayecto(trayecto_id: int, datos: FinalizarTrayectoRequest, db: Session = Depends(get_db)):
    trayecto = db.query(Journey).filter(Journey.id == trayecto_id).first()
    if not trayecto:
        raise HTTPException(status_code=404, detail="Trayecto no encontrado")
    
    if trayecto.estado != EstadoTrayecto.EN_CURSO:
        raise HTTPException(
            status_code=400, 
            detail=f"El trayecto no está en curso. Estado actual: {trayecto.estado}"
        )
    
    try:
        trayecto.estado = EstadoTrayecto.COMPLETADO
        trayecto.fecha_llegada = datetime.now()
        trayecto.cantidad_pasajeros = datos.cantidad_pasajeros
        
        if trayecto.fecha_salida:
            duracion = trayecto.fecha_llegada - trayecto.fecha_salida
            trayecto.duracion_minutos = int(duracion.total_seconds() / 60)
        
        db.commit()
        db.refresh(trayecto)
        return prepare_journey_response(trayecto)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{trayecto_id}", response_model=JourneyResponse)
def obtener_trayecto(trayecto_id: int, db: Session = Depends(get_db)):
    trayecto = db.query(Journey).filter(Journey.id == trayecto_id).first()
    if trayecto is None:
        raise HTTPException(status_code=404, detail="Trayecto no encontrado")
    return prepare_journey_response(trayecto) 