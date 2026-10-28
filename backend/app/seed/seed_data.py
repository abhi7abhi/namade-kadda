import json
import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, init_db
from app.models.user import User
from app.models.supplier import Supplier, SupplierCapability, CatalogItem
from app.models.sourcing import SourcingRequest
from app.models.rfq import RFQ, RFQSupplier
from app.models.quotation import Quotation, QuotationItem
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.bom import BOMProject, BOMItem
from app.models.agent import AgentRun, AgentRunEvent
from app.models.trade import TradeAssessment
from app.models.audit import AuditLog
from app.core.security import get_password_hash


def ensure_demo_users(db: Session, s1_id: int = 1):
    """Ensure the three required demonstration accounts exist with valid bcrypt passwords."""
    demo_accounts = [
        {
            "email": "buyer@namadekadda.demo",
            "password": "NmkBuyer@2026",
            "full_name": "Rajesh Sharma (Demo Buyer)",
            "role": "BUYER",
            "company_name": "Apex Dynamics Pvt Ltd",
            "country": "India",
            "business_category": "Automotive & Industrial Equipment",
            "supplier_id": None
        },
        {
            "email": "supplier@namadekadda.demo",
            "password": "NmkSupplier@2026",
            "full_name": "Vikram Patel (Demo Supplier)",
            "role": "SUPPLIER",
            "company_name": "Apex Precision Engineering",
            "country": "India",
            "business_category": "CNC Machining & Precision Fabrication",
            "supplier_id": s1_id
        },
        {
            "email": "admin@namadekadda.demo",
            "password": "NmkAdmin@2026",
            "full_name": "Priya Nair (System Admin)",
            "role": "ADMIN",
            "admin_id": "12345667",
            "company_name": "Namade Kadda Platform",
            "country": "India",
            "business_category": "Marketplace Operations",
            "supplier_id": None
        }
    ]

    for acc in demo_accounts:
        user = db.query(User).filter(User.email == acc["email"]).first()
        hashed = get_password_hash(acc["password"])
        if not user:
            new_user = User(
                email=acc["email"],
                hashed_password=hashed,
                full_name=acc["full_name"],
                role=acc["role"],
                admin_id=acc.get("admin_id"),
                company_name=acc["company_name"],
                country=acc["country"],
                business_category=acc["business_category"],
                supplier_id=acc["supplier_id"],
                is_active=True,
                verification_status="ACTIVE"
            )
            db.add(new_user)
            print(f"Created demo account: {acc['email']} ({acc['role']})")
        else:
            user.hashed_password = hashed
            user.role = acc["role"]
            user.admin_id = acc.get("admin_id")
            user.supplier_id = acc["supplier_id"]
            user.is_active = True
    db.commit()
    ensure_seller_demo_data(db, s1_id)


