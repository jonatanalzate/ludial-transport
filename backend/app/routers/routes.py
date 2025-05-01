from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.route import Route
from pydantic import BaseModel
from ..routers.auth import check_admin_access, check_role_access

class RouteBase(BaseModel):
    nombre: str
    origen: str
    destino: str

class RouteCreate(RouteBase):
    pass

class RouteUpdate(BaseModel):
    nombre: Optional[str] = None
    origen: Optional[str] = None
    destino: Optional[str] = None

class RouteResponse(RouteBase):
    id: int

    class Config:
        from_attributes = True

class RoutesCreateBulk(BaseModel):
    rutas: List[RouteCreate]

router = APIRouter(
    prefix="/rutas",
    tags=["Rutas"],
    redirect_slashes=False
)

@router.post("", response_model=RouteResponse, dependencies=[Depends(check_admin_access)])
async def crear_ruta(ruta: RouteCreate, db: Session = Depends(get_db)):
    db_ruta = Route(**ruta.dict())
    db.add(db_ruta)
    db.commit()
    db.refresh(db_ruta)
    return db_ruta

@router.get("", response_model=List[RouteResponse])
async def listar_rutas(db: Session = Depends(get_db)):
    return db.query(Route).all()

@router.get("/{ruta_id}", response_model=RouteResponse)
async def obtener_ruta(ruta_id: int, db: Session = Depends(get_db)):
    ruta = db.query(Route).filter(Route.id == ruta_id).first()
    if ruta is None:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    return ruta

@router.put("/{ruta_id}", response_model=RouteResponse, 
           dependencies=[Depends(check_role_access(["administrador", "supervisor"]))])
async def actualizar_ruta(ruta_id: int, ruta: RouteCreate, db: Session = Depends(get_db)):
    db_ruta = db.query(Route).filter(Route.id == ruta_id).first()
    if db_ruta is None:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    
    for key, value in ruta.dict().items():
        setattr(db_ruta, key, value)
    
    db.commit()
    db.refresh(db_ruta)
    return db_ruta

@router.delete("/{ruta_id}")
async def eliminar_ruta(ruta_id: int, db: Session = Depends(get_db)):
    db_ruta = db.query(Route).filter(Route.id == ruta_id).first()
    if db_ruta is None:
        raise HTTPException(status_code=404, detail="Ruta no encontrada")
    
    db.delete(db_ruta)
    db.commit()
    return {"message": "Ruta eliminada"}

@router.post("/bulk", response_model=List[RouteResponse])
async def crear_rutas_bulk(rutas: RoutesCreateBulk, db: Session = Depends(get_db)):
    db_rutas = []
    for ruta in rutas.rutas:
        db_ruta = Route(
            nombre=ruta.nombre,
            origen=ruta.origen,
            destino=ruta.destino
        )
        db_rutas.append(db_ruta)
    
    db.add_all(db_rutas)
    db.commit()
    for ruta in db_rutas:
        db.refresh(ruta)
    return db_rutas 