import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.database.config import settings

def create_db_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql"):
        try:
            temp_engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            conn = temp_engine.connect()
            conn.close()
            print("[Database] Successfully connected to PostgreSQL database.")
            return temp_engine
        except Exception as e:
            print(f"[Database Warning] PostgreSQL connection failed ({e}). Falling back to local SQLite database.")
            sqlite_url = "sqlite:///./acadrium.db"
            return create_engine(sqlite_url, connect_args={"check_same_thread": False})
    else:
        engine_kwargs = {"pool_pre_ping": True}
        if db_url.startswith("sqlite"):
            engine_kwargs["connect_args"] = {"check_same_thread": False}
        return create_engine(db_url, **engine_kwargs)

engine = create_db_engine()

# Create SessionLocal Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for Models
Base = declarative_base()

# FastAPI Dependency for DB Session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
