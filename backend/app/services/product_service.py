import math
from typing import Optional, Tuple, List, Dict, Any
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_, desc, asc

from app.models.supplier import CatalogItem, Supplier
from app.schemas.product import ProductCreate, ProductOut, ProductSupplierInfo


class ProductService:

    @staticmethod
    def list_products(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        origin_country: Optional[str] = None,
        supplier_country: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        max_moq: Optional[int] = None,
        max_lead_time: Optional[int] = None,
        manufacturing_capability: Optional[str] = None,
        sort_by: Optional[str] = "price_asc",
        page: int = 1,
        size: int = 12
    ) -> Tuple[List[ProductOut], int, Dict[str, Any]]:
        query = db.query(CatalogItem).join(Supplier).options(joinedload(CatalogItem.supplier))

        # Enforce marketplace access rules: Buyers only see PUBLISHED products
        query = query.filter(or_(CatalogItem.status == "PUBLISHED", CatalogItem.status == None))

        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    CatalogItem.name.ilike(term),
                    CatalogItem.description.ilike(term),
                    CatalogItem.part_number.ilike(term),
                    CatalogItem.sku.ilike(term),
                    CatalogItem.material.ilike(term),
                    CatalogItem.category.ilike(term),
                    CatalogItem.subcategory.ilike(term),
                    Supplier.name.ilike(term),
                    Supplier.country.ilike(term)
                )
            )

        if category and category != "All":
            query = query.filter(CatalogItem.category.ilike(f"%{category.strip()}%"))

        if origin_country and origin_country != "All":
            query = query.filter(CatalogItem.origin_country.ilike(f"%{origin_country.strip()}%"))

        if supplier_country and supplier_country != "All":
            query = query.filter(Supplier.country.ilike(f"%{supplier_country.strip()}%"))

        if min_price is not None:
            query = query.filter(CatalogItem.unit_price >= min_price)

        if max_price is not None:
            query = query.filter(CatalogItem.unit_price <= max_price)

        if max_moq is not None:
            query = query.filter(CatalogItem.moq <= max_moq)

        if max_lead_time is not None:
            query = query.filter(CatalogItem.lead_time_days <= max_lead_time)

        if manufacturing_capability and manufacturing_capability != "All":
            query = query.filter(CatalogItem.manufacturing_capability.ilike(f"%{manufacturing_capability.strip()}%"))

        # Aggregations for filter dropdowns
        all_categories = [c[0] for c in db.query(CatalogItem.category).distinct().filter(CatalogItem.category != None).all()]
        all_countries = [c[0] for c in db.query(CatalogItem.origin_country).distinct().filter(CatalogItem.origin_country != None).all()]
        price_stats = db.query(func.min(CatalogItem.unit_price), func.max(CatalogItem.unit_price)).first()
        min_p = float(price_stats[0] or 0.0) if price_stats else 0.0
        max_p = float(price_stats[1] or 1000.0) if price_stats else 1000.0

        total = query.count()

        # Sorting
        if sort_by == "price_desc":
            query = query.order_by(desc(CatalogItem.unit_price))
        elif sort_by == "lead_time_asc":
            query = query.order_by(asc(CatalogItem.lead_time_days))
        elif sort_by == "name_asc":
            query = query.order_by(asc(CatalogItem.name))
        else:  # default price_asc
            query = query.order_by(asc(CatalogItem.unit_price))

        offset = (page - 1) * size
        db_items = query.offset(offset).limit(size).all()

        results: List[ProductOut] = []
        for item in db_items:
            supp_info = None
            if item.supplier:
                supp_info = ProductSupplierInfo(
                    id=item.supplier.id,
                    name=item.supplier.name,
                    country=item.supplier.country,
                    city=item.supplier.city,
                    verification_status=item.supplier.verification_status,
                    is_verified=item.supplier.is_verified,
                    rating=float(item.supplier.rating or 4.5),
                    price_rating=item.supplier.price_rating or "$$"
                )
            
            p_out = ProductOut(
                id=item.id,
                supplier_id=item.supplier_id,
                name=item.name,
                part_number=item.part_number,
                sku=getattr(item, "sku", None) or item.part_number,
                category=item.category,
                subcategory=getattr(item, "subcategory", None),
                description=item.description,
                unit_price=float(item.unit_price),
                currency=item.currency,
                moq=item.moq,
                lead_time_days=item.lead_time_days,
                material=item.material,
                material_grade=getattr(item, "material_grade", None) or item.material,
                dimensions=getattr(item, "dimensions", None),
                weight=getattr(item, "weight", None),
                manufacturing_process=getattr(item, "manufacturing_process", None) or item.manufacturing_capability,
                specifications=item.specifications,
                origin_country=item.origin_country,
                available_quantity=item.available_quantity,
                image_url=item.image_url,
                manufacturing_capability=item.manufacturing_capability,
                in_stock=item.in_stock,
                customization_options=getattr(item, "customization_options", None),
                certifications=getattr(item, "certifications", None),
                shipping_options=getattr(item, "shipping_options", None) or "Air Cargo, Ocean Freight",
                supported_destinations=getattr(item, "supported_destinations", None) or "Global, United States, Germany, India, UAE, Japan",
                unit_of_measurement=getattr(item, "unit_of_measurement", "pieces") or "pieces",
                production_capacity=getattr(item, "production_capacity", None) or "10,000 units / month",
                stock_status=getattr(item, "stock_status", "IN_STOCK") or "IN_STOCK",
                datasheet_url=getattr(item, "datasheet_url", None),
                technical_specifications=getattr(item, "technical_specifications", None) or item.specifications,
                status=getattr(item, "status", "PUBLISHED") or "PUBLISHED",
                created_at=item.created_at,
                supplier=supp_info,
                is_demo_data=True
            )
            results.append(p_out)

        meta = {
            "categories": sorted(list(set(all_categories))),
            "countries": sorted(list(set(all_countries))),
            "min_price": min_p,
            "max_price": max_p
        }
        return results, total, meta

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Optional[ProductOut]:
        item = db.query(CatalogItem).filter(CatalogItem.id == product_id).options(joinedload(CatalogItem.supplier)).first()
        if not item:
            return None

        supp_info = None
        if item.supplier:
            supp_info = ProductSupplierInfo(
                id=item.supplier.id,
                name=item.supplier.name,
                country=item.supplier.country,
                city=item.supplier.city,
                verification_status=item.supplier.verification_status,
                is_verified=item.supplier.is_verified,
                rating=float(item.supplier.rating or 4.5),
                price_rating=item.supplier.price_rating or "$$"
            )

        return ProductOut(
            id=item.id,
            supplier_id=item.supplier_id,
            name=item.name,
            part_number=item.part_number,
            sku=getattr(item, "sku", None) or item.part_number,
            category=item.category,
            subcategory=getattr(item, "subcategory", None),
            description=item.description,
            unit_price=float(item.unit_price),
            currency=item.currency,
            moq=item.moq,
            lead_time_days=item.lead_time_days,
            material=item.material,
            material_grade=getattr(item, "material_grade", None) or item.material,
            dimensions=getattr(item, "dimensions", None),
            weight=getattr(item, "weight", None),
            manufacturing_process=getattr(item, "manufacturing_process", None) or item.manufacturing_capability,
            specifications=item.specifications,
            origin_country=item.origin_country,
            available_quantity=item.available_quantity,
            image_url=item.image_url,
            manufacturing_capability=item.manufacturing_capability,
            in_stock=item.in_stock,
            customization_options=getattr(item, "customization_options", None),
            certifications=getattr(item, "certifications", None),
            shipping_options=getattr(item, "shipping_options", None) or "Air Cargo, Ocean Freight",
            supported_destinations=getattr(item, "supported_destinations", None) or "Global, United States, Germany, India, UAE, Japan",
            unit_of_measurement=getattr(item, "unit_of_measurement", "pieces") or "pieces",
            production_capacity=getattr(item, "production_capacity", None) or "10,000 units / month",
            stock_status=getattr(item, "stock_status", "IN_STOCK") or "IN_STOCK",
            datasheet_url=getattr(item, "datasheet_url", None),
            technical_specifications=getattr(item, "technical_specifications", None) or item.specifications,
            status=getattr(item, "status", "PUBLISHED") or "PUBLISHED",
            created_at=item.created_at,
            supplier=supp_info,
            is_demo_data=True
        )

    @staticmethod
    def create_product(db: Session, data: ProductCreate) -> ProductOut:
        item = CatalogItem(
            supplier_id=data.supplier_id,
            name=data.name,
            part_number=data.part_number,
            category=data.category,
            description=data.description,
            unit_price=data.unit_price,
            currency=data.currency,
            moq=data.moq,
            lead_time_days=data.lead_time_days,
            material=data.material,
            specifications=data.specifications,
            origin_country=data.origin_country,
            available_quantity=data.available_quantity,
            image_url=data.image_url,
            manufacturing_capability=data.manufacturing_capability,
            in_stock=data.in_stock
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return ProductService.get_by_id(db, item.id)
