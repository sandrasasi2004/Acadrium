from fastapi.middleware.cors import CORSMiddleware
from app.database.config import settings

def get_allowed_origins() -> list[str]:
    raw = getattr(settings, "CORS_ORIGINS", [])
    if isinstance(raw, str):
        origins = [o.strip() for o in raw.split(",") if o.strip()]
    elif isinstance(raw, list):
        origins = []
        for item in raw:
            if isinstance(item, str) and "," in item:
                origins.extend([o.strip() for o in item.split(",") if o.strip()])
            else:
                origins.append(str(item).strip())
    else:
        origins = []

    # Guarantee development defaults are always included
    defaults = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    for d in defaults:
        if d not in origins:
            origins.append(d)
            
    return origins

def setup_cors(app):
    allowed_origins = get_allowed_origins()
    print(f"[CORS Configuration] Allowed origins: {allowed_origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:[0-9]+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
