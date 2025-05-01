from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse
from starlette.datastructures import URL
import os
from dotenv import load_dotenv
from .database import engine, Base
from .routers import (
    auth_router,
    users_router,
    drivers_router, 
    vehicles_router, 
    routes_router, 
    journeys_router
)

# Asegurarse de que todos los modelos estén importados
from .models.user import User
from .models.driver import Driver
from .models.vehicle import Vehicle
from .models.route import Route
from .models.journey import Journey

import socket

load_dotenv()

class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.scheme == "http":
            url = str(request.url)
            if url.endswith('/'):  # Remove trailing slash
                url = url.rstrip('/')
            url = url.replace("http://", "https://", 1)
            return RedirectResponse(url, status_code=301)
        return await call_next(request)

class TrailingSlashMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path != "/" and request.url.path.endswith("/"):
            url = str(request.url)
            return RedirectResponse(url.rstrip("/"), status_code=308)
        return await call_next(request)

app = FastAPI(
    title="Sistema de Transporte",
    description="API para sistema de gestión de transporte",
    version="1.0.0"
)

# Agregar middleware para forzar HTTPS y remover barras al final
app.add_middleware(HTTPSRedirectMiddleware)
app.add_middleware(TrailingSlashMiddleware)

# Obtener los orígenes permitidos de las variables de entorno o usar valores predeterminados
ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Desarrollo local
    "https://ludial-transport.vercel.app",  # Producción en Vercel
    "https://www.ludial-transport.vercel.app",  # Subdominio www
    os.getenv("FRONTEND_URL", ""),  # URL personalizada desde variables de entorno
]

# Filtrar orígenes vacíos
ALLOWED_ORIGINS = [origin for origin in ALLOWED_ORIGINS if origin]

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Forzar la recreación de todas las tablas
# Base.metadata.drop_all(bind=engine)  # Comentar después de la primera ejecución
Base.metadata.create_all(bind=engine)

# Incluir los routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(drivers_router)
app.include_router(vehicles_router)
app.include_router(routes_router)
app.include_router(journeys_router)

@app.get("/")
def read_root():
    return {"message": "Bienvenido al Sistema de Transporte"}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    print(f"Client host: {request.client.host}")
    response = await call_next(request)
    return response