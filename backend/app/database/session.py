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

def sync_database_columns(bind_engine):
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(bind_engine)
        tables = inspector.get_table_names()
        with bind_engine.connect() as conn:
            if "resources" in tables:
                columns = [c["name"] for c in inspector.get_columns("resources")]
                if "extracted_text" not in columns:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN extracted_text TEXT"))
                    conn.commit()
                if "extraction_status" not in columns:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN extraction_status VARCHAR(20) DEFAULT 'PENDING'"))
                    conn.commit()
                if "extraction_error" not in columns:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN extraction_error TEXT"))
                    conn.commit()
                if "uploaded_by_name" not in columns:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN uploaded_by_name VARCHAR(255)"))
                    conn.commit()
                if "classroom_name" not in columns:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN classroom_name VARCHAR(255)"))
                    conn.commit()
                if "page_count" not in columns:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN page_count INTEGER DEFAULT 0"))
                    conn.commit()
                if "word_count" not in columns:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN word_count INTEGER DEFAULT 0"))
                    conn.commit()
                if "last_processed_at" not in columns:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN last_processed_at TIMESTAMP"))
                    conn.commit()

            if "workspace_resources" in tables:
                columns = [c["name"] for c in inspector.get_columns("workspace_resources")]
                if "extracted_text" not in columns:
                    conn.execute(text("ALTER TABLE workspace_resources ADD COLUMN extracted_text TEXT"))
                    conn.commit()
                if "extraction_status" not in columns:
                    conn.execute(text("ALTER TABLE workspace_resources ADD COLUMN extraction_status VARCHAR(20) DEFAULT 'PENDING'"))
                    conn.commit()
                if "extraction_error" not in columns:
                    conn.execute(text("ALTER TABLE workspace_resources ADD COLUMN extraction_error TEXT"))
                    conn.commit()
                if "owner_name" not in columns:
                    conn.execute(text("ALTER TABLE workspace_resources ADD COLUMN owner_name VARCHAR(255)"))
                    conn.commit()
                if "page_count" not in columns:
                    conn.execute(text("ALTER TABLE workspace_resources ADD COLUMN page_count INTEGER DEFAULT 0"))
                    conn.commit()
                if "word_count" not in columns:
                    conn.execute(text("ALTER TABLE workspace_resources ADD COLUMN word_count INTEGER DEFAULT 0"))
                    conn.commit()
                if "last_processed_at" not in columns:
                    conn.execute(text("ALTER TABLE workspace_resources ADD COLUMN last_processed_at TIMESTAMP"))
                    conn.commit()

            if "workspace_notes" in tables:
                columns = [c["name"] for c in inspector.get_columns("workspace_notes")]
                if "word_count" not in columns:
                    conn.execute(text("ALTER TABLE workspace_notes ADD COLUMN word_count INTEGER DEFAULT 0"))
                    conn.commit()
                if "last_modified_at" not in columns:
                    conn.execute(text("ALTER TABLE workspace_notes ADD COLUMN last_modified_at TIMESTAMP"))
                    conn.commit()

            if "announcements" in tables:
                columns = [c["name"] for c in inspector.get_columns("announcements")]
                if "announcement_type" not in columns:
                    conn.execute(text("ALTER TABLE announcements ADD COLUMN announcement_type VARCHAR(50) DEFAULT 'GENERAL'"))
                    conn.commit()
                if "author_name" not in columns:
                    conn.execute(text("ALTER TABLE announcements ADD COLUMN author_name VARCHAR(255)"))
                    conn.commit()
            # Automatic Backfill for NULL metadata on existing rows
            try:
                if "resources" in tables and "users" in tables and "classrooms" in tables:
                    conn.execute(text("UPDATE resources SET uploaded_by_name = (SELECT full_name FROM users WHERE users.id = resources.uploaded_by) WHERE (uploaded_by_name IS NULL OR uploaded_by_name = '')"))
                    conn.execute(text("UPDATE resources SET classroom_name = (SELECT name FROM classrooms WHERE classrooms.id = resources.classroom_id) WHERE (classroom_name IS NULL OR classroom_name = '')"))
                    conn.commit()

                if "workspace_resources" in tables and "users" in tables:
                    conn.execute(text("UPDATE workspace_resources SET owner_name = (SELECT full_name FROM users WHERE users.id = workspace_resources.owner_id) WHERE (owner_name IS NULL OR owner_name = '')"))
                    conn.commit()

                if "workspace_notes" in tables:
                    conn.execute(text("UPDATE workspace_notes SET last_modified_at = updated_at WHERE last_modified_at IS NULL"))
                    conn.commit()

                if "announcements" in tables and "users" in tables and "classrooms" in tables:
                    conn.execute(text("UPDATE announcements SET author_name = (SELECT full_name FROM users WHERE users.id = announcements.posted_by) WHERE (author_name IS NULL OR author_name = '')"))
                    conn.execute(text("UPDATE announcements SET classroom_name = (SELECT name FROM classrooms WHERE classrooms.id = announcements.classroom_id) WHERE (classroom_name IS NULL OR classroom_name = '')"))
                    conn.execute(text("UPDATE announcements SET announcement_type = 'GENERAL' WHERE (announcement_type IS NULL OR announcement_type = '')"))
                    conn.commit()
            except Exception as backfill_err:
                print(f"[Database Backfill Info] {backfill_err}")
    except Exception as e:
        print(f"[Database Schema Warning] Migration check skipped: {e}")

sync_database_columns(engine)

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
