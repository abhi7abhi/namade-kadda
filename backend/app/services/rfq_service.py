import datetime
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.rfq import RFQ, RFQSupplier
from app.models.sourcing import SourcingRequest
from app.schemas.rfq import RFQCreate, RFQUpdate


class RFQService:

    @staticmethod
    def create_rfq(db: Session, data: RFQCreate) -> RFQ:
        count = db.query(RFQ).count()
        while True:
            rfq_code = f"RFQ-2026-{(count + 1):03d}"
            if not db.query(RFQ).filter(RFQ.rfq_code == rfq_code).first():
                break
            count += 1

        rfq = RFQ(
            rfq_code=rfq_code,
            sourcing_request_id=data.sourcing_request_id,
            title=data.title,
            status="ISSUED",
            deadline_date=data.deadline_date or (datetime.datetime.utcnow() + datetime.timedelta(days=14)),
            terms=data.terms or "Standard B2B Commercial Terms - Delivery DDP",
            notes=data.notes
        )
        db.add(rfq)
        db.flush()

        # Auto-match suppliers if none explicitly provided
        supplier_ids_to_invite = list(data.supplier_ids)
        if not supplier_ids_to_invite:
            from app.models.supplier import Supplier
            # Find up to 3 suppliers
            matched = db.query(Supplier).limit(3).all()
            supplier_ids_to_invite = [s.id for s in matched]

        from app.models.notification import Notification

        for supplier_id in supplier_ids_to_invite:
            link = RFQSupplier(
                rfq_id=rfq.id,
                supplier_id=supplier_id,
                status="INVITED"
            )
            db.add(link)

            # Create in-app notification for the invited supplier
            notif = Notification(
                supplier_id=supplier_id,
                title=f"New RFQ Opportunity: {rfq.title}",
                message=f"You have received a new buyer request ({rfq.rfq_code}) matching your manufacturing capabilities.",
                type="RFQ",
                link_url=f"/supplier/rfqs/{rfq.id}",
                is_read=False
            )
            db.add(notif)

        # Update sourcing request status
        sourcing_req = db.query(SourcingRequest).filter(SourcingRequest.id == data.sourcing_request_id).first()
        if sourcing_req:
            sourcing_req.status = "RFQ_ISSUED"

        db.commit()
        db.refresh(rfq)
        return rfq

    @staticmethod
    def get_by_id(db: Session, rfq_id: int) -> Optional[RFQ]:
        return db.query(RFQ).options(
            joinedload(RFQ.sourcing_request),
            joinedload(RFQ.supplier_invitations).joinedload(RFQSupplier.supplier),
            joinedload(RFQ.quotations)
        ).filter(RFQ.id == rfq_id).first()

    @staticmethod
    def list_rfqs(db: Session, skip: int = 0, limit: int = 50) -> List[RFQ]:
        return db.query(RFQ).options(
            joinedload(RFQ.sourcing_request),
            joinedload(RFQ.supplier_invitations).joinedload(RFQSupplier.supplier),
            joinedload(RFQ.quotations)
        ).order_by(RFQ.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def update_rfq(db: Session, rfq_id: int, data: RFQUpdate) -> Optional[RFQ]:
        rfq = db.query(RFQ).filter(RFQ.id == rfq_id).first()
        if not rfq:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(rfq, key, value)
        db.commit()
        db.refresh(rfq)
        return rfq
