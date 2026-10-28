import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class RFQ(Base):
    __tablename__ = "rfqs"

    id = Column(Integer, primary_key=True, index=True)
    rfq_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "RFQ-2026-101"
    sourcing_request_id = Column(Integer, ForeignKey("sourcing_requests.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="ISSUED", nullable=False)  # DRAFT, ISSUED, CLOSED, CANCELLED
    issue_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    deadline_date = Column(DateTime, nullable=True)
    terms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    sourcing_request = relationship("SourcingRequest", back_populates="rfqs")
    quotations = relationship("Quotation", back_populates="rfq", cascade="all, delete-orphan")
    supplier_invitations = relationship("RFQSupplier", back_populates="rfq", cascade="all, delete-orphan")


class RFQSupplier(Base):
    __tablename__ = "rfq_suppliers"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="INVITED", nullable=False)  # INVITED, VIEWED, ACCEPTED, QUOTED, DECLINED
    invited_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Section 10 RFQ Seller Actions
    decline_reason = Column(Text, nullable=True)
    clarification_questions = Column(Text, nullable=True)  # JSON array of questions
    responded_at = Column(DateTime, nullable=True)

    rfq = relationship("RFQ", back_populates="supplier_invitations")
    supplier = relationship("Supplier", back_populates="rfq_links")
