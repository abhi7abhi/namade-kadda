from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.bom_service import BOMService
from app.schemas.bom import (
    BOMProjectCreate,
    BOMProjectOut,
    BOMItemCreate,
    BOMItemUpdate,
    BOMItemOut,
    BOMGenerateRequest
)

router = APIRouter(prefix="/bom", tags=["Engineering / BOM"])


@router.get("/projects", response_model=List[BOMProjectOut])
def list_bom_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return BOMService.list_projects(db, skip=skip, limit=limit)


@router.get("/projects/{project_id}", response_model=BOMProjectOut)
def get_bom_project(project_id: int, db: Session = Depends(get_db)):
    proj = BOMService.get_project(db, project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="BOM project not found")
    return proj


@router.post("/projects", response_model=BOMProjectOut, status_code=201)
def create_bom_project(data: BOMProjectCreate, db: Session = Depends(get_db)):
    return BOMService.create_project(db, data)


@router.post("/projects/generate", response_model=BOMProjectOut, status_code=201)
def generate_draft_bom(data: BOMGenerateRequest, db: Session = Depends(get_db)):
    return BOMService.generate_draft_bom(db, data)


@router.post("/projects/{project_id}/items", response_model=BOMItemOut, status_code=201)
def add_bom_item(project_id: int, data: BOMItemCreate, db: Session = Depends(get_db)):
    try:
        return BOMService.add_item_to_project(db, project_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/items/{item_id}", response_model=BOMItemOut)
def update_bom_item(item_id: int, data: BOMItemUpdate, db: Session = Depends(get_db)):
    try:
        return BOMService.update_item(db, item_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/items/{item_id}")
def delete_bom_item(item_id: int, db: Session = Depends(get_db)):
    success = BOMService.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="BOM item not found")
    return {"message": "BOM item deleted successfully"}


@router.get("/projects/{project_id}/export-csv")
def export_bom_csv(project_id: int, db: Session = Depends(get_db)):
    try:
        csv_content = BOMService.export_csv(db, project_id)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=BOM_Project_{project_id}.csv"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
