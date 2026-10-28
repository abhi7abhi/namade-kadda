import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. CMP-2026-001

    # Complainant information
    complainant_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    complainant_role = Column(String(50), nullable=False)  # BUYER or SUPPLIER
    complainant_company_name = Column(String(255), nullable=False)

    # Accused entity information (private case, NOT notified)
    accused_company_name = Column(String(255), nullable=False)
    accused_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    accused_supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)

    # Classification
    category = Column(String(100), nullable=False)  # Product Quality, Delivery Delay, Payment or Refund, etc.
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(50), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, URGENT

    # Workflow Status: SUBMITTED, UNDER_REVIEW, AWAITING_INFO, RESOLVED, REJECTED, CLOSED
    status = Column(String(50), default="SUBMITTED", nullable=False)

    # Optional references to procurement entities
    related_order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    related_rfq_id = Column(Integer, ForeignKey("rfqs.id", ondelete="SET NULL"), nullable=True)
    related_quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True)

    # Administrative investigation fields
    assigned_admin_name = Column(String(255), nullable=True)
    internal_notes = Column(Text, nullable=True)  # Admin-only notes
    resolution_notes = Column(Text, nullable=True)  # Recorded when RESOLVED
    rejection_reason = Column(Text, nullable=True)  # Recorded when REJECTED

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    complainant_user = relationship("User", foreign_keys=[complainant_user_id])
    accused_user = relationship("User", foreign_keys=[accused_user_id])
    accused_supplier = relationship("Supplier", foreign_keys=[accused_supplier_id])
    related_order = relationship("Order", foreign_keys=[related_order_id])
    related_rfq = relationship("RFQ", foreign_keys=[related_rfq_id])
    related_quotation = relationship("Quotation", foreign_keys=[related_quotation_id])

    evidence = relationship("ComplaintEvidence", back_populates="complaint", cascade="all, delete-orphan")
    messages = relationship("ComplaintMessage", back_populates="complaint", cascade="all, delete-orphan")
    history = relationship("ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan")


class ComplaintEvidence(Base):
    __tablename__ = "complaint_evidence"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    download_url = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    uploaded_by_role = Column(String(50), default="COMPLAINANT", nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="evidence")


class ComplaintMessage(Base):
    __tablename__ = "complaint_messages"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    sender_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_role = Column(String(50), nullable=False)  # ADMIN, BUYER, SUPPLIER
    sender_name = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False, nullable=False)  # True = admin private internal note
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="messages")


class ComplaintStatusHistory(Base):
    __tablename__ = "complaint_status_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by_name = Column(String(255), nullable=False)
    changed_by_role = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="history")
