from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.driver import Driver
from pydantic import BaseModel

# Esquema para el conductor
class DriverBase(BaseModel):
    nombre: str
    licencia: str
    telefono: str

class DriverCreate(DriverBase):
    pass

class DriverUpdate(BaseModel):
    nombre: Optional[str] = None
    licencia: Optional[str] = None
    telefono: Optional[str] = None

class DriverResponse(DriverBase):
    id: int

    class Config:
        from_attributes = True

# Añadir después de las clases existentes
class DriversCreateBulk(BaseModel):
    conductores: List[DriverCreate]

# Router
router = APIRouter(
    prefix="/conductores",
    tags=["Conductores"]
)

@router.post("/", response_model=DriverResponse)
def crear_conductor(conductor: DriverCreate, db: Session = Depends(get_db)):
    db_conductor = Driver(
        nombre=conductor.nombre,
        licencia=conductor.licencia,
        telefono=conductor.telefono
    )
    db.add(db_conductor)
    db.commit()
    db.refresh(db_conductor)
    return db_conductor

@router.get("/", response_model=List[DriverResponse])
def listar_conductores(db: Session = Depends(get_db)):
    return db.query(Driver).all()

@router.get("/{conductor_id}", response_model=DriverResponse)
def obtener_conductor(conductor_id: int, db: Session = Depends(get_db)):
    conductor = db.query(Driver).filter(Driver.id == conductor_id).first()
    if conductor is None:
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    return conductor

@router.post("/bulk", response_model=List[DriverResponse])
def crear_conductores_bulk(conductores: DriversCreateBulk, db: Session = Depends(get_db)):
    db_conductores = []
    for conductor in conductores.conductores:
        db_conductor = Driver(
            nombre=conductor.nombre,
            licencia=conductor.licencia,
            telefono=conductor.telefono
        )
        db_conductores.append(db_conductor)
    
    db.add_all(db_conductores)
    db.commit()
    for conductor in db_conductores:
        db.refresh(conductor)
    return db_conductores

@router.put("/{conductor_id}", response_model=DriverResponse)
def actualizar_conductor(conductor_id: int, conductor: DriverUpdate, db: Session = Depends(get_db)):
    db_conductor = db.query(Driver).filter(Driver.id == conductor_id).first()
    if db_conductor is None:
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    
    for key, value in conductor.dict(exclude_unset=True).items():
        setattr(db_conductor, key, value)
    
    db.commit()
    db.refresh(db_conductor)
    return db_conductor

@router.delete("/{conductor_id}")
def eliminar_conductor(conductor_id: int, db: Session = Depends(get_db)):
    db_conductor = db.query(Driver).filter(Driver.id == conductor_id).first()
    if db_conductor is None:
        raise HTTPException(status_code=404, detail="Conductor no encontrado")
    
    db.delete(db_conductor)
    db.commit()
    return {"message": "Conductor eliminado"} 