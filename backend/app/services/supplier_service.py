from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_
from app.models.supplier import Supplier, SupplierCapability, CatalogItem
from app.schemas.supplier import SupplierCreate


class SupplierService:

    @staticmethod
    def list_suppliers(
        db: Session,
        search: Optional[str] = None,
        country: Optional[str] = None,
        category: Optional[str] = None,
        max_moq: Optional[int] = None,
        max_lead_time: Optional[int] = None,
        page: int = 1,
        size: int = 12
    ) -> Tuple[List[Supplier], int]:
        query = db.query(Supplier).options(
            joinedload(Supplier.capabilities),
            joinedload(Supplier.catalog_items)
        )

        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Supplier.name.ilike(term),
                    Supplier.description.ilike(term),
                    Supplier.city.ilike(term),
                    Supplier.country.ilike(term)
                )
            )

        if country:
            query = query.filter(Supplier.country.ilike(f"%{country.strip()}%"))

        if max_moq is not None and max_moq > 0:
            query = query.filter(Supplier.moq <= max_moq)

        if max_lead_time is not None and max_lead_time > 0:
            query = query.filter(Supplier.lead_time_days <= max_lead_time)

        if category:
            cat_term = f"%{category.strip()}%"
            query = query.join(Supplier.capabilities).filter(
                or_(
                    SupplierCapability.category.ilike(cat_term),
                    SupplierCapability.process_type.ilike(cat_term),
                    SupplierCapability.materials.ilike(cat_term)
                )
            ).distinct()

        total = query.count()
        offset = (page - 1) * size
        items = query.order_by(Supplier.rating.desc(), Supplier.id.asc()).offset(offset).limit(size).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, supplier_id: int) -> Optional[Supplier]:
        return db.query(Supplier).options(
            joinedload(Supplier.capabilities),
            joinedload(Supplier.catalog_items)
        ).filter(Supplier.id == supplier_id).first()

    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Optional[Supplier]:
        return db.query(Supplier).options(
            joinedload(Supplier.capabilities),
            joinedload(Supplier.catalog_items)
        ).filter(Supplier.slug == slug).first()

    @staticmethod
    def create_supplier(db: Session, data: SupplierCreate) -> Supplier:
        supplier = Supplier(**data.model_dump())
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier
