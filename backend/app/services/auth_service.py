import logging
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserUpdate
from app.auth.security import get_password_hash, verify_password, create_access_token

logger = logging.getLogger("acadrium.auth_service")

def register_user(db: Session, user_data: UserRegister):
    logger.info(f"[Auth Service] Register request received for email: {user_data.email}, role: {user_data.role}")
    
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == user_data.email.lower()).first()
    if existing_user:
        logger.warning(f"[Auth Service] Registration failed: Email '{user_data.email}' already exists in database.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )
    
    display_name = user_data.get_display_name()
    hashed_pwd = get_password_hash(user_data.password)

    new_user = User(
        full_name=display_name,
        email=user_data.email.lower(),
        password_hash=hashed_pwd,
        role=user_data.role,
        department=user_data.department if user_data.department else None,
        semester=user_data.semester if user_data.semester else None
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"[Auth Service] Database insert SUCCESS. Created user ID: {new_user.id}, email: {new_user.email}")
    except Exception as e:
        db.rollback()
        logger.error(f"[Auth Service] Database insert ERROR for email '{user_data.email}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insertion failed: {str(e)}"
        )

    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role})
    logger.info(f"[Auth Service] Registration completed successfully for user ID: {new_user.id}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user.to_dict()
    }

def authenticate_user(db: Session, login_data: UserLogin):
    email_or_username = (login_data.email or login_data.username or "").lower().strip()
    logger.info(f"[Auth Service] Login attempt for identifier: '{email_or_username}'")

    if not email_or_username:
        logger.warning("[Auth Service] Login failed: Missing email or username.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide an email or username.",
        )

    # Search user by email or username
    user = db.query(User).filter(
        (User.email == email_or_username) | 
        (User.full_name.ilike(email_or_username))
    ).first()

    if not user:
        logger.warning(f"[Auth Service] Login failed: User '{email_or_username}' not found in database.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not verify_password(login_data.password, user.password_hash):
        logger.warning(f"[Auth Service] Login failed: Password mismatch for user '{email_or_username}'.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    logger.info(f"[Auth Service] Login SUCCESS. Returned JWT token for user ID: {user.id}, role: {user.role}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

def update_user_profile(db: Session, current_user: User, data: UserUpdate) -> dict:
    if data.email and data.email.lower() != current_user.email.lower():
        existing = db.query(User).filter(User.email == data.email.lower(), User.id != current_user.id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered to another account."
            )
        current_user.email = data.email.lower()

    if data.full_name is not None and data.full_name.strip():
        current_user.full_name = data.full_name.strip()

    if data.password is not None and data.password.strip():
        current_user.password_hash = get_password_hash(data.password.strip())

    if data.department is not None:
        current_user.department = data.department.strip() if data.department.strip() else None

    if data.semester is not None:
        current_user.semester = data.semester.strip() if data.semester.strip() else None

    db.commit()
    db.refresh(current_user)
    logger.info(f"[Auth Service] Profile updated successfully for user ID: {current_user.id}")
    return current_user.to_dict()
