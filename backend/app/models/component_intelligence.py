import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class ProductComponentRelationship(Base):
    __tablename__ = "product_component_relationships"

    id = Column(Integer, primary_key=True, index=True)
    parent_name = Column(String(255), nullable=False, index=True)
    parent_category = Column(String(100), nullable=False, index=True)
    child_name = Column(String(255), nullable=False, index=True)
    child_category = Column(String(100), nullable=False, index=True)
    relationship_type = Column(String(50), default="DIRECT_COMPONENT", nullable=False)  # DIRECT_COMPONENT, SUBCOMPONENT, RAW_MATERIAL
    quantity = Column(Numeric(10, 2), default=1.0, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False)
    typical_purpose = Column(Text, nullable=False)
    specification_details = Column(Text, nullable=True)
    verification_status = Column(String(50), default="VERIFIED", nullable=False)  # VERIFIED, CURATED_REFERENCE, AI_SUGGESTED
    source = Column(String(150), default="Namade Kadda Knowledge Base", nullable=False)
    product_model_applicability = Column(String(255), default="Standard Industrial / Commercial Grade", nullable=True)
    estimated_cost_reference = Column(Numeric(12, 2), nullable=True)
    cost_currency = Column(String(10), default="USD", nullable=False)
    supplier_category_hint = Column(String(100), nullable=True)
    subcomponents_json = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)


class SavedComponentSearch(Base):
    __tablename__ = "saved_component_searches"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    query = Column(String(255), nullable=False)
    search_mode = Column(String(50), nullable=False)  # find_components, find_products, auto_detect
    detected_type = Column(String(50), nullable=True)  # PRODUCT, COMPONENT, RAW_MATERIAL, AMBIGUOUS
    result_count = Column(Integer, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    user = relationship("User")
