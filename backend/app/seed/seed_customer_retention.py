"""
Seed realistic historical customer orders, buyer companies, and purchase activity
for the Namade Kadda Seller Workspace Customer Insights & Retention feature.
"""
import datetime
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.supplier import Supplier, CatalogItem
from app.models.sourcing import SourcingRequest
from app.models.rfq import RFQ, RFQSupplier
from app.models.quotation import Quotation, QuotationItem
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.core.security import get_password_hash


def seed_customer_retention_data(db: Session, s1_id: int = 1):
    """Seed comprehensive multi-buyer historical order records for customer retention analytics."""
    s1 = db.query(Supplier).filter(Supplier.id == s1_id).first()
    if not s1:
        return

    # Check if retention orders are already seeded
    existing_siemens = db.query(User).filter(User.email == "markus.becker@siemens-mobility.demo").first()
    if existing_siemens:
        existing_orders = db.query(Order).filter(Order.supplier_id == s1.id).count()
        if existing_orders >= 12:
            # Already seeded
            return

    now = datetime.datetime.utcnow()

    # 1. Ensure catalog items exist for supplier s1
    catalog_specs = [
        ("CNC Machined Flange Adapter SS 316", "CNC Machining", 24.50, "SS-FLANGE-316", 50, 14),
        ("Titanium Precision Arm Bracket", "Precision Robotics", 41.50, "TI-ROBOT-BRK-01", 100, 21),
        ("Heavy Duty Planetary Gear Carrier", "Renewable Energy", 145.00, "WIND-GEAR-CARR-HD", 25, 28),
        ("Cast Iron Impeller Housings", "Industrial Pumps & Valves", 47.50, "CAST-IMP-HSG-400", 50, 18),
        ("High Pressure Stainless Flanges", "Oil & Gas Equipment", 70.00, "HP-SS-FLG-600", 30, 20),
        ("Stainless Steel Bushings", "CNC Machining", 16.60, "SS-BUSH-2024", 200, 10),
        ("Precision Valve Spools", "Hydraulics & Valves", 38.00, "VALV-SPOOL-HYD", 50, 16),
        ("Aluminum Electronics Housing", "Electronics Enclosures", 28.50, "ALU-ELEC-ENC-2U", 100, 14),
    ]

    for name, cat, price, sku, moq, lead in catalog_specs:
        item = db.query(CatalogItem).filter(CatalogItem.supplier_id == s1.id, CatalogItem.name == name).first()
        if not item:
            item = CatalogItem(
                supplier_id=s1.id,
                name=name,
                part_number=sku,
                sku=sku,
                category=cat,
                description=f"High-precision {name.lower()} engineered for demanding industrial and export standards.",
                unit_price=price,
                currency="USD",
                moq=moq,
                lead_time_days=lead,
                material="Certified Industrial Alloy",
                origin_country="India",
                available_quantity=5000,
                status="PUBLISHED",
                in_stock=True
            )
            db.add(item)
    db.flush()

    # 2. Buyer Companies & Users
    buyer_definitions = [
        {
            "email": "markus.becker@siemens-mobility.demo",
            "name": "Markus Becker",
            "company": "Siemens Mobility AG",
            "country": "Germany",
            "category": "Rail & Transit Systems",
            "phone": "+49 89 636 00",
            # INACTIVE CUSTOMER: 3 historical orders, elapsed 115 days (> 3x 36d interval)
            "orders": [
                {
                    "code": "PO-HIST-071",
                    "days_ago": 115,
                    "status": "DELIVERED",
                    "total": 34500.00,
                    "items": [("CNC Machined Flange Adapter SS 316", 1500, 23.00, 34500.00)]
                },
                {
                    "code": "PO-HIST-055",
                    "days_ago": 152,
                    "status": "DELIVERED",
                    "total": 22800.00,
                    "items": [("Aluminum Electronics Housing", 800, 28.50, 22800.00)]
                },
                {
                    "code": "PO-HIST-039",
                    "days_ago": 188,
                    "status": "DELIVERED",
                    "total": 31200.00,
                    "items": [("CNC Machined Flange Adapter SS 316", 1200, 26.00, 31200.00)]
                }
            ]
        },
        {
            "email": "hannah.richter@kuka-robotics.demo",
            "name": "Hannah Richter",
            "company": "KUKA Robotics GmbH",
            "country": "Germany",
            "category": "Industrial Automation & Robotics",
            "phone": "+49 821 797 0",
            # AT-RISK CUSTOMER: 3 orders, historical interval 40d, elapsed 62d ago (> 1.5x interval)
            "orders": [
                {
                    "code": "PO-HIST-012",
                    "days_ago": 62,
                    "status": "DELIVERED",
                    "total": 18600.00,
                    "items": [("Titanium Precision Arm Bracket", 450, 41.33, 18600.00)]
                },
                {
                    "code": "PO-HIST-088",
                    "days_ago": 104,
                    "status": "DELIVERED",
                    "total": 19400.00,
                    "items": [("Titanium Precision Arm Bracket", 470, 41.28, 19400.00)]
                },
                {
                    "code": "PO-HIST-062",
                    "days_ago": 142,
                    "status": "DELIVERED",
                    "total": 16500.00,
                    "items": [("Titanium Precision Arm Bracket", 400, 41.25, 16500.00)]
                }
            ]
        },
        {
            "email": "lars.lindqvist@nordic-wind.demo",
            "name": "Lars Lindqvist",
            "company": "Nordic Wind Energy Systems",
            "country": "Denmark",
            "category": "Renewable Energy Turbines",
            "phone": "+45 97 30 00 00",
            # REGULAR CUSTOMER: 4 completed orders, recent order 18 days ago (~32d interval)
            "orders": [
                {
                    "code": "PO-HIST-019",
                    "days_ago": 18,
                    "status": "SHIPPED",
                    "total": 28900.00,
                    "items": [("Heavy Duty Planetary Gear Carrier", 200, 144.50, 28900.00)]
                },
                {
                    "code": "PO-HIST-014",
                    "days_ago": 49,
                    "status": "DELIVERED",
                    "total": 26400.00,
                    "items": [("Heavy Duty Planetary Gear Carrier", 180, 146.67, 26400.00)]
                },
                {
                    "code": "PO-HIST-095",
                    "days_ago": 81,
                    "status": "DELIVERED",
                    "total": 27500.00,
                    "items": [("Heavy Duty Planetary Gear Carrier", 190, 144.74, 27500.00)]
                },
                {
                    "code": "PO-HIST-078",
                    "days_ago": 114,
                    "status": "DELIVERED",
                    "total": 24000.00,
                    "items": [("Heavy Duty Planetary Gear Carrier", 170, 141.18, 24000.00)]
                }
            ]
        },
        {
            "email": "sven.nygard@atlascopco.demo",
            "name": "Sven Nygard",
            "company": "Atlas Copco Industrial",
            "country": "Sweden",
            "category": "Industrial Compressors & Pneumatics",
            "phone": "+46 8 743 8000",
            # INACTIVE CUSTOMER: 2 orders, elapsed 185 days
            "orders": [
                {
                    "code": "PO-HIST-042",
                    "days_ago": 185,
                    "status": "DELIVERED",
                    "total": 14200.00,
                    "items": [("Cast Iron Impeller Housings", 300, 47.33, 14200.00)]
                },
                {
                    "code": "PO-HIST-018",
                    "days_ago": 240,
                    "status": "DELIVERED",
                    "total": 13800.00,
                    "items": [("Cast Iron Impeller Housings", 290, 47.59, 13800.00)]
                }
            ]
        },
        {
            "email": "tariq.mansoor@emirates-heavy.demo",
            "name": "Tariq Al-Mansoor",
            "company": "Emirates Heavy Industries LLC",
            "country": "UAE",
            "category": "Oil & Gas Equipment",
            "phone": "+971 4 330 0000",
            # INACTIVE CUSTOMER WITH 1 COMPLETED + 1 CANCELLED ORDER (Tests cancelled order exclusion)
            "orders": [
                {
                    "code": "PO-HIST-050",
                    "days_ago": 145,
                    "status": "DELIVERED",
                    "total": 42000.00,
                    "items": [("High Pressure Stainless Flanges", 600, 70.00, 42000.00)]
                },
                {
                    "code": "PO-HIST-025",
                    "days_ago": 30,
                    "status": "CANCELLED",
                    "total": 38000.00,
                    "items": [("High Pressure Stainless Flanges", 550, 69.09, 38000.00)]
                }
            ]
        },
        {
            "email": "kenji.sato@tokyo-electron.demo",
            "name": "Kenji Sato",
            "company": "Tokyo Electron Equipment Co.",
            "country": "Japan",
            "category": "Semiconductor Fabrication Tools",
            "phone": "+81 3 5561 7000",
            # PROSPECT / UNCLASSIFIED: 0 completed orders (only RFQ/Sourcing Request inquiry)
            "orders": []
        }
    ]

    # Additional orders for existing Apex Dynamics (Buyer Rajesh Sharma)
    apex_buyer = db.query(User).filter(User.email == "buyer@namadekadda.demo").first()
    if apex_buyer:
        additional_apex_orders = [
            {
                "code": "PO-HIST-008",
                "days_ago": 42,
                "status": "DELIVERED",
                "total": 8300.00,
                "items": [("Stainless Steel Bushings", 500, 16.60, 8300.00)]
            },
            {
                "code": "PO-HIST-005",
                "days_ago": 74,
                "status": "DELIVERED",
                "total": 15200.00,
                "items": [("Precision Valve Spools", 400, 38.00, 15200.00)]
            }
        ]
        for ord_data in additional_apex_orders:
            exist = db.query(Order).filter(Order.order_code == ord_data["code"]).first()
            if not exist:
                order_dt = now - datetime.timedelta(days=ord_data["days_ago"])
                # Create SourcingRequest
                sr_code = f"SR-{ord_data['code'].replace('PO-', '')}"
                sr = SourcingRequest(
                    request_code=sr_code,
                    title=f"Procurement for {ord_data['items'][0][0]}",
                    raw_input=f"Batch procurement order for {ord_data['items'][0][0]}",
                    status="COMPLETED",
                    user_id=apex_buyer.id,
                    category="CNC Machining",
                    quantity=ord_data["items"][0][1],
                    currency="USD",
                    destination_country=apex_buyer.country or "India",
                    created_at=order_dt - datetime.timedelta(days=7),
                    updated_at=order_dt
                )
                db.add(sr)
                db.flush()

                # RFQ
                rfq = RFQ(
                    rfq_code=f"RFQ-{ord_data['code'].replace('PO-', '')}",
                    sourcing_request_id=sr.id,
                    title=sr.title,
                    status="CLOSED",
                    issue_date=order_dt - datetime.timedelta(days=5),
                    deadline_date=order_dt - datetime.timedelta(days=1),
                    created_at=order_dt - datetime.timedelta(days=5)
                )
                db.add(rfq)
                db.flush()

                # Quotation
                q = Quotation(
                    quote_code=f"QT-{ord_data['code'].replace('PO-', '')}",
                    rfq_id=rfq.id,
                    supplier_id=s1.id,
                    total_amount=ord_data["total"],
                    currency="USD",
                    unit_price=ord_data["items"][0][2],
                    moq=100,
                    status="ACCEPTED",
                    created_at=order_dt - datetime.timedelta(days=3)
                )
                db.add(q)
                db.flush()

                po = Order(
                    order_code=ord_data["code"],
                    sourcing_request_id=sr.id,
                    quotation_id=q.id,
                    supplier_id=s1.id,
                    total_amount=ord_data["total"],
                    currency="USD",
                    status=ord_data["status"],
                    expected_delivery_date=order_dt + datetime.timedelta(days=14),
                    shipping_address="Apex Dynamics Hub, Bangalore, India",
                    tracking_number=f"SIM-TRK-{ord_data['days_ago']}9921",
                    notes="Completed commercial order.",
                    created_at=order_dt,
                    updated_at=order_dt
                )
                db.add(po)
                db.flush()

                for it_name, qty, u_price, tot in ord_data["items"]:
                    item_row = OrderItem(
                        order_id=po.id,
                        item_name=it_name,
                        quantity=qty,
                        unit_price=u_price,
                        total_price=tot
                    )
                    db.add(item_row)

                hist = OrderStatusHistory(
                    order_id=po.id,
                    previous_status="SHIPPED",
                    new_status=ord_data["status"],
                    changed_by="Carrier Delivery Notification",
                    notes="Consignment verified and delivered.",
                    created_at=order_dt + datetime.timedelta(days=10)
                )
                db.add(hist)

    # Process all other defined buyers
    for b_def in buyer_definitions:
        user = db.query(User).filter(User.email == b_def["email"]).first()
        if not user:
            user = User(
                email=b_def["email"],
                hashed_password=get_password_hash("NmkBuyer@2026"),
                full_name=b_def["name"],
                role="BUYER",
                company_name=b_def["company"],
                country=b_def["country"],
                business_category=b_def["category"],
                contact_phone=b_def["phone"],
                is_active=True,
                verification_status="ACTIVE"
            )
            db.add(user)
            db.flush()

        # If prospect with 0 orders, add an open Sourcing Request & RFQ link
        if not b_def["orders"]:
            existing_sr = db.query(SourcingRequest).filter(SourcingRequest.user_id == user.id).first()
            if not existing_sr:
                sr = SourcingRequest(
                    request_code="SR-2026-099",
                    title="Inquiry: Precision Ceramic & Aluminum Vacuum Chucks",
                    raw_input="Need RFQ for cleanroom grade precision chucks 300mm diameter.",
                    status="RFQ_ISSUED",
                    user_id=user.id,
                    category="Semiconductor",
                    quantity=50,
                    currency="USD",
                    destination_country=b_def["country"],
                    created_at=now - datetime.timedelta(days=12),
                    updated_at=now - datetime.timedelta(days=12)
                )
                db.add(sr)
                db.flush()

                rfq = RFQ(
                    rfq_code="RFQ-2026-099",
                    sourcing_request_id=sr.id,
                    title=sr.title,
                    status="ISSUED",
                    issue_date=now - datetime.timedelta(days=12),
                    created_at=now - datetime.timedelta(days=12)
                )
                db.add(rfq)
                db.flush()

                link = RFQSupplier(
                    rfq_id=rfq.id,
                    supplier_id=s1.id,
                    status="INVITED",
                    invited_at=now - datetime.timedelta(days=12)
                )
                db.add(link)
            continue

        # Create orders for this buyer
        for ord_data in b_def["orders"]:
            exist = db.query(Order).filter(Order.order_code == ord_data["code"]).first()
            if not exist:
                order_dt = now - datetime.timedelta(days=ord_data["days_ago"])
                sr_code = f"SR-{ord_data['code'].replace('PO-', '')}"
                sr = SourcingRequest(
                    request_code=sr_code,
                    title=f"Industrial Requirement: {ord_data['items'][0][0]}",
                    raw_input=f"Standard commercial order specifications for {b_def['company']}.",
                    status="COMPLETED" if ord_data["status"] != "CANCELLED" else "CANCELLED",
                    user_id=user.id,
                    category=b_def["category"],
                    quantity=ord_data["items"][0][1],
                    currency="USD",
                    destination_country=b_def["country"],
                    created_at=order_dt - datetime.timedelta(days=8),
                    updated_at=order_dt
                )
                db.add(sr)
                db.flush()

                rfq = RFQ(
                    rfq_code=f"RFQ-{ord_data['code'].replace('PO-', '')}",
                    sourcing_request_id=sr.id,
                    title=sr.title,
                    status="CLOSED",
                    issue_date=order_dt - datetime.timedelta(days=6),
                    deadline_date=order_dt - datetime.timedelta(days=2),
                    created_at=order_dt - datetime.timedelta(days=6)
                )
                db.add(rfq)
                db.flush()

                q = Quotation(
                    quote_code=f"QT-{ord_data['code'].replace('PO-', '')}",
                    rfq_id=rfq.id,
                    supplier_id=s1.id,
                    total_amount=ord_data["total"],
                    currency="USD",
                    unit_price=ord_data["items"][0][2],
                    moq=50,
                    status="ACCEPTED" if ord_data["status"] != "CANCELLED" else "REJECTED",
                    created_at=order_dt - datetime.timedelta(days=4)
                )
                db.add(q)
                db.flush()

                po = Order(
                    order_code=ord_data["code"],
                    sourcing_request_id=sr.id,
                    quotation_id=q.id,
                    supplier_id=s1.id,
                    total_amount=ord_data["total"],
                    currency="USD",
                    status=ord_data["status"],
                    expected_delivery_date=order_dt + datetime.timedelta(days=21),
                    shipping_address=f"{b_def['company']} Inbound Logistics Center, {b_def['country']}",
                    tracking_number=f"EXP-TRK-{ord_data['days_ago']}8832",
                    notes=f"Order fulfilled for {b_def['company']} under master industrial supply agreement.",
                    created_at=order_dt,
                    updated_at=order_dt
                )
                db.add(po)
                db.flush()

                for it_name, qty, u_price, tot in ord_data["items"]:
                    item_row = OrderItem(
                        order_id=po.id,
                        item_name=it_name,
                        quantity=qty,
                        unit_price=u_price,
                        total_price=tot
                    )
                    db.add(item_row)

                hist = OrderStatusHistory(
                    order_id=po.id,
                    previous_status="CONFIRMED" if ord_data["status"] == "CANCELLED" else "SHIPPED",
                    new_status=ord_data["status"],
                    changed_by="Supply Chain Operations",
                    notes="Order cancelled by mutual agreement" if ord_data["status"] == "CANCELLED" else "Delivered to factory receiving bay.",
                    created_at=order_dt + datetime.timedelta(days=12)
                )
                db.add(hist)

    db.commit()
    print("Successfully seeded customer retention historical datasets!")