def ensure_seller_demo_data(db: Session, s1_id: int):
    """Seed comprehensive seller workspace demonstration datasets."""
    from app.models.notification import Notification
    from app.models.negotiation import NegotiationMessage
    from app.models.order import Order, OrderItem, OrderStatusHistory

    s1 = db.query(Supplier).filter(Supplier.id == s1_id).first()
    if s1:
        if not s1.legal_business_name:
            s1.legal_business_name = "Apex Precision Engineering Pvt. Ltd."
            s1.state_region = "Karnataka"
            s1.factory_location = "Plot 44, Peenya Industrial Area, Phase II, Bangalore"
            s1.export_countries = "United States, Germany, UAE, Singapore, Japan, United Kingdom"
            s1.languages_supported = "English, Hindi, Kannada, German"
            s1.production_capacity = "75,000 components / month"
            s1.materials_supported = "Stainless Steel 304/316L, Aluminum 6061-T6, Copper C11000, Brass, Titanium Gr 5"
            s1.certifications_documents = "ISO 9001:2015, AS9100D, IATF 16949"
            s1.business_registration_number = "U28910KA2014PTC074129"
            s1.verification_status = "VERIFIED"
            s1.verification_request_status = "APPROVED"
            s1.is_verified = True
            s1.profile_completeness = 95
            db.commit()

        # Ensure an active order exists for s1
        existing_order = db.query(Order).filter(Order.supplier_id == s1.id).first()
        if not existing_order:
            po2 = Order(
                order_code="PO-2026-002",
                sourcing_request_id=1,
                quotation_id=1,
                supplier_id=s1.id,
                total_amount=12450.00,
                currency="USD",
                status="IN_PRODUCTION",
                expected_delivery_date=datetime.datetime.utcnow() + datetime.timedelta(days=12),
                shipping_address="Boeing / Collins Aerospace Tier-1 Supply Hub, Bangalore, India",
                tracking_number="SIM-TRK-77192033",
                notes="PO approved. Precision milling batch running on 5-axis Mazak machining center."
            )
            db.add(po2)
            db.flush()
            poi = OrderItem(order_id=po2.id, item_name="CNC Machined Flange Adapter SS 316", quantity=750, unit_price=16.60, total_price=12450.00)
            h1 = OrderStatusHistory(order_id=po2.id, previous_status=None, new_status="CONFIRMED", changed_by="Procurement Pipeline", notes="Order approved from accepted quote.")
            h2 = OrderStatusHistory(order_id=po2.id, previous_status="CONFIRMED", new_status="IN_PRODUCTION", changed_by="Vikram Patel (Supplier Operations)", notes="Setup verified on 5-axis mill. Batch in production.")
            db.add_all([poi, h1, h2])
            db.commit()

        # Ensure negotiation messages exist for rfq 1 and s1
        existing_neg = db.query(NegotiationMessage).filter(NegotiationMessage.supplier_id == s1.id).first()
        if not existing_neg:
            neg1 = NegotiationMessage(
                rfq_id=1,
                quotation_id=1,
                supplier_id=s1.id,
                sender_role="BUYER",
                sender_name="Rajesh Sharma (Apex Dynamics)",
                message="Can you provide a volume discount if we expand the initial procurement order from 500 to 750 units?",
                proposed_price=14.90,
                proposed_lead_time_days=18,
                proposed_moq=750,
                proposed_payment_terms="Net 45",
                status="COUNTEROFFER"
            )
            neg2 = NegotiationMessage(
                rfq_id=1,
                quotation_id=1,
                supplier_id=s1.id,
                sender_role="SUPPLIER",
                sender_name="Vikram Patel (Apex Precision)",
                message="We can offer $14.85/unit for 750 units with 18 days lead time, subject to Net 30 payment terms and FOB port of dispatch.",
                proposed_price=14.85,
                proposed_lead_time_days=18,
                proposed_moq=750,
                proposed_payment_terms="Net 30, FOB",
                status="OPEN"
            )
            db.add_all([neg1, neg2])
            db.commit()

        # Ensure in-app notifications exist for s1
        existing_notif = db.query(Notification).filter(Notification.supplier_id == s1.id).first()
        if not existing_notif:
            n1 = Notification(
                supplier_id=s1.id,
                title="New RFQ Invitation: RFQ-2026-001",
                message="Buyer has invited Apex Precision Engineering to quote on 500 pcs SS 304 Mounting Brackets.",
                type="RFQ",
                link_url="/supplier/rfqs/1",
                is_read=False
            )
            n2 = Notification(
                supplier_id=s1.id,
                title="Counteroffer Received on RFQ-2026-001",
                message="Apex Dynamics proposed $14.90/unit for 750 units. Review in Negotiations Workspace.",
                type="NEGOTIATION",
                link_url="/supplier/negotiations",
                is_read=False
            )
            n3 = Notification(
                supplier_id=s1.id,
                title="Purchase Order PO-2026-002 Active",
                message="Binding purchase order confirmed. Current shop-floor stage: IN_PRODUCTION.",
                type="ORDER",
                link_url="/supplier/orders",
                is_read=True
            )
            db.add_all([n1, n2, n3])
            db.commit()

        # Seed customer retention and inactive customer intelligence orders
        from app.seed.seed_customer_retention import seed_customer_retention_data
        seed_customer_retention_data(db, s1_id)


