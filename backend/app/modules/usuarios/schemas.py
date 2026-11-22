from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import EmailStr, StringConstraints
from sqlmodel import Field, SQLModel


class Rol(str, Enum):
    USER = "user"
    ADMIN = "admin"


Username = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=50)]
FullName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class UserCreate(SQLModel):
    username: Username
    full_name: FullName
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=8, max_length=72)


class UserPublic(SQLModel):
    id: int
    username: str
    full_name: str
    email: str
    role: Rol
    disabled: bool
    created_at: datetime
