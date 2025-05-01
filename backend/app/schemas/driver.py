from pydantic import BaseModel

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