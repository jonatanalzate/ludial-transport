from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.user import User, RolUsuario
from pydantic import BaseModel, EmailStr
from ..routers.auth import get_password_hash, verify_password

# Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    nombre_completo: str
    rol: RolUsuario

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre_completo: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[RolUsuario] = None
    activo: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    activo: bool

    class Config:
        from_attributes = True

class UsersCreateBulk(BaseModel):
    usuarios: List[UserCreate]

router = APIRouter(
    prefix="/usuarios",
    tags=["usuarios"]
)

# Endpoint de prueba
@router.get("/test")
async def test_usuarios():
    return {"message": "El router de usuarios está funcionando"}

def normalize_role(role: str) -> RolUsuario:
    role_mapping = {
        'admin': RolUsuario.ADMINISTRADOR,
        'ADMIN': RolUsuario.ADMINISTRADOR,
        'administrador': RolUsuario.ADMINISTRADOR,
        'ADMINISTRADOR': RolUsuario.ADMINISTRADOR,
        'operador': RolUsuario.OPERADOR,
        'OPERADOR': RolUsuario.OPERADOR,
        'supervisor': RolUsuario.SUPERVISOR,
        'SUPERVISOR': RolUsuario.SUPERVISOR,
    }
    return role_mapping.get(role, RolUsuario.OPERADOR)  # default a OPERADOR si no se encuentra

# Listar usuarios
@router.get("/", response_model=List[UserResponse])
async def get_users(db: Session = Depends(get_db)):
    try:
        print("Intentando obtener usuarios...")
        users = db.query(User).all()
        print(f"Usuarios encontrados: {len(users)}")
        
        # Convertir roles a formato correcto
        for user in users:
            if user.rol == 'admin' or user.rol == 'ADMIN':
                user.rol = 'administrador'
                db.add(user)
        
        db.commit()
        
        # Crear respuesta con roles normalizados
        response_users = []
        for user in users:
            user_dict = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "nombre_completo": user.nombre_completo,
                "rol": RolUsuario(user.rol.lower() if user.rol else 'operador'),
                "activo": user.activo
            }
            response_users.append(user_dict)
        
        return response_users
    except Exception as e:
        print(f"Error obteniendo usuarios: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener usuarios: {str(e)}"
        )

# Crear usuario
@router.post("/", response_model=dict)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(
            (User.email == user.email) | (User.username == user.username)
        ).first()
        if db_user:
            raise HTTPException(status_code=400, detail="El usuario ya existe")

        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            username=user.username,
            nombre_completo=user.nombre_completo,
            hashed_password=hashed_password,
            rol=user.rol
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return {"message": "Usuario creado exitosamente"}
        
    except Exception as e:
        db.rollback()
        print(f"Error creando usuario: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error al crear el usuario"
        )

# Obtener usuario por ID
@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

# Actualizar usuario
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = user.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

# Eliminar usuario
@router.delete("/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado"}

@router.post("/migrate-roles")
async def migrate_roles(db: Session = Depends(get_db)):
    try:
        users = db.query(User).all()
        updated = 0
        
        for user in users:
            old_role = user.rol
            if old_role in ['admin', 'ADMIN']:
                user.rol = 'administrador'
                updated += 1
                db.add(user)
        
        db.commit()
        return {"message": f"Migrados {updated} usuarios"}
    except Exception as e:
        print(f"Error en migración: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error en migración: {str(e)}"
        )

@router.post("/bulk", response_model=List[UserResponse])
async def crear_usuarios_bulk(usuarios: UsersCreateBulk, db: Session = Depends(get_db)):
    db_usuarios = []
    for usuario in usuarios.usuarios:
        # Verificar si el usuario ya existe
        existing_user = db.query(User).filter(
            (User.email == usuario.email) | (User.username == usuario.username)
        ).first()
        if existing_user:
            continue  # Saltar usuarios que ya existen

        hashed_password = get_password_hash(usuario.password)
        db_usuario = User(
            email=usuario.email,
            username=usuario.username,
            nombre_completo=usuario.nombre_completo,
            hashed_password=hashed_password,
            rol=usuario.rol,
            activo=True
        )
        db_usuarios.append(db_usuario)
    
    if db_usuarios:
        db.add_all(db_usuarios)
        db.commit()
        for usuario in db_usuarios:
            db.refresh(usuario)
    
    return db_usuarios 