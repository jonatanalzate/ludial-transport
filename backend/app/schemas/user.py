from pydantic import BaseModel
from ..models.user import UserType

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