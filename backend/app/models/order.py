import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. "PO-2026-904"
    sourcing_request_id = Column(Integer, ForeignKey("sourcing_requests.id", ondelete="SET NULL"), nullable=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    status = Column(String(50), default="CONFIRMED", nullable=False)
    # Allowed statuses:
    # CONFIRMED, PREPARING, IN_PRODUCTION, READY_FOR_DISPATCH, READY_TO_SHIP,
    # DISPATCHED, SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, DELIVERY_EXCEPTION, CANCELLED
    expected_delivery_date = Column(DateTime, nullable=True)
    shipping_address = Column(Text, nullable=True)
    tracking_number = Column(String(100), nullable=True)  # Clearly simulated demo tracking
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    sourcing_request = relationship("SourcingRequest", back_populates="orders")
    quotation = relationship("Quotation", back_populates="order")
    supplier = relationship("Supplier", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    negotiations = relationship("NegotiationMessage", foreign_keys="NegotiationMessage.order_id", cascade="all, delete-orphan")

    @property
    def buyer(self):
        if self.sourcing_request and self.sourcing_request.user:
            return self.sourcing_request.user
        if self.quotation and self.quotation.rfq and self.quotation.rfq.sourcing_request and self.quotation.rfq.sourcing_request.user:
            return self.quotation.rfq.sourcing_request.user
        return None

    @property
    def buyer_id(self):
        b = self.buyer
        return b.id if b else None

    @property
    def buyer_company_name(self) -> str:
        b = self.buyer
        if b and b.company_name:
            return b.company_name
        return "Global Enterprise Inc."

    @property
    def buyer_country(self) -> str:
        b = self.buyer
        if b and b.country:
            return b.country
        return "Germany"

    @property
    def buyer_name(self) -> str:
        b = self.buyer
        if b and b.full_name:
            return b.full_name
        return "Procurement Manager"

    @property
    def buyer_email(self) -> str:
        b = self.buyer
        if b and b.email:
            return b.email
        return "buyer@namadekadda.com"

    @property
    def buyer_id(self):
        b = self.buyer
        return b.id if b else None


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)

    order = relationship("Order", back_populates="items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by = Column(String(100), default="Procurement Manager", nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    order = relationship("Order", back_populates="history")
