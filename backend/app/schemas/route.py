from pydantic import BaseModel

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