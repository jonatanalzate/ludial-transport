from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..models.user import RolUsuario
from ..core.config import settings

# Configuración de seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_password_hash(password: str) -> str:
    """
    Genera un hash de la contraseña
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si la contraseña coincide con el hash
    """
    return pwd_context.verify(plain_password, hashed_password)

async def get_current_user_type(token: str = Depends(oauth2_scheme)):
    """
    Obtiene el tipo de usuario del token JWT
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_type: str = payload.get("role")
        if user_type is None:
            raise credentials_exception
        return user_type
    except JWTError:
        raise credentials_exception

def check_admin_permission(user_type: str = Depends(get_current_user_type)):
    """
    Verifica si el usuario tiene permisos de administrador
    """
    if user_type != RolUsuario.ADMINISTRADOR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción"
        )
    return True 