import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class TradeAssessment(Base):
    __tablename__ = "trade_assessments"

    id = Column(Integer, primary_key=True, index=True)
    sourcing_request_id = Column(Integer, ForeignKey("sourcing_requests.id", ondelete="SET NULL"), nullable=True)
    origin_country = Column(String(100), nullable=False)
    destination_country = Column(String(100), nullable=False)
    product_description = Column(Text, nullable=False)
    declared_value = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)

    hs_code_candidate = Column(String(50), nullable=True)  # e.g. "7326.90.99"
    estimated_duty_rate = Column(Numeric(5, 2), default=7.50, nullable=False)  # in %
    estimated_tax_rate = Column(Numeric(5, 2), default=18.00, nullable=False)   # in % (e.g. IGST)
    freight_insurance_estimate = Column(Numeric(12, 2), default=0.00, nullable=False)
    duty_estimate = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax_estimate = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_landed_estimate = Column(Numeric(12, 2), default=0.00, nullable=False)

    compliance_checklist = Column(Text, nullable=True)  # JSON checklist of required trade docs
    disclaimer = Column(Text, nullable=False)
    source_basis = Column(String(255), default="Illustrative Reference Tariff 2026", nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    sourcing_request = relationship("SourcingRequest", back_populates="trade_assessments")
