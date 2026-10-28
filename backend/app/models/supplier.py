import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    country = Column(String(100), nullable=False, index=True)
    city = Column(String(100), nullable=False, index=True)
    address = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    moq = Column(Integer, default=100, nullable=False)
    lead_time_days = Column(Integer, default=21, nullable=False)
    price_rating = Column(String(10), default="$$", nullable=False)  # $, $$, $$$, $$$$
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_status = Column(String(50), default="SAMPLE_DATA", nullable=False)  # SAMPLE_DATA, PENDING_REVIEW, APPROVED, REJECTED
    rating = Column(Numeric(3, 2), default=4.5, nullable=False)  # sample/demo rating

    # Extended Company Profile fields (Section 6)
    legal_business_name = Column(String(255), nullable=True)
    state_region = Column(String(100), nullable=True)
    years_of_operation = Column(Integer, default=12, nullable=False)
    business_type = Column(String(100), default="Manufacturer & Exporter", nullable=False)  # Manufacturer, Wholesaler, Contract Fabricator, Exporter
    factory_location = Column(String(255), nullable=True)
    export_countries = Column(Text, default="India, Germany, United States, UAE, Singapore, Japan", nullable=False)
    languages_supported = Column(String(255), default="English, Hindi, German", nullable=False)
    production_capacity = Column(String(255), default="50,000 components / month", nullable=False)
    materials_supported = Column(Text, default="Stainless Steel 304/316, Aluminum 6061-T6, Copper Alloy C11000, Carbon Steel", nullable=False)
    certifications_documents = Column(Text, default="ISO 9001:2015, IATF 16949, AS9100D", nullable=False)
    business_registration_number = Column(String(100), default="REG-IND-KA-2014-99812", nullable=True)
    verification_request_status = Column(String(50), default="APPROVED", nullable=False)  # PENDING, APPROVED, REJECTED, MORE_INFO_REQUIRED, SUSPENDED, REMOVED
    verification_rejection_reason = Column(Text, nullable=True)
    verification_submitted_at = Column(DateTime, nullable=True)
    verification_reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(255), nullable=True)
    suspension_reason = Column(Text, nullable=True)
    removal_reason = Column(Text, nullable=True)
    more_info_requested = Column(Text, nullable=True)
    products_sold = Column(Text, nullable=True)
    product_categories = Column(Text, nullable=True)
    profile_completeness = Column(Integer, default=90, nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    capabilities = relationship("SupplierCapability", back_populates="supplier", cascade="all, delete-orphan")
    catalog_items = relationship("CatalogItem", back_populates="supplier", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="supplier")
    orders = relationship("Order", back_populates="supplier")
    rfq_links = relationship("RFQSupplier", back_populates="supplier")
    documents = relationship("CompanyDocument", back_populates="supplier", cascade="all, delete-orphan")


class SupplierCapability(Base):
    __tablename__ = "supplier_capabilities"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False, index=True)  # e.g. CNC Machining, Sheet Metal, Injection Molding
    process_type = Column(String(150), nullable=False)
    materials = Column(String(255), nullable=True)  # comma-separated e.g. "SS 304, Aluminum 6061, Brass"
    certifications = Column(String(255), nullable=True)  # e.g. "ISO 9001:2015, AS9100D, IATF 16949"

    supplier = relationship("Supplier", back_populates="capabilities")


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    part_number = Column(String(100), nullable=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    unit_price = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    moq = Column(Integer, default=50, nullable=False)
    lead_time_days = Column(Integer, default=14, nullable=False)
    material = Column(String(100), nullable=True)
    specifications = Column(Text, nullable=True)  # JSON or text description
    origin_country = Column(String(100), default="India", nullable=False, index=True)
    available_quantity = Column(Integer, default=2500, nullable=False)
    image_url = Column(String(500), nullable=True)
    manufacturing_capability = Column(String(150), nullable=True)
    in_stock = Column(Boolean, default=True, nullable=False)

    # Extended Product fields (Section 7 & Product Management Module)
    sku = Column(String(100), nullable=True)
    subcategory = Column(String(100), nullable=True)
    material_grade = Column(String(100), nullable=True)
    dimensions = Column(String(100), nullable=True)
    weight = Column(String(50), nullable=True)
    manufacturing_process = Column(String(150), nullable=True)
    customization_options = Column(Text, nullable=True)
    certifications = Column(String(255), nullable=True)
    shipping_options = Column(String(255), default="Air Cargo, Ocean Freight, Express Courier", nullable=True)
    supported_destinations = Column(Text, default="Global, United States, Germany, India, UAE, Japan", nullable=True)
    unit_of_measurement = Column(String(50), default="pieces", nullable=False)
    production_capacity = Column(String(150), default="10,000 units / month", nullable=True)
    stock_status = Column(String(50), default="IN_STOCK", nullable=False)  # IN_STOCK, MADE_TO_ORDER, OUT_OF_STOCK
    datasheet_url = Column(String(500), nullable=True)
    technical_specifications = Column(Text, nullable=True)
    status = Column(String(50), default="PUBLISHED", nullable=False)  # DRAFT, PUBLISHED, UNPUBLISHED, ARCHIVED

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    supplier = relationship("Supplier", back_populates="catalog_items")
