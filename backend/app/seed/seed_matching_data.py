import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.supplier import Supplier, CatalogItem
from app.models.sourcing import SourcingRequest
from app.models.rfq import RFQ, RFQSupplier
from app.models.quotation import Quotation, QuotationItem


def seed_matching_and_buyer_data(db: Session):
    """
    Seeds comprehensive buyer RFQs, multi-country quotations, and active sourcing
    requirements to power Relevant Buyers, Relevant Suppliers, and Price Comparison analytics.
    """
    # 1. Fetch Key Users
    buyer_user = db.query(User).filter(User.email.in_(["buyer@industrial-corp.com", "buyer@namadekadda.demo"])).first()
    if not buyer_user:
        buyer_user = db.query(User).filter(User.role == "BUYER").first()

    siemens_user = db.query(User).filter(User.email == "markus.becker@siemens-mobility.demo").first()
    kuka_user = db.query(User).filter(User.email == "hannah.richter@kuka-robotics.demo").first()
    nordic_user = db.query(User).filter(User.email == "lars.lindqvist@nordic-wind.demo").first()
    atlas_user = db.query(User).filter(User.email == "sven.nygard@atlascopco.demo").first()
    emirates_user = db.query(User).filter(User.email == "tariq.mansoor@emirates-heavy.demo").first()
    tokyo_user = db.query(User).filter(User.email == "kenji.sato@tokyo-electron.demo").first()

    # 2. Fetch Suppliers
    s1 = db.query(Supplier).filter(Supplier.slug == "apex-precision-engineering").first()
    s2 = db.query(Supplier).filter(Supplier.slug == "bharat-forgetech-solutions").first()
    s3 = db.query(Supplier).filter(Supplier.slug == "rhineland-machining-gmbh").first()
    s4 = db.query(Supplier).filter(Supplier.slug == "shenzhen-precision-metalworks-ltd").first()
    s5 = db.query(Supplier).filter(Supplier.slug == "tokyo-sensor-robotics-instruments-co").first()
    s6 = db.query(Supplier).filter(Supplier.slug == "midwest-hydraulic-valves-systems-inc").first()
    s8 = db.query(Supplier).filter(Supplier.slug == "apex-microelectronics-foundry-ltd").first()
    s9 = db.query(Supplier).filter(Supplier.slug == "voltmax-energy-systems-corp").first()
    s11 = db.query(Supplier).filter(Supplier.slug == "samsung-electro-mechanics-device-solutions").first()

    # 3. Define Sourcing Requirements & RFQs across categories
    requirements = [
        {
            "code": "SR-2026-101",
            "rfq_code": "RFQ-2026-101",
            "user": siemens_user or buyer_user,
            "title": "Industrial High-RPM Spindle Ball Bearings ABEC-5",
            "category": "Bearings & Motion",
            "qty": 1200,
            "unit": "pieces",
            "budget": 46000.0,
            "currency": "USD",
            "country": "Germany",
            "city": "Munich",
            "material": "Chrome Steel 100Cr6",
            "specs": "Bore 25mm, Outer Dia 52mm, Width 15mm, Sub-micron runout, C3 clearance",
            "certs": "ISO 9001:2015, DIN 625-1",
            "target_supplier_ids": [s3.id if s3 else 3, s4.id if s4 else 4, s1.id if s1 else 1]
        },
        {
            "code": "SR-2026-102",
            "rfq_code": "RFQ-2026-102",
            "user": kuka_user or buyer_user,
            "title": "5-Axis CNC Machined Aluminium Robotic Arm Chassis",
            "category": "CNC Machining",
            "qty": 450,
            "unit": "pieces",
            "budget": 11500.0,
            "currency": "USD",
            "country": "Germany",
            "city": "Augsburg",
            "material": "Aluminium 6061-T6",
            "specs": "Tolerance ISO 2768-f (±0.05mm), Type II Matte Black Anodizing Ra 0.8um",
            "certs": "ISO 9001:2015, AS9100D",
            "target_supplier_ids": [s4.id if s4 else 4, s1.id if s1 else 1, s3.id if s3 else 3]
        },
        {
            "code": "SR-2026-103",
            "rfq_code": "RFQ-2026-103",
            "user": nordic_user or buyer_user,
            "title": "M18 Industrial Inductive Proximity Sensors IO-Link",
            "category": "Industrial Sensors",
            "qty": 800,
            "unit": "pieces",
            "budget": 64000.0,
            "currency": "USD",
            "country": "Denmark",
            "city": "Aarhus",
            "material": "Stainless Steel 316L / PBT",
            "specs": "8mm Flush Sensing Range, PNP/NPN Selectable, IP68 Waterproof",
            "certs": "CE Mark, RoHS, ISO 9001:2015",
            "target_supplier_ids": [s5.id if s5 else 5, s8.id if s8 else 8]
        },
        {
            "code": "SR-2026-104",
            "rfq_code": "RFQ-2026-104",
            "user": atlas_user or buyer_user,
            "title": "Electrically Actuated Hydraulic Spool Directional Valves 350 Bar",
            "category": "Hydraulics & Valves",
            "qty": 300,
            "unit": "pieces",
            "budget": 45000.0,
            "currency": "USD",
            "country": "Sweden",
            "city": "Stockholm",
            "material": "Ductile Iron & Hardened Chrome Plated Steel Spool",
            "specs": "350 bar continuous pressure, 24V DC solenoids, ISO 4401 subplate mounting",
            "certs": "ISO 9001:2015, Mill Test Certificate",
            "target_supplier_ids": [s6.id if s6 else 6, s1.id if s1 else 1]
        },
        {
            "code": "SR-2026-105",
            "rfq_code": "RFQ-2026-105",
            "user": emirates_user or buyer_user,
            "title": "Industrial Lithium-Ion Battery Storage Modules 48V 100Ah",
            "category": "Energy Storage & Batteries",
            "qty": 150,
            "unit": "modules",
            "budget": 75000.0,
            "currency": "USD",
            "country": "UAE",
            "city": "Dubai",
            "material": "LiFePO4 Lithium Iron Phosphate Prismatic Cells",
            "specs": "48V 100Ah, CANbus 2.0B / RS485 Smart BMS, 4000 cycles at 80% DoD",
            "certs": "UN 38.3, IEC 62619, CE",
            "target_supplier_ids": [s9.id if s9 else 9, s8.id if s8 else 8]
        },
        {
            "code": "SR-2026-106",
            "rfq_code": "RFQ-2026-106",
            "user": buyer_user,
            "title": "AMOLED LTPO 120Hz Flexible Touch Screen Display Modules",
            "category": "Displays & Optoelectronics",
            "qty": 2500,
            "unit": "pieces",
            "budget": 125000.0,
            "currency": "USD",
            "country": "India",
            "city": "Bangalore",
            "material": "Flexible OLED with Corning Gorilla Glass Victus 2",
            "specs": "6.7-inch, 1.5K 2712x1220 resolution, 2600 nits peak brightness, MIPI DSI interface",
            "certs": "RoHS, ISO 9001:2015",
            "target_supplier_ids": [s11.id if s11 else 11, s8.id if s8 else 8]
        }
    ]

    for req in requirements:
        existing_rfq = db.query(RFQ).filter(RFQ.rfq_code == req["rfq_code"]).first()
        if not existing_rfq:
            # Create SourcingRequest
            sr = SourcingRequest(
                request_code=req["code"],
                title=req["title"],
                raw_input=f"Sourcing requirement for {req['qty']} {req['unit']} of {req['title']}. Specifications: {req['specs']}.",
                status="RFQ_ISSUED",
                user_id=req["user"].id if req["user"] else 1,
                category=req["category"],
                quantity=req["qty"],
                unit=req["unit"],
                target_budget=req["budget"],
                currency=req["currency"],
                destination_country=req["country"],
                destination_city=req["city"],
                required_delivery_date="Within 4 weeks",
                manufacturing_process="Precision CNC / Automated Line",
                material_grade=req["material"],
                tolerances="ISO Standard",
                required_certifications=req["certs"],
                notes="Active verified commercial sourcing project."
            )
            db.add(sr)
            db.flush()

            # Create RFQ
            rfq = RFQ(
                rfq_code=req["rfq_code"],
                sourcing_request_id=sr.id,
                title=f"RFQ: {req['title']}",
                status="ISSUED",
                issue_date=datetime.utcnow() - timedelta(days=3),
                deadline_date=datetime.utcnow() + timedelta(days=14),
                terms="Standard DDP Commercial Terms - 100% Quality Assurance",
                notes="Quotations requested with unit pricing, lead time, and material compliance certificates."
            )
            db.add(rfq)
            db.flush()

            # Create supplier invitations
            for sid in req["target_supplier_ids"]:
                if sid:
                    inv = RFQSupplier(
                        rfq_id=rfq.id,
                        supplier_id=sid,
                        status="INVITED"
                    )
                    db.add(inv)

    db.commit()

    # 4. Ensure multi-country quotations exist for "Stainless-Steel Mounting Brackets" & "Industrial Ball Bearings"
    rfq1 = db.query(RFQ).filter(RFQ.rfq_code == "RFQ-2026-001").first()
    if rfq1:
        # Add German quotation from Rhineland Machining (s3) if not present
        if s3:
            q_de = db.query(Quotation).filter(Quotation.rfq_id == rfq1.id, Quotation.supplier_id == s3.id).first()
            if not q_de:
                q_de = Quotation(
                    quote_code="QT-2026-0003",
                    rfq_id=rfq1.id,
                    supplier_id=s3.id,
                    total_amount=9600.00,
                    currency="USD",
                    unit_price=19.20,
                    moq=100,
                    lead_time_days=16,
                    shipping_estimate=450.00,
                    payment_terms="Net 45, EXW Stuttgart",
                    validity_date=datetime.utcnow() + timedelta(days=45),
                    notes="Manufactured to German DIN standards. Electrolytic passivation and EN 10204 3.1 cert included.",
                    status="SUBMITTED",
                    comparison_score=82.50
                )
                db.add(q_de)
                db.flush()
                qi_de = QuotationItem(
                    quotation_id=q_de.id,
                    item_name="Stainless-Steel Mounting Brackets",
                    description="Laser Cut & Passivated DIN-grade",
                    quantity=500,
                    unit_price=19.20,
                    total_price=9600.00,
                    lead_time_days=16
                )
                db.add(qi_de)

        # Add Chinese quotation from Shenzhen Precision (s4) if not present
        if s4:
            q_cn = db.query(Quotation).filter(Quotation.rfq_id == rfq1.id, Quotation.supplier_id == s4.id).first()
            if not q_cn:
                q_cn = Quotation(
                    quote_code="QT-2026-0004",
                    rfq_id=rfq1.id,
                    supplier_id=s4.id,
                    total_amount=6750.00,
                    currency="USD",
                    unit_price=13.50,
                    moq=200,
                    lead_time_days=14,
                    shipping_estimate=320.00,
                    payment_terms="Net 30, FOB Shenzhen",
                    validity_date=datetime.utcnow() + timedelta(days=30),
                    notes="High-volume CNC laser fabrication with automated deburring.",
                    status="SUBMITTED",
                    comparison_score=91.00
                )
                db.add(q_cn)
                db.flush()
                qi_cn = QuotationItem(
                    quotation_id=q_cn.id,
                    item_name="Stainless-Steel Mounting Brackets",
                    description="Fiber Laser Cut 4mm SS 304",
                    quantity=500,
                    unit_price=13.50,
                    total_price=6750.00,
                    lead_time_days=14
                )
                db.add(qi_cn)

    # Quotations for RFQ-2026-101 (Ball Bearings)
    rfq101 = db.query(RFQ).filter(RFQ.rfq_code == "RFQ-2026-101").first()
    if rfq101 and s3:
        q_bb1 = db.query(Quotation).filter(Quotation.rfq_id == rfq101.id, Quotation.supplier_id == s3.id).first()
        if not q_bb1:
            q_bb1 = Quotation(
                quote_code="QT-2026-0101",
                rfq_id=rfq101.id,
                supplier_id=s3.id,
                total_amount=46200.00,
                currency="USD",
                unit_price=38.50,
                moq=50,
                lead_time_days=14,
                shipping_estimate=600.00,
                payment_terms="Net 30",
                validity_date=datetime.utcnow() + timedelta(days=45),
                notes="High precision ABEC-5 spindle bearings from Stuttgart manufacturing plant.",
                status="SUBMITTED",
                comparison_score=96.00
            )
            db.add(q_bb1)
            db.flush()
            qi_bb1 = QuotationItem(
                quotation_id=q_bb1.id,
                item_name="Industrial Ball Bearings",
                description="Chrome Steel 100Cr6 ABEC-5 P5",
                quantity=1200,
                unit_price=38.50,
                total_price=46200.00,
                lead_time_days=14
            )
            db.add(qi_bb1)

    db.commit()
    print("Seeded matching requirements and multi-country quotations successfully.")
