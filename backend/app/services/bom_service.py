import csv
import io
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.bom import BOMProject, BOMItem
from app.models.sourcing import SourcingRequest
from app.schemas.bom import BOMProjectCreate, BOMItemCreate, BOMItemUpdate, BOMGenerateRequest


class BOMService:

    @staticmethod
    def create_project(db: Session, data: BOMProjectCreate) -> BOMProject:
        project = BOMProject(
            title=data.title,
            description=data.description,
            sourcing_request_id=data.sourcing_request_id,
            currency=data.currency,
            status=data.status
        )
        db.add(project)
        db.flush()

        total = 0.0
        for item_data in data.items:
            line_cost = float(item_data.estimated_unit_cost) * item_data.quantity
            total += line_cost
            item = BOMItem(
                bom_project_id=project.id,
                part_name=item_data.part_name,
                description=item_data.description,
                material=item_data.material,
                dimensions=item_data.dimensions,
                quantity=item_data.quantity,
                unit=item_data.unit,
                manufacturing_process=item_data.manufacturing_process,
                estimated_unit_cost=item_data.estimated_unit_cost,
                total_cost=line_cost,
                supplier_id=item_data.supplier_id,
                specification_status=item_data.specification_status,
                notes=item_data.notes
            )
            db.add(item)

        project.total_estimated_cost = round(total, 2)
        db.commit()
        db.refresh(project)
        return project

    @staticmethod
    def get_project(db: Session, project_id: int) -> Optional[BOMProject]:
        return db.query(BOMProject).options(
            joinedload(BOMProject.items).joinedload(BOMItem.supplier)
        ).filter(BOMProject.id == project_id).first()

    @staticmethod
    def list_projects(db: Session, skip: int = 0, limit: int = 50) -> List[BOMProject]:
        return db.query(BOMProject).options(
            joinedload(BOMProject.items)
        ).order_by(BOMProject.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def add_item_to_project(db: Session, project_id: int, item_data: BOMItemCreate) -> BOMItem:
        project = db.query(BOMProject).filter(BOMProject.id == project_id).first()
        if not project:
            raise ValueError(f"BOM Project {project_id} not found")

        line_cost = float(item_data.estimated_unit_cost) * item_data.quantity
        item = BOMItem(
            bom_project_id=project.id,
            part_name=item_data.part_name,
            description=item_data.description,
            material=item_data.material,
            dimensions=item_data.dimensions,
            quantity=item_data.quantity,
            unit=item_data.unit,
            manufacturing_process=item_data.manufacturing_process,
            estimated_unit_cost=item_data.estimated_unit_cost,
            total_cost=line_cost,
            supplier_id=item_data.supplier_id,
            specification_status=item_data.specification_status,
            notes=item_data.notes
        )
        db.add(item)
        db.flush()

        BOMService._recalculate_project_total(db, project)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_item(db: Session, item_id: int, update: BOMItemUpdate) -> BOMItem:
        item = db.query(BOMItem).filter(BOMItem.id == item_id).first()
        if not item:
            raise ValueError(f"BOM Item {item_id} not found")

        for key, value in update.model_dump(exclude_unset=True).items():
            setattr(item, key, value)

        item.total_cost = float(item.estimated_unit_cost) * item.quantity
        db.flush()

        project = db.query(BOMProject).filter(BOMProject.id == item.bom_project_id).first()
        if project:
            BOMService._recalculate_project_total(db, project)

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_item(db: Session, item_id: int) -> bool:
        item = db.query(BOMItem).filter(BOMItem.id == item_id).first()
        if not item:
            return False
        project_id = item.bom_project_id
        db.delete(item)
        db.flush()

        project = db.query(BOMProject).filter(BOMProject.id == project_id).first()
        if project:
            BOMService._recalculate_project_total(db, project)

        db.commit()
        return True

    @staticmethod
    def _recalculate_project_total(db: Session, project: BOMProject):
        items = db.query(BOMItem).filter(BOMItem.bom_project_id == project.id).all()
        total = sum(float(i.total_cost) for i in items)
        project.total_estimated_cost = round(total, 2)

    @staticmethod
    def export_csv(db: Session, project_id: int) -> str:
        project = BOMService.get_project(db, project_id)
        if not project:
            raise ValueError("BOM Project not found")

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Item ID",
            "Part Name",
            "Description",
            "Material",
            "Dimensions",
            "Quantity",
            "Unit",
            "Process",
            "Estimated Unit Cost (USD)",
            "Total Cost (USD)",
            "Specification Status",
            "Notes"
        ])

        for item in project.items:
            writer.writerow([
                item.id,
                item.part_name,
                item.description or "",
                item.material or "",
                item.dimensions or "",
                item.quantity,
                item.unit,
                item.manufacturing_process or "",
                f"{float(item.estimated_unit_cost):.2f}",
                f"{float(item.total_cost):.2f}",
                item.specification_status,
                item.notes or ""
            ])

        writer.writerow([])
        writer.writerow(["", "", "", "", "", "", "", "Subtotal", f"{float(project.total_estimated_cost):.2f}"])
        return output.getvalue()

    @staticmethod
    def generate_draft_bom(db: Session, req: BOMGenerateRequest) -> BOMProject:
        """
        Engineering Agent synthesis: produces an engineering bill of materials draft.
        Clearly labeled: 'AI-generated draft — engineering review required'.
        """
        title = req.title or "Engineering Assembly BOM Draft"
        sourcing_req = None
        if req.sourcing_request_id:
            sourcing_req = db.query(SourcingRequest).filter(SourcingRequest.id == req.sourcing_request_id).first()
            if sourcing_req:
                title = f"BOM - {sourcing_req.title}"

        # Structured engineering sub-assemblies for industrial bracket/mounting assembly
        draft_items = [
            BOMItemCreate(
                part_name="Primary Mounting Plate",
                description="Laser cut and CNC bent base plate, 4x M8 mounting slots",
                material=sourcing_req.material_grade if sourcing_req and sourcing_req.material_grade else "SS 304",
                dimensions=sourcing_req.dimensions if sourcing_req and sourcing_req.dimensions else "250mm x 150mm x 4mm",
                quantity=sourcing_req.quantity if sourcing_req and sourcing_req.quantity else 500,
                unit="pcs",
                manufacturing_process="Laser Cutting & CNC Press Brake",
                estimated_unit_cost=12.50,
                specification_status="AI-DRAFT-REVIEW-REQ",
                notes="AI-generated draft — engineering review required. Tolerance ISO 2768-m."
            ),
            BOMItemCreate(
                part_name="Stiffener Gusset Ribs",
                description="Triangular reinforcing rib gussets, chamfered weld prep edges",
                material=sourcing_req.material_grade if sourcing_req and sourcing_req.material_grade else "SS 304",
                dimensions="80mm x 80mm x 4mm",
                quantity=(sourcing_req.quantity * 2) if sourcing_req and sourcing_req.quantity else 1000,
                unit="pcs",
                manufacturing_process="Fiber Laser Profiling",
                estimated_unit_cost=3.20,
                specification_status="AI-DRAFT-REVIEW-REQ",
                notes="TIG welded to primary plate. Weld spec AWS D1.6."
            ),
            BOMItemCreate(
                part_name="Hex Flange Lock Bolts M8x25",
                description="DIN 6921 high tensile A2-70 stainless fasteners",
                material="Stainless Steel A2-70",
                dimensions="M8 x 25mm Pitch 1.25",
                quantity=(sourcing_req.quantity * 4) if sourcing_req and sourcing_req.quantity else 2000,
                unit="pcs",
                manufacturing_process="Cold Heading & Thread Rolling",
                estimated_unit_cost=0.45,
                specification_status="SPECIFIED",
                notes="Catalog fastener item."
            ),
            BOMItemCreate(
                part_name="Surface Pickling & Passivation Treatment",
                description="Chemical immersion passivation to ASTM A967 for corrosion resistance",
                material="Passivation Bath",
                dimensions="Batch Surface Treatment",
                quantity=sourcing_req.quantity if sourcing_req and sourcing_req.quantity else 500,
                unit="pcs",
                manufacturing_process="Chemical Passivation",
                estimated_unit_cost=1.80,
                specification_status="ESTIMATED",
                notes="Surface finish Ra < 1.6um."
            )
        ]

        proj_create = BOMProjectCreate(
            title=title,
            description="AI-generated draft BOM synthesized from sourcing specifications. Review by certified mechanical engineer required before tooling.",
            sourcing_request_id=req.sourcing_request_id,
            currency="USD",
            status="DRAFT",
            items=draft_items
        )

        return BOMService.create_project(db, proj_create)
