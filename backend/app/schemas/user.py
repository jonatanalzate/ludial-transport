from pydantic import BaseModel
from typing import Optional
from ..models.user import RolUsuario

class UserBase(BaseModel):
    username: str
    email: str
    nombre_completo: Optional[str] = None
    rol: str
    activo: bool = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True 