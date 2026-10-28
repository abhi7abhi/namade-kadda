import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class CompanyDocument(Base):
    __tablename__ = "company_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True)

    document_type = Column(String(100), nullable=False)  # COMPANY_REGISTRATION, BUSINESS_LICENSE, TAX_CERTIFICATE, REPRESENTATIVE_ID, PRODUCT_CERTIFICATION, QUALITY_CERTIFICATION, OTHER
    document_title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    mime_type = Column(String(100), nullable=False)  # image/png, image/jpeg, application/pdf

    status = Column(String(50), default="PENDING_REVIEW", nullable=False)  # PENDING_REVIEW, APPROVED, REJECTED
    rejection_reason = Column(Text, nullable=True)
    reviewed_by = Column(String(255), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="documents")
    supplier = relationship("Supplier", back_populates="documents")
