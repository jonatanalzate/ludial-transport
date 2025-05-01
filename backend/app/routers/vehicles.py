from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.vehicle import Vehicle
from pydantic import BaseModel

class VehicleBase(BaseModel):
    placa: str
    modelo: str
    capacidad: int

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    placa: Optional[str] = None
    modelo: Optional[str] = None
    capacidad: Optional[int] = None

class VehicleResponse(VehicleBase):
    id: int

    class Config:
        from_attributes = True

class VehiclesCreateBulk(BaseModel):
    vehiculos: List[VehicleCreate]

router = APIRouter(
    prefix="/vehiculos",
    tags=["Vehículos"],
    redirect_slashes=False
)

@router.post("", response_model=VehicleResponse)
async def crear_vehiculo(vehiculo: VehicleCreate, db: Session = Depends(get_db)):
    db_vehiculo = Vehicle(
        placa=vehiculo.placa,
        modelo=vehiculo.modelo,
        capacidad=vehiculo.capacidad
    )
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

@router.get("", response_model=List[VehicleResponse])
async def listar_vehiculos(db: Session = Depends(get_db)):
    return db.query(Vehicle).all()

@router.get("/{vehiculo_id}", response_model=VehicleResponse)
async def obtener_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    vehiculo = db.query(Vehicle).filter(Vehicle.id == vehiculo_id).first()
    if vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return vehiculo

@router.post("/bulk", response_model=List[VehicleResponse])
async def crear_vehiculos_bulk(vehiculos: VehiclesCreateBulk, db: Session = Depends(get_db)):
    db_vehiculos = []
    for vehiculo in vehiculos.vehiculos:
        db_vehiculo = Vehicle(
            placa=vehiculo.placa,
            modelo=vehiculo.modelo,
            capacidad=vehiculo.capacidad
        )
        db_vehiculos.append(db_vehiculo)
    
    db.add_all(db_vehiculos)
    db.commit()
    for vehiculo in db_vehiculos:
        db.refresh(vehiculo)
    return db_vehiculos 