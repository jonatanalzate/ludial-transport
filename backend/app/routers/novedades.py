from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import List
from ..database import get_db
from ..models import Novedad, Journey, User, Route
from ..schemas.novedad import NovedadCreate, NovedadResponse, NovedadStats
from ..utils.auth import get_current_user

router = APIRouter(prefix="/novedades", tags=["novedades"])

@router.post("/", response_model=NovedadResponse)
def crear_novedad(
    novedad: NovedadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear una nueva novedad"""
    # Verificar que el trayecto existe y está en curso
    trayecto = db.query(Journey).filter(Journey.id == novedad.trayecto_id).first()
    if not trayecto:
        raise HTTPException(status_code=404, detail="Trayecto no encontrado")
    
    if trayecto.estado.value != "EN_CURSO":
        raise HTTPException(status_code=400, detail="Solo se pueden reportar novedades en trayectos en curso")
    
    # Verificar que el conductor es el que reporta la novedad
    if current_user.role_enum.value == "conductor" and trayecto.conductor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo puedes reportar novedades de tus propios trayectos")
    
    db_novedad = Novedad(
        trayecto_id=novedad.trayecto_id,
        conductor_id=novedad.conductor_id,
        tipo=novedad.tipo,
        notas=novedad.notas
    )
    
    db.add(db_novedad)
    db.commit()
    db.refresh(db_novedad)
    
    # Obtener información adicional para la respuesta
    conductor = db.query(User).filter(User.id == db_novedad.conductor_id).first()
    ruta = db.query(Route).filter(Route.id == trayecto.ruta_id).first()
    
    return NovedadResponse(
        id=db_novedad.id,
        trayecto_id=db_novedad.trayecto_id,
        conductor_id=db_novedad.conductor_id,
        tipo=db_novedad.tipo,
        notas=db_novedad.notas,
        fecha_reporte=db_novedad.fecha_reporte,
        nombre_conductor=conductor.nombre_completo if conductor else None,
        nombre_ruta=ruta.nombre if ruta else None
    )

@router.get("/", response_model=List[NovedadResponse])
def obtener_novedades(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener lista de novedades"""
    query = db.query(Novedad)
    
    # Si es conductor, solo mostrar sus novedades
    if current_user.role_enum.value == "conductor":
        query = query.filter(Novedad.conductor_id == current_user.id)
    
    novedades = query.offset(skip).limit(limit).all()
    
    # Obtener información adicional
    result = []
    for novedad in novedades:
        conductor = db.query(User).filter(User.id == novedad.conductor_id).first()
        trayecto = db.query(Journey).filter(Journey.id == novedad.trayecto_id).first()
        ruta = None
        if trayecto:
            ruta = db.query(Route).filter(Route.id == trayecto.ruta_id).first()
        
        result.append(NovedadResponse(
            id=novedad.id,
            trayecto_id=novedad.trayecto_id,
            conductor_id=novedad.conductor_id,
            tipo=novedad.tipo,
            notas=novedad.notas,
            fecha_reporte=novedad.fecha_reporte,
            nombre_conductor=conductor.nombre_completo if conductor else None,
            nombre_ruta=ruta.nombre if ruta else None
        ))
    
    return result

@router.get("/stats", response_model=NovedadStats)
def obtener_estadisticas_novedades(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas de novedades"""
    # Solo administradores y supervisores pueden ver estadísticas
    if current_user.role_enum.value not in ["administrador", "supervisor"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver estadísticas")
    
    # Total de novedades
    total = db.query(func.count(Novedad.id)).scalar()
    
    # Novedades por tipo
    por_tipo = {}
    tipos = db.query(Novedad.tipo, func.count(Novedad.id)).group_by(Novedad.tipo).all()
    for tipo, count in tipos:
        por_tipo[tipo.value] = count
    
    # Novedades de hoy
    hoy = datetime.now().date()
    novedades_hoy = db.query(func.count(Novedad.id)).filter(
        func.date(Novedad.fecha_reporte) == hoy
    ).scalar()
    
    return NovedadStats(
        total=total,
        por_tipo=por_tipo,
        hoy=novedades_hoy
    ) 