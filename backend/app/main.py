import logging
from fastapi import FastAPI
from app.database.config import settings
from app.database.session import engine, Base
from app.middleware.cors import setup_cors
from app.routes.auth import router as auth_router

# Configure root logger for detailed diagnostic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("acadrium.main")

# Auto-create tables in database if connected
try:
    Base.metadata.create_all(bind=engine)
    logger.info("[Database] Schema synchronized successfully.")
except Exception as e:
    logger.warning(f"[Database Warning] Table creation deferred or connection failed: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI Backend for Acadrium Academic Memory System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS
setup_cors(app)

# Include Auth Router under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
logger.info(f"[FastAPI Startup] Auth router registered with prefix: {settings.API_V1_STR}/auth")

@app.get("/")
def root():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

