from fastapi import APIRouter, Depends, HTTPException, Request, Body, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.journey import Journey, EstadoTrayecto, Location
from ..models.vehicle import Vehicle
from ..models.route import Route
from pydantic import BaseModel
from datetime import datetime, timezone
import logging
import traceback
from sqlalchemy import text
from ..models.user import User
from fastapi.encoders import jsonable_encoder
from ..models.novedad import Novedad

# Configurar logging con más detalle
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class JourneyBase(BaseModel):
    conductor_id: int
    vehiculo_id: int
    ruta_id: int
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: Optional[str] = None

class JourneyCreate(BaseModel):
    conductor_id: int
    vehiculo_id: int
    ruta_id: int

class JourneyUpdate(BaseModel):
    conductor_id: Optional[int] = None
    vehiculo_id: Optional[int] = None
    ruta_id: Optional[int] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    estado: Optional[str] = None

class JourneyResponse(BaseModel):
    id: int
    conductor_id: Optional[int]
    vehiculo_id: int
    ruta_id: int
    estado: str
    fecha_salida: Optional[datetime] = None
    fecha_llegada: Optional[datetime] = None
    duracion_minutos: Optional[int] = None
    cantidad_pasajeros: Optional[int] = None
    duracion_actual: Optional[int] = None
    nombre_ruta: Optional[str] = None
    nombre_conductor: Optional[str] = None
    placa_vehiculo: Optional[str] = None
    novedades: Optional[List[dict]] = None
    cumplio_tiempo: Optional[bool] = None

    class Config:
        from_attributes = True

class FinalizarTrayectoRequest(BaseModel):
    cantidad_pasajeros: int

router = APIRouter(
    prefix="/trayectos",
    tags=["Trayectos"]
)

