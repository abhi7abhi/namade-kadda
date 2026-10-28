import json
import datetime
from sqlalchemy.orm import Session
from app.models.component_intelligence import ProductComponentRelationship
from app.models.supplier import Supplier, SupplierCapability, CatalogItem


def seed_component_intelligence(db: Session):
    """
    Populate rich, verified Two-Way Product and Component Intelligence data.
    Ensures that searches for finished products yield authentic BOM breakdowns,
    and searches for components/raw materials reveal commercial product applications.
    """
    # 1. Ensure electronic & battery suppliers exist in DB for authentic supplier matches
    ensure_electronics_suppliers(db)

    # 2. Ensure computing catalog items exist under authentic suppliers
    ensure_computing_catalog_items(db)

    # 3. Check and seed computing relationships (Laptop, Desktop Tower, Desktop PC)
    comp_count = db.query(ProductComponentRelationship).filter(
        ProductComponentRelationship.parent_name.in_(["Laptop", "Desktop Tower", "Desktop PC"])
    ).count()
    if comp_count < 41:
        print(f"Seeding verified computing relationships (currently {comp_count}/41)...")
        old_comp = db.query(ProductComponentRelationship).filter(
            ProductComponentRelationship.parent_name.in_(["Laptop", "Desktop Tower", "Desktop PC"])
        ).all()
        for oc in old_comp:
            db.delete(oc)
        for rel in COMPUTING_RELATIONSHIPS:
            db.add(ProductComponentRelationship(**rel))
        db.commit()
        print("Successfully seeded 41 computing component relationships!")

    # 4. Check if base relationships already seeded
    existing_count = db.query(ProductComponentRelationship).count()
    if existing_count >= 70:
        print(f"Component Intelligence relationships already present ({existing_count} records).")
        return

    print("Seeding Two-Way Component Intelligence relationships...")

    relationships = [
        # ==========================================
        # 1. SMARTPHONE (Consumer Electronics)
        # ==========================================
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "Application processor / SoC",
            "child_category": "Semiconductor",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Processing and device control",
            "specification_details": "4nm/5nm process, Octa-Core 64-bit ARMv9 architecture, 3.2GHz, integrated AI Neural Processing Unit (NPU)",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Flagship & Mid-Range Mobile Architecture",
            "estimated_cost_reference": 45.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Semiconductor",
            "subcomponents_json": json.dumps(["CPU Cores", "GPU Engine", "Neural Processing Unit (NPU)", "5G Baseband Modulator"]),
            "notes": "Silicon system-on-chip coordinating OS kernel, graphics pipeline, and AI inference."
        },
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "Memory chips",
            "child_category": "Semiconductor",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Temporary and permanent data storage",
            "specification_details": "12GB LPDDR5X RAM (8533 Mbps) + 256GB UFS 4.0 High-Speed Flash Storage Package (PoP BGA)",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "High-Speed Mobile Memory Subsystem",
            "estimated_cost_reference": 32.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Semiconductor",
            "subcomponents_json": json.dumps(["LPDDR5X DRAM Die", "3D TLC NAND Flash", "Integrated Memory Controller"]),
            "notes": "Stacked Package-on-Package (PoP) memory configuration soldered atop the SoC."
        },
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "Display module",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Visual output and capacitive touch input",
            "specification_details": "6.7-inch Flexible AMOLED, 120Hz LTPO dynamic refresh, 2400x1080 FHD+, 1600 nits peak, Corning Gorilla Glass Victus",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Bezel-less Capacitive Touchscreen Assembly",
            "estimated_cost_reference": 55.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["OLED Emitter Glass Substrate", "Display Driver IC (DDI)", "Touch Digitizer Film", "Polarizing Filter Layer"]),
            "notes": "Integrated touch digitizer and display driver with under-display optical fingerprint window."
        },
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "Battery cell and pack",
            "child_category": "Battery",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Power supply and portable operation",
            "specification_details": "5000 mAh Lithium-ion Polymer (Li-Po), 3.85V nominal, 65W fast-charging certified, dual-cell architecture",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "High Energy Density Slim Pouch Cell",
            "estimated_cost_reference": 12.50,
            "cost_currency": "USD",
            "supplier_category_hint": "Battery",
            "subcomponents_json": json.dumps(["Lithium Cobalt Oxide Cathode", "Graphite Anode", "Protection Circuit Module (PCM)", "FPC Power Flex Cable"]),
            "notes": "Includes thermal sensing thermistor and integrated overcharge protection circuitry."
        },
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "Camera modules",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Image capture and optical stabilization",
            "specification_details": "Triple array: 50MP Primary (f/1.8, OIS) + 12MP Ultra-wide (120° FOV) + 10MP Telephoto (3x optical zoom)",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Multi-Sensor Compact Camera Module (CCM)",
            "estimated_cost_reference": 38.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["CMOS Image Sensor (CIS)", "Voice Coil Motor (VCM) Actuator", "Optical Lens Barrel Assembly", "IR-Cut Glass Filter"]),
            "notes": "Active alignment precision lens mount with closed-loop optical image stabilization."
        },
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "Printed circuit board (PCB)",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Connects electronic components",
            "specification_details": "10-Layer High-Density Interconnect (HDI) Any-Layer PCB, ENIG surface finish, halogen-free, micro-via laser drilled",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "High-Density Mainboard and Sub-Board Carrier",
            "estimated_cost_reference": 8.50,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["Polyimide / High-Tg FR-4 Core", "Electrodeposited Copper Foil", "Prepreg Dielectric Layers", "Stacked Micro-Vias"]),
            "notes": "Substrate-like PCB (SLP) optimized for micro-pitch 0.35mm BGA surface mount components."
        },
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "RF and connectivity modules",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Wireless communication",
            "specification_details": "5G Sub-6GHz & mmWave RF Front-End (RFFE), Wi-Fi 7 (802.11be), Bluetooth 5.4, NFC, GPS/GLONASS/Galileo GNSS receiver",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Multiband Wireless Transceiver Subsystem",
            "estimated_cost_reference": 18.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["Power Amplifier (PA)", "Low Noise Amplifier (LNA)", "SAW/BAW Duplexers", "Antenna Switch Module (ASM)"]),
            "notes": "Integrated RF power amplifiers and antenna tuning switches for global carrier bands."
        },
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "Speakers and microphones",
            "child_category": "Audio",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Sound input and output",
            "specification_details": "Dual stereo dynamic micro-speakers (1115 box, 0.8W) + 3x MEMS noise-canceling beamforming microphone array",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Acoustic Transducer Assembly",
            "estimated_cost_reference": 4.20,
            "cost_currency": "USD",
            "supplier_category_hint": "Audio",
            "subcomponents_json": json.dumps(["NdFeB Neodymium Magnet", "Mylar Micro-Diaphragm", "Silicon MEMS Sensor Die", "Waterproof Acoustic Mesh"]),
            "notes": "Acoustic enclosure designed for IP68 ingress resistance while maximizing bass resonance."
        },
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "Sensors",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Motion, proximity, and ambient sensing",
            "specification_details": "6-Axis IMU (Gyro + Accelerometer), Proximity & Ambient Light, In-Display Optical Fingerprint, Barometer, Hall Effect",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Environmental & Biometric Sensor Hub",
            "estimated_cost_reference": 6.80,
            "cost_currency": "USD",
            "supplier_category_hint": "Industrial Sensors",
            "subcomponents_json": json.dumps(["MEMS Gyroscope", "ToF Proximity Photodiode", "Under-display Optical Sensor", "Barometric Pressure Sensor"]),
            "notes": "Low-power continuous sensor hub for pedometer, screen rotation, and biometric authentication."
        },
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "Housing and structural parts",
            "child_category": "Mechanical",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Protection and assembly",
            "specification_details": "Aerospace Grade 6063-T6 Aluminum mid-frame CNC machined + Corning Gorilla Glass back plate, IP68 water resistance gasket",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Precision CNC Unibody Enclosure",
            "estimated_cost_reference": 19.50,
            "cost_currency": "USD",
            "supplier_category_hint": "CNC Machining",
            "subcomponents_json": json.dumps(["5-Axis CNC Aluminum Midframe", "Tempered Rear Glass Panel", "SIM Card Tray Mechanism", "Precision Silicone Gaskets"]),
            "notes": "Bead-blasted anodized surface finish with integrated thermal heat distribution channels."
        },
        {
            "parent_name": "Smartphone",
            "parent_category": "Consumer Electronics",
            "child_name": "Connectors and flex cables",
            "child_category": "Electrical",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Internal connections",
            "specification_details": "USB Type-C 3.2 Gen 2 receptacle + ultra-fine pitch Board-to-Board (B2B) connectors (0.35mm pitch) & polyimide FPC jumpers",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Internal Interconnect Wiring & Interface",
            "estimated_cost_reference": 3.50,
            "cost_currency": "USD",
            "supplier_category_hint": "Electrical",
            "subcomponents_json": json.dumps(["Gold-Plated Beryllium Copper Terminals", "Polyimide Flexible Printed Circuits (FPC)", "Stainless Steel Shielding Bracket"]),
            "notes": "Supports up to 10Gbps USB data throughput and 100W Power Delivery."
        },

        # ==========================================
        # 2. LAPTOP (Computing & Electronics)
        # ==========================================
        {
            "parent_name": "Laptop",
            "parent_category": "Computing & Electronics",
            "child_name": "Semiconductor chip",
            "child_category": "Semiconductor",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 2.0,
            "unit": "pcs",
            "typical_purpose": "General computing and discrete graphics processing",
            "specification_details": "x86-64 14-Core Mobile Processor (45W TDP) + Discrete Ray-Tracing GPU with dedicated GDDR6 VRAM",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Main Processing Unit",
            "estimated_cost_reference": 185.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Semiconductor",
            "subcomponents_json": json.dumps(["CPU Die", "Integrated GPU Cores", "PCIe Controller", "Chipset PCH"]),
            "notes": "Dual processor architecture mounted directly to the system motherboard."
        },
        {
            "parent_name": "Laptop",
            "parent_category": "Computing & Electronics",
            "child_name": "Printed circuit board (PCB)",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Core motherboard interconnect and power regulation",
            "specification_details": "12-Layer High-Speed Impedance Controlled Motherboard with Type-C Thunderbolt controller traces",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Laptop Motherboard & I/O Daughterboard",
            "estimated_cost_reference": 38.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["Multi-layer FR4 Substrate", "Power MOSFET Stages", "BIOS Flash ROM", "I/O Ports"]),
            "notes": "Includes thermal dissipation ground planes and high-current inductor rails."
        },
        {
            "parent_name": "Laptop",
            "parent_category": "Computing & Electronics",
            "child_name": "Display module",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Primary user display interface",
            "specification_details": "15.6-inch 2.8K (2880x1800) OLED display, 120Hz refresh, 100% DCI-P3 wide color gamut, eDP 4-lane interface",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Slim Laptop Lid Display Assembly",
            "estimated_cost_reference": 85.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["OLED Glass Substrate", "Timing Controller (T-CON)", "eDP Flex Ribbon Cable", "Anti-Glare Coating"]),
            "notes": "Embedded DisplayPort (eDP) digital video connection."
        },
        {
            "parent_name": "Laptop",
            "parent_category": "Computing & Electronics",
            "child_name": "Lithium-ion battery",
            "child_category": "Battery",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Mobile energy storage and portable operation",
            "specification_details": "75Wh 4-Cell Smart Li-ion Battery Pack (15.4V nominal), integrated SMBus/I2C fuel gauge and thermal cutoff fuse",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Internal High-Capacity Battery Pack",
            "estimated_cost_reference": 28.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Battery",
            "subcomponents_json": json.dumps(["4x Prismatic Li-ion Cells", "BMS Battery Management Board", "Thermal Fuse", "Shielding Wrap"]),
            "notes": "Smart battery telemetry compatible with ACPI power management protocols."
        },
        {
            "parent_name": "Laptop",
            "parent_category": "Computing & Electronics",
            "child_name": "Copper Sheets",
            "child_category": "Metals & Raw Materials",
            "relationship_type": "RAW_MATERIAL",
            "quantity": 2.0,
            "unit": "pcs",
            "typical_purpose": "Thermal heat pipe dissipation and vapor chamber heat spreading",
            "specification_details": "High-purity C11000 Electrolytic Copper vapor chamber plates and sintered wick capillary heat pipes",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Laptop Thermal Dissipation Module",
            "estimated_cost_reference": 14.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Metals & Raw Materials",
            "subcomponents_json": json.dumps(["Sintered Copper Wick", "Flattened Copper Heat Pipes", "Cold Plate Contact Blocks"]),
            "notes": "Dissipates thermal load from CPU and GPU directly to the dual centrifugal blower fans."
        },

        # ==========================================
        # 3. ELECTRIC VEHICLE (Automotive)
        # ==========================================
        {
            "parent_name": "Electric Vehicle (EV)",
            "parent_category": "Automotive & Mobility",
            "child_name": "Lithium-ion battery",
            "child_category": "Battery",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "High-voltage vehicle traction energy storage",
            "specification_details": "82 kWh 400V/800V Prismatic Liquid-Cooled Battery Pack with integrated master BMS, pyrofuse disconnect, IP67 enclosure",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Underbody Skateboard Traction Battery Pack",
            "estimated_cost_reference": 6500.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Battery",
            "subcomponents_json": json.dumps(["Prismatic LFP/NMC Cells", "Liquid Cooling Cold Plates", "Master Battery Management System", "High-Voltage Pyrofuse"]),
            "notes": "Automotive crash-tested structural battery pack with active thermal management loop."
        },
        {
            "parent_name": "Electric Vehicle (EV)",
            "parent_category": "Automotive & Mobility",
            "child_name": "Semiconductor chip",
            "child_category": "Semiconductor",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 18.0,
            "unit": "pcs",
            "typical_purpose": "Motor inverter control, ADAS perception and safety critical systems",
            "specification_details": "Automotive Grade Silicon Carbide (SiC) MOSFET inverter driver modules + ASIL-D Dual-Lockstep 32-bit Microcontrollers",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Traction Inverter & ADAS Domain Controller",
            "estimated_cost_reference": 120.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Semiconductor",
            "subcomponents_json": json.dumps(["SiC Power Modules", "Gate Driver ICs", "ASIL-D Automotive Microcontrollers", "CAN-FD Transceivers"]),
            "notes": "High switching speed Silicon Carbide switches providing 98%+ inverter electrical efficiency."
        },
        {
            "parent_name": "Electric Vehicle (EV)",
            "parent_category": "Automotive & Mobility",
            "child_name": "Copper Sheets",
            "child_category": "Metals & Raw Materials",
            "relationship_type": "RAW_MATERIAL",
            "quantity": 12.0,
            "unit": "pcs",
            "typical_purpose": "Stator electromagnetic windings, high-voltage busbars, and power distribution",
            "specification_details": "Oxygen-free high conductivity (OFHC) Pure Copper C10100 busbars rated for 800V DC / 350A continuous traction currents",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "High-Voltage Traction Busbars & Stator Hairpin Windings",
            "estimated_cost_reference": 240.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Metals & Raw Materials",
            "subcomponents_json": json.dumps(["Laminated Busbars", "Hairpin Stator Wire", "Heavy Duty Lug Terminals"]),
            "notes": "Low resistance copper interconnects preventing thermal hotspots under rapid acceleration."
        },
        {
            "parent_name": "Electric Vehicle (EV)",
            "parent_category": "Automotive & Mobility",
            "child_name": "Automotive Electronic Control Unit (ECU)",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 6.0,
            "unit": "pcs",
            "typical_purpose": "Distributed vehicle control, body electronics and battery management",
            "specification_details": "ASIL-D automotive safety grade multi-controller with CAN-FD, LIN, and Automotive Ethernet connectivity",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Zone Control Units & Vehicle Dynamics Gateway",
            "estimated_cost_reference": 280.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["Automotive Grade MCU", "Power Transceivers", "Die-Cast Enclosure", "IP6K9K Connectors"]),
            "notes": "Zonal architecture controlling brakes, steering, motor torque vectors, and safety sensors."
        },

        # ==========================================
        # 4. INDUSTRIAL DRONE (Robotics & Aerospace)
        # ==========================================
        {
            "parent_name": "Industrial Drone",
            "parent_category": "Aerospace & Robotics",
            "child_name": "Lithium-ion battery",
            "child_category": "Battery",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 2.0,
            "unit": "pcs",
            "typical_purpose": "Flight propulsion and payload electrical power",
            "specification_details": "6S 22.2V 16,000 mAh High-Discharge LiPo Battery with XT90 anti-spark connector, 25C continuous discharge rate",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Heavy-Lift Industrial Propulsion Battery",
            "estimated_cost_reference": 165.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Battery",
            "subcomponents_json": json.dumps(["High-Rate LiPo Pouch Cells", "Integrated Fuel Gauge", "Aluminum Armor Shell", "Balance Plug"]),
            "notes": "High continuous discharge rate required for gust stabilization and rapid ascent."
        },
        {
            "parent_name": "Industrial Drone",
            "parent_category": "Aerospace & Robotics",
            "child_name": "Semiconductor chip",
            "child_category": "Semiconductor",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 4.0,
            "unit": "pcs",
            "typical_purpose": "Autopilot navigation, real-time motor telemetry and optical tracking",
            "specification_details": "Dual ARM Cortex-M7 flight control processor running at 480MHz with redundant triple MEMS IMU sensors",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Flight Controller & ESC Driver Silicon",
            "estimated_cost_reference": 42.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Semiconductor",
            "subcomponents_json": json.dumps(["Flight Control MCU", "Hardware Floating Point Unit", "Redundant IMU Accelerometer/Gyro"]),
            "notes": "Coordinates PID loops at 8kHz for precise aerial payload positioning."
        },
        {
            "parent_name": "Industrial Drone",
            "parent_category": "Aerospace & Robotics",
            "child_name": "Printed circuit board (PCB)",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 3.0,
            "unit": "pcs",
            "typical_purpose": "Electronic speed control (ESC) and power distribution board",
            "specification_details": "4-Layer 3oz heavy copper PCB for high-current brushless motor drives (up to 80A burst per arm)",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "High Current Drone Power Distribution Board",
            "estimated_cost_reference": 18.50,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["Heavy Copper PCB Substrate", "Gate Drive Circuitry", "Current Shunt Resistors"]),
            "notes": "Heavy copper board capable of continuous 120A system current delivery."
        },
        {
            "parent_name": "Industrial Drone",
            "parent_category": "Aerospace & Robotics",
            "child_name": "Industrial Sensors",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 3.0,
            "unit": "pcs",
            "typical_purpose": "Obstacle avoidance, altitude monitoring, and optical flow positioning",
            "specification_details": "Millimeter-wave radar transceiver + LiDAR optical time-of-flight sensor (40m range, IP65)",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Aerial Collision Avoidance Sensor Suite",
            "estimated_cost_reference": 85.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Industrial Sensors",
            "subcomponents_json": json.dumps(["ToF Laser Emitter", "Optical Receiver", "Signal Processing DSP"]),
            "notes": "Enables GPS-denied indoor hovering and terrain following."
        },

        # ==========================================
        # 5. SOLAR INVERTER (Renewable Energy)
        # ==========================================
        {
            "parent_name": "Solar Inverter",
            "parent_category": "Renewable Energy",
            "child_name": "Semiconductor chip",
            "child_category": "Semiconductor",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 8.0,
            "unit": "pcs",
            "typical_purpose": "High-efficiency MPPT tracking and DC-AC grid synchronization",
            "specification_details": "1200V / 50A IGBT discrete power switching modules and high-speed DSP microcontroller (32-bit 200MHz)",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Power Inverter Switch Bridge & DSP",
            "estimated_cost_reference": 68.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Semiconductor",
            "subcomponents_json": json.dumps(["IGBT Silicon Modules", "Optically Isolated Drivers", "Digital Signal Processor (DSP)"]),
            "notes": "Maximum Power Point Tracking (MPPT) algorithm executes grid tie sync."
        },
        {
            "parent_name": "Solar Inverter",
            "parent_category": "Renewable Energy",
            "child_name": "Copper Sheets",
            "child_category": "Metals & Raw Materials",
            "relationship_type": "RAW_MATERIAL",
            "quantity": 8.0,
            "unit": "pcs",
            "typical_purpose": "Heavy-duty power busbars, inductor coils and grounding distribution",
            "specification_details": "99.9% Electrolytic Copper busbars (3mm thickness) rated for 1500V DC / 60A continuous solar string current",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "High Current Solar Busbars & Inductor Coils",
            "estimated_cost_reference": 64.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Metals & Raw Materials",
            "subcomponents_json": json.dumps(["Laminated Power Busbars", "High Conductivity Terminal Blocks", "Grounding Bus"]),
            "notes": "Handles high temperature continuous photovoltaic string current."
        },
        {
            "parent_name": "Solar Inverter",
            "parent_category": "Renewable Energy",
            "child_name": "Printed circuit board (PCB)",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 2.0,
            "unit": "pcs",
            "typical_purpose": "Power stage gating and digital telemetry interface",
            "specification_details": "6-Layer FR4 PCB with 70um (2oz) copper thickness and creepage clearance slots for high voltage isolation",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Solar Inverter Control and Gating Board",
            "estimated_cost_reference": 24.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["High Voltage Isolation Slots", "Reinforced Dielectric Prepreg", "Gold Immersion Contacts"]),
            "notes": "Meets IEC 62109-1 safety standards for photovoltaic power converters."
        },
        {
            "parent_name": "Solar Inverter",
            "parent_category": "Renewable Energy",
            "child_name": "Electrical Enclosure Chassis 2U",
            "child_category": "Sheet Metal",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Outdoor weather-resistant IP65 aluminum / galvannealed steel enclosure",
            "specification_details": "1.5mm powder-coated enclosure with silicone sealing gasket and integrated DIN rail mounts",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Outdoor Photovoltaic Inverter Housing",
            "estimated_cost_reference": 48.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Sheet Metal",
            "subcomponents_json": json.dumps(["Powder Coated Metal Shell", "Silicone Weatherproofing Gasket", "Integrated Heat Sink Flange"]),
            "notes": "Resists UV radiation, wind-blown rain, and industrial chemical corrosion."
        },

        # ==========================================
        # 6. SMART TELEVISION (Consumer Electronics)
        # ==========================================
        {
            "parent_name": "Smart Television",
            "parent_category": "Consumer Electronics",
            "child_name": "Display module",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Ultra-high-definition visual display panel",
            "specification_details": "65-inch 4K Quantum Dot Mini-LED panel, 144Hz refresh rate, 1200 nits peak brightness, 1000+ local dimming zones",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Large Format Television Panel Assembly",
            "estimated_cost_reference": 210.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["Mini-LED Backlight Unit", "Quantum Dot Color Film", "T-CON Driver Board", "Anti-Glare Diffuser"]),
            "notes": "Includes multi-zone backlighting controller."
        },
        {
            "parent_name": "Smart Television",
            "parent_category": "Consumer Electronics",
            "child_name": "Semiconductor chip",
            "child_category": "Semiconductor",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 2.0,
            "unit": "pcs",
            "typical_purpose": "Video signal processing, AI upscaling and smart OS computing",
            "specification_details": "Quad-core ARM Cortex-A73 SoC with dedicated Mali GPU and hardware HEVC/AV1 video decoder",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Smart TV Main Video Processing SoC",
            "estimated_cost_reference": 28.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Semiconductor",
            "subcomponents_json": json.dumps(["Video Decoding DSP", "AI Picture Enhancer", "Multi-Channel Audio Processor"]),
            "notes": "Decodes streaming 4K HDR streams in real time."
        },

        # ==========================================
        # 7. SMARTWATCH (Wearables)
        # ==========================================
        {
            "parent_name": "Smartwatch",
            "parent_category": "Wearables & IoT",
            "child_name": "Display module",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Ultra-low power wearable touch screen",
            "specification_details": "1.4-inch circular AMOLED, 454x454 resolution, 1000 nits, sapphire crystal protective cover",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Round Wearable AMOLED Screen",
            "estimated_cost_reference": 16.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["Circular AMOLED Substrate", "Driver IC", "Sapphire Watch Crystal"]),
            "notes": "Always-on display with low-refresh 1Hz idle mode."
        },
        {
            "parent_name": "Smartwatch",
            "parent_category": "Wearables & IoT",
            "child_name": "Semiconductor chip",
            "child_category": "Semiconductor",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Wearable computing and biometric signal processing",
            "specification_details": "Ultra-low power dual-core wearable SoC with BLE 5.3, integrated GNSS, and low-power sensor coprocessor",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Wearable Ultra-Low Power SoC",
            "estimated_cost_reference": 14.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Semiconductor",
            "subcomponents_json": json.dumps(["Energy Efficient ARM Cortex-M55", "BLE 5.3 Radio", "Microcontroller Hub"]),
            "notes": "Operates under 5mA active power draw for multi-day battery endurance."
        },
        {
            "parent_name": "Smartwatch",
            "parent_category": "Wearables & IoT",
            "child_name": "Lithium-ion battery",
            "child_category": "Battery",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Miniature wearable power source",
            "specification_details": "450 mAh 3.87V Li-ion pouch cell with micro-protection PCM board and fast inductive charging coil",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Miniature Wearable Pouch Battery",
            "estimated_cost_reference": 4.80,
            "cost_currency": "USD",
            "supplier_category_hint": "Battery",
            "subcomponents_json": json.dumps(["Custom Curved Pouch Cell", "Micro PCM Board", "Wireless Qi Coil"]),
            "notes": "Custom curved pouch configuration maximizes internal chassis volume."
        },
        {
            "parent_name": "Smartwatch",
            "parent_category": "Wearables & IoT",
            "child_name": "Industrial Sensors",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Continuous biometric and health metric monitoring",
            "specification_details": "Optical photoplethysmography (PPG) heart rate sensor + ECG electrodes + SpO2 infrared LED array",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Biometric Wearable Sensor Cluster",
            "estimated_cost_reference": 7.50,
            "cost_currency": "USD",
            "supplier_category_hint": "Industrial Sensors",
            "subcomponents_json": json.dumps(["Dual Wavelength LED Emitter", "Silicon Photodiode Array", "Analog Front End (AFE)"]),
            "notes": "Measures blood oxygen saturation, skin temperature, and cardiac pulse transit time."
        },

        # ==========================================
        # 8. AUTOMOTIVE ECU (Automotive Electronics)
        # ==========================================
        {
            "parent_name": "Automotive Electronic Control Unit (ECU)",
            "parent_category": "Automotive Electronics",
            "child_name": "Semiconductor chip",
            "child_category": "Semiconductor",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 3.0,
            "unit": "pcs",
            "typical_purpose": "Automotive powertrain and active safety deterministic processing",
            "specification_details": "32-bit ASIL-D TriCore microcontroller (300MHz) with hardware security module (HSM) and lockstep cores",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Engine Management & Braking Safety Silicon",
            "estimated_cost_reference": 48.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Semiconductor",
            "subcomponents_json": json.dumps(["TriCore 32-bit MCU", "Hardware Security Module", "CAN-FD Transceiver IC"]),
            "notes": "AEC-Q100 Grade 0 qualified for engine compartment temperature ranges (-40°C to +150°C)."
        },
        {
            "parent_name": "Automotive Electronic Control Unit (ECU)",
            "parent_category": "Automotive Electronics",
            "child_name": "Printed circuit board (PCB)",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Automotive grade multilayer circuit board",
            "specification_details": "8-Layer polyimide/FR4 hybrid PCB, high thermal TG170 material, conformal coated for moisture isolation",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Harsh Environment Automotive PCB",
            "estimated_cost_reference": 19.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["High-Tg Polyimide Laminate", "Conformal Moisture Barrier", "Heavy Ground Plane Vias"]),
            "notes": "Withstands continuous automotive vibration and salt spray testing."
        },

        # ==========================================
        # 9. INDUSTRIAL IOT GATEWAY (Industrial Automation)
        # ==========================================
        {
            "parent_name": "Industrial IoT Gateway",
            "parent_category": "Industrial Automation",
            "child_name": "Semiconductor chip",
            "child_category": "Semiconductor",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 2.0,
            "unit": "pcs",
            "typical_purpose": "Edge computing and industrial protocol translation (Modbus/OPC-UA/MQTT)",
            "specification_details": "ARM Cortex-A53 dual-core processor with crypto accelerator and dedicated industrial communications engine",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Industrial Edge Computing Processor",
            "estimated_cost_reference": 22.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Semiconductor",
            "subcomponents_json": json.dumps(["Dual-Core ARM Application Processor", "Ethernet PHY Transceiver", "Hardware TPM 2.0"]),
            "notes": "Translates legacy factory bus signals into encrypted cloud telemetry."
        },
        {
            "parent_name": "Industrial IoT Gateway",
            "parent_category": "Industrial Automation",
            "child_name": "Printed circuit board (PCB)",
            "child_category": "Electronics",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Industrial I/O and communication carrier board",
            "specification_details": "6-Layer FR-4 PCB with optocoupler isolated RS-485, CAN bus, and dual Gigabit Ethernet interfaces",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Isolated Industrial Telemetry Board",
            "estimated_cost_reference": 16.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Electronics",
            "subcomponents_json": json.dumps(["Optocoupler Isolation Barriers", "Surge Protection TVS Diodes", "Gold Plated Terminal Pads"]),
            "notes": "Galvanically isolated to 2.5kV to protect against factory ground loops."
        },

        # ==========================================
        # 10. INDUSTRIAL HYDRAULIC ACTUATOR (Industrial Equipment)
        # ==========================================
        {
            "parent_name": "Industrial Hydraulic Actuator",
            "parent_category": "Industrial Equipment",
            "child_name": "Hydraulic Valves",
            "child_category": "Hydraulics & Valves",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Electro-hydraulic fluid control and directional flow metering",
            "specification_details": "Electrically actuated 4-way 3-position directional control spool valve rated for 350 bar continuous pressure",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "High Pressure Hydraulic Directional Control",
            "estimated_cost_reference": 145.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Hydraulics & Valves",
            "subcomponents_json": json.dumps(["Hardened Spool Mechanism", "24V DC Dual Solenoids", "Viton O-Ring Pack", "CETOP Subplate"]),
            "notes": "Precision honed spool tolerance controls piston extension speed and hold pressure."
        },
        {
            "parent_name": "Industrial Hydraulic Actuator",
            "parent_category": "Industrial Equipment",
            "child_name": "CNC Machined Flange Adapter M20",
            "child_category": "CNC Machining",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 2.0,
            "unit": "pcs",
            "typical_purpose": "High-pressure fluid port connection and sealing interface",
            "specification_details": "Precision turned SS 316 flange adapter with internal O-ring seal groove for high-pressure hydraulic lines",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "High Pressure Actuator Manifold Connection",
            "estimated_cost_reference": 24.50,
            "cost_currency": "USD",
            "supplier_category_hint": "CNC Machining",
            "subcomponents_json": json.dumps(["Precision Turned Flange Body", "High Pressure Seal Groove", "SAE Thread Port"]),
            "notes": "Handles up to 250 bar continuous hydraulic system working pressure."
        },
        {
            "parent_name": "Industrial Hydraulic Actuator",
            "parent_category": "Industrial Equipment",
            "child_name": "Industrial Sensors",
            "child_category": "Industrial Sensors",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Cylinder position and stroke displacement feedback",
            "specification_details": "Non-contact inductive proximity sensor and linear stroke displacement transducer (IP68 oil-resistant stainless housing)",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Hydraulic Stroke End-Position Feedback",
            "estimated_cost_reference": 85.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Industrial Sensors",
            "subcomponents_json": json.dumps(["Inductive Sensing Coil", "Stainless 316L Sealed Tube", "IO-Link Output Interface"]),
            "notes": "Monitors end-of-stroke deceleration and safety clamping interlocks."
        },

        # ==========================================
        # 11. STAINLESS STEEL MOUNTING ASSEMBLY (Sheet Metal)
        # ==========================================
        {
            "parent_name": "Stainless Steel Mounting Assembly",
            "parent_category": "Sheet Metal Fabrication",
            "child_name": "Stainless-Steel Mounting Brackets",
            "child_category": "Sheet Metal",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Primary mechanical load-bearing mounting interface",
            "specification_details": "Heavy-duty 4mm laser-cut mounting brackets with pre-drilled M8 slots, passivated finish (SS 304)",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Industrial Automation Structural Bracket",
            "estimated_cost_reference": 14.20,
            "cost_currency": "USD",
            "supplier_category_hint": "Sheet Metal",
            "subcomponents_json": json.dumps(["Laser Cut Base Plate", "CNC Brake Ribs", "Slotted Mounting Holes"]),
            "notes": "Electrolytic passivation prevents chemical corrosion in high humidity plant atmospheres."
        },
        {
            "parent_name": "Stainless Steel Mounting Assembly",
            "parent_category": "Sheet Metal Fabrication",
            "child_name": "Copper Sheets",
            "child_category": "Metals & Raw Materials",
            "relationship_type": "RAW_MATERIAL",
            "quantity": 1.0,
            "unit": "pcs",
            "typical_purpose": "Grounding bonding strap and EMI shielding interface",
            "specification_details": "Pure Copper C11000 electrolytic tough pitch conductive strip for electrical equipment chassis earth bonding",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Equipment Earth Bonding & Grounding Strap",
            "estimated_cost_reference": 64.00,
            "cost_currency": "USD",
            "supplier_category_hint": "Metals & Raw Materials",
            "subcomponents_json": json.dumps(["ETP Copper Sheet", "Punch Hole Terminal Connectors"]),
            "notes": "Ensures electrical safety by providing low impedance path to ground."
        },
        {
            "parent_name": "Stainless Steel Mounting Assembly",
            "parent_category": "Sheet Metal Fabrication",
            "child_name": "Industrial Ball Bearings",
            "child_category": "Bearings & Motion",
            "relationship_type": "DIRECT_COMPONENT",
            "quantity": 2.0,
            "unit": "pcs",
            "typical_purpose": "Low-friction pivot and rotational alignment support",
            "specification_details": "Deep groove precision ball bearings engineered for high RPM industrial spindle applications (ABEC-5)",
            "verification_status": "VERIFIED",
            "source": "Namade Kadda Knowledge Base",
            "product_model_applicability": "Pivot Joint Bearing Cartridge",
            "estimated_cost_reference": 38.50,
            "cost_currency": "USD",
            "supplier_category_hint": "High Precision Tooling",
            "subcomponents_json": json.dumps(["Chrome Steel Inner Ring", "Precision Ground Balls", "Synthetic Rubber Seals"]),
            "notes": "Supports rotational load during articulated arm adjustments."
        }
    ]

    for item in relationships:
        rel = ProductComponentRelationship(
            parent_name=item["parent_name"],
            parent_category=item["parent_category"],
            child_name=item["child_name"],
            child_category=item["child_category"],
            relationship_type=item["relationship_type"],
            quantity=item["quantity"],
            unit=item["unit"],
            typical_purpose=item["typical_purpose"],
            specification_details=item["specification_details"],
            verification_status=item["verification_status"],
            source=item["source"],
            product_model_applicability=item.get("product_model_applicability"),
            estimated_cost_reference=item.get("estimated_cost_reference"),
            cost_currency=item.get("cost_currency", "USD"),
            supplier_category_hint=item.get("supplier_category_hint"),
            subcomponents_json=item.get("subcomponents_json"),
            notes=item.get("notes")
        )
        db.add(rel)

    db.commit()
    print(f"Successfully seeded {len(relationships)} Two-Way Component Intelligence relationships!")


