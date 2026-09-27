import json
from sqlalchemy.types import TypeDecorator, TEXT

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    Vector = None

class VectorOrText(TypeDecorator):
    """Custom SQLAlchemy column type that uses pgvector.Vector(384) on PostgreSQL
    and TEXT (JSON serialized array) on SQLite."""
    impl = TEXT
    cache_ok = True

    def __init__(self, dim=384, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.dim = dim

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql" and Vector is not None:
            return dialect.type_descriptor(Vector(self.dim))
        else:
            return dialect.type_descriptor(TEXT())

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql" and Vector is not None:
            return value
        else:
            if isinstance(value, (list, tuple)):
                return json.dumps([float(x) for x in value])
            return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql" and Vector is not None:
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except Exception:
                    return [float(x) for x in value.strip("[]").split(",") if x.strip()]
            return list(value)
        else:
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except Exception:
                    return [float(x) for x in value.strip("[]").split(",") if x.strip()]
            return list(value) if isinstance(value, (list, tuple)) else value
