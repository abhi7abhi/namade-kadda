import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class BOMProject(Base):
    __tablename__ = "bom_projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    sourcing_request_id = Column(Integer, ForeignKey("sourcing_requests.id", ondelete="SET NULL"), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    total_estimated_cost = Column(Numeric(12, 2), default=0.00, nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False)  # DRAFT, REVIEWED, APPROVED

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    sourcing_request = relationship("SourcingRequest", back_populates="bom_projects")
    items = relationship("BOMItem", back_populates="project", cascade="all, delete-orphan")


class BOMItem(Base):
    __tablename__ = "bom_items"

    id = Column(Integer, primary_key=True, index=True)
    bom_project_id = Column(Integer, ForeignKey("bom_projects.id", ondelete="CASCADE"), nullable=False)
    part_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    material = Column(String(100), nullable=True)
    dimensions = Column(String(100), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False)
    manufacturing_process = Column(String(100), nullable=True)
    estimated_unit_cost = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_cost = Column(Numeric(12, 2), default=0.00, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    specification_status = Column(String(50), default="PENDING_REVIEW", nullable=False)  # SPECIFIED, PENDING_REVIEW, ESTIMATED
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    project = relationship("BOMProject", back_populates="items")
    supplier = relationship("Supplier")
