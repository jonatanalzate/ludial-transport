from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from ..models.user import UserType
from ..models.journey import JourneyStatus

class UserBase(BaseModel):
    email: str
    username: str
    user_type: UserType

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str 

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

class DriverBase(BaseModel):
    first_name: str
    last_name: str
    license_number: str
    phone_number: str
    is_active: bool = True

class DriverCreate(DriverBase):
    pass

class Driver(DriverBase):
    id: int

    class Config:
        orm_mode = True

class RouteBase(BaseModel):
    name: str
    start_location: str
    end_location: str
    distance: float
    estimated_time: int

class RouteCreate(RouteBase):
    pass

class Route(RouteBase):
    id: int

    class Config:
        orm_mode = True

class JourneyBase(BaseModel):
    vehicle_id: int
    driver_id: int
    route_id: int
    start_time: datetime
    status: JourneyStatus = JourneyStatus.SCHEDULED

class JourneyCreate(JourneyBase):
    pass

class Journey(JourneyBase):
    id: int
    end_time: Optional[datetime]
    created_by: int
    
    class Config:
        orm_mode = True 