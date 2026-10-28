from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class CompanyDocumentBase(BaseModel):
    document_type: str
    document_title: str
    description: Optional[str] = None


class CompanyDocumentCreate(CompanyDocumentBase):
    pass


class CompanyDocumentOut(CompanyDocumentBase):
    id: int
    user_id: int
    supplier_id: Optional[int] = None
    original_filename: str
    file_size: int
    mime_type: str
    status: str  # PENDING_REVIEW, APPROVED, REJECTED
    rejection_reason: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    download_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdminDocumentItemOut(CompanyDocumentOut):
    user_email: str
    company_name: Optional[str] = None
    role: str
    country: Optional[str] = None


class DocumentReviewRequest(BaseModel):
    action: str = Field(..., description="'APPROVE' or 'REJECT'")
    rejection_reason: Optional[str] = None


class CompanyVerificationStatusOut(BaseModel):
    user_id: int
    company_name: Optional[str] = None
    role: str
    verification_status: str  # NOT_SUBMITTED, PENDING_REVIEW, APPROVED, REJECTED, ACTIVE
    rejection_reason: Optional[str] = None
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    documents: List[CompanyDocumentOut] = []
    documents_count: int = 0
    approved_documents_count: int = 0
    rejected_documents_count: int = 0
    pending_documents_count: int = 0


class AdminCompanyVerifyRequest(BaseModel):
    action: str = Field(..., description="'APPROVE' or 'REJECT'")
    rejection_reason: Optional[str] = None
