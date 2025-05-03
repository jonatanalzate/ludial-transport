from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
from jose import jwt
import os
from dotenv import load_dotenv
import bcrypt
import logging
import traceback

from ..database import get_db
from ..models.user import User, RolUsuario

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración del JWT
load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "tu_clave_secreta_aqui")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30000

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_password_hash(password: str) -> str:
    if isinstance(password, str):
        password = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception as e:
        logger.error(f"Error verificando contraseña: {str(e)}")
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creando token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el token de acceso"
        )

@router.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        # Buscar usuario usando SQL directo para evitar problemas con las relaciones
        result = db.execute(
            text("SELECT * FROM usuarios WHERE email = :email"),
            {"email": form_data.username}
        ).first()
        
        if not result:
            logger.warning(f"Usuario no encontrado con email: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas"
            )
        
        # Crear un diccionario con los datos del usuario
        user_data = {
            "id": result[0],
            "username": result[1],
            "email": result[2],
            "nombre_completo": result[3],
            "hashed_password": result[4],
            "rol": result[5],
            "activo": bool(result[6])
        }
        
        # Verificar contraseña
        if not verify_password(form_data.password, user_data['hashed_password']):
            logger.warning(f"Contraseña incorrecta para usuario: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas"
            )
        
        # Crear token
        token_data = {
            "sub": user_data['username'],
            "role": user_data['rol'].lower() if user_data['rol'] else 'operador'
        }
        
        access_token = create_access_token(token_data)
        
        logger.info(f"Login exitoso para usuario: {form_data.username}")
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Error en login: {str(e)}")
        logger.error("Traceback: " + traceback.format_exc())
        raise HTTPException(status_code=500, detail="Error interno en el servidor")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def check_admin_access(current_user = Depends(get_current_user)):
    if current_user.rol != "administrador":
        raise HTTPException(
            status_code=403, 
            detail="No tienes permiso para acceder a este recurso"
        )
    return current_user

def check_role_access(allowed_roles: list[str]):
    def check_role(current_user = Depends(get_current_user)):
        if current_user.rol not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Se requiere uno de los siguientes roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return check_role 