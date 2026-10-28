import json
import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload
from app.models.quotation import Quotation, QuotationItem
from app.models.supplier import Supplier
from app.models.rfq import RFQ
from app.schemas.quotation import (
    QuotationCreate,
    QuotationComparisonWeights,
    QuotationComparisonItem,
    QuotationComparisonResponse,
    QuotationAcceptRequest,
    QuotationRejectRequest
)


class QuotationService:

    @staticmethod
    def create_quotation(db: Session, data: QuotationCreate) -> Quotation:
        count = db.query(Quotation).count()
        while True:
            code = f"QT-2026-{(count + 1):04d}"
            if not db.query(Quotation).filter(Quotation.quote_code == code).first():
                break
            count += 1

        # Check missing fields
        missing = []
        if data.shipping_estimate <= 0:
            missing.append("shipping_estimate_breakdown")
        if not data.validity_date:
            missing.append("validity_expiration_date")
        if not data.notes:
            missing.append("material_test_certification_reference")

        quote = Quotation(
            quote_code=code,
            rfq_id=data.rfq_id,
            supplier_id=data.supplier_id,
            total_amount=data.total_amount,
            currency=data.currency,
            unit_price=data.unit_price,
            moq=data.moq,
            lead_time_days=data.lead_time_days,
            shipping_estimate=data.shipping_estimate,
            payment_terms=data.payment_terms,
            validity_date=data.validity_date or (datetime.datetime.utcnow() + datetime.timedelta(days=30)),
            notes=data.notes,
            status="SUBMITTED",
            missing_fields=json.dumps(missing)
        )
        db.add(quote)
        db.flush()

        for item_in in data.items:
            q_item = QuotationItem(
                quotation_id=quote.id,
                item_name=item_in.item_name,
                description=item_in.description,
                quantity=item_in.quantity,
                unit_price=item_in.unit_price,
                total_price=item_in.total_price,
                lead_time_days=item_in.lead_time_days
            )
            db.add(q_item)

        # Update RFQSupplier link status to QUOTED
        from app.models.rfq import RFQSupplier
        link = db.query(RFQSupplier).filter(
            RFQSupplier.rfq_id == data.rfq_id,
            RFQSupplier.supplier_id == data.supplier_id
        ).first()
        if link:
            link.status = "QUOTED"
            link.responded_at = datetime.datetime.utcnow()
        else:
            link = RFQSupplier(
                rfq_id=data.rfq_id,
                supplier_id=data.supplier_id,
                status="QUOTED",
                responded_at=datetime.datetime.utcnow()
            )
            db.add(link)

        db.commit()
        db.refresh(quote)
        return quote

    @staticmethod
    def compare_quotations(
        db: Session,
        rfq_id: int,
        weights: QuotationComparisonWeights
    ) -> QuotationComparisonResponse:
        quotes = db.query(Quotation).options(
            joinedload(Quotation.supplier),
            joinedload(Quotation.items)
        ).filter(Quotation.rfq_id == rfq_id).all()

        if not quotes:
            return QuotationComparisonResponse(
                rfq_id=rfq_id,
                quotations=[],
                weights_applied=weights,
                transparency_explanation="No quotations received yet for this RFQ."
            )

        # Find minimum price and minimum lead time for normalization
        min_price = min(float(q.total_amount) for q in quotes if float(q.total_amount) > 0) or 1.0
        min_lead = min(int(q.lead_time_days) for q in quotes if int(q.lead_time_days) > 0) or 1

        comparison_items: List[QuotationComparisonItem] = []

        for q in quotes:
            price_val = float(q.total_amount)
            lead_val = int(q.lead_time_days)
            rating_val = float(q.supplier.rating) if (q.supplier and q.supplier.rating) else 4.0

            # Normalized component scores (0 to 100)
            price_score = (min_price / max(price_val, 0.01)) * 100.0
            lead_score = (min_lead / max(lead_val, 1)) * 100.0
            rel_score = (rating_val / 5.0) * 100.0

            # Weighted sum
            final_score = (
                price_score * weights.price_weight +
                lead_score * weights.lead_time_weight +
                rel_score * weights.reliability_weight
            )

            # Update quotation in database with recalculated score
            q.comparison_score = round(final_score, 2)
            breakdown = {
                "price_score": round(price_score, 1),
                "price_weight": weights.price_weight,
                "lead_score": round(lead_score, 1),
                "lead_weight": weights.lead_time_weight,
                "reliability_score": round(rel_score, 1),
                "reliability_weight": weights.reliability_weight,
                "calculated_at": datetime.datetime.utcnow().isoformat()
            }
            q.score_breakdown = json.dumps(breakdown)

            missing = []
            if q.missing_fields:
                try:
                    missing = json.loads(q.missing_fields)
                except Exception:
                    pass

            recommendation_note = ""
            if price_val == min_price:
                recommendation_note = "Lowest Total Quoted Price"
            elif lead_val == min_lead:
                recommendation_note = "Fastest Delivery Schedule"
            elif rating_val >= 4.8:
                recommendation_note = "Highest Supplier Track Record"
            else:
                recommendation_note = "Competitive Balanced Offer"

            comparison_items.append(QuotationComparisonItem(
                quotation_id=q.id,
                quote_code=q.quote_code,
                supplier_name=q.supplier.name if q.supplier else "Unknown Supplier",
                supplier_country=q.supplier.country if q.supplier else "N/A",
                total_amount=price_val,
                unit_price=float(q.unit_price),
                lead_time_days=lead_val,
                moq=q.moq,
                shipping_estimate=float(q.shipping_estimate),
                payment_terms=q.payment_terms,
                comparison_score=round(final_score, 2),
                rank=0,  # assigned after sorting
                missing_fields=missing,
                score_details=breakdown,
                recommendation_note=recommendation_note
            ))

        db.commit()

        # Sort by comparison score descending
        comparison_items.sort(key=lambda x: x.comparison_score, reverse=True)
        for idx, item in enumerate(comparison_items, start=1):
            item.rank = idx

        explanation = (
            f"Comparison model applied: Price ({int(weights.price_weight*100)}%), "
            f"Lead Time ({int(weights.lead_time_weight*100)}%), "
            f"Supplier Reliability ({int(weights.reliability_weight*100)}%). "
            "Scores are normalized against the current offer set and provide an indicative decision aid."
        )

        return QuotationComparisonResponse(
            rfq_id=rfq_id,
            quotations=comparison_items,
            weights_applied=weights,
            transparency_explanation=explanation
        )

    @staticmethod
    def accept_quotation(
        db: Session,
        quotation_id: int,
        req: QuotationAcceptRequest
    ) -> Quotation:
        quote = db.query(Quotation).options(
            joinedload(Quotation.supplier),
            joinedload(Quotation.items),
            joinedload(Quotation.rfq)
        ).filter(Quotation.id == quotation_id).first()

        if not quote:
            raise ValueError(f"Quotation {quotation_id} not found")

        quote.status = "ACCEPTED"
        quote.acceptance_reason = req.acceptance_reason

        # Reject competing quotes for the same RFQ
        competing = db.query(Quotation).filter(
            Quotation.rfq_id == quote.rfq_id,
            Quotation.id != quote.id
        ).all()
        for c in competing:
            if c.status != "REJECTED":
                c.status = "REJECTED"
                c.rejection_reason = "Alternative supplier quotation selected during procurement review."

        # Send in-app notification to the winning supplier
        from app.models.notification import Notification
        notif = Notification(
            supplier_id=quote.supplier_id,
            title=f"Quotation Accepted! ({quote.quote_code})",
            message=f"Your quotation for {quote.rfq.title if quote.rfq else 'RFQ'} has been accepted by the buyer. Check Orders & Fulfilment.",
            type="ORDER",
            link_url="/supplier/orders",
            is_read=False
        )
        db.add(notif)

        db.commit()
        db.refresh(quote)
        return quote

    @staticmethod
    def reject_quotation(
        db: Session,
        quotation_id: int,
        req: QuotationRejectRequest
    ) -> Quotation:
        quote = db.query(Quotation).filter(Quotation.id == quotation_id).first()
        if not quote:
            raise ValueError(f"Quotation {quotation_id} not found")

        quote.status = "REJECTED"
        quote.rejection_reason = req.rejection_reason
        db.commit()
        db.refresh(quote)
        return quote
