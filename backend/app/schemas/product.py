from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
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


class ProductCreate(ProductBase):
    supplier_id: int


class ProductSupplierInfo(BaseModel):
    id: int
    name: str
    country: str
    city: str
    verification_status: str = "SAMPLE_DATA"
    is_verified: bool = False
    rating: float = 4.5
    price_rating: str = "$$"

    model_config = ConfigDict(from_attributes=True)


class ProductOut(ProductBase):
    id: int
    supplier_id: int
    created_at: datetime
    supplier: Optional[ProductSupplierInfo] = None
    is_demo_data: bool = True

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    size: int
    pages: int
    available_categories: List[str] = []
    available_countries: List[str] = []
    min_price: float = 0.0
    max_price: float = 1000.0
