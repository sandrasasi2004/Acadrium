import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt, JWTError
import bcrypt
from app.database.config import settings

logger = logging.getLogger("acadrium.security")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        is_valid = bcrypt.checkpw(plain_password.encode('utf-8')[:72], hashed_password.encode('utf-8'))
        logger.info(f"[Security] Password verification result: {is_valid}")
        return is_valid
    except Exception as e:
        logger.error(f"[Security] Password verification error: {e}")
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    logger.info("[Security] Password successfully hashed")
    return hashed

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    logger.info(f"[Security] JWT generated successfully for sub: {to_encode.get('sub')}")
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        logger.info(f"[Security] Token successfully decoded for sub: {payload.get('sub')}")
        return payload
    except JWTError as e:
        logger.warning(f"[Security] Token decode error: {e}")
        return None

