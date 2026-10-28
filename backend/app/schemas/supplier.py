from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SupplierCapabilityBase(BaseModel):
    category: str
    process_type: str
    materials: Optional[str] = None
    certifications: Optional[str] = None


class SupplierCapabilityOut(SupplierCapabilityBase):
    id: int
    supplier_id: int

    model_config = ConfigDict(from_attributes=True)


class CatalogItemBase(BaseModel):
    name: str
    part_number: Optional[str] = None
    sku: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    unit_price: float
    currency: str = "USD"
    moq: int = 50
    lead_time_days: int = 14
    material: Optional[str] = None
    material_grade: Optional[str] = None
    dimensions: Optional[str] = None
    weight: Optional[str] = None
    manufacturing_process: Optional[str] = None
    specifications: Optional[str] = None
    origin_country: str = "India"
    available_quantity: int = 1000
    image_url: Optional[str] = None
    manufacturing_capability: Optional[str] = None
    in_stock: bool = True
    customization_options: Optional[str] = None
    certifications: Optional[str] = None
    shipping_options: Optional[str] = "Air Cargo, Ocean Freight, Express Courier"
    supported_destinations: Optional[str] = "Global, United States, Germany, India, UAE, Japan"
    unit_of_measurement: Optional[str] = "pieces"
    production_capacity: Optional[str] = "10,000 units / month"
    stock_status: Optional[str] = "IN_STOCK"
    datasheet_url: Optional[str] = None
    technical_specifications: Optional[str] = None
    status: Optional[str] = "PUBLISHED"


class CatalogItemOut(CatalogItemBase):
    id: int
    supplier_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SupplierBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    country: str
    city: str
    address: Optional[str] = None
    website: Optional[str] = None
    contact_email: str
    phone: Optional[str] = None
    moq: Optional[int] = 100
    lead_time_days: Optional[int] = 21
    price_rating: Optional[str] = "$$"
    is_verified: Optional[bool] = False
    verification_status: Optional[str] = "SAMPLE_DATA"
    rating: Optional[float] = 4.5

    # Extended Seller Company Profile fields
    legal_business_name: Optional[str] = None
    state_region: Optional[str] = None
    years_of_operation: Optional[int] = 12
    business_type: Optional[str] = "Manufacturer & Exporter"
    factory_location: Optional[str] = None
    export_countries: Optional[str] = "India, Germany, United States, Japan, Singapore"
    languages_supported: Optional[str] = "English, Hindi, German"
    production_capacity: Optional[str] = "50,000 units/month"
    materials_supported: Optional[str] = "Stainless Steel 304/316, Aluminum 6061-T6, Copper"
    certifications_documents: Optional[str] = "ISO 9001:2015"
    business_registration_number: Optional[str] = None
    verification_request_status: Optional[str] = "APPROVED"
    profile_completeness: Optional[int] = 90


class SupplierCreate(SupplierBase):
    pass


class SupplierOut(SupplierBase):
    id: int
    created_at: datetime
    updated_at: datetime
    capabilities: List[SupplierCapabilityOut] = []
    catalog_items: List[CatalogItemOut] = []

    model_config = ConfigDict(from_attributes=True)


class SupplierListResponse(BaseModel):
    items: List[SupplierOut]
    total: int
    page: int
    size: int
    pages: int
