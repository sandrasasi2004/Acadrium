from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field("student", pattern="^(faculty|student)$")
    department: Optional[str] = "Computer Applications"
    semester: Optional[str] = None

    def get_display_name(self) -> str:
        return self.full_name or self.username or self.email.split("@")[0]

class UserLogin(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    full_name: str
    email: str
    role: str
    department: Optional[str] = None
    semester: Optional[str] = None
    avatar: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
