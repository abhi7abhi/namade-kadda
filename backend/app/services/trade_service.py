import io
import json
import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable
)

from app.models.trade import TradeAssessment
from app.schemas.trade import TradeEstimateRequest, TradeEstimateResponse, TradeDocumentRequirement


class TradeService:

    @staticmethod
    def calculate_trade_estimate(db: Session, req: TradeEstimateRequest) -> TradeEstimateResponse:
        cif_value = req.declared_value + req.freight_insurance_estimate

        # Candidate HS code heuristic for industrial parts
        desc_lower = req.product_description.lower()
        if "steel" in desc_lower or "bracket" in desc_lower or "metal" in desc_lower:
            hs_code = "7326.90.99"  # Other articles of iron or steel
            duty_rate = 7.50
            tax_rate = 18.00
            source_basis = "Indian Customs Tariff Schedule 2026 (Chapter 73, General BCD + IGST)"
        elif "aluminum" in desc_lower or "aluminium" in desc_lower:
            hs_code = "7616.99.90"  # Other articles of aluminum
            duty_rate = 7.50
            tax_rate = 18.00
            source_basis = "Indian Customs Tariff Schedule 2026 (Chapter 76)"
        elif "circuit" in desc_lower or "electronic" in desc_lower or "pcb" in desc_lower:
            hs_code = "8534.00.00"  # Printed circuits
            duty_rate = 0.00
            tax_rate = 18.00
            source_basis = "Information Technology Agreement (ITA-1) Concessional Schedule"
        elif "sensor" in desc_lower or "optical" in desc_lower or "inductive" in desc_lower:
            hs_code = "9031.80.00"  # Measuring and checking instruments
            duty_rate = 7.50
            tax_rate = 18.00
            source_basis = "Indian Customs Tariff Schedule 2026 (Chapter 90)"
        elif "valve" in desc_lower or "hydraulic" in desc_lower:
            hs_code = "8481.20.00"  # Valves for oleohydraulic or pneumatic transmissions
            duty_rate = 7.50
            tax_rate = 18.00
            source_basis = "Indian Customs Tariff Schedule 2026 (Chapter 84)"
        elif "bearing" in desc_lower:
            hs_code = "8482.10.00"  # Ball bearings
            duty_rate = 7.50
            tax_rate = 18.00
            source_basis = "Indian Customs Tariff Schedule 2026 (Chapter 84)"
        elif "copper" in desc_lower:
            hs_code = "7409.11.00"  # Refined copper plates, sheets, strip
            duty_rate = 5.00
            tax_rate = 18.00
            source_basis = "Indian Customs Tariff Schedule 2026 (Chapter 74)"
        else:
            hs_code = "8487.90.00"  # Machinery parts not containing electrical connectors
            duty_rate = 7.50
            tax_rate = 18.00
            source_basis = "General Industrial Machinery Schedule 2026"

        duty_amount = round(cif_value * (duty_rate / 100.0), 2)
        # Social Welfare Surcharge (SWS): 10% on BCD
        sws_amount = round(duty_amount * 0.10, 2)
        # Taxable base for IGST = CIF + Duty + SWS
        igst_base = cif_value + duty_amount + sws_amount
        tax_amount = round(igst_base * (tax_rate / 100.0), 2)
        total_landed = round(cif_value + duty_amount + sws_amount + tax_amount, 2)

        qty = req.quantity or 500.0
        unit_p = req.unit_price or round(req.declared_value / qty, 2)
        cost_per_unit = round(total_landed / qty, 2)

        checklist = [
            TradeDocumentRequirement(
                document_name="Commercial Invoice (CI)",
                purpose="Defines transaction value, incoterms (FOB/CIF/DDP), and buyer/seller tax IDs",
                issuing_authority="Supplier / Exporter",
                mandatory=True
            ),
            TradeDocumentRequirement(
                document_name="Packing List (PL)",
                purpose="Specifies net and gross weights, package count, and container marks",
                issuing_authority="Supplier / Exporter",
                mandatory=True
            ),
            TradeDocumentRequirement(
                document_name="Bill of Lading (B/L) or Air Waybill (AWB)",
                purpose="Contract of carriage and receipt of freight handover",
                issuing_authority="Freight Forwarder / Carrier",
                mandatory=True
            ),
            TradeDocumentRequirement(
                document_name="Certificate of Origin (COO)",
                purpose="Verifies country of manufacture; essential for preferential duty rates",
                issuing_authority="Chamber of Commerce / Designated Trade Authority",
                mandatory=True
            ),
            TradeDocumentRequirement(
                document_name="Material Test Report (MTR / Mill Cert EN 10204 3.1)",
                purpose="Chemical and mechanical composition verification for industrial metal grades",
                issuing_authority="Accredited Testing Laboratory or Mill",
                mandatory=True
            ),
            TradeDocumentRequirement(
                document_name="Import-Export Code (IEC) & GSTIN Registration",
                purpose="Required for customs filing on ICEGATE (Indian Customs Portal)",
                issuing_authority="Directorate General of Foreign Trade (DGFT) / GST Council",
                mandatory=True
            )
        ]

        disclaimer_text = (
            "ESTIMATE — NOT A CUSTOMS OR LEGAL DETERMINATION. "
            "Applicable Basic Customs Duty, IGST, cess, valuation rules, and port handling depend on "
            "official classification at the port of entry and current national regulations. "
            "Independent verification with a licensed customs broker is strictly required."
        )

        # Persist to database
        record = TradeAssessment(
            sourcing_request_id=req.sourcing_request_id,
            origin_country=req.origin_country,
            destination_country=req.destination_country,
            product_description=req.product_description,
            declared_value=req.declared_value,
            currency=req.currency,
            hs_code_candidate=hs_code,
            estimated_duty_rate=duty_rate,
            estimated_tax_rate=tax_rate,
            freight_insurance_estimate=req.freight_insurance_estimate,
            duty_estimate=duty_amount + sws_amount,
            tax_estimate=tax_amount,
            total_landed_estimate=total_landed,
            compliance_checklist=json.dumps([c.model_dump() for c in checklist]),
            disclaimer=disclaimer_text,
            source_basis=source_basis
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return TradeEstimateResponse(
            id=record.id,
            origin_country=req.origin_country,
            destination_country=req.destination_country,
            product_description=req.product_description,
            declared_value=req.declared_value,
            quantity=qty,
            unit_price=unit_p,
            cost_per_unit=cost_per_unit,
            currency=req.currency,
            hs_code_candidate=hs_code,
            estimated_duty_rate_percent=duty_rate,
            estimated_tax_rate_percent=tax_rate,
            cif_value=cif_value,
            duty_estimate=round(duty_amount + sws_amount, 2),
            tax_estimate=tax_amount,
            total_landed_estimate=total_landed,
            compliance_checklist=checklist,
            source_basis=source_basis,
            supplier_name=req.supplier_name or "Global Industrial Supplier",
            disclaimer=disclaimer_text,
            is_simulated_estimate=True,
            created_at=record.created_at
        )

    @staticmethod
    def generate_trade_pdf(estimate: TradeEstimateResponse) -> bytes:
        """Generate a downloadable, high-fidelity PDF trade cost assessment report."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        # Custom Typography Styles
        brand_title_style = ParagraphStyle(
            "BrandTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0f172a")
        )
        brand_sub_style = ParagraphStyle(
            "BrandSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#059669")
        )
        h2_style = ParagraphStyle(
            "Heading2Custom",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#1e293b")
        )
        body_style = ParagraphStyle(
            "BodyCustom",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#334155")
        )
        label_style = ParagraphStyle(
            "LabelCustom",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#64748b")
        )
        val_bold_style = ParagraphStyle(
            "ValBoldCustom",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#0f172a")
        )
        disclaimer_style = ParagraphStyle(
            "DisclaimerCustom",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#b45309")
        )

        story = []

        # 1. Header Banner Table
        report_id_str = f"NK-TC-2026-{estimate.id:04d}" if estimate.id else "NK-TC-2026-DEMO"
        gen_date = estimate.created_at.strftime("%d %b %Y, %H:%M UTC") if estimate.created_at else datetime.datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")

        header_data = [
            [
                Paragraph("<b>NAMADE KADDA</b>", brand_title_style),
                Paragraph(f"<b>REPORT ID:</b> {report_id_str}<br/><b>DATE:</b> {gen_date}", body_style)
            ],
            [
                Paragraph("GLOBAL B2B SOURCING & TRADE COST ESTIMATOR", brand_sub_style),
                Paragraph("<b>STATUS:</b> ADVISORY SIMULATION", label_style)
            ]
        ]
        header_table = Table(header_data, colWidths=[360, 180])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#059669"), spaceBefore=0, spaceAfter=14))

        # 2. Executive Overview (Product & Corridor)
        qty = estimate.quantity or 500.0
        unit_p = estimate.unit_price or (estimate.declared_value / qty)
        cost_unit = estimate.cost_per_unit or (estimate.total_landed_estimate / qty)

        overview_data = [
            [
                Paragraph("PRODUCT DESCRIPTION", label_style),
                Paragraph("SUPPLIER & CORRIDOR", label_style),
                Paragraph("COMMERCIAL BASIS", label_style)
            ],
            [
                Paragraph(f"<b>{estimate.product_description}</b>", val_bold_style),
                Paragraph(f"<b>{estimate.supplier_name or 'Industrial Partner'}</b><br/>{estimate.origin_country} &rarr; {estimate.destination_country}", body_style),
                Paragraph(f"Quantity: <b>{int(qty)} units</b><br/>Unit Price: <b>${unit_p:.2f} {estimate.currency}</b><br/>Incoterms: <b>CIF Basis</b>", body_style)
            ]
        ]
        overview_table = Table(overview_data, colWidths=[200, 180, 160])
        overview_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(overview_table)
        story.append(Spacer(1, 14))

        # 3. Itemized Landed Cost Calculation Matrix
        story.append(Paragraph("Itemized Landed Cost & Customs Calculation", h2_style))
        story.append(Spacer(1, 6))

        cif = estimate.cif_value
        freight_ins = cif - estimate.declared_value
        duty_pct = estimate.estimated_duty_rate_percent
        bcd_amt = round(cif * (duty_pct / 100.0), 2)
        sws_amt = round(bcd_amt * 0.10, 2)
        igst_amt = estimate.tax_estimate
        total_landed = estimate.total_landed_estimate

        cost_rows = [
            [Paragraph("Cost Component", label_style), Paragraph("Calculation Basis / Statutory Rule", label_style), Paragraph("Amount (USD)", label_style)],
            [Paragraph("1. Declared Goods Value (FOB)", body_style), Paragraph(f"{int(qty)} units @ ${unit_p:.2f} / unit", body_style), Paragraph(f"${estimate.declared_value:,.2f}", val_bold_style)],
            [Paragraph("2. International Freight & Marine Insurance", body_style), Paragraph("Standard freight forwarding estimate", body_style), Paragraph(f"${freight_ins:,.2f}", val_bold_style)],
            [Paragraph("<b>Subtotal: Customs Valuation Base (CIF)</b>", val_bold_style), Paragraph("FOB Value + Freight + Insurance", body_style), Paragraph(f"<b>${cif:,.2f}</b>", val_bold_style)],
            [Paragraph(f"3. Basic Customs Duty (BCD - {duty_pct:.1f}%)", body_style), Paragraph(f"HS Code: {estimate.hs_code_candidate} (Advisory)", body_style), Paragraph(f"${bcd_amt:,.2f}", val_bold_style)],
            [Paragraph("4. Social Welfare Surcharge (SWS - 10%)", body_style), Paragraph("10% on Basic Customs Duty (Finance Act)", body_style), Paragraph(f"${sws_amt:,.2f}", val_bold_style)],
            [Paragraph(f"5. Integrated GST (IGST - {estimate.estimated_tax_rate_percent:.1f}%)", body_style), Paragraph(f"Assessed on (CIF + BCD + SWS)", body_style), Paragraph(f"${igst_amt:,.2f}", val_bold_style)],
            [Paragraph("<b>TOTAL ESTIMATED LANDED COST</b>", ParagraphStyle("BigTotal", parent=val_bold_style, textColor=colors.HexColor("#059669"))), Paragraph(f"<b>Landed Unit Cost: ${cost_unit:.2f} / unit</b>", body_style), Paragraph(f"<b>${total_landed:,.2f}</b>", ParagraphStyle("BigTotalVal", parent=val_bold_style, textColor=colors.HexColor("#059669")))]
        ]

        cost_table = Table(cost_rows, colWidths=[200, 210, 130])
        cost_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("BACKGROUND", (0, 3), (-1, 3), colors.HexColor("#f8fafc")),
            ("BACKGROUND", (0, 7), (-1, 7), colors.HexColor("#ecfdf5")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ]))
        story.append(cost_table)
        story.append(Spacer(1, 14))

        # 4. Mandatory Regulatory Documents Checklist
        story.append(Paragraph("Required Customs Clearance & Compliance Documentation", h2_style))
        story.append(Spacer(1, 6))

        doc_rows = [
            [Paragraph("Document Name", label_style), Paragraph("Purpose & Regulatory Significance", label_style), Paragraph("Issuing Authority", label_style), Paragraph("Status", label_style)]
        ]
        for d in estimate.compliance_checklist:
            doc_rows.append([
                Paragraph(f"<b>{d.document_name}</b>", body_style),
                Paragraph(d.purpose, body_style),
                Paragraph(d.issuing_authority, body_style),
                Paragraph("<font color='#059669'>MANDATORY</font>" if d.mandatory else "Optional", label_style)
            ])

        doc_table = Table(doc_rows, colWidths=[140, 210, 130, 60])
        doc_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(doc_table)
        story.append(Spacer(1, 14))

        # 5. Regulatory Disclaimer & Legal Box
        disclaimer_rows = [
            [Paragraph("<b>STATUTORY DISCLAIMER & ADVISORY NOTICE:</b>", ParagraphStyle("DiscTitle", parent=label_style, textColor=colors.HexColor("#b45309")))],
            [Paragraph(
                f"{estimate.disclaimer} "
                f"Source Schedule: <i>{estimate.source_basis}</i>. "
                "Candidate HS code classifications are machine-assisted approximations and do not constitute official customs binding rulings. "
                "Consult a licensed customs broker before executing commercial letter of credit or bill of entry filings.",
                disclaimer_style
            )]
        ]
        disc_table = Table(disclaimer_rows, colWidths=[540])
        disc_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#fde68a")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(KeepTogether(disc_table))

        doc.build(story)
        return buffer.getvalue()
