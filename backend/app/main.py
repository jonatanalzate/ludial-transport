from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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

app = FastAPI(
    title="Sistema de Transporte",
    description="API para sistema de gestión de transporte",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

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
        "version": "1.0.0"
    }

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    # Log de la petición entrante
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {request.headers}")
    
    response = await call_next(request)
    
    # Log de la respuesta
    logger.info(f"Response status: {response.status_code}")
    logger.info(f"Response headers: {response.headers}")
    
    # Agregar headers de seguridad
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response