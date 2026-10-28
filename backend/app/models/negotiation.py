import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class NegotiationMessage(Base):
    __tablename__ = "negotiation_messages"

    id = Column(Integer, primary_key=True, index=True)
    rfq_id = Column(Integer, ForeignKey("rfqs.id", ondelete="CASCADE"), nullable=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    sender_role = Column(String(50), nullable=False)  # BUYER, SUPPLIER, SYSTEM
    sender_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)

    # Optional structured proposal / counteroffer terms
    action_type = Column(String(50), default="MESSAGE", nullable=False)  # MESSAGE, PROPOSAL, ACCEPT, DECLINE, COUNTER
    proposed_price = Column(Numeric(12, 2), nullable=True)
    proposed_quantity = Column(Integer, nullable=True)
    proposed_currency = Column(String(10), default="USD", nullable=True)
    proposed_lead_time_days = Column(Integer, nullable=True)
    proposed_delivery_date = Column(DateTime, nullable=True)
    proposed_payment_terms = Column(String(100), nullable=True)
    proposed_moq = Column(Integer, nullable=True)
    status = Column(String(50), default="OPEN", nullable=False)  # OPEN, COUNTEROFFER, ACCEPTED, DECLINED, AGREED

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    rfq = relationship("RFQ", foreign_keys=[rfq_id])
    quotation = relationship("Quotation", foreign_keys=[quotation_id])
    supplier = relationship("Supplier", foreign_keys=[supplier_id])
    order = relationship("Order", foreign_keys=[order_id], overlaps="negotiations")
    buyer = relationship("User", foreign_keys=[buyer_id])
