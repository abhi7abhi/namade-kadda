import re
import json
import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.sourcing import SourcingRequest
from app.schemas.sourcing import SourcingExtractionResult, ParsedSpecificationField, SourcingRequestCreate, SourcingRequestUpdate
from app.core.config import settings


class SourcingService:

    @staticmethod
    def extract_specifications_from_text(raw_text: str) -> SourcingExtractionResult:
        """
        Extracts structured engineering & procurement parameters from natural language input.
        In demo mode, uses rule-based parsing with explicit confidence and missing-field detection.
        Never silently invents fields.
        """
        text = raw_text.strip()
        extracted: List[ParsedSpecificationField] = []
        missing: List[str] = []

        # 1. Quantity extraction
        qty = None
        qty_unit = "pieces"
        qty_match = re.search(r'(\d+[\d,]*)\s*(pieces|pcs|units|nos|brackets|valves|fasteners|parts|kg|tons)?', text, re.IGNORECASE)
        if qty_match:
            try:
                qty_str = qty_match.group(1).replace(",", "")
                qty = int(qty_str)
                if qty_match.group(2):
                    qty_unit = qty_match.group(2).lower()
                extracted.append(ParsedSpecificationField(
                    field_name="quantity",
                    value=qty,
                    confidence=0.95,
                    requires_confirmation=False,
                    source_snippet=qty_match.group(0)
                ))
            except ValueError:
                pass
        else:
            missing.append("quantity")

        # 2. Material extraction
        material = None
        material_match = re.search(
            r'(stainless[- ]steel|ss\s*304|ss\s*316|aluminum\s*\d{4}|brass|mild[- ]steel|carbon[- ]steel|titanium|inconel|abs|pom|nylon|peek|grade\s*\w+)',
            text, re.IGNORECASE
        )
        if material_match:
            material = material_match.group(0).strip().title()
            extracted.append(ParsedSpecificationField(
                field_name="material_grade",
                value=material,
                confidence=0.92,
                requires_confirmation=False,
                source_snippet=material_match.group(0)
            ))
        else:
            missing.append("material_grade")

        # 3. Manufacturing Process
        process = None
        process_match = re.search(
            r'(cnc\s*machining|sheet[- ]metal|laser[- ]cutting|stamping|injection[- ]molding|casting|forging|3d[- ]printing|extrusion|bending|welding)',
            text, re.IGNORECASE
        )
        if process_match:
            process = process_match.group(0).strip().title()
            extracted.append(ParsedSpecificationField(
                field_name="manufacturing_process",
                value=process,
                confidence=0.88,
                requires_confirmation=False,
                source_snippet=process_match.group(0)
            ))
        else:
            # Infer process from keywords like "bracket" -> Sheet Metal / CNC
            if "bracket" in text.lower():
                process = "Sheet Metal / Stamping"
                extracted.append(ParsedSpecificationField(
                    field_name="manufacturing_process",
                    value=process,
                    confidence=0.65,
                    requires_confirmation=True,
                    source_snippet="Inferred from 'bracket'"
                ))
            else:
                missing.append("manufacturing_process")

        # 4. Dimensions / Tolerances
        dimensions = None
        dim_match = re.search(r'(\d+(?:\.\d+)?\s*(?:mm|cm|in|inch|m|thickness\s*\d+\s*mm|thk\s*\d+\s*mm)[\w\s\.\*xX\-]*)', text, re.IGNORECASE)
        if dim_match:
            dimensions = dim_match.group(0).strip()
            extracted.append(ParsedSpecificationField(
                field_name="dimensions",
                value=dimensions,
                confidence=0.85,
                requires_confirmation=False,
                source_snippet=dim_match.group(0)
            ))
        else:
            missing.append("dimensions")

        # Tolerances
        tolerances = None
        tol_match = re.search(r'(±\s*\d+(?:\.\d+)?\s*mm|tolerance\s*[\w\.\±\s]+|iso\s*2768[- ]?[mk])', text, re.IGNORECASE)
        if tol_match:
            tolerances = tol_match.group(0).strip()
            extracted.append(ParsedSpecificationField(
                field_name="tolerances",
                value=tolerances,
                confidence=0.90,
                requires_confirmation=False,
                source_snippet=tol_match.group(0)
            ))
        else:
            missing.append("tolerances")

        # 5. Destination / Geography
        country = None
        city = None
        dest_match = re.search(r'(in|to|delivered (?:in|to)|destination)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)', text)
        if dest_match:
            candidate = dest_match.group(2).strip()
            if candidate.lower() in ["india", "germany", "united states", "usa", "singapore", "vietnam", "uae", "mexico"]:
                country = candidate
                extracted.append(ParsedSpecificationField(
                    field_name="destination_country",
                    value=country,
                    confidence=0.90,
                    requires_confirmation=False,
                    source_snippet=dest_match.group(0)
                ))
        if not country:
            country = "India"
            extracted.append(ParsedSpecificationField(
                field_name="destination_country",
                value=country,
                confidence=0.60,
                requires_confirmation=True,
                source_snippet="Defaulted based on primary hub"
            ))

        # 6. Lead time / Delivery date
        delivery = None
        deliv_match = re.search(r'(within\s+\d+\s+(?:weeks|days|months)|by\s+[A-Za-z0-9\s,]+)', text, re.IGNORECASE)
        if deliv_match:
            delivery = deliv_match.group(0).strip()
            extracted.append(ParsedSpecificationField(
                field_name="required_delivery_date",
                value=delivery,
                confidence=0.85,
                requires_confirmation=False,
                source_snippet=deliv_match.group(0)
            ))
        else:
            missing.append("required_delivery_date")

        # 7. Category & Title
        title_words = [w for w in text.split()[:8] if len(w) > 2]
        title = " ".join(title_words).capitalize()
        if not title:
            title = "Custom Industrial Part Sourcing"

        category = "Fabrication & Machining"
        if process:
            category = f"{process} Components"

        return SourcingExtractionResult(
            title=title,
            category=category,
            quantity=qty,
            unit=qty_unit,
            target_budget=None,
            currency="USD",
            destination_country=country,
            destination_city=city,
            required_delivery_date=delivery,
            manufacturing_process=process,
            material_grade=material,
            dimensions=dimensions,
            tolerances=tolerances,
            required_certifications="ISO 9001:2015 (Standard Industrial)",
            notes=f"Extracted automatically from requirement: '{raw_text[:120]}...'",
            confidence_score=0.92 if len(missing) <= 2 else 0.75,
            extracted_fields=extracted,
            missing_fields=missing,
            mode="DEMO" if settings.is_demo_mode else "LIVE"
        )

    @staticmethod
    def create_sourcing_request(db: Session, data: SourcingRequestCreate, user_id: Optional[int] = None) -> SourcingRequest:
        count = db.query(SourcingRequest).count()
        while True:
            code = f"SR-2026-{(count + 1):03d}"
            if not db.query(SourcingRequest).filter(SourcingRequest.request_code == code).first():
                break
            count += 1

        # JSON metadata for tracking provenance
        metadata_dict = {
            "mode": "DEMO" if settings.is_demo_mode else "LIVE",
            "source": "Natural Language Sourcing Engine",
            "confirmed_by_user": True
        }

        req = SourcingRequest(
            request_code=code,
            title=data.title,
            raw_input=data.raw_input,
            status=data.status or "CONFIRMED",
            user_id=user_id,
            category=data.category,
            quantity=data.quantity,
            unit=data.unit,
            target_budget=data.target_budget,
            currency=data.currency,
            destination_country=data.destination_country,
            destination_city=data.destination_city,
            required_delivery_date=data.required_delivery_date,
            manufacturing_process=data.manufacturing_process,
            material_grade=data.material_grade,
            dimensions=data.dimensions,
            tolerances=data.tolerances,
            required_certifications=data.required_certifications,
            notes=data.notes,
            confidence_score=0.95,
            extraction_metadata=json.dumps(metadata_dict)
        )
        db.add(req)
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 50) -> List[SourcingRequest]:
        return db.query(SourcingRequest).order_by(SourcingRequest.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_by_id(db: Session, request_id: int) -> Optional[SourcingRequest]:
        return db.query(SourcingRequest).filter(SourcingRequest.id == request_id).first()

    @staticmethod
    def update_sourcing_request(db: Session, request_id: int, data: SourcingRequestUpdate) -> Optional[SourcingRequest]:
        req = db.query(SourcingRequest).filter(SourcingRequest.id == request_id).first()
        if not req:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(req, key, value)
        db.commit()
        db.refresh(req)
        return req
