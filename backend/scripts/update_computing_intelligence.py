import json
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.component_intelligence import ProductComponentRelationship
from app.models.supplier import Supplier, CatalogItem, SupplierCapability


def update_computing_catalog_and_relationships():
    db = SessionLocal()
    try:
        print("1. Updating computing catalog items under authentic suppliers...")
        
        # Suppliers
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

        added_items = 0
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
                added_items += 1
        db.commit()
        print(f"Added {added_items} new authentic computing catalog items.")

        print("2. Replacing/updating ProductComponentRelationship records for Laptop, Desktop Tower, and Desktop PC...")
        # Clean out old incomplete records for these three parent products
        old_rels = db.query(ProductComponentRelationship).filter(
            ProductComponentRelationship.parent_name.in_(["Laptop", "Desktop Tower", "Desktop PC"])
        ).all()
        for r in old_rels:
            db.delete(r)
        db.commit()

        # Load definitions
        from app.seed.seed_component_intelligence import COMPUTING_RELATIONSHIPS
        added_rels = 0
        for rel in COMPUTING_RELATIONSHIPS:
            rec = ProductComponentRelationship(**rel)
            db.add(rec)
            added_rels += 1
        db.commit()
        print(f"Successfully seeded {added_rels} verified computing component relationships!")

        # Verification counts
        laptop_c = db.query(ProductComponentRelationship).filter(ProductComponentRelationship.parent_name == "Laptop").count()
        tower_c = db.query(ProductComponentRelationship).filter(ProductComponentRelationship.parent_name == "Desktop Tower").count()
        pc_c = db.query(ProductComponentRelationship).filter(ProductComponentRelationship.parent_name == "Desktop PC").count()
        print(f"Verification: Laptop: {laptop_c} items | Desktop Tower: {tower_c} items | Desktop PC: {pc_c} items")

    except Exception as e:
        db.rollback()
        print(f"Error updating computing intelligence: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    update_computing_catalog_and_relationships()
