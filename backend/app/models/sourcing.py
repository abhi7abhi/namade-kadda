import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SourcingRequest(Base):
    __tablename__ = "sourcing_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "SR-2026-001"
    title = Column(String(255), nullable=False)
    raw_input = Column(Text, nullable=False)
    status = Column(String(50), default="SPEC_EXTRACTED", nullable=False)  # DRAFT, SPEC_EXTRACTED, CONFIRMED, RFQ_ISSUED, COMPLETED, CANCELLED
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    category = Column(String(100), nullable=True, index=True)
    quantity = Column(Integer, nullable=True)
    unit = Column(String(50), default="pieces", nullable=False)
    target_budget = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    destination_country = Column(String(100), nullable=True)
    destination_city = Column(String(100), nullable=True)
    required_delivery_date = Column(String(50), nullable=True)
    manufacturing_process = Column(String(150), nullable=True)
    material_grade = Column(String(150), nullable=True)
    dimensions = Column(String(255), nullable=True)
    tolerances = Column(String(100), nullable=True)
    required_certifications = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    confidence_score = Column(Numeric(3, 2), default=0.92, nullable=False)
    extraction_metadata = Column(Text, nullable=True)  # JSON string detailing parsed vs missing fields

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="sourcing_requests")
    rfqs = relationship("RFQ", back_populates="sourcing_request", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="sourcing_request")
    bom_projects = relationship("BOMProject", back_populates="sourcing_request")
    trade_assessments = relationship("TradeAssessment", back_populates="sourcing_request")
    agent_runs = relationship("AgentRun", back_populates="sourcing_request")
