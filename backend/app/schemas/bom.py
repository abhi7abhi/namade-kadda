from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BOMItemBase(BaseModel):
    part_name: str
    description: Optional[str] = None
    material: Optional[str] = None
    dimensions: Optional[str] = None
    quantity: int = 1
    unit: str = "pcs"
    manufacturing_process: Optional[str] = None
    estimated_unit_cost: float = 0.00
    supplier_id: Optional[int] = None
    specification_status: str = "PENDING_REVIEW"
    notes: Optional[str] = None


class BOMItemCreate(BOMItemBase):
    pass


class BOMItemUpdate(BaseModel):
    part_name: Optional[str] = None
    description: Optional[str] = None
    material: Optional[str] = None
    dimensions: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    manufacturing_process: Optional[str] = None
    estimated_unit_cost: Optional[float] = None
    supplier_id: Optional[int] = None
    specification_status: Optional[str] = None
    notes: Optional[str] = None


class BOMItemOut(BOMItemBase):
    id: int
    bom_project_id: int
    total_cost: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BOMProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    sourcing_request_id: Optional[int] = None
    currency: str = "USD"
    status: str = "DRAFT"


class BOMProjectCreate(BOMProjectBase):
    items: List[BOMItemCreate] = []


class BOMProjectOut(BOMProjectBase):
    id: int
    total_estimated_cost: float
    created_at: datetime
    updated_at: datetime
    items: List[BOMItemOut] = []

    model_config = ConfigDict(from_attributes=True)


class BOMGenerateRequest(BaseModel):
    sourcing_request_id: Optional[int] = None
    requirement_text: Optional[str] = None
    title: Optional[str] = None
