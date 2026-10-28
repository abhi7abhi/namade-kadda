from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.component_intelligence_service import ComponentIntelligenceService
from app.schemas.component_intelligence import (
    ComponentIntelligenceSearchResponse,
    ComponentMatchSupplierOut,
    ExportToBOMRequest,
    ExportToBOMResponse,
    CreateComponentSourcingRequest,
    CreateComponentSourcingResponse,
    SavedSearchOut,
    SaveSearchRequest
)
from app.models.component_intelligence import SavedComponentSearch

router = APIRouter(prefix="/component-intelligence", tags=["Two-Way Component Intelligence"])


@router.get("/search", response_model=ComponentIntelligenceSearchResponse)
def search_component_intelligence(
    query: str = Query(..., description="Product, component, or raw material query"),
    mode: str = Query("auto_detect", description="find_components, find_products, or auto_detect"),
    db: Session = Depends(get_db)
):
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty")
    return ComponentIntelligenceService.search(db, query=query, mode=mode)


@router.get("/suppliers", response_model=List[ComponentMatchSupplierOut])
def get_component_suppliers(
    component_name: str = Query(..., description="Name of the component or raw material"),
    category: Optional[str] = Query(None, description="Component category"),
    hint: Optional[str] = Query(None, description="Supplier capability hint"),
    db: Session = Depends(get_db)
):
    return ComponentIntelligenceService.find_suppliers_for_component(
        db, component_name=component_name, category=category, hint=hint
    )


@router.post("/export-to-bom", response_model=ExportToBOMResponse, status_code=201)
def export_to_bom(req: ExportToBOMRequest, db: Session = Depends(get_db)):
    if not req.components:
        raise HTTPException(status_code=400, detail="No components provided to export to BOM")
    return ComponentIntelligenceService.export_to_bom(db, req)


@router.post("/create-sourcing-rfq", response_model=CreateComponentSourcingResponse, status_code=201)
def create_sourcing_rfq(req: CreateComponentSourcingRequest, db: Session = Depends(get_db)):
    return ComponentIntelligenceService.create_sourcing_rfq(db, req)


@router.get("/saved-searches", response_model=List[SavedSearchOut])
def list_saved_searches(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    records = db.query(SavedComponentSearch).order_by(SavedComponentSearch.id.desc()).limit(limit).all()
    return [
        SavedSearchOut(
            id=r.id,
            query=r.query,
            search_mode=r.search_mode,
            detected_type=r.detected_type,
            result_count=r.result_count,
            created_at=r.created_at.isoformat() if r.created_at else ""
        ) for r in records
    ]
