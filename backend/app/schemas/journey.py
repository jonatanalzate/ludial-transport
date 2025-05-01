from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.journey import JourneyStatus

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