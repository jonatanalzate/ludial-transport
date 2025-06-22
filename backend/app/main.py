from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import os
from dotenv import load_dotenv
import logging
from fastapi.middleware.proxy_headers import ProxyHeadersMiddleware

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Importar modelos primero
from .models.user import User
from .models.vehicle import Vehicle
from .models.route import Route
from .models.journey import Journey, EstadoTrayecto
from .models.novedad import Novedad

# Luego importar la base de datos
from .database import engine, Base

# Finalmente importar los routers
from .routers import (
    auth_router,
    users_router,
    vehicles_router, 
    routes_router, 
    journeys_router,
    novedades_router
)

# class NoRedirectMiddleware(BaseHTTPMiddleware):
#     async def dispatch(self, request: Request, call_next):
#         response = await call_next(request)
#         if response.status_code in [301, 302, 307, 308]:
#             location = response.headers.get('location', '')
#             if location.startswith('http://'):
#                 response.headers['location'] = location.replace('http://', 'https://')
#         return response

app = FastAPI(
    title="Sistema de Transporte",
    description="API para sistema de gestión de transporte",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware para reconocer headers de proxy (X-Forwarded-Proto)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# Middleware para manejar redirecciones
# app.add_middleware(NoRedirectMiddleware)

# Configuración de CORS más permisiva para desarrollo y producción
origins = os.getenv("CORS_ORIGINS", "https://ludial-transport.vercel.app,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

# Incluir los routers
for router in [auth_router, users_router, vehicles_router, routes_router, journeys_router, novedades_router]:
    app.include_router(router)

@app.get("/")
def read_root():
    return {
        "message": "Bienvenido al Sistema de Transporte",
        "version": "1.0.0"
    }

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # Log de la petición entrante
    # logger.info(f"Request: {request.method} {request.url}")
    # logger.info(f"Headers: {request.headers}")
    
    response = await call_next(request)
    
    # Log de la respuesta
    # logger.info(f"Response status: {response.status_code}")
    # logger.info(f"Response headers: {response.headers}")
    
    # Agregar headers de seguridad
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    if "origin" in request.headers and request.headers["origin"] in origins:
        response.headers["Access-Control-Allow-Origin"] = request.headers["origin"]
    
    return response