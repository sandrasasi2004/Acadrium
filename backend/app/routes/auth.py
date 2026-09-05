import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.auth import UserRegister, UserLogin, UserUpdate, Token
from app.services import auth_service
from app.auth.dependencies import get_current_user
from app.models.user import User

logger = logging.getLogger("acadrium.routes.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    logger.info(f"-> [POST /api/auth/register] Endpoint called with email: {user_data.email}")
    return auth_service.register_user(db, user_data)

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    logger.info(f"-> [POST /api/auth/login] Endpoint called for identifier: {login_data.email or login_data.username}")
    return auth_service.authenticate_user(db, login_data)

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    logger.info(f"-> [GET /api/auth/me] Endpoint called for user ID: {current_user.id}")
    return current_user.to_dict()

@router.put("/me")
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"-> [PUT /api/auth/me] Endpoint called for user ID: {current_user.id}")
    return auth_service.update_user_profile(db, current_user, data)
