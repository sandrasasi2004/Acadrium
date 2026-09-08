import logging
from fastapi import FastAPI
from app.database.config import settings
from app.database.session import engine, Base
from app.middleware.cors import setup_cors
from app.routes.auth import router as auth_router
from app.routes.classrooms import router as classrooms_router
from app.routes.resources import router as resources_router
from app.routes.workspace import router as workspace_router
from app.routes.workspace_notes import router as workspace_notes_router
from app.routes.announcements import router as announcements_router
from app.routes.timeline import router as timeline_router
from app.models import timeline_event  # Ensure model registered for Base.metadata.create_all
from app.services.resource_service import ensure_storage_directories
from app.services.workspace_service import ensure_workspace_directories

# Ensure physical upload directories exist on startup
ensure_storage_directories()
ensure_workspace_directories()

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

# Include Routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(classrooms_router, prefix=settings.API_V1_STR)
app.include_router(resources_router, prefix=settings.API_V1_STR)
app.include_router(workspace_notes_router, prefix=settings.API_V1_STR)
app.include_router(workspace_router, prefix=settings.API_V1_STR)
app.include_router(announcements_router, prefix=settings.API_V1_STR)
app.include_router(timeline_router, prefix=settings.API_V1_STR)
logger.info(f"[FastAPI Startup] Auth, Classrooms, Resources, Workspace, Workspace Notes, Announcements & Timeline routers registered under prefix: {settings.API_V1_STR}")

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

