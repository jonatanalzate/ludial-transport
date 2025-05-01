from pydantic import BaseModel

class VehicleBase(BaseModel):
    plate_number: str
    model: str
    brand: str
    year: int
    capacity: int
    is_active: bool = True

class VehicleCreate(VehicleBase):
    pass

class Vehicle(VehicleBase):
    id: int

    class Config:
        orm_mode = True 