def ensure_electronics_suppliers(db: Session):
    """
    Ensure the database has authentic, verified suppliers for Semiconductors,
    Batteries, and Advanced Electronics, so supplier matching uses real DB records.
    """
    # Check if Taiwan Semiconductor supplier exists
    s_semi = db.query(Supplier).filter(Supplier.slug == "apex-microelectronics-taiwan").first()
    if not s_semi:
        s_semi = Supplier(
            name="Apex Microelectronics & Foundry Ltd",
            slug="apex-microelectronics-taiwan",
            description="Leading specialist in 4nm/7nm ARM architecture SoC manufacturing, memory packaging, and microcontrollers.",
            country="Taiwan",
            city="Hsinchu",
            address="Hsinchu Science Park, Building 8",
            website="https://apexmicro.demo.tw",
            contact_email="sales@apexmicro.demo.tw",
            phone="+886-3-577-9000",
            moq=100,
            lead_time_days=21,
            price_rating="$$$",
            is_verified=True,
            verification_status="APPROVED",
            rating=4.9,
            legal_business_name="Apex Microelectronics Taiwan Co., Ltd.",
            business_type="Semiconductor Foundry & Packaging",
            production_capacity="2,000,000 IC packages / month",
            materials_supported="Silicon Wafer, Gold Wire Bonding, Epoxy Molding Compound, Gallium Nitride",
            certifications_documents="ISO 9001:2015, IATF 16949, ISO 14001",
            profile_completeness=100
        )
        db.add(s_semi)
        db.flush()

        cap1 = SupplierCapability(
            supplier_id=s_semi.id,
            category="Semiconductor",
            process_type="Advanced CMOS Wafer Fab, BGA Package-on-Package (PoP)",
            materials="High Purity Silicon, Beryllium Copper Leads",
            certifications="ISO 9001:2015, IATF 16949"
        )
        db.add(cap1)

        cat1 = CatalogItem(
            supplier_id=s_semi.id,
            name="Application processor / SoC (4nm Octa-Core)",
            part_number="APX-SOC-9000",
            category="Semiconductor",
            description="High-performance ARMv9 mobile & IoT application processor with integrated NPU and 5G baseband.",
            unit_price=45.00,
            currency="USD",
            moq=50,
            lead_time_days=21,
            material="Silicon / BGA PoP",
            specifications="4nm process | 8-Core 3.2GHz | NPU 24 TOPS | BGA 0.35mm pitch",
            origin_country="Taiwan",
            available_quantity=25000,
            in_stock=True
        )
        cat2 = CatalogItem(
            supplier_id=s_semi.id,
            name="Memory chips (12GB LPDDR5X + 256GB UFS 4.0)",
            part_number="APX-MEM-12256",
            category="Semiconductor",
            description="Combined multi-chip package integrating 12GB LPDDR5X RAM and 256GB UFS 4.0 storage.",
            unit_price=32.00,
            currency="USD",
            moq=100,
            lead_time_days=14,
            material="Silicon DRAM / NAND",
            specifications="LPDDR5X 8533Mbps | UFS 4.0 Read 4200MB/s | 153-ball FBGA",
            origin_country="Taiwan",
            available_quantity=18000,
            in_stock=True
        )
        db.add_all([cat1, cat2])

    # Check if Battery supplier exists
    s_batt = db.query(Supplier).filter(Supplier.slug == "voltmax-energy-korea").first()
    if not s_batt:
        s_batt = Supplier(
            name="VoltMax Energy Systems Corp",
            slug="voltmax-energy-korea",
            description="Specialist manufacturer of high energy density Lithium-ion pouch cells, EV traction packs, and smart BMS solutions.",
            country="South Korea",
            city="Incheon",
            address="Free Economic Zone, Songdo Techno Park",
            website="https://voltmax.demo.kr",
            contact_email="export@voltmax.demo.kr",
            phone="+82-32-850-4100",
            moq=50,
            lead_time_days=18,
            price_rating="$$",
            is_verified=True,
            verification_status="APPROVED",
            rating=4.8,
            legal_business_name="VoltMax Energy Systems Corporation",
            business_type="Battery Cell & Module Manufacturer",
            production_capacity="500,000 cells / month",
            materials_supported="Lithium Nickel Manganese Cobalt (NMC 811), Lithium Iron Phosphate (LFP), Pure Copper Foil",
            certifications_documents="ISO 9001:2015, UN 38.3, UL 1642, CE",
            profile_completeness=95
        )
        db.add(s_batt)
        db.flush()

        cap2 = SupplierCapability(
            supplier_id=s_batt.id,
            category="Battery",
            process_type="Cleanroom Lithium Pouch Cell Stacking, Automated Ultrasonic Tab Welding",
            materials="NMC 811, Electrolyte, Aluminum Laminated Film",
            certifications="ISO 9001:2015, UN 38.3, UL 1642"
        )
        db.add(cap2)

        cat3 = CatalogItem(
            supplier_id=s_batt.id,
            name="Battery cell and pack (5000 mAh Li-Po)",
            part_number="VMX-BAT-5000",
            category="Battery",
            description="Ultra-slim high energy density 5000 mAh Lithium-ion polymer pouch battery with dual-cell 65W fast charge.",
            unit_price=12.50,
            currency="USD",
            moq=100,
            lead_time_days=18,
            material="Lithium-ion Polymer",
            specifications="Capacity: 5000 mAh | Nominal: 3.85V | Fast Charge: 65W | Cycle Life: 1000+ cycles @ 80%",
            origin_country="South Korea",
            available_quantity=15000,
            in_stock=True
        )
        cat4 = CatalogItem(
            supplier_id=s_batt.id,
            name="Lithium-ion battery pack (75Wh Smart Laptop)",
            part_number="VMX-BAT-75WH",
            category="Battery",
            description="4-Cell integrated smart laptop battery pack with embedded I2C fuel gauge and thermal protection.",
            unit_price=28.00,
            currency="USD",
            moq=50,
            lead_time_days=14,
            material="Lithium-ion Cells / PCM",
            specifications="Energy: 75 Wh | Nominal: 15.4V | Interface: SMBus/I2C | Overcharge/Short Protection",
            origin_country="South Korea",
            available_quantity=8000,
            in_stock=True
        )
        db.add_all([cat3, cat4])

    # Check if HDI PCB & Display supplier exists
    s_ems = db.query(Supplier).filter(Supplier.slug == "dynasty-circuits-vietnam").first()
    if not s_ems:
        s_ems = Supplier(
            name="Dynasty Circuits & EMS Ltd",
            slug="dynasty-circuits-vietnam",
            description="High Density Interconnect (HDI) multilayer printed circuit board fabrication and automated SMT cleanroom assembly.",
            country="Vietnam",
            city="Ho Chi Minh City",
            address="Saigon Hi-Tech Park, District 9",
            website="https://dynastycircuits.demo.vn",
            contact_email="rfq@dynastycircuits.demo.vn",
            phone="+84-28-3730-8888",
            moq=50,
            lead_time_days=15,
            price_rating="$$",
            is_verified=True,
            verification_status="APPROVED",
            rating=4.7,
            legal_business_name="Dynasty Circuits Vietnam Co., Ltd.",
            business_type="EMS & PCB Manufacturer",
            production_capacity="100,000 sq meters PCB / month",
            materials_supported="High-Tg FR-4, Polyimide, Halogen-Free Laminates, ENIG / Immersion Gold",
            certifications_documents="ISO 9001:2015, ISO 13485, IATF 16949, RoHS",
            profile_completeness=95
        )
        db.add(s_ems)
        db.flush()

        cap3 = SupplierCapability(
            supplier_id=s_ems.id,
            category="Electronics",
            process_type="Laser Micro-Via HDI PCB Fabrication, SMT Surface Mount Assembly 01005 chips",
            materials="High-Tg FR-4, Immersion Gold ENIG",
            certifications="ISO 9001:2015, IATF 16949"
        )
        db.add(cap3)

        cat5 = CatalogItem(
            supplier_id=s_ems.id,
            name="Printed circuit board (PCB) 10-Layer HDI",
            part_number="DYN-PCB-10HDI",
            category="Electronics",
            description="10-Layer Any-Layer HDI PCB with laser micro-vias, 0.35mm BGA pitch, and immersion gold finish.",
            unit_price=8.50,
            currency="USD",
            moq=100,
            lead_time_days=15,
            material="High-Tg FR-4 / ENIG",
            specifications="Layers: 10 | Min Trace/Space: 2.5mil/2.5mil | Micro-via: 75um | Impedance: ±7%",
            origin_country="Vietnam",
            available_quantity=20000,
            in_stock=True
        )
        cat6 = CatalogItem(
            supplier_id=s_ems.id,
            name="Display module (6.7-inch AMOLED 120Hz)",
            part_number="DYN-DISP-67AMOLED",
            category="Electronics",
            description="Flexible 6.7-inch AMOLED display module with integrated LTPO dynamic refresh and touch digitizer.",
            unit_price=55.00,
            currency="USD",
            moq=50,
            lead_time_days=16,
            material="OLED / Corning Gorilla Glass",
            specifications="Size: 6.7-inch | Res: 2400x1080 | 120Hz LTPO | Peak Brightness: 1600 nits",
            origin_country="Vietnam",
            available_quantity=6000,
            in_stock=True
        )
        db.add_all([cat5, cat6])

    # Check if Samsung supplier exists
    s_samsung = db.query(Supplier).filter(Supplier.slug == "samsung-electro-mechanics-korea").first()
    if not s_samsung:
        s_samsung = Supplier(
            name="Samsung Electro-Mechanics & Device Solutions",
            slug="samsung-electro-mechanics-korea",
            description="Global manufacturer of Multi-Layer Ceramic Capacitors (MLCC), camera modules, flip-chip BGA substrates, and optical sensor modules.",
            country="South Korea",
            city="Suwon",
            address="Maeyoung-ro, Yeongtong-gu, Suwon-si, Gyeonggi-do",
            website="https://samsungsem.demo.kr",
            contact_email="b2b-supply@samsungsem.demo.kr",
            phone="+82-31-210-5114",
            moq=100,
            lead_time_days=18,
            price_rating="$$$",
            is_verified=True,
            verification_status="APPROVED",
            rating=4.9,
            legal_business_name="Samsung Electro-Mechanics Co., Ltd.",
            business_type="Electronic Component Manufacturer",
            production_capacity="10,000,000 MLCC & Camera Units / month",
            materials_supported="Barium Titanate Ceramic, Nickel Electrodes, Optical Glass, Copper Foil",
            certifications_documents="ISO 9001:2015, IATF 16949, ISO 14001, Sony Green Partner",
            profile_completeness=100
        )
        db.add(s_samsung)
        db.flush()

        cap_s1 = SupplierCapability(
            supplier_id=s_samsung.id,
            category="Semiconductor & Passive Components",
            process_type="High-Capacitance Ultra-Thin MLCC Stacking, High-Precision Sintering",
            materials="Barium Titanate, Nickel Internal Electrodes",
            certifications="IATF 16949, ISO 9001:2015"
        )
        cap_s2 = SupplierCapability(
            supplier_id=s_samsung.id,
            category="Camera & Optics",
            process_type="Periscope Optical Zoom Assembly, 10x Folded Telephoto Lens, Actuator Cleanroom SMT",
            materials="Molded Optical Glass, Voice Coil Motor (VCM)",
            certifications="ISO 9001:2015, IATF 16949"
        )
        db.add_all([cap_s1, cap_s2])

        cat_s1 = CatalogItem(
            supplier_id=s_samsung.id,
            name="Camera modules (50MP Periscope OIS + Ultra-Wide)",
            part_number="SEM-CAM-50OIS",
            category="Electronics",
            description="Dual mobile camera sub-assembly integrating 50MP 1/1.3-inch primary sensor with optical image stabilization and periscope telephoto.",
            unit_price=28.00,
            currency="USD",
            moq=100,
            lead_time_days=18,
            material="Optical Glass / VCM / Ceramic Substrate",
            specifications="50MP f/1.8 24mm equivalent OIS | 12MP 5x Folded Telephoto | MIPI CSI-2 interface",
            origin_country="South Korea",
            available_quantity=15000,
            in_stock=True
        )
        cat_s2 = CatalogItem(
            supplier_id=s_samsung.id,
            name="Multi-Layer Ceramic Capacitors (0201 High-Q MLCC)",
            part_number="SEM-MLCC-0201",
            category="Semiconductor",
            description="Sub-miniature high-capacitance MLCC reels designed for high-frequency RF front-end filtering and power rail stabilization.",
            unit_price=0.04,
            currency="USD",
            moq=5000,
            lead_time_days=10,
            material="Ceramic / Nickel",
            specifications="Size: 0201 (0.6x0.3mm) | Capacitance: 10uF | Voltage: 6.3V | Tolerance: ±10%",
            origin_country="South Korea",
            available_quantity=500000,
            in_stock=True
        )
        db.add_all([cat_s1, cat_s2])

    # Check if Foxconn / Apple contract fabricator exists
    s_foxconn = db.query(Supplier).filter(Supplier.slug == "foxconn-precision-fabricators").first()
    if not s_foxconn:
        s_foxconn = Supplier(
            name="Foxconn Precision Fabricators (Apple Industrial Supply)",
            slug="foxconn-precision-fabricators",
            description="Primary global Tier-1 contract manufacturer for Apple and enterprise OEMs specializing in CNC aluminum unibody chassis, precision laser tooling, and cleanroom assembly.",
            country="Taiwan",
            city="Taipei",
            address="Tucheng Industrial Park, New Taipei City",
            website="https://foxconn.demo.tw",
            contact_email="oem-procurement@foxconn.demo.tw",
            phone="+886-2-2268-3466",
            moq=50,
            lead_time_days=21,
            price_rating="$$$$",
            is_verified=True,
            verification_status="APPROVED",
            rating=4.9,
            legal_business_name="Hon Hai Precision Industry Co., Ltd.",
            business_type="Tier-1 EMS & Precision Enclosure Fabricator",
            production_capacity="5,000,000 Unibody Housings / month",
            materials_supported="Aerospace Aluminum 7000 Series, Titanium Grade 5, Stainless Steel 316L, Ceramic Shield Glass",
            certifications_documents="ISO 9001:2015, IATF 16949, AS9100D, ISO 14001, Apple Supplier Responsibility Certified",
            profile_completeness=100
        )
        db.add(s_foxconn)
        db.flush()

        cap_f1 = SupplierCapability(
            supplier_id=s_foxconn.id,
            category="Precision Enclosures",
            process_type="High-Speed 5-Axis CNC Milling, Diamond-Cut Chamfering, Type III Anodizing",
            materials="Aluminum 7075-T6, Titanium Alloy Ti-6Al-4V",
            certifications="ISO 9001:2015, AS9100D"
        )
        db.add(cap_f1)

        cat_f1 = CatalogItem(
            supplier_id=s_foxconn.id,
            name="Smartphone Enclosure and Structural Chassis (Series 7000)",
            part_number="FXN-CHAS-SP70",
            category="CNC Machining",
            description="Precision milled aerospace-grade 7000-series aluminum unibody frame with integrated antenna split lines and internal heat sink pocket.",
            unit_price=18.00,
            currency="USD",
            moq=100,
            lead_time_days=20,
            material="Aluminum 7000 / Titanium Inset",
            specifications="Tolerance: ±0.015mm | Bead-Blasted Anodized | Integrated Ceramic Heat Dissipation Spreader",
            origin_country="Taiwan",
            available_quantity=20000,
            in_stock=True
        )
        cat_f2 = CatalogItem(
            supplier_id=s_foxconn.id,
            name="CNC Machined Laptop Enclosure (14-inch Unibody)",
            part_number="FXN-CHAS-LT14",
            category="CNC Machining",
            description="Seamless monolithic aluminum unibody laptop top and bottom clamshell assembly with CNC keyboard grille and magnetic hinge mounts.",
            unit_price=34.50,
            currency="USD",
            moq=50,
            lead_time_days=21,
            material="Aluminum 6063-T6",
            specifications="Dimensions: 312x221x15mm | CNC Milled Keyboard Openings | Surface Roughness: Ra 0.4um",
            origin_country="Taiwan",
            available_quantity=8000,
            in_stock=True
        )
        db.add_all([cat_f1, cat_f2])

    db.commit()


