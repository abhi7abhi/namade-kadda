from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


COMPLAINT_CATEGORIES = [
    "Product Quality",
    "Delivery Delay",
    "Payment or Refund",
    "Incorrect Product or Quantity",
    "Misleading Information",
    "Unprofessional Behaviour",
    "Fraud or Suspicious Activity",
    "Other"
]

COMPLAINT_STATUSES = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "AWAITING_INFO",
    "RESOLVED",
    "REJECTED",
    "CLOSED"
]


class ComplaintCreateRequest(BaseModel):
    category: str
    subject: str
    description: str
    accused_company_name: str
    accused_supplier_id: Optional[int] = None
    accused_buyer_id: Optional[int] = None
    priority: str = "MEDIUM"  # LOW, MEDIUM, HIGH, URGENT
    related_order_id: Optional[int] = None
    related_rfq_id: Optional[int] = None
    related_quotation_id: Optional[int] = None


class ComplaintEvidenceOut(BaseModel):
    id: int
    complaint_id: int
    file_name: str
    file_size: int
    mime_type: str
    download_url: str
    uploaded_by_role: str = "COMPLAINANT"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintMessageOut(BaseModel):
    id: int
    complaint_id: int
    sender_user_id: Optional[int] = None
    sender_role: str
    sender_name: str
    message: str
    is_internal: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintMessageCreateRequest(BaseModel):
    message: str
    is_internal: bool = False


class ComplaintStatusHistoryOut(BaseModel):
    id: int
    complaint_id: int
    previous_status: Optional[str] = None
    new_status: str
    changed_by_name: str
    changed_by_role: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintSummaryOut(BaseModel):
    id: int
    complaint_code: str
    complainant_user_id: int
    complainant_role: str
    complainant_company_name: str
    accused_company_name: str
    category: str
    subject: str
    priority: str
    status: str
    related_order_id: Optional[int] = None
    related_order_code: Optional[str] = None
    related_rfq_id: Optional[int] = None
    related_rfq_code: Optional[str] = None
    assigned_admin_name: Optional[str] = None
    has_admin_response: bool = False
    latest_admin_response: Optional[str] = None
    messages_count: int = 0
    evidence_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintDetailOut(ComplaintSummaryOut):
    description: str
    internal_notes: Optional[str] = None  # None for non-admin callers
    resolution_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    related_quotation_id: Optional[int] = None
    related_quotation_code: Optional[str] = None
    evidence: List[ComplaintEvidenceOut] = []
    messages: List[ComplaintMessageOut] = []
    history: List[ComplaintStatusHistoryOut] = []
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None


class ComplaintStatusUpdateRequest(BaseModel):
    new_status: str  # SUBMITTED, UNDER_REVIEW, AWAITING_INFO, RESOLVED, REJECTED, CLOSED
    notes: Optional[str] = None  # Mandatory if RESOLVED or REJECTED
    priority: Optional[str] = None  # LOW, MEDIUM, HIGH, URGENT
    assigned_admin_name: Optional[str] = None
    response_to_complainant: Optional[str] = None  # Optional message automatically sent to complainant


class ComplaintAdminOverviewOut(BaseModel):
    total_complaints: int = 0
    submitted_count: int = 0
    under_review_count: int = 0
    awaiting_info_count: int = 0
    resolved_count: int = 0
    rejected_count: int = 0
    closed_count: int = 0
    by_category: Dict[str, int] = {}
    by_complainant_role: Dict[str, int] = {}
    by_priority: Dict[str, int] = {}


class ComplaintReferenceOptionsOut(BaseModel):
    target_companies: List[Dict[str, Any]] = []
    orders: List[Dict[str, Any]] = []
    rfqs: List[Dict[str, Any]] = []
    quotations: List[Dict[str, Any]] = []
