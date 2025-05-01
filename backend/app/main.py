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

import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info(f"Processing request: {request.method} {request.url}")
        logger.info(f"Headers: {request.headers}")
        
        # Si la petición es HTTP, redirigir a HTTPS
        if request.url.scheme == "http":
            https_url = str(request.url).replace("http://", "https://")
            logger.info(f"Redirecting to HTTPS: {https_url}")
            return RedirectResponse(https_url, status_code=301)
        
        response = await call_next(request)
        
        # Asegurar que las redirecciones sean HTTPS
        if response.status_code in (301, 302, 307, 308):
            location = response.headers.get("location", "")
            if location.startswith("http://"):
                https_location = location.replace("http://", "https://")
                logger.info(f"Converting redirect to HTTPS: {https_location}")
                response.headers["location"] = https_location
        
        # Agregar headers de seguridad
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app = FastAPI(
    title="Sistema de Transporte",
    description="API para sistema de gestión de transporte",
    version="1.0.0"
)

# Middleware para forzar HTTPS
app.add_middleware(HTTPSRedirectMiddleware)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ludial-transport.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Crear las tablas en la base de datos
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
    return {
        "message": "Bienvenido al Sistema de Transporte",
        "version": "1.0.0",
        "https": "enabled"
    }