COMPUTING_RELATIONSHIPS = [
    # ==========================================
    # LAPTOP (16 Components)
    # ==========================================
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Processor (CPU)",
        "child_category": "Semiconductor",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Central execution and mobile system computing",
        "specification_details": "Intel Core i7-13700H Mobile / AMD Ryzen 7 7840HS, 14 Cores (6P+8E), up to 5.0 GHz Turbo, 45W Base TDP, integrated Iris Xe / Radeon 780M graphics",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "High-Efficiency Mobile Computing",
        "estimated_cost_reference": 175.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Semiconductor",
        "subcomponents_json": json.dumps(["CPU Cores", "Integrated Graphics", "Neural Engine", "Integrated Memory Controller", "PCIe Root Complex"]),
        "notes": json.dumps({
            "alternatives": ["AMD Ryzen 7 7840HS Mobile", "Intel Core i5-13500H", "Apple M3 (Proprietary ARM)", "Qualcomm Snapdragon X Elite"],
            "compatibility": "BGA soldered directly to laptop motherboard; 45W thermal cooling envelope requires dual heat-pipe thermal dissipation.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Motherboard",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Main system interconnect, power delivery, and logic circuit assembly",
        "specification_details": "10-Layer Low-Loss HDI PCB, embedded CPU BGA socket, dual DDR5 SO-DIMM slots, 2x M.2 NVMe PCIe 4.0, integrated Thunderbolt 4 / USB4 controllers, real-time power regulation (VRM)",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "10-Layer Low-Loss Mobile Platform",
        "estimated_cost_reference": 42.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["HDI Multi-Layer PCB Substrate", "VRM MOSFET Power Stages", "Thunderbolt / USB4 Controller", "Embedded Controller (EC) Chip", "Audio Codec IC"]),
        "notes": json.dumps({
            "alternatives": ["Custom 12-Layer Ultra-Thin Form-Factor PCB", "LPDDR5 Soldered Memory Mainboard", "AMD FP8 Platform Mainboard"],
            "compatibility": "Engineered for 14/15.6-inch laptop chassis geometry, dual fan exhaust layout, and 45W thermal dissipation envelopes.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "RAM",
        "child_category": "Semiconductor",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "High-speed volatile system working memory",
        "specification_details": "16GB (or 2x8GB) DDR5-5600 SO-DIMM 262-pin, 1.1V standard operating voltage, on-die ECC",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "High-Speed Mobile Memory Subsystem",
        "estimated_cost_reference": 34.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Semiconductor",
        "subcomponents_json": json.dumps(["DDR5 DRAM Dies", "SPD EEPROM", "Power Management IC (PMIC)", "262-Pin Gold Contact PCB"]),
        "notes": json.dumps({
            "alternatives": ["32GB DDR5-5600 SO-DIMM Kit", "LPDDR5X-6400 Soldered On-Board", "16GB DDR5-4800 SO-DIMM"],
            "compatibility": "Compatible with DDR5 SO-DIMM slots only. Incompatible with DDR4 slots or desktop 288-pin DIMMs.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Storage (SSD or HDD)",
        "child_category": "Semiconductor",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "High-speed non-volatile operating system and data storage",
        "specification_details": "1TB M.2 2280 NVMe PCIe 4.0 x4 SSD, Read 5000 MB/s, Write 4500 MB/s, 3D TLC NAND Flash, 600 TBW endurance",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "PCIe 4.0 M.2 Storage Subsystem",
        "estimated_cost_reference": 45.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Semiconductor",
        "subcomponents_json": json.dumps(["3D TLC NAND Flash Die", "Multi-Channel NVMe Controller", "DRAM Cache Buffer", "M.2 M-Key Connector Substrate"]),
        "notes": json.dumps({
            "alternatives": ["2TB M.2 2280 PCIe 4.0 NVMe SSD", "512GB M.2 2242 Compact NVMe SSD", "2TB 2.5-inch SATA SSD / HDD (Legacy)"],
            "compatibility": "M.2 2280 or 2242 form factor, M-Key slot with PCIe 4.0 / 3.0 backward compatibility.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Display panel",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Primary visual display output",
        "specification_details": "15.6-inch FHD (1920x1080) 144Hz IPS Anti-Glare Display Panel, 300 nits, 100% sRGB, 30-pin eDP interface, 3.2mm ultra-slim border",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "High Refresh Rate Anti-Glare IPS Display",
        "estimated_cost_reference": 58.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["IPS LCD Matrix Glass", "WLED Backlight Array", "Timing Controller (T-Con) Board", "Polarizer and Diffuser Films", "30-Pin eDP Ribbon Cable Interface"]),
        "notes": json.dumps({
            "alternatives": ["15.6-inch QHD 165Hz IPS Panel", "15.6-inch 4K OLED 60Hz Panel", "14-inch 16:10 2.8K OLED Display"],
            "compatibility": "Requires standard 30-pin eDP connector with 2-lane or 4-lane eDP 1.4 signaling from the motherboard.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Battery",
        "child_category": "Battery",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Internal rechargeable portable power supply",
        "specification_details": "70Wh 4-Cell Lithium-Polymer (Li-Po) Smart Battery Pack, 15.4V nominal voltage, integrated Battery Management System (BMS) with overcharge and thermal cutoff",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Slim Form-Factor High-Capacity Li-Po Pack",
        "estimated_cost_reference": 26.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Battery",
        "subcomponents_json": json.dumps(["4x Prismatic Li-Po Pouch Cells", "Battery Management System (BMS) Circuit", "SMBus Communication Bus", "Reinforced Flame-Retardant Casing"]),
        "notes": json.dumps({
            "alternatives": ["54Wh 3-Cell Slim Li-Po Battery", "80Wh High-Capacity Li-Po Battery (Extended Life)", "99.9Wh Flight-Safe Maximum Battery"],
            "compatibility": "Custom mechanical form factor matching the laptop lower enclosure palm rest interior. Requires SMBus / I2C telemetry with motherboard EC.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Keyboard and touchpad",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Primary tactile input and multi-touch navigation",
        "specification_details": "Scissor-switch backlit ergonomic chiclet keyboard (1.4mm key travel) paired with chemically etched glass Precision Multi-Touch Clickpad supporting Windows Precision drivers",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Precision Ergonomic Mobile Input Deck",
        "estimated_cost_reference": 18.50,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Scissor Mechanism Keys", "LED Backlight Guide Film", "Flexible Printed Circuit (FPC)", "Etched Glass Capacitive Sensor Surface", "Integrated Tactile Switches"]),
        "notes": json.dumps({
            "alternatives": ["Per-Key RGB Mechanical Switch Laptop Keyboard", "Standard Membrane Keyboard with Mylar Touchpad", "Compact 75% Non-Numpad Layout"],
            "compatibility": "Integrated into upper C-cover chassis; connects via high-density zero-insertion-force (ZIF) FPC connectors.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Cooling fan and heat sink",
        "child_category": "Metals & Raw Materials",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Thermal dissipation for CPU and GPU",
        "specification_details": "Dual copper heat pipe assembly (D6 sintering) with dual ultra-slim 0.2mm blade centrifugal blower fans (5V PWM) and micro-fin copper exhaust radiator, 65W dissipation capacity",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Low-Profile Dual-Fan Sintered Thermal Module",
        "estimated_cost_reference": 14.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Metals & Raw Materials",
        "subcomponents_json": json.dumps(["Sintered Powder Copper Heat Pipes", "Micro-Fin Copper Radiator Fins", "Dual Centrifugal Fluid-Dynamic Blower Fans", "Phase Change Thermal Interface Material (TIM)"]),
        "notes": json.dumps({
            "alternatives": ["Vapor Chamber Cooling Assembly", "Single Heat Pipe Silent Low-Power Cooler (15W)", "Liquid Metal Thermal Compound Assembly"],
            "compatibility": "Must precisely align with CPU BGA die and GPU die mounting screw standoffs on motherboard; fits within 18mm laptop thickness.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Graphics processor (integrated or dedicated, as appropriate)",
        "child_category": "Semiconductor",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "3D graphics rendering, video encoding, and AI acceleration",
        "specification_details": "NVIDIA GeForce RTX 4060 Mobile GPU (8GB GDDR6, 128-bit bus, up to 75W TGP) or Integrated Intel Iris Xe Graphics (96 EUs)",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Dedicated Mobile Graphics Subsystem",
        "estimated_cost_reference": 125.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Semiconductor",
        "subcomponents_json": json.dumps(["GPU Die Silicon (AD107)", "4x 2GB GDDR6 Memory Chips", "Dedicated VRM Power Stages", "PCIe 4.0 x8 Mobile Interconnect"]),
        "notes": json.dumps({
            "alternatives": ["Intel Iris Xe Integrated Graphics (Zero added BOM cost)", "NVIDIA RTX 4050 Mobile 6GB", "AMD Radeon RX 7600M 8GB"],
            "compatibility": "Dedicated GPU requires dedicated VRAM footprint and shared cooling heat pipes on motherboard. Integrated GPU shares system DDR5 RAM.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Power adapter",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "AC-to-DC external power conversion and high-speed charging",
        "specification_details": "100W GaN (Gallium Nitride) USB-C Fast Charger, Universal 100-240V AC input, USB Power Delivery (USB-PD 3.0 / PPS), detachable 1.8m braided USB-C cable",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Universal GaN USB-PD 3.0 External Charger",
        "estimated_cost_reference": 15.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["GaN Power Transistor Module", "Flyback Transformer Subassembly", "USB-PD Protocol IC", "Thermal Heat Shield Housing"]),
        "notes": json.dumps({
            "alternatives": ["65W Ultra-Compact GaN Travel Charger", "140W USB-PD 3.1 Extended Power Range Charger", "230W Barrel Plug Heavy-Duty AC Adapter"],
            "compatibility": "USB Type-C Power Delivery 3.0 compatible with laptop USB-C / Thunderbolt charging ports.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Chassis and casing",
        "child_category": "CNC Machining",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Structural housing, display hinge support, and protective unibody exterior",
        "specification_details": "Precision CNC-machined aerospace-grade Aluminum 6063-T6 unibody enclosure: A-cover (display back), B-cover (bezel), C-cover (keyboard palm rest), D-cover (bottom ventilation base) with dual zinc-alloy drop hinges (25,000 cycle rating)",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Anodized Aerospace Aluminum 6063-T6 Monolithic Clamshell",
        "estimated_cost_reference": 28.00,
        "cost_currency": "USD",
        "supplier_category_hint": "CNC Machining",
        "subcomponents_json": json.dumps(["CNC Milled Top Cover (A-Shell)", "Precision Bezel Mask (B-Shell)", "Unibody Keyboard Deck (C-Shell)", "Vented Bottom Chassis (D-Shell)", "Dual Steel/Zinc Friction Hinges"]),
        "notes": json.dumps({
            "alternatives": ["Carbon Fiber Composite Lightweight Enclosure", "Magnesium-Aluminum Die-Cast Casing", "Molded Polycarbonate ABS Enclosure (Budget)"],
            "compatibility": "Houses 15.6-inch panel, specific motherboard screw mount patterns, and I/O port cutouts.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Wi-Fi and Bluetooth module, if not integrated",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Wireless local area network and peripheral radio connectivity",
        "specification_details": "Wi-Fi 6E / Wi-Fi 7 (802.11ax/be) + Bluetooth 5.4 M.2 2230 module, 2x2 TX/RX dual-stream, 2.4/5/6 GHz tri-band, up to 2.4 Gbps throughput",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Tri-Band High-Throughput Wireless Module",
        "estimated_cost_reference": 14.50,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Tri-Band RF Front-End Module", "Baseband MAC Processor", "M.2 Key-E Connector Interface", "Dual IPEX MHF4 Antenna Connectors"]),
        "notes": json.dumps({
            "alternatives": ["Intel AX210 Wi-Fi 6E M.2 2230", "MediaTek MT7922 Wi-Fi 6E", "Intel Killer BE1750 Wi-Fi 7", "Soldered CNVi RF Module"],
            "compatibility": "Installs into motherboard M.2 Key-E slot (PCIe/USB interface). Requires connection to dual display-lid antennas.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Speakers",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Stereo acoustic audio output",
        "specification_details": "Dual stereo 2W micro-speakers (4W total peak) with tuned acoustic damping resonance chambers, neodymium magnets, and smart amplifier DSP integration",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Dual Tuned Acoustic Resonance Chambers",
        "estimated_cost_reference": 4.80,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Dual Neodymium Dynamic Transducers", "Acoustic Sealed Enclosures", "Anti-Vibration Rubber Isolation Mounts", "Audio FPC Wiring Harness"]),
        "notes": json.dumps({
            "alternatives": ["Quad Speaker Array (2 Woofers + 2 Tweeters)", "Dolby Atmos Certified Spatial Acoustic Module", "Single Mono 1.5W Micro-Speaker"],
            "compatibility": "Mounted into lower chassis vibration-isolated bays; connects directly to motherboard high-definition audio header.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Webcam",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Video conferencing and facial authentication",
        "specification_details": "1080p Full HD (1920x1080 @ 30fps) CMOS camera module with integrated dual digital MEMS noise-canceling microphone array and physical sliding privacy shutter",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "FHD Micro-Camera & Dual Mic Sub-Assembly",
        "estimated_cost_reference": 6.50,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["1080p CMOS Image Sensor", "Multi-Element Optical Glass Lens", "Dual Digital MEMS Microphones", "Integrated Physical Privacy Shutter", "Ultra-Slim Bezel Ribbon Harness"]),
        "notes": json.dumps({
            "alternatives": ["Windows Hello IR Facial Recognition Webcam Module", "720p HD Compact Webcam (Budget)", "5MP High-Resolution Quad-Mic Array"],
            "compatibility": "Embedded in top display bezel (B-shell); connects to motherboard via USB 2.0 / MIPI CSI-2 bus over display cable.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Ports and connectors",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "External peripheral input/output and expansion interfaces",
        "specification_details": "Integrated port daughterboard and mainboard I/O: 2x Thunderbolt 4 / USB-C, 2x USB 3.2 Gen 1 Type-A, 1x HDMI 2.1, 1x 3.5mm combo audio jack, 1x MicroSD card reader",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "High-Density Mixed I/O Sub-Assembly",
        "estimated_cost_reference": 5.50,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Thunderbolt 4 Receptacles", "USB-A Heavy-Cycle Connectors", "HDMI 2.1 Receptacle", "3.5mm Gold-Plated Audio Jack", "ESD Protection Diode Arrays"]),
        "notes": json.dumps({
            "alternatives": ["Modular Replaceable I/O Daughterboard", "Full-Size SD Express 7.0 Card Reader Module", "RJ-45 Drop-Jaw Gigabit Ethernet Port"],
            "compatibility": "Soldered on motherboard and daughterboard; matches precision cutouts on laptop C/D chassis shells.",
            "scope": "LAPTOP"
        })
    },
    {
        "parent_name": "Laptop",
        "parent_category": "Computing Systems",
        "child_name": "Cables and assembly materials",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Internal interconnection, RF signal routing, grounding, and structural fastening",
        "specification_details": "Complete internal assembly kit: 40-pin micro-coaxial eDP display cable, dual Wi-Fi antenna routing cables, I/O flexible flat cables (FFC), conductive EMI grounding copper foil, graphite heat spreader sheets, and Torx T5 chassis screw set",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Precision Internal Interconnect & EMI Shielding Kit",
        "estimated_cost_reference": 6.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Micro-Coaxial eDP Cable", "Dual Wi-Fi IPEX MHF4 Cables", "Conductive EMI Grounding Gaskets", "Graphite Thermal Sheets", "Black Zinc Torx Fastener Set"]),
        "notes": json.dumps({
            "alternatives": ["High-Flex Armored eDP Display Cable", "Custom Die-Cut Thermal Pad Kit", "Anti-Tamper Pentalobe Screw Kit"],
            "compatibility": "Engineered for 15.6-inch laptop internal routing channels and EMI shielding standards.",
            "scope": "LAPTOP"
        })
    },

    # ==========================================
    # DESKTOP TOWER (11 Components - Core internal tower, NO monitor/keyboard/mouse)
    # ==========================================
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "Processor (CPU)",
        "child_category": "Semiconductor",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Central execution and desktop workload computation",
        "specification_details": "Intel Core i7-14700K (Socket LGA1700, 20 Cores [8P+12E], 28 Threads, up to 5.6 GHz Turbo, 125W Base / 253W Max TDP) or AMD Ryzen 7 7800X3D (Socket AM5, 8 Cores, 3D V-Cache, 120W TDP)",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "High-Performance Desktop Computing",
        "estimated_cost_reference": 340.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Semiconductor",
        "subcomponents_json": json.dumps(["LGA Package Substrate", "Performance & Efficiency Cores", "Intel UHD Graphics 770", "L3 Smart Cache (33MB)", "Integrated PCIe 5.0 Controller"]),
        "notes": json.dumps({
            "alternatives": ["AMD Ryzen 7 7800X3D (Socket AM5)", "Intel Core i9-14900K (Socket LGA1700)", "Intel Core i5-14600K (Socket LGA1700)", "AMD Ryzen 9 7950X (Socket AM5)"],
            "compatibility": "Requires Socket LGA1700 (Intel 600/700 series) or Socket AM5 (AMD 600 series) motherboard. High TDP requires dedicated tower cooler (>240W capacity).",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "Motherboard",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Main platform interconnect, PCIe bus distribution, and high-current power delivery",
        "specification_details": "Intel Z790 ATX Motherboard, Socket LGA1700, 4x DDR5 DIMM slots (up to 7200+ MHz OC), 1x PCIe 5.0 x16 GPU slot, 4x M.2 NVMe PCIe 4.0 slots, 16+1+1 90A Power Stages, 2.5GbE LAN",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "ATX High-Current Desktop Platform",
        "estimated_cost_reference": 165.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Multi-Layer ATX PCB Substrate", "16+1+1 Phase VRM Power Stages", "Intel Z790 Chipset PCH", "ALC1220 HD Audio Codec", "2.5G Realtek/Intel Ethernet PHY"]),
        "notes": json.dumps({
            "alternatives": ["AMD B650 / X670E ATX Motherboard (AM5)", "Intel B760 ATX Motherboard", "Micro-ATX Form Factor Motherboard"],
            "compatibility": "ATX form factor (305x244mm) requires Mid-Tower or Full-Tower case. Socket LGA1700 matches Intel 13th/14th Gen CPUs. Supports DDR5 memory only.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "RAM",
        "child_category": "Semiconductor",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "High-speed volatile system working memory",
        "specification_details": "32GB (2x16GB) DDR5-6000 MHz CL30 Dual-Channel Desktop Memory Kit, 288-pin DIMM, 1.35V, Intel XMP 3.0 and AMD EXPO profile support, aluminum heat spreaders",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Dual-Channel DDR5 High-Speed Memory Kit",
        "estimated_cost_reference": 95.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Semiconductor",
        "subcomponents_json": json.dumps(["2x 16GB DDR5 288-Pin DIMM Modules", "High-Bin DRAM ICs", "On-DIMM Power Management IC (PMIC)", "Anodized Aluminum Thermal Spreaders"]),
        "notes": json.dumps({
            "alternatives": ["64GB (2x32GB) DDR5-6000 Kit", "32GB (2x16GB) DDR5-6400 Low-Latency Kit", "32GB (2x16GB) DDR4-3600 (For DDR4 Motherboards)"],
            "compatibility": "Compatible only with DDR5 desktop motherboards (288-pin DIMM). Incompatible with DDR4 slots or laptop SO-DIMMs.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "Storage (SSD or HDD)",
        "child_category": "Semiconductor",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "High-throughput primary solid-state drive for OS and enterprise data",
        "specification_details": "2TB M.2 2280 NVMe PCIe 4.0 x4 SSD, Sequential Read 7,000 MB/s, Sequential Write 6,500 MB/s, 3D TLC NAND Flash, 1200 TBW endurance, integrated thermal graphene label",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "PCIe 4.0 NVMe High-End M.2 SSD",
        "estimated_cost_reference": 115.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Semiconductor",
        "subcomponents_json": json.dumps(["Multi-Die 3D TLC V-NAND Flash", "8-Channel High-Speed NVMe Controller", "2GB LPDDR4 DRAM Cache", "M.2 2280 Form Factor PCB"]),
        "notes": json.dumps({
            "alternatives": ["1TB M.2 2280 PCIe 4.0 SSD", "4TB M.2 2280 PCIe 4.0 SSD", "4TB 3.5-inch 7200RPM Enterprise SATA HDD (Secondary Storage)"],
            "compatibility": "Installs into motherboard M.2 NVMe slot (PCIe 4.0/5.0). Heatsink provided by motherboard or cooler.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "Power supply unit (PSU)",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "High-efficiency AC-to-DC system power distribution",
        "specification_details": "850W ATX 3.0 / PCIe 5.0 Fully Modular Power Supply, 80-Plus Gold Certified (>90% efficiency), 12VHPWR 16-pin native GPU connector (up to 450W power draw), 100% Japanese 105C capacitors",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "ATX 3.0 80-Plus Gold High-Efficiency Power Module",
        "estimated_cost_reference": 105.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Heavy-Duty Steel ATX Casing", "Active PFC + LLC Resonant Converter", "135mm Fluid Dynamic Bearing Silent Fan", "Modular Cable Harness with 12VHPWR Cable"]),
        "notes": json.dumps({
            "alternatives": ["1000W ATX 3.0 80-Plus Gold Modular PSU (For RTX 4090 / Overclocking)", "750W ATX 3.0 80-Plus Gold Modular PSU", "850W 80-Plus Platinum Silent PSU"],
            "compatibility": "Standard ATX form factor (150x140x86mm). 850W provides >45% safety margin above estimated 440W total system load.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "Computer case",
        "child_category": "Sheet Metal",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Rigid steel enclosure, component mounting chassis, and airflow management",
        "specification_details": "Mid-Tower ATX High-Airflow Chassis, 0.8mm SPCC cold-rolled steel, front mesh panel, 4mm tempered glass side panel, supports ATX/Micro-ATX motherboards, 360mm radiator top/front, up to 400mm GPU clearance",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Mid-Tower ATX High-Airflow Steel/Glass Chassis",
        "estimated_cost_reference": 65.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Sheet Metal",
        "subcomponents_json": json.dumps(["0.8mm SPCC Steel Stamped Chassis Frame", "Perforated Mesh Front Intake Bezel", "4mm Quick-Release Tempered Glass Panel", "Front I/O Assembly (USB-C 3.2 Gen2 + USB 3.0 + Audio)"]),
        "notes": json.dumps({
            "alternatives": ["Full-Tower Extended ATX Chassis (Dual PSU / Custom Watercooling)", "Micro-ATX Compact Mini-Tower Case", "Dual-Chamber Panoramic Tempered Glass Case"],
            "compatibility": "Fits ATX/mATX motherboards, up to 175mm CPU cooler height, up to 400mm GPU length, standard ATX PSU up to 200mm.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "CPU cooler",
        "child_category": "Metals & Raw Materials",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Active heat extraction from desktop processor",
        "specification_details": "360mm All-In-One (AIO) Liquid CPU Cooler, aluminum 360mm radiator, copper micro-skived cold plate, 3x 120mm PWM static-pressure fans, 280W TDP cooling capacity, multi-socket LGA1700/AM5 mounting kit",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "360mm Liquid Closed-Loop Thermal Solution",
        "estimated_cost_reference": 68.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Metals & Raw Materials",
        "subcomponents_json": json.dumps(["Copper Cold Plate Waterblock with Ceramic Pump", "360mm Dual-Row Aluminum Radiator", "Low-Permeation Sleeved EPDM Tubing", "3x 120mm High Static Pressure PWM Fans", "LGA1700/AM5 Steel Backplate and Standoffs"]),
        "notes": json.dumps({
            "alternatives": ["Dual-Tower Twin-Fan Air Cooler (e.g., Peerless Assassin 120 / Noctua NH-D15)", "240mm AIO Liquid CPU Cooler", "360mm LCD Display AIO Liquid Cooler"],
            "compatibility": "Compatible with Intel LGA1700 and AMD AM5 sockets. Requires 360mm radiator mount in chassis top or front.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "Case fans",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Chassis positive-pressure intake and exhaust ventilation",
        "specification_details": "3x 120mm PWM Fluid Dynamic Bearing (FDB) Chassis Case Fans, 500-1800 RPM, 65.5 CFM max airflow, 2.56 mmH2O static pressure, <25 dBA noise level, 4-pin PWM daisy-chain cabling",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "120mm High Static Pressure PWM Case Fan Pack",
        "estimated_cost_reference": 22.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["3x 120mm High-Airflow Impellers", "Fluid Dynamic Bearing (FDB) Motors", "Anti-Vibration Silicone Corner Pads", "4-Pin PWM Daisy-Chain Cables"]),
        "notes": json.dumps({
            "alternatives": ["3x 140mm PWM High-Airflow Fans", "3x 120mm ARGB Addressable Lighting Fans", "Magnetic Levitation High-RPM Industrial Fans"],
            "compatibility": "Standard 120mm chassis mounting holes. Powered via 4-pin PWM headers on motherboard or fan hub.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "Graphics card (GPU)",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Dedicated high-performance 3D rendering, compute acceleration, and multi-display driving",
        "specification_details": "NVIDIA GeForce RTX 4070 Super 12GB GDDR6X, PCIe 4.0 x16, 7168 CUDA Cores, 2475 MHz Boost Clock, Triple-Fan cooling assembly, 3x DisplayPort 1.4a + 1x HDMI 2.1a, 220W TGP",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Dedicated Triple-Fan Desktop GPU Subsystem",
        "estimated_cost_reference": 485.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["AD104 Silicon GPU Die", "6x 2GB Micron GDDR6X Memory Chips", "Triple-Slot Vapor Chamber / Heatpipe Cooler", "Reinforced Rigid Metal Backplate", "16-Pin 12VHPWR Power Receptacle"]),
        "notes": json.dumps({
            "alternatives": ["AMD Radeon RX 7800 XT 16GB", "NVIDIA GeForce RTX 4080 Super 16GB", "NVIDIA GeForce RTX 4060 Ti 8GB/16GB", "AMD Radeon RX 7900 XTX 24GB"],
            "compatibility": "Requires PCIe 4.0 x16 slot, 280mm case clearance, and minimum 650W PSU with 12VHPWR or dual 8-pin PCIe power cables.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "Networking components",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "High-speed wireless and wired local network access",
        "specification_details": "Intel Wi-Fi 6E AX210 / Wi-Fi 7 BE200 PCIe x1 Desktop Adapter Card, 2.4 Gbps throughput, Bluetooth 5.3/5.4, dual external high-gain magnetic antenna base, plus integrated Realtek 2.5GbE RJ-45 LAN",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "PCIe High-Bandwidth Wi-Fi 6E/7 & 2.5GbE LAN",
        "estimated_cost_reference": 16.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["M.2 2230 Wi-Fi 6E/7 NIC Card", "PCIe x1 Expansion Bracket Adapter", "Dual External Omnidirectional Dipole Antennas", "Internal USB 2.0 Header Bluetooth Cable"]),
        "notes": json.dumps({
            "alternatives": ["10-Gigabit PCIe Ethernet NIC Card (Aquantia AQC107)", "Integrated Motherboard Wi-Fi Module (No PCIe slot used)", "Cat6A High-Shielded Gigabit Patch Cable"],
            "compatibility": "Installs into any standard PCIe x1 or x4 motherboard expansion slot. External antennas connect via standard RP-SMA jacks.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop Tower",
        "parent_category": "Computing Systems",
        "child_name": "Internal cables and accessories",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Internal system cabling, data routing, component retention, and hardware fastening",
        "specification_details": "Comprehensive desktop assembly kit: 2x SATA 6Gb/s latching cables, motherboard standoff set (6-32), GPU anti-sag support bracket, 20x reusable nylon cable ties, internal front-panel breakout adapter, and chassis fan splitter",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Standard ATX Cabling & Mounting Hardware",
        "estimated_cost_reference": 8.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["2x High-Shielded SATA III Cables", "Black Anodized Aluminum GPU Anti-Sag Bracket", "Brass Standoffs and Carbon Steel Thumb Screws", "Thermal Paste (5W/mK Syringe)"]),
        "notes": json.dumps({
            "alternatives": ["Custom Braided PSU Cable Extension Kit", "Magnetic GPU Sag Bracket with RGB", "Velcro Cable Management Straps"],
            "compatibility": "Universal standard hardware compliant with ATX chassis specifications.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },

    # ==========================================
    # DESKTOP PC (14 Components - Complete Desktop Setup, includes Monitor, Peripherals, Audio)
    # ==========================================
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Processor (CPU)",
        "child_category": "Semiconductor",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Central execution and desktop workload computation",
        "specification_details": "Intel Core i7-14700K (Socket LGA1700, 20 Cores [8P+12E], 28 Threads, up to 5.6 GHz Turbo, 125W Base / 253W Max TDP) or AMD Ryzen 7 7800X3D (Socket AM5, 8 Cores, 3D V-Cache, 120W TDP)",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "High-Performance Desktop Computing",
        "estimated_cost_reference": 340.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Semiconductor",
        "subcomponents_json": json.dumps(["LGA Package Substrate", "Performance & Efficiency Cores", "Intel UHD Graphics 770", "L3 Smart Cache (33MB)", "Integrated PCIe 5.0 Controller"]),
        "notes": json.dumps({
            "alternatives": ["AMD Ryzen 7 7800X3D (Socket AM5)", "Intel Core i9-14900K (Socket LGA1700)", "Intel Core i5-14600K (Socket LGA1700)", "AMD Ryzen 9 7950X (Socket AM5)"],
            "compatibility": "Requires Socket LGA1700 (Intel 600/700 series) or Socket AM5 (AMD 600 series) motherboard. High TDP requires dedicated tower cooler (>240W capacity).",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Motherboard",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Main platform interconnect, PCIe bus distribution, and high-current power delivery",
        "specification_details": "Intel Z790 ATX Motherboard, Socket LGA1700, 4x DDR5 DIMM slots (up to 7200+ MHz OC), 1x PCIe 5.0 x16 GPU slot, 4x M.2 NVMe PCIe 4.0 slots, 16+1+1 90A Power Stages, 2.5GbE LAN",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "ATX High-Current Desktop Platform",
        "estimated_cost_reference": 165.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Multi-Layer ATX PCB Substrate", "16+1+1 Phase VRM Power Stages", "Intel Z790 Chipset PCH", "ALC1220 HD Audio Codec", "2.5G Realtek/Intel Ethernet PHY"]),
        "notes": json.dumps({
            "alternatives": ["AMD B650 / X670E ATX Motherboard (AM5)", "Intel B760 ATX Motherboard", "Micro-ATX Form Factor Motherboard"],
            "compatibility": "ATX form factor (305x244mm) requires Mid-Tower or Full-Tower case. Socket LGA1700 matches Intel 13th/14th Gen CPUs. Supports DDR5 memory only.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "RAM",
        "child_category": "Semiconductor",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "High-speed volatile system working memory",
        "specification_details": "32GB (2x16GB) DDR5-6000 MHz CL30 Dual-Channel Desktop Memory Kit, 288-pin DIMM, 1.35V, Intel XMP 3.0 and AMD EXPO profile support, aluminum heat spreaders",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Dual-Channel DDR5 High-Speed Memory Kit",
        "estimated_cost_reference": 95.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Semiconductor",
        "subcomponents_json": json.dumps(["2x 16GB DDR5 288-Pin DIMM Modules", "High-Bin DRAM ICs", "On-DIMM Power Management IC (PMIC)", "Anodized Aluminum Thermal Spreaders"]),
        "notes": json.dumps({
            "alternatives": ["64GB (2x32GB) DDR5-6000 Kit", "32GB (2x16GB) DDR5-6400 Low-Latency Kit", "32GB (2x16GB) DDR4-3600 (For DDR4 Motherboards)"],
            "compatibility": "Compatible only with DDR5 desktop motherboards (288-pin DIMM). Incompatible with DDR4 slots or laptop SO-DIMMs.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Storage (SSD or HDD)",
        "child_category": "Semiconductor",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "High-throughput primary solid-state drive for OS and enterprise data",
        "specification_details": "2TB M.2 2280 NVMe PCIe 4.0 x4 SSD, Sequential Read 7,000 MB/s, Sequential Write 6,500 MB/s, 3D TLC NAND Flash, 1200 TBW endurance, integrated thermal graphene label",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "PCIe 4.0 NVMe High-End M.2 SSD",
        "estimated_cost_reference": 115.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Semiconductor",
        "subcomponents_json": json.dumps(["Multi-Die 3D TLC V-NAND Flash", "8-Channel High-Speed NVMe Controller", "2GB LPDDR4 DRAM Cache", "M.2 2280 Form Factor PCB"]),
        "notes": json.dumps({
            "alternatives": ["1TB M.2 2280 PCIe 4.0 SSD", "4TB M.2 2280 PCIe 4.0 SSD", "4TB 3.5-inch 7200RPM Enterprise SATA HDD (Secondary Storage)"],
            "compatibility": "Installs into motherboard M.2 NVMe slot (PCIe 4.0/5.0). Heatsink provided by motherboard or cooler.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Power supply unit (PSU)",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "High-efficiency AC-to-DC system power distribution",
        "specification_details": "850W ATX 3.0 / PCIe 5.0 Fully Modular Power Supply, 80-Plus Gold Certified (>90% efficiency), 12VHPWR 16-pin native GPU connector (up to 450W power draw), 100% Japanese 105C capacitors",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "ATX 3.0 80-Plus Gold High-Efficiency Power Module",
        "estimated_cost_reference": 105.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Heavy-Duty Steel ATX Casing", "Active PFC + LLC Resonant Converter", "135mm Fluid Dynamic Bearing Silent Fan", "Modular Cable Harness with 12VHPWR Cable"]),
        "notes": json.dumps({
            "alternatives": ["1000W ATX 3.0 80-Plus Gold Modular PSU (For RTX 4090 / Overclocking)", "750W ATX 3.0 80-Plus Gold Modular PSU", "850W 80-Plus Platinum Silent PSU"],
            "compatibility": "Standard ATX form factor (150x140x86mm). 850W provides >45% safety margin above estimated 440W total system load.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Computer case",
        "child_category": "Sheet Metal",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Rigid steel enclosure, component mounting chassis, and airflow management",
        "specification_details": "Mid-Tower ATX High-Airflow Chassis, 0.8mm SPCC cold-rolled steel, front mesh panel, 4mm tempered glass side panel, supports ATX/Micro-ATX motherboards, 360mm radiator top/front, up to 400mm GPU clearance",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Mid-Tower ATX High-Airflow Steel/Glass Chassis",
        "estimated_cost_reference": 65.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Sheet Metal",
        "subcomponents_json": json.dumps(["0.8mm SPCC Steel Stamped Chassis Frame", "Perforated Mesh Front Intake Bezel", "4mm Quick-Release Tempered Glass Panel", "Front I/O Assembly (USB-C 3.2 Gen2 + USB 3.0 + Audio)"]),
        "notes": json.dumps({
            "alternatives": ["Full-Tower Extended ATX Chassis (Dual PSU / Custom Watercooling)", "Micro-ATX Compact Mini-Tower Case", "Dual-Chamber Panoramic Tempered Glass Case"],
            "compatibility": "Fits ATX/mATX motherboards, up to 175mm CPU cooler height, up to 400mm GPU length, standard ATX PSU up to 200mm.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "CPU cooler",
        "child_category": "Metals & Raw Materials",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Active heat extraction from desktop processor",
        "specification_details": "360mm All-In-One (AIO) Liquid CPU Cooler, aluminum 360mm radiator, copper micro-skived cold plate, 3x 120mm PWM static-pressure fans, 280W TDP cooling capacity, multi-socket LGA1700/AM5 mounting kit",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "360mm Liquid Closed-Loop Thermal Solution",
        "estimated_cost_reference": 68.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Metals & Raw Materials",
        "subcomponents_json": json.dumps(["Copper Cold Plate Waterblock with Ceramic Pump", "360mm Dual-Row Aluminum Radiator", "Low-Permeation Sleeved EPDM Tubing", "3x 120mm High Static Pressure PWM Fans", "LGA1700/AM5 Steel Backplate and Standoffs"]),
        "notes": json.dumps({
            "alternatives": ["Dual-Tower Twin-Fan Air Cooler (e.g., Peerless Assassin 120 / Noctua NH-D15)", "240mm AIO Liquid CPU Cooler", "360mm LCD Display AIO Liquid Cooler"],
            "compatibility": "Compatible with Intel LGA1700 and AMD AM5 sockets. Requires 360mm radiator mount in chassis top or front.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Case fans",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Chassis positive-pressure intake and exhaust ventilation",
        "specification_details": "3x 120mm PWM Fluid Dynamic Bearing (FDB) Chassis Case Fans, 500-1800 RPM, 65.5 CFM max airflow, 2.56 mmH2O static pressure, <25 dBA noise level, 4-pin PWM daisy-chain cabling",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "120mm High Static Pressure PWM Case Fan Pack",
        "estimated_cost_reference": 22.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["3x 120mm High-Airflow Impellers", "Fluid Dynamic Bearing (FDB) Motors", "Anti-Vibration Silicone Corner Pads", "4-Pin PWM Daisy-Chain Cables"]),
        "notes": json.dumps({
            "alternatives": ["3x 140mm PWM High-Airflow Fans", "3x 120mm ARGB Addressable Lighting Fans", "Magnetic Levitation High-RPM Industrial Fans"],
            "compatibility": "Standard 120mm chassis mounting holes. Powered via 4-pin PWM headers on motherboard or fan hub.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Graphics card (GPU)",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Dedicated high-performance 3D rendering, compute acceleration, and multi-display driving",
        "specification_details": "NVIDIA GeForce RTX 4070 Super 12GB GDDR6X, PCIe 4.0 x16, 7168 CUDA Cores, 2475 MHz Boost Clock, Triple-Fan cooling assembly, 3x DisplayPort 1.4a + 1x HDMI 2.1a, 220W TGP",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Dedicated Triple-Fan Desktop GPU Subsystem",
        "estimated_cost_reference": 485.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["AD104 Silicon GPU Die", "6x 2GB Micron GDDR6X Memory Chips", "Triple-Slot Vapor Chamber / Heatpipe Cooler", "Reinforced Rigid Metal Backplate", "16-Pin 12VHPWR Power Receptacle"]),
        "notes": json.dumps({
            "alternatives": ["AMD Radeon RX 7800 XT 16GB", "NVIDIA GeForce RTX 4080 Super 16GB", "NVIDIA GeForce RTX 4060 Ti 8GB/16GB", "AMD Radeon RX 7900 XTX 24GB"],
            "compatibility": "Requires PCIe 4.0 x16 slot, 280mm case clearance, and minimum 650W PSU with 12VHPWR or dual 8-pin PCIe power cables.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Networking components",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "High-speed wireless and wired local network access",
        "specification_details": "Intel Wi-Fi 6E AX210 / Wi-Fi 7 BE200 PCIe x1 Desktop Adapter Card, 2.4 Gbps throughput, Bluetooth 5.3/5.4, dual external high-gain magnetic antenna base, plus integrated Realtek 2.5GbE RJ-45 LAN",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "PCIe High-Bandwidth Wi-Fi 6E/7 & 2.5GbE LAN",
        "estimated_cost_reference": 16.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["M.2 2230 Wi-Fi 6E/7 NIC Card", "PCIe x1 Expansion Bracket Adapter", "Dual External Omnidirectional Dipole Antennas", "Internal USB 2.0 Header Bluetooth Cable"]),
        "notes": json.dumps({
            "alternatives": ["10-Gigabit PCIe Ethernet NIC Card (Aquantia AQC107)", "Integrated Motherboard Wi-Fi Module (No PCIe slot used)", "Cat6A High-Shielded Gigabit Patch Cable"],
            "compatibility": "Installs into any standard PCIe x1 or x4 motherboard expansion slot. External antennas connect via standard RP-SMA jacks.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Internal cables and accessories",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Internal system cabling, data routing, component retention, and hardware fastening",
        "specification_details": "Comprehensive desktop assembly kit: 2x SATA 6Gb/s latching cables, motherboard standoff set (6-32), GPU anti-sag support bracket, 20x reusable nylon cable ties, internal front-panel breakout adapter, and chassis fan splitter",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Standard ATX Cabling & Mounting Hardware",
        "estimated_cost_reference": 8.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["2x High-Shielded SATA III Cables", "Black Anodized Aluminum GPU Anti-Sag Bracket", "Brass Standoffs and Carbon Steel Thumb Screws", "Thermal Paste (5W/mK Syringe)"]),
        "notes": json.dumps({
            "alternatives": ["Custom Braided PSU Cable Extension Kit", "Magnetic GPU Sag Bracket with RGB", "Velcro Cable Management Straps"],
            "compatibility": "Universal standard hardware compliant with ATX chassis specifications.",
            "scope": "TOWER_AND_BUNDLE"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Monitor",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Primary visual display and workspace canvas",
        "specification_details": "27-inch QHD (2560x1440) 165Hz Fast-IPS Desktop Monitor, 1ms GtG, 99% sRGB / 95% DCI-P3, VESA DisplayHDR 400, AMD FreeSync Premium / G-Sync Compatible, DisplayPort 1.4 + 2x HDMI 2.0, fully ergonomic height/tilt/swivel/pivot stand",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "27-inch QHD 165Hz Fast-IPS Ergonomic Display",
        "estimated_cost_reference": 175.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["27-inch Fast-IPS Panel Cell", "WLED Edge Backlight Module", "Scalar / Timing Controller Mainboard", "Internal Power Supply Board", "Ergonomic Gas-Spring Aluminum Stand Assembly"]),
        "notes": json.dumps({
            "alternatives": ["32-inch 4K UHD (3840x2160) 144Hz IPS Monitor", "24-inch 1080p 144Hz Gaming Monitor (Budget)", "34-inch Ultrawide 1440p Curved Display"],
            "compatibility": "Includes DisplayPort 1.4 and HDMI 2.0 cables connecting to dedicated graphics card. VESA 100x100mm mounting support.",
            "scope": "BUNDLE_ONLY"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Keyboard and mouse",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Primary desktop tactile data entry and precision pointer control",
        "specification_details": "Desktop Peripherals Bundle: Tenkeyless (TKL) or Full-Size Mechanical Keyboard with hot-swappable linear switches, PBT double-shot keycaps, and white LED backlighting; paired with lightweight ergonomic optical mouse with 16,000 DPI sensor (PixArt PMW3389) and braided USB paracord",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "Tactile Mechanical Keyboard & Precision Optical Mouse",
        "estimated_cost_reference": 35.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Mechanical Keyboard with Aluminum Top Plate", "Hot-Swappable Linear Mechanical Switches", "Precision Optical Mouse with 16K Sensor", "2x Gold-Plated Braided USB Cables"]),
        "notes": json.dumps({
            "alternatives": ["2.4GHz Wireless Keyboard and Mouse Combo", "Quiet Membrane Office Keyboard & Mouse Set", "Ergonomic Split Keyboard with Vertical Mouse"],
            "compatibility": "Connects via standard USB 2.0/3.0 Type-A ports on rear I/O panel or front chassis ports. Plug-and-play driverless operation.",
            "scope": "BUNDLE_ONLY"
        })
    },
    {
        "parent_name": "Desktop PC",
        "parent_category": "Computing Systems",
        "child_name": "Speakers",
        "child_category": "Electronics",
        "relationship_type": "DIRECT_COMPONENT",
        "quantity": 1.0,
        "unit": "pcs",
        "typical_purpose": "Acoustic audio reproduction and communication sound output",
        "specification_details": "2.0 Desktop Stereo Multimedia Speakers, dual 2.5-inch dynamic drivers, 10W peak power (5W RMS), 3.5mm analog auxiliary input + USB power, front headphone jack and volume control knob",
        "verification_status": "VERIFIED",
        "source": "Namade Kadda Knowledge Base",
        "product_model_applicability": "2.0 Stereo Multimedia Acoustic Monitors",
        "estimated_cost_reference": 16.00,
        "cost_currency": "USD",
        "supplier_category_hint": "Electronics",
        "subcomponents_json": json.dumps(["Dual 2.5-inch Acoustic Driver Units", "Sealed Acoustic ABS Enclosures", "Integrated Class-D Stereo Amplifier PCB", "3.5mm Gold-Plated Audio + USB Power Cable"]),
        "notes": json.dumps({
            "alternatives": ["2.1 Stereo Speaker System with Dedicated Subwoofer", "USB Desktop Soundbar with Bluetooth 5.3", "Professional Studio Reference Monitors (Pair)"],
            "compatibility": "Connects to motherboard 3.5mm green line-out audio jack and USB Type-A port for power.",
            "scope": "BUNDLE_ONLY"
        })
    }
]


def ensure_computing_catalog_items(db: Session):
    """
    Ensure all authentic computing subcomponents are present in the catalog
    under genuine, verified suppliers in the database.
    """
    s_semi = db.query(Supplier).filter(Supplier.slug == "apex-microelectronics-taiwan").first()
    s_batt = db.query(Supplier).filter(Supplier.slug == "voltmax-energy-korea").first()
    s_ems = db.query(Supplier).filter(Supplier.slug == "dynasty-circuits-vietnam").first()
    s_samsung = db.query(Supplier).filter(Supplier.slug == "samsung-electro-mechanics-korea").first()
    s_foxconn = db.query(Supplier).filter(Supplier.slug == "foxconn-precision-fabricators").first()
    s_metal = db.query(Supplier).filter(Supplier.slug == "shenzhen-precision-metalworks-ltd").first()
    s_tokyo = db.query(Supplier).filter(Supplier.slug == "tokyo-sensor-robotics-co").first()

    catalog_items_to_add = [
        # Apex Microelectronics (Taiwan)
        (s_semi, "Intel Core i7-14700K Desktop Processor", "APX-CPU-14700K", "Semiconductor", 340.00, 10, 10, "Silicon Intel 7", "Socket LGA1700 | 20 Cores (8P+12E) | 5.6 GHz Turbo | 125W Base TDP", "Taiwan", 1200),
        (s_semi, "Intel Core i7-13700H Mobile Processor", "APX-CPU-13700H", "Semiconductor", 175.00, 20, 14, "Silicon BGA", "BGA Package | 14-Core (6P+8E) | 5.0 GHz Turbo | 45W TDP", "Taiwan", 3500),
        (s_semi, "Dedicated Desktop Graphics Card (NVIDIA RTX 4070 Super 12GB)", "APX-GPU-4070S", "Electronics", 485.00, 5, 12, "Silicon / Copper Heatpipes", "12GB GDDR6X | PCIe 4.0 x16 | 3x DP 1.4a + 1x HDMI 2.1 | 220W TGP", "Taiwan", 850),
        (s_semi, "Dedicated Mobile GPU (NVIDIA RTX 4060 Mobile 8GB)", "APX-GPU-4060M", "Semiconductor", 125.00, 25, 15, "Silicon GDDR6", "8GB GDDR6 | PCIe 4.0 x8 | 75W TGP | BGA Module", "Taiwan", 4000),
        (s_semi, "Wi-Fi 6E / Wi-Fi 7 + BT 5.4 M.2 2230 Wireless NIC", "APX-WIFI-6E", "Electronics", 14.50, 50, 10, "FR-4 PCB", "Tri-Band 2.4/5/6 GHz | 2.4 Gbps | Bluetooth 5.4 | M.2 2230", "Taiwan", 15000),

        # Dynasty Circuits & EMS Ltd (Vietnam)
        (s_ems, "Z790 ATX Desktop Motherboard (LGA1700 / DDR5)", "DYN-MB-Z790", "Electronics", 165.00, 15, 14, "High-Tg FR-4 / Copper", "Socket LGA1700 | 4x DDR5 DIMM | PCIe 5.0 x16 | 4x M.2 NVMe | 2.5GbE LAN", "Vietnam", 1800),
        (s_ems, "10-Layer Laptop Mainboard Assembly", "DYN-MB-LT14", "Electronics", 42.00, 50, 18, "Low-Loss FR-4", "10-Layer Low-Loss PCB | Dual DDR5 SO-DIMM | Thunderbolt 4 | PCIe 4.0", "Vietnam", 5000),
        (s_ems, "15.6-inch FHD (1920x1080) 144Hz IPS Laptop Display Panel", "DYN-DISP-156IPS", "Electronics", 58.00, 30, 12, "IPS Glass / LED", "15.6-inch | 1920x1080 | 144Hz IPS | 300 nits | 30-pin eDP", "Vietnam", 4500),
        (s_ems, "27-inch QHD (2560x1440) 165Hz IPS Desktop Monitor", "DYN-MON-27QHD", "Electronics", 175.00, 10, 15, "Fast IPS / Aluminum Stand", "27-inch IPS | 2560x1440 | 165Hz 1ms | HDR400 | DP 1.4 + HDMI 2.0 | Ergonomic Stand", "Vietnam", 1200),

        # Samsung Electro-Mechanics & Device Solutions (South Korea)
        (s_samsung, "32GB (2x16GB) DDR5-6000 Desktop Memory Kit", "SEC-RAM-D5-32G", "Semiconductor", 95.00, 20, 10, "Silicon DRAM / Aluminum", "32GB (2x16GB) | DDR5-6000 CL30 | 1.35V | Intel XMP 3.0 / AMD EXPO", "South Korea", 6000),
        (s_samsung, "16GB DDR5-5600 SO-DIMM Laptop RAM", "SEC-RAM-SO5-16G", "Semiconductor", 34.00, 50, 10, "Silicon DRAM", "16GB | DDR5-5600 CL46 | 1.1V JEDEC | SO-DIMM 262-pin", "South Korea", 12000),
        (s_samsung, "2TB M.2 2280 PCIe 4.0 NVMe SSD (7,000 MB/s)", "SEC-SSD-2TB-G4", "Semiconductor", 115.00, 15, 10, "3D TLC NAND", "2TB | PCIe 4.0 x4 NVMe | Read 7000 MB/s, Write 6500 MB/s | 1200 TBW", "South Korea", 5000),
        (s_samsung, "1TB M.2 2280 PCIe 4.0 NVMe SSD (5,000 MB/s)", "SEC-SSD-1TB-G4", "Semiconductor", 45.00, 30, 10, "3D TLC NAND", "1TB | PCIe 4.0 x4 NVMe | Read 5000 MB/s, Write 4500 MB/s | 600 TBW", "South Korea", 10000),

        # VoltMax Energy Systems Corp (South Korea)
        (s_batt, "850W ATX 3.0 80-Plus Gold Modular Power Supply (PSU)", "VMX-PSU-850G", "Electronics", 105.00, 20, 14, "Steel / Japanese Capacitors", "850W | 80-Plus Gold | ATX 3.0 / PCIe 5.0 | 12VHPWR Native | Fully Modular", "South Korea", 2500),
        (s_batt, "100W USB-C GaN Fast Power Adapter", "VMX-CHG-100W", "Electronics", 15.00, 50, 12, "GaN Semiconductor / ABS", "100W GaN | USB-PD 3.0 / PPS | 100-240V AC | Type-C Cable", "South Korea", 8000),

        # Shenzhen Precision Metalworks Ltd (China)
        (s_metal, "Mid-Tower ATX High-Airflow Tempered Glass PC Chassis", "SPM-CASE-ATX01", "Sheet Metal", 65.00, 20, 16, "0.8mm SPCC Steel / Tempered Glass", "Mid-Tower ATX | 4mm Tempered Glass | Mesh Front | 360mm Radiator & 400mm GPU support", "China", 3000),
        (s_metal, "CNC Aluminum Laptop Unibody Enclosure (15.6-inch)", "SPM-LT-CAS15", "CNC Machining", 28.00, 50, 18, "Aluminum 6063-T6", "Aluminum 6063-T6 | A/C covers CNC milled | Dual Zinc Alloy drop hinges", "China", 4500),

        # Foxconn Precision Fabricators (Taiwan)
        (s_foxconn, "360mm AIO Liquid CPU Cooler (LGA1700 / AM5)", "FXN-AIO-360", "Metals & Raw Materials", 68.00, 20, 14, "Copper / Aluminum / EPDM", "360mm Radiator | Micro-Fin Copper Base | 3x 120mm PWM Fans | 280W TDP", "Taiwan", 3500),
        (s_foxconn, "Laptop Dual Heat Pipe & Blower Fan Assembly", "FXN-LT-COOL", "Metals & Raw Materials", 14.00, 50, 14, "Copper C11000 / Polycarbonate", "Sintered Copper Heat Pipes | Dual 0.2mm Blower Fans | 65W TDP", "Taiwan", 8000),
        (s_foxconn, "Desktop Internal Cabling & Hardware Fastener Kit", "FXN-CAB-KIT", "Electronics", 8.00, 100, 10, "Copper Wire / Plated Steel", "2x SATA 6Gbps | Standoffs & Screws | Cable Ties | GPU Sag Bracket", "Taiwan", 15000),

        # Tokyo Sensor & Robotics Instruments Co (Japan)
        (s_tokyo, "120mm PWM High-Airflow Case Fans (Pack of 3)", "TKS-FAN-120P3", "Electronics", 22.00, 30, 12, "PBT Plastic / FDB Bearing", "3x 120mm PWM | 1800 RPM | 65.5 CFM | FDB Bearing <25 dBA", "Japan", 7500),
        (s_tokyo, "Mechanical Backlit Keyboard & Optical Precision Mouse Bundle", "TKS-KB-MS01", "Electronics", 35.00, 25, 14, "ABS Plastic / Aluminum Plate", "Mechanical Linear Switch Keyboard | 16,000 DPI Optical Mouse | USB Wired", "Japan", 4000),
        (s_tokyo, "Laptop Scissor Keyboard & Precision Touchpad Assembly", "TKS-LT-KEY01", "Electronics", 18.50, 50, 14, "ABS / Glass Touchpad", "Scissor-Switch 1.4mm Travel | LED Backlit | Glass Precision Touchpad", "Japan", 6000),
        (s_tokyo, "1080p FHD Dual-Mic Webcam Module", "TKS-CAM-1080P", "Electronics", 6.50, 50, 12, "CMOS / Optical Glass", "1080p @ 30fps | Dual Digital MEMS Mic | Privacy Shutter | USB 2.0", "Japan", 9000),
        (s_tokyo, "2.0 Desktop Stereo Acoustic Speakers", "TKS-SPK-20", "Electronics", 16.00, 30, 14, "ABS Acoustic Enclosure", "10W Peak / 5W RMS | Dual 2.5-inch Drivers | 3.5mm Aux + USB Power", "Japan", 3500)
    ]

    for sup, name, part, cat, price, moq, lead, mat, specs, orig, qty in catalog_items_to_add:
        if not sup:
            continue
        existing = db.query(CatalogItem).filter(CatalogItem.part_number == part).first()
        if not existing:
            item = CatalogItem(
                supplier_id=sup.id,
                name=name,
                part_number=part,
                category=cat,
                description=specs,
                unit_price=price,
                currency="USD",
                moq=moq,
                lead_time_days=lead,
                material=mat,
                specifications=specs,
                origin_country=orig,
                available_quantity=qty,
                in_stock=True
            )
            db.add(item)
    db.commit()
