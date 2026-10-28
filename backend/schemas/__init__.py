"""
schemas/user_schema.py
======================
Pydantic models for authentication and user management.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ── Request models ──────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=120)
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    business_name: Optional[str] = Field(None, min_length=1, max_length=120)
    name: Optional[str] = Field(None, min_length=1, max_length=120)


class BenchmarkUpdate(BaseModel):
    benchmark: int = Field(..., ge=10, le=100)



# ── Response models ─────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    name: str
    business_name: str
    email: str
    benchmark: int = 78
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    token: str
    user: UserResponse
