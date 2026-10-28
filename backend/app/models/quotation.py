import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quote_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "QT-2026-8801"
    rfq_id = Column(Integer, ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    moq = Column(Integer, default=100, nullable=False)
    lead_time_days = Column(Integer, default=21, nullable=False)
    shipping_estimate = Column(Numeric(12, 2), default=0.00, nullable=False)
    payment_terms = Column(String(100), default="Net 30, EXW Factory", nullable=False)
    validity_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="SUBMITTED", nullable=False)  # DRAFT, SUBMITTED, UNDER_REVIEW, REVISED, ACCEPTED, REJECTED, EXPIRED, WITHDRAWN
    rejection_reason = Column(Text, nullable=True)
    acceptance_reason = Column(Text, nullable=True)

    # Section 11 Extended Quotation Terms
    incoterms = Column(String(50), default="FOB", nullable=False)  # EXW, FOB, CIF, DDP
    estimated_shipping_cost = Column(Numeric(12, 2), default=0.00, nullable=False)
    discounts = Column(Numeric(12, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    warranty_info = Column(String(255), default="12 Months Manufacturer Warranty against material defects", nullable=False)
    packaging_details = Column(String(255), default="Export-grade wooden crate with VCI anti-corrosion wrap", nullable=False)
    technical_deviations = Column(Text, nullable=True)
    revision_number = Column(Integer, default=1, nullable=False)
    parent_quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True)

    comparison_score = Column(Numeric(5, 2), default=0.00, nullable=False)  # 0 to 100
    score_breakdown = Column(Text, nullable=True)  # JSON: {price_score, lead_time_score, reliability_score, weights}
    missing_fields = Column(Text, nullable=True)  # JSON array: ["material_test_cert", "customs_code"]

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    rfq = relationship("RFQ", back_populates="quotations")
    supplier = relationship("Supplier", back_populates="quotations")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")
    order = relationship("Order", back_populates="quotation", uselist=False)


class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)
    lead_time_days = Column(Integer, default=21, nullable=False)

    quotation = relationship("Quotation", back_populates="items")
