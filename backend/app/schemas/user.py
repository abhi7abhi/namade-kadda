from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "BUYER"  # BUYER, SUPPLIER, ADMIN
    admin_id: Optional[str] = None
    company_name: Optional[str] = None
    country: Optional[str] = None
    business_category: Optional[str] = None
    sourcing_categories: Optional[str] = None
    contact_phone: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: Optional[EmailStr] = None
    admin_id: Optional[str] = None
    password: str = Field(..., min_length=1)
    role: Optional[str] = None  # Expected role: BUYER, SUPPLIER, ADMIN
    remember_me: Optional[bool] = False


class AdminLoginRequest(BaseModel):
    admin_id: str = Field(..., min_length=4, max_length=20, description="Numeric Administrator ID (e.g. 12345667)")
    password: str = Field(..., min_length=1)


class UserRegisterBuyer(BaseModel):
    company_name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None
    full_name: Optional[str] = None
    country: str = Field("India", min_length=2)
    business_category: Optional[str] = "Industrial Components"
    sourcing_categories: Optional[Union[List[str], str]] = None
    contact_phone: Optional[str] = None


class UserRegisterSupplier(BaseModel):
    company_name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None
    full_name: Optional[str] = None
    country: str = Field("India", min_length=2)
    products_sold: Optional[str] = None
    product_categories: Optional[Union[List[str], str]] = None
    manufacturing_capabilities: Optional[str] = "General Manufacturing"
    contact_phone: str = Field("+91 80 1234 5678")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    message: str
    is_simulated: bool = True
    dev_note: str


class UserOut(UserBase):
    id: int
    supplier_id: Optional[int] = None
    verification_status: str = "ACTIVE"
    verification_rejection_reason: Optional[str] = None
    verification_submitted_at: Optional[datetime] = None
    verification_reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    suspension_reason: Optional[str] = None
    removal_reason: Optional[str] = None
    more_info_requested: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    redirect_url: Optional[str] = None


class AuditLogOut(BaseModel):
    id: int
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: Optional[str] = None
    user_email: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
