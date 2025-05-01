from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.journey import Journey, EstadoTrayecto
from ..models.driver import Driver
from ..models.vehicle import Vehicle
from ..models.route import Route
from pydantic import BaseModel
from datetime import datetime
import logging
import traceback

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JourneyBase(BaseModel):
    conductor_id: int
    vehiculo_id: int
    ruta_id: int
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    estado: str

class JourneyCreate(JourneyBase):
    pass

class JourneyUpdate(BaseModel):
    conductor_id: Optional[int] = None
    vehiculo_id: Optional[int] = None
    ruta_id: Optional[int] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: Optional[str] = None

class JourneyResponse(JourneyBase):
    id: int
    nombre_ruta: Optional[str]
    nombre_conductor: Optional[str]
    placa_vehiculo: Optional[str]
    duracion_actual: Optional[int]

    class Config:
        from_attributes = True

class FinalizarTrayectoRequest(BaseModel):
    cantidad_pasajeros: int

router = APIRouter(
    prefix="/trayectos",
    tags=["Trayectos"],
    redirect_slashes=False
)

def prepare_journey_response(trayecto: Journey, db: Session) -> dict:
    """Prepara la respuesta del trayecto con información relacionada."""
    try:
        # Obtener datos relacionados
        conductor = db.query(Driver).filter(Driver.id == trayecto.conductor_id).first()
        vehiculo = db.query(Vehicle).filter(Vehicle.id == trayecto.vehiculo_id).first()
        ruta = db.query(Route).filter(Route.id == trayecto.ruta_id).first()

        # Crear diccionario base
        response = {
            "id": trayecto.id,
            "conductor_id": trayecto.conductor_id,
            "vehiculo_id": trayecto.vehiculo_id,
            "ruta_id": trayecto.ruta_id,
            "fecha_inicio": trayecto.fecha_inicio,
            "fecha_fin": trayecto.fecha_fin,
            "estado": trayecto.estado,
            "nombre_ruta": ruta.nombre if ruta else "Sin ruta",
            "nombre_conductor": conductor.nombre if conductor else "Sin conductor",
            "placa_vehiculo": vehiculo.placa if vehiculo else "Sin vehículo",
            "duracion_actual": None
        }

        # Calcular duración si está en curso
        if trayecto.estado == EstadoTrayecto.EN_CURSO and trayecto.fecha_salida:
            tiempo_transcurrido = datetime.now() - trayecto.fecha_salida
            response["duracion_actual"] = int(tiempo_transcurrido.total_seconds() / 60)

        return response
    except Exception as e:
        logger.error(f"Error preparando respuesta del trayecto {trayecto.id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise

@router.post("", response_model=JourneyResponse)
async def crear_trayecto(trayecto: JourneyCreate, db: Session = Depends(get_db)):
    try:
        db_trayecto = Journey(**trayecto.dict())
        db.add(db_trayecto)
        db.commit()
        db.refresh(db_trayecto)
        return prepare_journey_response(db_trayecto, db)
    except Exception as e:
        logger.error(f"Error creando trayecto: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[JourneyResponse])
async def listar_trayectos(request: Request, db: Session = Depends(get_db)):
    try:
        logger.info(f"Listando trayectos - URL: {request.url}")
        logger.info(f"Headers: {request.headers}")
        
        trayectos = db.query(Journey).all()
        logger.info(f"Encontrados {len(trayectos)} trayectos")
        
        response = []
        for t in trayectos:
            try:
                response.append(prepare_journey_response(t, db))
            except Exception as e:
                logger.error(f"Error procesando trayecto {t.id}: {str(e)}")
                logger.error(traceback.format_exc())
                continue
        
        return response
    except Exception as e:
        logger.error(f"Error al listar trayectos: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{trayecto_id}/iniciar", response_model=JourneyResponse)
async def iniciar_trayecto(trayecto_id: int, db: Session = Depends(get_db)):
    try:
        trayecto = db.query(Journey).filter(Journey.id == trayecto_id).first()
        if not trayecto:
            raise HTTPException(status_code=404, detail="Trayecto no encontrado")
        
        if trayecto.estado != EstadoTrayecto.PROGRAMADO:
            raise HTTPException(status_code=400, detail="El trayecto no está en estado PROGRAMADO")
        
        trayecto.estado = EstadoTrayecto.EN_CURSO
        trayecto.fecha_salida = datetime.now()
        db.commit()
        db.refresh(trayecto)
        return prepare_journey_response(trayecto, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error iniciando trayecto {trayecto_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{trayecto_id}/finalizar", response_model=JourneyResponse)
async def finalizar_trayecto(trayecto_id: int, datos: FinalizarTrayectoRequest, db: Session = Depends(get_db)):
    try:
        trayecto = db.query(Journey).filter(Journey.id == trayecto_id).first()
        if not trayecto:
            raise HTTPException(status_code=404, detail="Trayecto no encontrado")
        
        if trayecto.estado != EstadoTrayecto.EN_CURSO:
            raise HTTPException(
                status_code=400, 
                detail=f"El trayecto no está en curso. Estado actual: {trayecto.estado}"
            )
        
        trayecto.estado = EstadoTrayecto.COMPLETADO
        trayecto.fecha_llegada = datetime.now()
        trayecto.cantidad_pasajeros = datos.cantidad_pasajeros
        
        if trayecto.fecha_salida:
            duracion = trayecto.fecha_llegada - trayecto.fecha_salida
            trayecto.duracion_minutos = int(duracion.total_seconds() / 60)
        
        db.commit()
        db.refresh(trayecto)
        return prepare_journey_response(trayecto, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finalizando trayecto {trayecto_id}: {str(e)}")
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{trayecto_id}", response_model=JourneyResponse)
async def obtener_trayecto(trayecto_id: int, db: Session = Depends(get_db)):
    try:
        trayecto = db.query(Journey).filter(Journey.id == trayecto_id).first()
        if trayecto is None:
            raise HTTPException(status_code=404, detail="Trayecto no encontrado")
        return prepare_journey_response(trayecto, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo trayecto {trayecto_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) 