def seed_database():
    init_db()
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        first_supplier = db.query(Supplier).first()
        if first_supplier:
            print("Database already contains data. Ensuring demo accounts...")
            ensure_demo_users(db, first_supplier.id)
            from app.seed.seed_component_intelligence import seed_component_intelligence
            seed_component_intelligence(db)
            from app.seed.seed_matching_data import seed_matching_and_buyer_data
            seed_matching_and_buyer_data(db)
            return

        print("Seeding synthetic demonstration data...")

        # 1. Users
        buyer = User(
            email="buyer@industrial-corp.com",
            hashed_password=get_password_hash("NmkBuyer@2026"),
            full_name="Rajesh Sharma",
            role="BUYER",
            company_name="Apex Dynamics Pvt Ltd"
        )
        supplier_user = User(
            email="sales@apexprecision.in",
            hashed_password=get_password_hash("NmkSupplier@2026"),
            full_name="Vikram Patel",
            role="SUPPLIER",
            company_name="Apex Precision Engineering"
        )
        admin = User(
            email="admin@namadekadda.internal",
            hashed_password=get_password_hash("NmkAdmin@2026"),
            full_name="Platform Admin",
            role="ADMIN",
            company_name="Namade Kadda Platform"
        )
        db.add_all([buyer, supplier_user, admin])
        db.flush()

        # 2. Suppliers
        s1 = Supplier(
            name="Apex Precision Engineering",
            slug="apex-precision-engineering",
            description="Specialized in 5-axis CNC machining, structural milling, and defense-grade precision assemblies.",
            country="India",
            city="Bangalore",
            address="Plot 44, Peenya Industrial Area, Phase II",
            website="https://apexprecision.demo.in",
            contact_email="sales@apexprecision.demo.in",
            phone="+91-80-2839-4411",
            moq=50,
            lead_time_days=18,
            price_rating="$$",
            is_verified=True,
            verification_status="SAMPLE_DATA",
            rating=4.8
        )
        s2 = Supplier(
            name="Bharat ForgeTech Solutions",
            slug="bharat-forgetech-solutions",
            description="Sheet metal stamping, CNC press brake forming, laser profiling, and welded sub-assemblies.",
            country="India",
            city="Pune",
            address="Bhosari Industrial Estate, Block S-12",
            website="https://bharatforgetech.demo.in",
            contact_email="rfq@bharatforgetech.demo.in",
            phone="+91-20-6711-2299",
            moq=100,
            lead_time_days=14,
            price_rating="$",
            is_verified=True,
            verification_status="SAMPLE_DATA",
            rating=4.6
        )
        s3 = Supplier(
            name="Rhineland Machining GmbH",
            slug="rhineland-machining-gmbh",
            description="German precision toolmaking, titanium turning, and high-tolerance industrial instrumentation.",
            country="Germany",
            city="Stuttgart",
            address="Industriestrasse 18, 70565 Stuttgart",
            website="https://rhineland-machining.demo.de",
            contact_email="kontakt@rhineland-machining.demo.de",
            phone="+49-711-8921-00",
            moq=25,
            lead_time_days=28,
            price_rating="$$$$",
            is_verified=True,
            verification_status="SAMPLE_DATA",
            rating=4.9
        )
        s4 = Supplier(
            name="Shenzhen Precision Metalworks Ltd",
            slug="shenzhen-precision-metalworks-ltd",
            description="High-volume aluminum die casting, automated CNC profiling, and rapid prototyping.",
            country="China",
            city="Shenzhen",
            address="Baoan Industrial Park, District 3, Building 4",
            website="https://shenzhen-metalworks.demo.cn",
            contact_email="export@shenzhen-metalworks.demo.cn",
            phone="+86-755-8833-2211",
            moq=200,
            lead_time_days=15,
            price_rating="$$",
            is_verified=True,
            verification_status="SAMPLE_DATA",
            rating=4.7
        )
        s5 = Supplier(
            name="Tokyo Sensor & Robotics Instruments Co",
            slug="tokyo-sensor-robotics-co",
            description="High-precision industrial optoelectronic, inductive proximity, and ultrasonic sensor assemblies.",
            country="Japan",
            city="Nagoya",
            address="Aichi High-Tech Corridor, Minato-ku 12-4",
            website="https://tokyo-sensor.demo.jp",
            contact_email="sales@tokyo-sensor.demo.jp",
            phone="+81-52-789-4400",
            moq=20,
            lead_time_days=10,
            price_rating="$$$",
            is_verified=True,
            verification_status="SAMPLE_DATA",
            rating=4.9
        )
        s6 = Supplier(
            name="Midwest Hydraulic Valves & Systems Inc",
            slug="midwest-hydraulic-valves-inc",
            description="Industrial directional control, pressure relief valves, and heavy equipment manifolds.",
            country="United States",
            city="Chicago",
            address="1420 S Western Ave, Chicago, IL 60608",
            website="https://midwest-hydraulics.demo.com",
            contact_email="rfq@midwest-hydraulics.demo.com",
            phone="+1-312-555-0199",
            moq=15,
            lead_time_days=21,
            price_rating="$$$",
            is_verified=True,
            verification_status="SAMPLE_DATA",
            rating=4.8
        )
        s7 = Supplier(
            name="Delta Industrial Castings",
            slug="delta-industrial-castings",
            description="Sand casting, investment casting, ductile iron housings, and valve components.",
            country="India",
            city="Coimbatore",
            address="Civil Aerodrome Post, SITRA Area",
            website="https://deltacasting.demo.in",
            contact_email="info@deltacasting.demo.in",
            phone="+91-422-257-3388",
            moq=150,
            lead_time_days=25,
            price_rating="$$",
            is_verified=False,
            verification_status="SAMPLE_DATA",
            rating=4.3
        )

        db.add_all([s1, s2, s3, s4, s5, s6, s7])
        db.flush()

        # Capabilities
        c1 = SupplierCapability(supplier_id=s1.id, category="CNC Machining", process_type="5-Axis CNC Milling, Turning", materials="SS 304, SS 316, Al 6061, Titanium", certifications="ISO 9001:2015, AS9100D")
        c2 = SupplierCapability(supplier_id=s2.id, category="Sheet Metal", process_type="Fiber Laser Cutting, CNC Bending, TIG Welding", materials="SS 304, Mild Steel, Galvanized Sheet, Copper", certifications="ISO 9001:2015")
        c3 = SupplierCapability(supplier_id=s3.id, category="High Precision Tooling", process_type="Wire EDM, Micro-Milling, Jig Grinding", materials="Tool Steel D2, Chrome Steel 100Cr6, Inconel 718", certifications="DIN EN ISO 9001, IATF 16949")
        c4 = SupplierCapability(supplier_id=s4.id, category="Die Casting & Extrusion", process_type="High Pressure Die Casting, Extrusion, CNC Finishing", materials="A380 Aluminum, ADC12, Al 6061-T6", certifications="ISO 9001:2015, ISO 14001")
        c5 = SupplierCapability(supplier_id=s5.id, category="Industrial Sensors", process_type="Cleanroom Assembly, Surface Mount PCB, Optical Calibration", materials="Stainless 316L, PBT Polymer, Gold Contacts", certifications="ISO 9001:2015, CE, RoHS, UL")
        c6 = SupplierCapability(supplier_id=s6.id, category="Hydraulics & Valves", process_type="Precision Lapping, Honing, High-Pressure Testing", materials="Ductile Iron, Nitrile, Viton Seals", certifications="ISO 9001:2015, ASME")
        c7 = SupplierCapability(supplier_id=s7.id, category="Ferrous Castings", process_type="Investment Shell Casting, Green Sand", materials="Ductile Iron GGG-40, Cast Stainless CF8M", certifications="ISO 9001:2015")

        db.add_all([c1, c2, c3, c4, c5, c6, c7])

        # Catalog Items (The 6 required synthetic products from prompt + extra items)
        cat1 = CatalogItem(
            supplier_id=s2.id,
            name="Stainless-Steel Mounting Brackets",
            part_number="BFT-MB-40",
            category="Sheet Metal",
            description="Heavy-duty 4mm laser-cut mounting brackets with pre-drilled M8 slots, passivated finish.",
            unit_price=14.20,
            currency="USD",
            moq=100,
            lead_time_days=12,
            material="Stainless Steel 304",
            specifications="Thickness: 4mm | Dimensions: 250x150mm | Finish: Electrolytic Passivation | Tolerance: ±0.2mm",
            origin_country="India",
            available_quantity=5000,
            manufacturing_capability="Fiber Laser Cutting & CNC Bending",
            image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
            in_stock=True
        )
        cat2 = CatalogItem(
            supplier_id=s3.id,
            name="Industrial Ball Bearings",
            part_number="RLM-BB-6205",
            category="Bearings & Motion",
            description="Deep groove precision ball bearings engineered for high RPM industrial spindle applications.",
            unit_price=38.50,
            currency="USD",
            moq=50,
            lead_time_days=18,
            material="Chrome Steel 100Cr6",
            specifications="Bore: 25mm | Outer Dia: 52mm | Width: 15mm | Precision Grade: ABEC-5 (P5) | C3 Clearance",
            origin_country="Germany",
            available_quantity=2400,
            manufacturing_capability="Sub-Micron Precision Grinding & Honing",
            image_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
            in_stock=True
        )
        cat3 = CatalogItem(
            supplier_id=s4.id,
            name="CNC-Machined Aluminium Components",
            part_number="SZP-AL-6061",
            category="CNC Machining",
            description="Custom 5-axis milled aerospace aluminum structural chassis bracket with bead-blasted black anodizing.",
            unit_price=22.00,
            currency="USD",
            moq=200,
            lead_time_days=15,
            material="Aluminium 6061-T6",
            specifications="Tolerance: ISO 2768-f (±0.05mm) | Anodized: Type II Matte Black | Surface Roughness: Ra 0.8um",
            origin_country="China",
            available_quantity=3500,
            manufacturing_capability="5-Axis High-Speed CNC Milling",
            image_url="https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80",
            in_stock=True
        )
        cat4 = CatalogItem(
            supplier_id=s5.id,
            name="Industrial Sensors",
            part_number="TKS-PX-18M",
            category="Industrial Sensors",
            description="M18 inductive proximity sensors with IO-Link digital interface and IP68 oil-resistant stainless housing.",
            unit_price=85.00,
            currency="USD",
            moq=20,
            lead_time_days=10,
            material="Stainless Steel 316L / PBT",
            specifications="Sensing Range: 8mm Flush | Output: PNP/NPN selectable | Supply: 10-30V DC | Frequency: 1000Hz",
            origin_country="Japan",
            available_quantity=1200,
            manufacturing_capability="Cleanroom Automated Surface-Mount Assembly",
            image_url="https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80",
            in_stock=True
        )
        cat5 = CatalogItem(
            supplier_id=s6.id,
            name="Hydraulic Valves",
            part_number="MWH-V4-350",
            category="Hydraulics & Valves",
            description="Electrically actuated 4-way 3-position directional control spool valve rated for 350 bar continuous pressure.",
            unit_price=145.00,
            currency="USD",
            moq=15,
            lead_time_days=21,
            material="High Tensile Ductile Iron / Viton",
            specifications="Max Pressure: 350 Bar (5000 PSI) | Flow Rate: 80 L/min | Interface: CETOP 3 / NG6 | Coil: 24V DC",
            origin_country="United States",
            available_quantity=800,
            manufacturing_capability="Precision Internal Honing & Hydrostatic Pressure Proofing",
            image_url="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80",
            in_stock=True
        )
        cat6 = CatalogItem(
            supplier_id=s2.id,
            name="Copper Sheets",
            part_number="BFT-CU-110",
            category="Metals & Raw Materials",
            description="Electrolytic tough pitch (ETP) high conductivity copper sheet for busbars, heat spreaders and EMI shielding.",
            unit_price=64.00,
            currency="USD",
            moq=25,
            lead_time_days=14,
            material="Pure Copper C11000 (99.9% Cu)",
            specifications="Thickness: 2.0mm | Dimensions: 1000x500mm | Conductivity: 101% IACS | Temper: Half Hard (H02)",
            origin_country="India",
            available_quantity=4000,
            manufacturing_capability="Precision Cold Rolling & Shearing",
            image_url="https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=600&q=80",
            in_stock=True
        )
        cat7 = CatalogItem(
            supplier_id=s1.id,
            name="CNC Machined Flange Adapter M20",
            part_number="APX-FL-20",
            category="CNC Machining",
            description="Precision turned SS 316 flange adapter with internal O-ring seal groove for high-pressure hydraulic lines.",
            unit_price=24.50,
            currency="USD",
            moq=50,
            lead_time_days=14,
            material="Stainless Steel 316",
            specifications="Thread: M20x1.5 | Flange OD: 65mm | Rating: 250 Bar | Surface: Electropolished",
            origin_country="India",
            available_quantity=1800,
            manufacturing_capability="5-Axis CNC Turning & Milling",
            image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
            in_stock=True
        )
        cat8 = CatalogItem(
            supplier_id=s2.id,
            name="Electrical Enclosure Chassis 2U",
            part_number="BFT-ENC-2U",
            category="Sheet Metal",
            description="Powder-coated 19-inch rackmount sheet metal equipment chassis with integrated DIN rail mounts.",
            unit_price=48.00,
            currency="USD",
            moq=25,
            lead_time_days=18,
            material="Galvannealed Steel 1.5mm",
            specifications="Form Factor: 2U 19-inch | Depth: 380mm | Ingress Protection: IP54 | Coating: Textured Epoxy",
            origin_country="India",
            available_quantity=950,
            manufacturing_capability="CNC Turret Punching & Powder Coating",
            image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
            in_stock=True
        )

        db.add_all([cat1, cat2, cat3, cat4, cat5, cat6, cat7, cat8])
        db.flush()

        # 3. Sourcing Request (seeded)
        sr1 = SourcingRequest(
            request_code="SR-2026-001",
            title="Stainless Steel Mounting Brackets 4mm Batch",
            raw_input="Source 500 stainless-steel mounting brackets, grade 304, thickness 4 mm, manufactured in India, delivered within four weeks.",
            status="RFQ_ISSUED",
            user_id=buyer.id,
            category="Sheet Metal Fabrication",
            quantity=500,
            unit="pieces",
            target_budget=8000.00,
            currency="USD",
            destination_country="India",
            destination_city="Bangalore",
            required_delivery_date="Within 4 weeks",
            manufacturing_process="Laser Cutting & CNC Bending",
            material_grade="Stainless Steel 304",
            dimensions="250mm x 150mm x 4mm",
            tolerances="ISO 2768-m (±0.3mm)",
            required_certifications="ISO 9001:2015, Mill Test Certificate EN 10204 3.1",
            notes="Demo dataset sourcing requirement for industrial automation line fixture.",
            confidence_score=0.96,
            extraction_metadata=json.dumps({"source": "Demo Seed Pipeline", "mode": "DEMO"})
        )
        db.add(sr1)
        db.flush()

        # 4. RFQ
        rfq1 = RFQ(
            rfq_code="RFQ-2026-001",
            sourcing_request_id=sr1.id,
            title="RFQ: 500x SS 304 Heavy Duty Mounting Brackets",
            status="ISSUED",
            issue_date=datetime.datetime.utcnow() - datetime.timedelta(days=5),
            deadline_date=datetime.datetime.utcnow() + datetime.timedelta(days=9),
            terms="Standard DDP Bangalore Commercial Terms - 100% inspection upon receipt",
            notes="Please submit quotes including tooling amortization and material cert."
        )
        db.add(rfq1)
        db.flush()

        # Invite suppliers
        inv1 = RFQSupplier(rfq_id=rfq1.id, supplier_id=s1.id, status="QUOTED")
        inv2 = RFQSupplier(rfq_id=rfq1.id, supplier_id=s2.id, status="QUOTED")
        inv3 = RFQSupplier(rfq_id=rfq1.id, supplier_id=s4.id, status="DECLINED")
        db.add_all([inv1, inv2, inv3])
        db.flush()

        # 5. Quotations
        q1 = Quotation(
            quote_code="QT-2026-0001",
            rfq_id=rfq1.id,
            supplier_id=s1.id,
            total_amount=7850.00,
            currency="USD",
            unit_price=15.70,
            moq=100,
            lead_time_days=20,
            shipping_estimate=250.00,
            payment_terms="Net 30",
            validity_date=datetime.datetime.utcnow() + datetime.timedelta(days=25),
            notes="Quote includes full CNC edge deburring and ASTM A967 chemical passivation.",
            status="UNDER_REVIEW",
            comparison_score=86.40,
            score_breakdown=json.dumps({"price_score": 90.4, "lead_score": 70.0, "reliability_score": 96.0}),
            missing_fields=json.dumps([])
        )
        q2 = Quotation(
            quote_code="QT-2026-0002",
            rfq_id=rfq1.id,
            supplier_id=s2.id,
            total_amount=7100.00,
            currency="USD",
            unit_price=14.20,
            moq=100,
            lead_time_days=14,
            shipping_estimate=150.00,
            payment_terms="Net 30",
            validity_date=datetime.datetime.utcnow() + datetime.timedelta(days=30),
            notes="Laser profiling and CNC press brake formed. Mill cert 3.1 included.",
            status="ACCEPTED",
            acceptance_reason="Best total cost, fastest lead time (14 days), and strong local track record.",
            comparison_score=94.80,
            score_breakdown=json.dumps({"price_score": 100.0, "lead_score": 100.0, "reliability_score": 92.0}),
            missing_fields=json.dumps([])
        )
        db.add_all([q1, q2])
        db.flush()

        qi1 = QuotationItem(quotation_id=q1.id, item_name="SS 304 Mounting Bracket 4mm", description="CNC Machined & Passivated", quantity=500, unit_price=15.70, total_price=7850.00, lead_time_days=20)
        qi2 = QuotationItem(quotation_id=q2.id, item_name="SS 304 Mounting Bracket 4mm", description="Fiber Laser Cut & CNC Bended", quantity=500, unit_price=14.20, total_price=7100.00, lead_time_days=14)
        db.add_all([qi1, qi2])
        db.flush()

        # 6. Order created from accepted quote q2
        po1 = Order(
            order_code="PO-2026-001",
            sourcing_request_id=sr1.id,
            quotation_id=q2.id,
            supplier_id=s2.id,
            total_amount=7100.00,
            currency="USD",
            status="IN_PRODUCTION",
            expected_delivery_date=datetime.datetime.utcnow() + datetime.timedelta(days=14),
            shipping_address="Industrial Tech Park, Whitefield, Bangalore, India 560066",
            tracking_number="SIM-TRK-88294101",
            notes="PO issued from accepted quotation QT-2026-0002. Tooling approved."
        )
        db.add(po1)
        db.flush()

        poi1 = OrderItem(order_id=po1.id, item_name="SS 304 Mounting Bracket 4mm", quantity=500, unit_price=14.20, total_price=7100.00)
        db.add(poi1)

        h1 = OrderStatusHistory(order_id=po1.id, previous_status=None, new_status="CONFIRMED", changed_by="Procurement Pipeline", notes="Order initialized upon quote acceptance.")
        h2 = OrderStatusHistory(order_id=po1.id, previous_status="CONFIRMED", new_status="IN_PRODUCTION", changed_by="Supplier Production Manager", notes="Raw SS 304 coil sheet received. Laser profiling begun.")
        db.add_all([h1, h2])

        # 7. BOM Project
        bom1 = BOMProject(
            title="BOM - Stainless Steel Industrial Mounting Bracket Assembly",
            description="Engineering bill of materials for industrial bracket sub-assembly.",
            sourcing_request_id=sr1.id,
            currency="USD",
            total_estimated_cost=8850.00,
            status="REVIEWED"
        )
        db.add(bom1)
        db.flush()

        bi1 = BOMItem(bom_project_id=bom1.id, part_name="Base Mounting Flange", description="4mm SS 304 Laser Cut Base", material="SS 304", dimensions="250x150x4mm", quantity=500, unit="pcs", manufacturing_process="Laser Cutting", estimated_unit_cost=10.50, total_cost=5250.00, supplier_id=s2.id, specification_status="SPECIFIED", notes="Main base structure")
        bi2 = BOMItem(bom_project_id=bom1.id, part_name="Reinforcing Gusset Plate", description="Weld-on stiffener rib", material="SS 304", dimensions="80x80x4mm", quantity=1000, unit="pcs", manufacturing_process="Laser Cutting", estimated_unit_cost=2.80, total_cost=2800.00, supplier_id=s2.id, specification_status="SPECIFIED", notes="2 per bracket")
        bi3 = BOMItem(bom_project_id=bom1.id, part_name="Stainless Fasteners M8", description="DIN 6921 Flanged Bolt A2-70", material="SS A2-70", dimensions="M8 x 20mm", quantity=2000, unit="pcs", manufacturing_process="Cold Heading", estimated_unit_cost=0.40, total_cost=800.00, supplier_id=None, specification_status="SPECIFIED", notes="Standard hardware kit")
        db.add_all([bi1, bi2, bi3])

        # 8. Trade Assessment
        trade1 = TradeAssessment(
            sourcing_request_id=sr1.id,
            origin_country="India",
            destination_country="India",
            product_description="Industrial stainless steel mounting brackets",
            declared_value=7100.00,
            currency="USD",
            hs_code_candidate="7326.90.99",
            estimated_duty_rate=0.00,  # Domestic
            estimated_tax_rate=18.00,  # Domestic GST
            freight_insurance_estimate=150.00,
            duty_estimate=0.00,
            tax_estimate=1305.00,
            total_landed_estimate=8555.00,
            compliance_checklist=json.dumps([
                {"document_name": "GST Tax Invoice", "purpose": "Input tax credit filing", "issuing_authority": "Supplier", "mandatory": True},
                {"document_name": "E-Way Bill", "purpose": "Interstate transit compliance", "issuing_authority": "GST Portal", "mandatory": True},
                {"document_name": "Mill Test Certificate (EN 10204 3.1)", "purpose": "Material composition test", "issuing_authority": "Steel Mill", "mandatory": True}
            ]),
            disclaimer="ESTIMATE — NOT A CUSTOMS OR LEGAL DETERMINATION. Independent tax and trade consultation recommended.",
            source_basis="Indian GST Schedule 2026 (Chapter 73)"
        )
        db.add(trade1)

        # 9. Initial Agent Run record
        agent_run1 = AgentRun(
            run_code="RUN-2026-001",
            request_id=sr1.id,
            prompt="Analyze procurement strategy for 500x SS 304 mounting brackets to be sourced in India.",
            provider="deterministic-demo",
            model="demo-deterministic-v1",
            mode="DEMO",
            status="COMPLETED",
            summary="Multi-Agent Procurement Pipeline completed comprehensive assessment. Dual-sourcing strategy established with Apex Precision and Bharat ForgeTech.",
            started_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            completed_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2, seconds=-3)
        )
        db.add(agent_run1)
        db.flush()

        evt1 = AgentRunEvent(
            run_id=agent_run1.id,
            agent_name="Procurement Agent",
            task="Requirement Structuring & Sourcing Strategy",
            inputs=json.dumps({"quantity": 500, "material": "SS 304"}),
            outputs=json.dumps({"strategy": "Dual-Sourcing RFP with Regional Tier-1 & Tier-2 Fabricators"}),
            assumptions=json.dumps(["Standard payment terms Net 30"]),
            warnings=json.dumps(["Monitor nickel surcharge index"]),
            mode="DEMO",
            human_approval_required=False,
            execution_order=1
        )
        evt2 = AgentRunEvent(
            run_id=agent_run1.id,
            agent_name="Supplier Matching Agent",
            task="Supplier Catalog Discovery",
            inputs=json.dumps({"process": "Laser Cutting & Bending"}),
            outputs=json.dumps({"primary": "Bharat ForgeTech Solutions", "backup": "Apex Precision Engineering"}),
            assumptions=json.dumps(["Vendors have open shop capacity"]),
            warnings=json.dumps(["Verify active ISO 9001 certificates"]),
            mode="DEMO",
            human_approval_required=True,
            execution_order=2
        )
        evt3 = AgentRunEvent(
            run_id=agent_run1.id,
            agent_name="Coordinator Agent",
            task="Executive Procurement Synthesis",
            inputs=json.dumps({"steps_completed": 5}),
            outputs=json.dumps({"recommendation": "Issue RFQ to Bharat ForgeTech and Apex Precision"}),
            assumptions=json.dumps(["Human sign-off on tolerances"]),
            warnings=json.dumps(["Demonstration advisory only"]),
            mode="DEMO",
            human_approval_required=False,
            execution_order=6
        )
        db.add_all([evt1, evt2, evt3])

        # Initial Audit Trail Events
        audit_events = [
            AuditLog(
                action="PLATFORM_INITIALIZED",
                entity_type="System",
                entity_id="SYS-001",
                details="Namade Kadda AI Marketplace initialized with synthetic demonstration dataset.",
                user_email="admin@namadekadda.demo"
            ),
            AuditLog(
                action="SUPPLIER_VERIFIED",
                entity_type="Supplier",
                entity_id=str(s1.id),
                details="Apex Precision Engineering approved and verified for public marketplace RFQs.",
                user_email="admin@namadekadda.demo"
            ),
            AuditLog(
                action="RFQ_ISSUED",
                entity_type="RFQ",
                entity_id=str(rfq1.id),
                details=f"RFQ {rfq1.rfq_code} broadcast to Apex Precision and Bharat ForgeTech.",
                user_email="buyer@namadekadda.demo"
            ),
            AuditLog(
                action="QUOTATION_SUBMITTED",
                entity_type="Quotation",
                entity_id=str(q1.id),
                details=f"Quotation {q1.quote_code} ($14,250.00) submitted by Apex Precision.",
                user_email="supplier@namadekadda.demo"
            ),
            AuditLog(
                action="ORDER_CONFIRMED",
                entity_type="Order",
                entity_id=str(po1.id),
                details=f"Purchase Order {po1.order_code} confirmed for contract manufacturing.",
                user_email="buyer@namadekadda.demo"
            )
        ]
        db.add_all(audit_events)
        db.commit()
        ensure_demo_users(db, s1.id)
        from app.seed.seed_component_intelligence import seed_component_intelligence
        seed_component_intelligence(db)
        print("Demonstration dataset seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
