import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="BUYER", nullable=False)  # BUYER, SUPPLIER, ADMIN
    admin_id = Column(String(50), unique=True, index=True, nullable=True)  # Numeric Administrator ID (e.g. 12345667)
    company_name = Column(String(255), nullable=True)
    country = Column(String(100), nullable=True)
    business_category = Column(String(100), nullable=True)
    sourcing_categories = Column(Text, nullable=True)  # JSON or comma-separated sourcing categories for buyers
    contact_phone = Column(String(50), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    verification_status = Column(String(50), default="PENDING_REVIEW", nullable=False)  # NOT_SUBMITTED, PENDING_REVIEW, APPROVED, REJECTED, MORE_INFO_REQUIRED, SUSPENDED, REMOVED, ACTIVE
    verification_rejection_reason = Column(Text, nullable=True)
    verification_submitted_at = Column(DateTime, nullable=True)
    verification_reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(255), nullable=True)  # Admin email who reviewed
    suspension_reason = Column(Text, nullable=True)
    removal_reason = Column(Text, nullable=True)
    more_info_requested = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    sourcing_requests = relationship("SourcingRequest", back_populates="user", cascade="all, delete-orphan")
    supplier = relationship("Supplier", foreign_keys=[supplier_id])
    documents = relationship("CompanyDocument", back_populates="user", cascade="all, delete-orphan")
