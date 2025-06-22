from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.vehicle import Vehicle, PicoYPlacaConfig
from pydantic import BaseModel
from datetime import date

class VehicleBase(BaseModel):
    placa: str
    modelo: str
    capacidad: int
    soat_vencimiento: Optional[date] = None
    tecnomecanica_vencimiento: Optional[date] = None
    kit_vencimiento: Optional[date] = None
    pico_placa: Optional[str] = None
    activo: Optional[bool] = True

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    placa: Optional[str] = None
    modelo: Optional[str] = None
    capacidad: Optional[int] = None
    soat_vencimiento: Optional[date] = None
    tecnomecanica_vencimiento: Optional[date] = None
    kit_vencimiento: Optional[date] = None
    pico_placa: Optional[str] = None
    activo: Optional[bool] = None

class VehicleResponse(VehicleBase):
    id: int

    class Config:
        from_attributes = True

class VehiclesCreateBulk(BaseModel):
    vehiculos: List[VehicleCreate]

class PicoYPlacaConfigSchema(BaseModel):
    config: dict

    class Config:
        from_attributes = True

router = APIRouter(
    prefix="/vehiculos",
    tags=["Vehículos"]
)

@router.post("", response_model=VehicleResponse)
async def crear_vehiculo(vehiculo: VehicleCreate, db: Session = Depends(get_db)):
    db_vehiculo = Vehicle(
        placa=vehiculo.placa,
        modelo=vehiculo.modelo,
        capacidad=vehiculo.capacidad,
        soat_vencimiento=vehiculo.soat_vencimiento,
        tecnomecanica_vencimiento=vehiculo.tecnomecanica_vencimiento,
        kit_vencimiento=vehiculo.kit_vencimiento,
        pico_placa=vehiculo.pico_placa,
        activo=vehiculo.activo
    )
    db.add(db_vehiculo)
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

@router.get("", response_model=List[VehicleResponse])
async def listar_vehiculos(solo_activos: bool = False, db: Session = Depends(get_db)):
    query = db.query(Vehicle)
    if solo_activos:
        query = query.filter(Vehicle.activo == True)
    return query.all()

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
            capacidad=vehiculo.capacidad,
            soat_vencimiento=vehiculo.soat_vencimiento,
            tecnomecanica_vencimiento=vehiculo.tecnomecanica_vencimiento,
            kit_vencimiento=vehiculo.kit_vencimiento,
            pico_placa=vehiculo.pico_placa,
            activo=vehiculo.activo
        )
        db_vehiculos.append(db_vehiculo)
    
    db.add_all(db_vehiculos)
    db.commit()
    for vehiculo in db_vehiculos:
        db.refresh(vehiculo)
    return db_vehiculos

@router.put("/{vehiculo_id}", response_model=VehicleResponse)
async def actualizar_vehiculo(vehiculo_id: int, vehiculo: VehicleUpdate, db: Session = Depends(get_db)):
    db_vehiculo = db.query(Vehicle).filter(Vehicle.id == vehiculo_id).first()
    if db_vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    for key, value in vehiculo.dict(exclude_unset=True).items():
        setattr(db_vehiculo, key, value)
    
    db.commit()
    db.refresh(db_vehiculo)
    return db_vehiculo

@router.delete("/{vehiculo_id}")
async def eliminar_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    db_vehiculo = db.query(Vehicle).filter(Vehicle.id == vehiculo_id).first()
    if db_vehiculo is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    
    db.delete(db_vehiculo)
    db.commit()
    return {"message": "Vehículo eliminado"}

@router.get("/pico-y-placa-config", response_model=PicoYPlacaConfigSchema)
async def get_pico_y_placa_config(db: Session = Depends(get_db)):
    default = {"1": ["0", "1"], "2": ["2", "3"], "3": ["4"], "4": ["5", "6"], "5": ["7", "8"], "6": ["9"], "0": []}
    config = db.query(PicoYPlacaConfig).first()
    needs_update = False

    if not config:
        config = PicoYPlacaConfig(config=default)
        db.add(config)
        db.commit()
        db.refresh(config)
    else:
        # Si el campo config es None, vacío o no es un dict válido, lo repara
        if not config.config or not isinstance(config.config, dict):
            config.config = default
            needs_update = True

    if needs_update:
        db.commit()
        db.refresh(config)

    return config

@router.put("/pico-y-placa-config", response_model=PicoYPlacaConfigSchema)
async def update_pico_y_placa_config(data: PicoYPlacaConfigSchema = Body(...), db: Session = Depends(get_db)):
    config = db.query(PicoYPlacaConfig).first()
    if not config:
        config = PicoYPlacaConfig(config=data.config)
        db.add(config)
    else:
        config.config = data.config
    db.commit()
    db.refresh(config)
    return config 