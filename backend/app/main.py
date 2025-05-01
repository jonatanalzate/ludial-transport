from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import RedirectResponse
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
    async def dispatch(self, request, call_next):
        if request.headers.get('x-forwarded-proto', 'http') == 'http':
            url = request.url
            url = url.replace(scheme='https')
            return RedirectResponse(url=str(url))
        return await call_next(request)

app = FastAPI(
    title="Sistema de Transporte",
    description="API para sistema de gestión de transporte",
    version="1.0.0"
)

# Middleware para forzar HTTPS
app.add_middleware(HTTPSRedirectMiddleware)

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
    expose_headers=["*"]
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