def prepare_journey_response(trayecto: Journey, db: Session) -> dict:
    """Prepara la respuesta del trayecto con información relacionada."""
    try:
        # Obtener datos relacionados
        conductor = db.query(User).filter(User.id == trayecto.conductor_id).first()
        vehiculo = db.query(Vehicle).filter(Vehicle.id == trayecto.vehiculo_id).first()
        ruta = db.query(Route).filter(Route.id == trayecto.ruta_id).first()

        # Obtener novedades asociadas
        novedades = db.query(Novedad).filter_by(trayecto_id=trayecto.id).all()
        novedades_resumen = [
            {"tipo": n.tipo.value if hasattr(n.tipo, 'value') else str(n.tipo), "notas": n.notas} for n in novedades
        ]

        # Calcular cumplimiento de tiempo
        cumplio_tiempo = None
        if trayecto.fecha_salida and trayecto.fecha_llegada and ruta and ruta.tiempo_estimado:
            duracion_real = (trayecto.fecha_llegada - trayecto.fecha_salida).total_seconds() / 60
            margen = ruta.tiempo_estimado * 0.1  # 10% de margen
            cumplio_tiempo = (ruta.tiempo_estimado - margen) <= duracion_real <= (ruta.tiempo_estimado + margen)

        # Crear diccionario base
        response = {
            "id": trayecto.id,
            "conductor_id": trayecto.conductor_id,
            "vehiculo_id": trayecto.vehiculo_id,
            "ruta_id": trayecto.ruta_id,
            "estado": trayecto.estado.value if hasattr(trayecto.estado, 'value') else str(trayecto.estado),
            "fecha_salida": trayecto.fecha_salida,
            "fecha_llegada": trayecto.fecha_llegada,
            "duracion_minutos": trayecto.duracion_minutos,
            "cantidad_pasajeros": trayecto.cantidad_pasajeros,
            "duracion_actual": trayecto.duracion_actual,
            "nombre_ruta": ruta.nombre if ruta else "Sin ruta",
            "nombre_conductor": conductor.nombre_completo if conductor else "Sin conductor",
            "placa_vehiculo": vehiculo.placa if vehiculo else "Sin vehículo",
            "novedades": novedades_resumen,
            "cumplio_tiempo": cumplio_tiempo
        }

        return response
    except Exception as e:
        logger.error(f"Error preparando respuesta del trayecto {trayecto.id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise

@router.post("", response_model=JourneyResponse)
async def crear_trayecto(request: Request, journey: JourneyCreate, db: Session = Depends(get_db)):
    try:
        # logger.info("=== Iniciando creación de trayecto ===")
        # logger.info(f"Datos recibidos: {journey.dict()}")
        
        # Validar conductor
        conductor = db.query(User).filter(User.id == journey.conductor_id).first()
        if not conductor:
            logger.error(f"Conductor no encontrado: ID {journey.conductor_id}")
            raise HTTPException(status_code=404, detail=f"Conductor con ID {journey.conductor_id} no encontrado")
        # logger.info(f"Conductor validado: {conductor.nombre} (ID: {conductor.id})")
        
        # Validar vehículo
        vehiculo = db.query(Vehicle).filter(Vehicle.id == journey.vehiculo_id).first()
        if not vehiculo:
            logger.error(f"Vehículo no encontrado: ID {journey.vehiculo_id}")
            raise HTTPException(status_code=404, detail=f"Vehículo con ID {journey.vehiculo_id} no encontrado")
        # logger.info(f"Vehículo validado: {vehiculo.placa} (ID: {vehiculo.id})")
        
        # Validar ruta
        ruta = db.query(Route).filter(Route.id == journey.ruta_id).first()
        if not ruta:
            logger.error(f"Ruta no encontrada: ID {journey.ruta_id}")
            raise HTTPException(status_code=404, detail=f"Ruta con ID {journey.ruta_id} no encontrada")
        # logger.info(f"Ruta validada: {ruta.nombre} (ID: {ruta.id})")
        
        # Crear trayecto
        new_journey = Journey(
            conductor_id=journey.conductor_id,
            vehiculo_id=journey.vehiculo_id,
            ruta_id=journey.ruta_id,
            estado=EstadoTrayecto.PROGRAMADO
        )
        
        try:
            db.add(new_journey)
            db.commit()
            db.refresh(new_journey)
            # logger.info(f"Trayecto creado exitosamente con ID: {new_journey.id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Error al guardar en la base de datos: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail="Error al guardar el trayecto")
        
        # Preparar respuesta
        try:
            response = prepare_journey_response(new_journey, db)
            # logger.info("Respuesta preparada exitosamente")
            return response
        except Exception as e:
            logger.error(f"Error al preparar la respuesta: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail="Error al preparar la respuesta")
            
    except HTTPException as he:
        logger.error(f"HTTP Exception: {str(he.detail)}")
        raise he
    except Exception as e:
        logger.error("=== Error en creación de trayecto ===")
        logger.error(f"Error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[JourneyResponse])
async def listar_trayectos(request: Request, db: Session = Depends(get_db)):
    try:
        # logger.info("=== Iniciando listado de trayectos ===")
        # logger.info(f"URL: {request.url}")
        # logger.info(f"Headers: {dict(request.headers)}")
        
        # Verificar conexión a la base de datos
        try:
            db.execute(text("SELECT 1"))
            # logger.info("Conexión a la base de datos verificada")
        except Exception as e:
            logger.error(f"Error de conexión a la base de datos: {str(e)}")
            raise HTTPException(status_code=500, detail="Error de conexión a la base de datos")
        
        # Contar total de registros en la tabla
        total_count = db.query(Journey).count()
        # logger.info(f"Total de registros en la tabla Journey: {total_count}")
        
        # Obtener todos los trayectos que no tengan un vehiculo_id nulo
        trayectos = db.query(Journey).filter(Journey.vehiculo_id != None).all()
        # logger.info(f"Trayectos encontrados (filtrando nulos): {len(trayectos)}")
        
        # Verificar estructura de cada trayecto
        for t in trayectos:
            # logger.info(f"Trayecto ID: {t.id}")
            # logger.info(f"Estado: {t.estado}")
            # logger.info(f"Conductor ID: {t.conductor_id}")
            # logger.info(f"Vehículo ID: {t.vehiculo_id}")
            # logger.info(f"Ruta ID: {t.ruta_id}")
            pass
        
        response = []
        for t in trayectos:
            try:
                journey_response = prepare_journey_response(t, db)
                response.append(journey_response)
                # logger.info(f"Trayecto {t.id} procesado correctamente")
            except Exception as e:
                logger.error(f"Error procesando trayecto {t.id}: {str(e)}")
                logger.error(traceback.format_exc())
                continue
        
        # logger.info(f"Total de trayectos procesados: {len(response)}")
        # logger.info("=== Fin del listado de trayectos ===")
        return response
        
    except Exception as e:
        logger.error("=== Error en listado de trayectos ===")
        logger.error(f"Error: {str(e)}")
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
        trayecto.fecha_salida = datetime.now(timezone.utc)
        db.commit()
        db.refresh(trayecto)
        return prepare_journey_response(trayecto, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error iniciando trayecto {trayecto_id}: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{trayecto_id}/detener", response_model=JourneyResponse)
async def detener_trayecto(trayecto_id: int, db: Session = Depends(get_db)):
    try:
        trayecto = db.query(Journey).filter(Journey.id == trayecto_id).first()
        if not trayecto:
            raise HTTPException(status_code=404, detail="Trayecto no encontrado")
        
        if trayecto.estado != EstadoTrayecto.EN_CURSO:
            raise HTTPException(status_code=400, detail="El trayecto no está en estado EN_CURSO")
        
        trayecto.estado = EstadoTrayecto.CANCELADO
        trayecto.fecha_llegada = datetime.now(timezone.utc)
        db.commit()
        db.refresh(trayecto)
        return prepare_journey_response(trayecto, db)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deteniendo trayecto {trayecto_id}: {str(e)}")
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
        trayecto.fecha_llegada = datetime.now(timezone.utc)
        trayecto.cantidad_pasajeros = datos.cantidad_pasajeros
        
        if trayecto.fecha_salida:
            llegada = trayecto.fecha_llegada
            salida = trayecto.fecha_salida
            if llegada.tzinfo is None:
                llegada = llegada.replace(tzinfo=timezone.utc)
            if salida.tzinfo is None:
                salida = salida.replace(tzinfo=timezone.utc)
            duracion = llegada - salida
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

@router.get("/ubicaciones", tags=["Monitoreo"])
async def obtener_ubicaciones(db: Session = Depends(get_db)):
    try:
        # Query con JOIN para obtener información completa
        ubicaciones_completas = db.query(
            Location, Journey, Vehicle, User, Route
        ).join(
            Journey, Location.conductor_id == Journey.conductor_id
        ).join(
            Vehicle, Journey.vehiculo_id == Vehicle.id
        ).join(
            User, Journey.conductor_id == User.id
        ).join(
            Route, Journey.ruta_id == Route.id
        ).filter(
            Journey.estado == EstadoTrayecto.EN_CURSO
        ).all()
        
        response_data = [
            {
                "conductor_id": u.Location.conductor_id,
                "lat": u.Location.lat,
                "lng": u.Location.lng,
                "timestamp": u.Location.timestamp.isoformat() if u.Location.timestamp else None,
                "placa_vehiculo": u.Vehicle.placa,
                "nombre_conductor": u.User.nombre_completo,
                "nombre_ruta": u.Route.nombre,
                "vehiculo_id": u.Vehicle.id,
                "ruta_id": u.Route.id
            } for u in ubicaciones_completas
        ]
        
        logger.info(f"Datos de ubicaciones completas a enviar: {len(response_data)} registros")

        # Intentar serializar manualmente para depuración
        try:
            json_compatible_data = jsonable_encoder(response_data)
            logger.info(f"Datos de ubicaciones serializados correctamente")
            return json_compatible_data
        except Exception as serial_e:
            logger.error(f"Error durante la serialización de ubicaciones: {str(serial_e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail="Error de serialización al obtener ubicaciones")

    except Exception as e:
        logger.error(f"Error al obtener o serializar ubicaciones: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Error interno al obtener ubicaciones")

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

@router.post("/ubicacion", tags=["Monitoreo"])
async def actualizar_ubicacion(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    conductor_id = data.get("conductor_id")
    lat = data.get("lat")
    lng = data.get("lng")
    if not conductor_id or lat is None or lng is None:
        raise HTTPException(status_code=400, detail="Datos incompletos")
    trayecto_activo = db.query(Journey).filter(Journey.conductor_id == conductor_id, Journey.estado == EstadoTrayecto.EN_CURSO).first()
    if not trayecto_activo:
        raise HTTPException(status_code=403, detail="No tienes trayecto activo")
    ubicacion = db.query(Location).filter(Location.conductor_id == conductor_id).first()
    now = datetime.now(timezone.utc)
    if ubicacion:
        ubicacion.lat = lat
        ubicacion.lng = lng
        ubicacion.timestamp = now
    else:
        ubicacion = Location(conductor_id=conductor_id, lat=lat, lng=lng, timestamp=now)
        db.add(ubicacion)
    db.commit()
    return {"ok": True} 

@router.delete("/{trayecto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_trayecto(trayecto_id: int, db: Session = Depends(get_db)):
    trayecto = db.query(Journey).filter(Journey.id == trayecto_id).first()
    if not trayecto:
        raise HTTPException(status_code=404, detail="Trayecto no encontrado")
    if trayecto.estado != EstadoTrayecto.PROGRAMADO:
        raise HTTPException(status_code=400, detail="Solo se pueden eliminar trayectos en estado PROGRAMADO")
    db.delete(trayecto)
    db.commit()
    return

@router.put("/{trayecto_id}", response_model=JourneyResponse)
async def editar_trayecto(trayecto_id: int, datos: JourneyUpdate, db: Session = Depends(get_db)):
    trayecto = db.query(Journey).filter(Journey.id == trayecto_id).first()
    if not trayecto:
        raise HTTPException(status_code=404, detail="Trayecto no encontrado")
    if trayecto.estado != EstadoTrayecto.PROGRAMADO:
        raise HTTPException(status_code=400, detail="Solo se pueden editar trayectos en estado PROGRAMADO")
    for field, value in datos.dict(exclude_unset=True).items():
        setattr(trayecto, field, value)
    db.commit()
    db.refresh(trayecto)
    return prepare_journey_response(trayecto, db)

@router.post("/bulk", response_model=List[JourneyResponse])
async def crear_trayectos_bulk(journeys: List[JourneyCreate], db: Session = Depends(get_db)):
    trayectos_creados = []
    for journey in journeys:
        # Validar conductor
        conductor = db.query(User).filter(User.id == journey.conductor_id).first()
        if not conductor:
            continue
        # Validar vehículo
        vehiculo = db.query(Vehicle).filter(Vehicle.id == journey.vehiculo_id).first()
        if not vehiculo:
            continue
        # Validar ruta
        ruta = db.query(Route).filter(Route.id == journey.ruta_id).first()
        if not ruta:
            continue
        new_journey = Journey(
            conductor_id=journey.conductor_id,
            vehiculo_id=journey.vehiculo_id,
            ruta_id=journey.ruta_id,
            estado=EstadoTrayecto.PROGRAMADO
        )
        db.add(new_journey)
        db.commit()
        db.refresh(new_journey)
        trayectos_creados.append(prepare_journey_response(new_journey, db))
    return trayectos_creados 