from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.trade_service import TradeService
from app.schemas.trade import TradeEstimateRequest, TradeEstimateResponse
from app.models.trade import TradeAssessment
import json

router = APIRouter(prefix="/trade", tags=["Trade & Compliance"])


@router.post("/estimate", response_model=TradeEstimateResponse)
def estimate_customs_and_taxes(req: TradeEstimateRequest, db: Session = Depends(get_db)):
    """Calculate landed cost, import duties, and compliance checklist."""
    return TradeService.calculate_trade_estimate(db, req)


@router.post("/pdf")
def generate_trade_pdf_report(req: TradeEstimateRequest, db: Session = Depends(get_db)):
    """Calculate landed cost and stream a downloadable ReportLab PDF report."""
    estimate = TradeService.calculate_trade_estimate(db, req)
    pdf_bytes = TradeService.generate_trade_pdf(estimate)
    report_filename = f"Namade_Kadda_Trade_Report_NK{estimate.id or 1:04d}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{report_filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get("/{assessment_id}/pdf")
def get_existing_trade_pdf_report(assessment_id: int, db: Session = Depends(get_db)):
    """Download PDF for an existing trade assessment record."""
    record = db.query(TradeAssessment).filter(TradeAssessment.id == assessment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Trade assessment record not found")

    checklist = []
    if record.compliance_checklist:
        try:
            checklist = json.loads(record.compliance_checklist)
        except Exception:
            checklist = []

    estimate = TradeEstimateResponse(
        id=record.id,
        origin_country=record.origin_country,
        destination_country=record.destination_country,
        product_description=record.product_description,
        declared_value=float(record.declared_value),
        currency=record.currency,
        hs_code_candidate=record.hs_code_candidate or "7326.90.99",
        estimated_duty_rate_percent=float(record.estimated_duty_rate),
        estimated_tax_rate_percent=float(record.estimated_tax_rate),
        cif_value=float(record.declared_value) + float(record.freight_insurance_estimate or 0),
        duty_estimate=float(record.duty_estimate),
        tax_estimate=float(record.tax_estimate),
        total_landed_estimate=float(record.total_landed_estimate),
        compliance_checklist=checklist,
        source_basis=record.source_basis or "Customs Tariff Schedule 2026",
        disclaimer=record.disclaimer or "ESTIMATE — NOT A CUSTOMS OR LEGAL DETERMINATION",
        created_at=record.created_at
    )

    pdf_bytes = TradeService.generate_trade_pdf(estimate)
    report_filename = f"Namade_Kadda_Trade_Report_NK{record.id:04d}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{report_filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
