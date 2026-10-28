import json
import os
import sys

# Script to inject COMPUTING_RELATIONSHIPS and ensure_computing_catalog_items into seed_component_intelligence.py
# and seed MongoDB immediately.

COMPUTING_RELATIONSHIPS_DEF = '''
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
'''
