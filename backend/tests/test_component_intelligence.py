import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.component_intelligence import ProductComponentRelationship
from app.models.bom import BOMProject, BOMItem
from app.models.sourcing import SourcingRequest

client = TestClient(app)


def test_search_phone_component_hierarchy():
    """1. Search Phone and display its component hierarchy."""
    response = client.get("/api/v1/component-intelligence/search?query=Phone&mode=auto_detect")
    assert response.status_code == 200
    data = response.json()
    assert data["detected_type"] == "PRODUCT"
    assert data["item_name"] == "Smartphone"
    assert len(data["components"]) >= 10

    # Verify specific components from prompt
    comp_names = [c["name"] for c in data["components"]]
    assert "Application processor / SoC" in comp_names
    assert "Memory chips" in comp_names
    assert "Display module" in comp_names
    assert "Battery cell and pack" in comp_names
    assert "Camera modules" in comp_names
    assert "Printed circuit board (PCB)" in comp_names

    # Check that supplier matches come from real database
    soc_comp = next(c for c in data["components"] if "Application processor" in c["name"])
    assert soc_comp["has_matching_suppliers"] is True
    assert len(soc_comp["supplier_matches"]) > 0
    first_supplier = soc_comp["supplier_matches"][0]
    assert first_supplier["name"] != ""
    assert first_supplier["country"] != ""


def test_search_chip_products_using_it():
    """2. Search Chip and display products that commonly use chips."""
    response = client.get("/api/v1/component-intelligence/search?query=Chip&mode=auto_detect")
    assert response.status_code == 200
    data = response.json()
    assert data["detected_type"] in ("COMPONENT", "RAW_MATERIAL")
    assert data["item_name"] == "Semiconductor chip"
    assert len(data["products"]) >= 4

    product_names = [p["product_name"] for p in data["products"]]
    assert "Smartphone" in product_names or "Laptop" in product_names
    for p in data["products"]:
        assert len(p["how_component_is_used"]) > 5
        assert p["verification_status"] in ("VERIFIED", "CURATED_REFERENCE", "AI_SUGGESTED")


def test_search_battery_applications():
    """3. Search Battery and display relevant product applications."""
    response = client.get("/api/v1/component-intelligence/search?query=Battery&mode=auto_detect")
    assert response.status_code == 200
    data = response.json()
    assert data["detected_type"] in ("COMPONENT", "RAW_MATERIAL")
    assert data["item_name"] == "Lithium-ion battery"
    assert len(data["products"]) >= 3

    product_names = [p["product_name"] for p in data["products"]]
    assert any("Vehicle" in name or "Drone" in name or "Phone" in name or "Laptop" in name for name in product_names)


def test_two_way_reverse_navigation_flow():
    """4 & 5. Open a component -> related products, and open product -> explore BOM."""
    # Step A: Start with Smartphone
    res_phone = client.get("/api/v1/component-intelligence/search?query=Smartphone&mode=find_components")
    assert res_phone.status_code == 200
    data_phone = res_phone.json()
    assert len(data_phone["components"]) > 0

    # Pick Display module
    display_comp = next(c for c in data_phone["components"] if "Display" in c["name"])
    assert display_comp is not None

    # Step B: Reverse navigate to products using Display module
    res_disp = client.get(f"/api/v1/component-intelligence/search?query={display_comp['name']}&mode=find_products")
    assert res_disp.status_code == 200
    data_disp = res_disp.json()
    assert len(data_disp["products"]) > 0
    disp_prods = [p["product_name"] for p in data_disp["products"]]
    assert "Smartphone" in disp_prods or "Laptop" in disp_prods

    # Step C: Pick another product from the list (e.g. Laptop or Smart Television) and explore its BOM
    next_prod = "Laptop" if "Laptop" in disp_prods else disp_prods[0]
    res_next = client.get(f"/api/v1/component-intelligence/search?query={next_prod}&mode=find_components")
    assert res_next.status_code == 200
    data_next = res_next.json()
    assert len(data_next["components"]) > 0


def test_find_suppliers_real_database():
    """6. Find suppliers using real stored marketplace data."""
    response = client.get("/api/v1/component-intelligence/suppliers?component_name=Copper Sheets&category=Metals %26 Raw Materials")
    assert response.status_code == 200
    suppliers = response.json()
    assert len(suppliers) > 0
    # Must have Bharat ForgeTech Solutions or Apex
    names = [s["name"] for s in suppliers]
    assert any("Bharat ForgeTech" in n or "Apex" in n for n in names)
    for s in suppliers:
        assert s["rating"] >= 4.0
        assert s["country"] in ("India", "Germany", "China", "Japan", "United States", "Taiwan", "South Korea", "Vietnam")


def test_ambiguous_and_unknown_queries():
    """7 & 8. Handle unknown or ambiguous queries gracefully."""
    # Ambiguous query "power"
    res_ambig = client.get("/api/v1/component-intelligence/search?query=power&mode=auto_detect")
    assert res_ambig.status_code == 200
    data_ambig = res_ambig.json()
    assert data_ambig["is_ambiguous"] is True
    assert len(data_ambig["disambiguation_options"]) >= 2

    # Unknown query "xyz999asdf"
    res_unk = client.get("/api/v1/component-intelligence/search?query=xyz999asdf&mode=auto_detect")
    assert res_unk.status_code == 200
    data_unk = res_unk.json()
    assert data_unk["detected_type"] == "UNKNOWN"
    assert len(data_unk["suggestions"]) > 0
    assert len(data_unk["components"]) == 0
    assert len(data_unk["products"]) == 0


def test_export_to_bom_workflow():
    """Export components to a real BOM project in the database."""
    payload = {
        "product_name": "Smart Connected Thermostat",
        "description": "Smart IoT thermostat hardware BOM",
        "components": [
            {
                "name": "Microcontroller SoC",
                "category": "Semiconductor",
                "quantity": 1,
                "unit": "pcs",
                "specification_details": "ARM Cortex-M4 120MHz with BLE",
                "estimated_cost_reference": 3.50,
                "verification_status": "VERIFIED"
            },
            {
                "name": "E-Ink Display Panel",
                "category": "Electronics",
                "quantity": 1,
                "unit": "pcs",
                "specification_details": "2.9-inch 296x128 monochrome E-paper display",
                "estimated_cost_reference": 5.80,
                "verification_status": "VERIFIED"
            }
        ]
    }
    response = client.post("/api/v1/component-intelligence/export-to-bom", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["bom_project_id"] > 0
    assert data["items_count"] == 2

    # Verify BOM project exists in database
    db = SessionLocal()
    bom = db.query(BOMProject).filter(BOMProject.id == data["bom_project_id"]).first()
    assert bom is not None
    assert len(bom.items) == 2
    db.close()


def test_create_sourcing_rfq_workflow():
    """Create a real sourcing request from a component."""
    payload = {
        "component_name": "Lithium-ion Battery Pack 5000mAh",
        "category": "Battery",
        "quantity": 1000,
        "unit": "pcs",
        "material": "Li-Po",
        "specifications": "5000mAh 3.85V 65W fast-charge",
        "target_budget": 12000.0,
        "currency": "USD",
        "destination_country": "India"
    }
    response = client.post("/api/v1/component-intelligence/create-sourcing-rfq", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["sourcing_request_id"] > 0
    assert "SR-2026-" in data["request_code"]

    # Verify in DB
    db = SessionLocal()
    sr = db.query(SourcingRequest).filter(SourcingRequest.id == data["sourcing_request_id"]).first()
    assert sr is not None
    assert sr.quantity == 1000
    db.close()


def test_laptop_component_discovery():
    """Verify Laptop search returns all 16 components with specs, alternatives, and compatibility."""
    response = client.get("/api/v1/component-intelligence/search?query=Laptop&mode=auto_detect")
    assert response.status_code == 200
    data = response.json()
    assert data["detected_type"] == "PRODUCT"
    assert data["item_name"] == "Laptop"
    assert len(data["components"]) == 16
    assert data["active_configuration"] == "Mobile Laptop Architecture"
    assert data["compatibility_summary"] is not None
    assert "thermal" in data["compatibility_summary"].lower()

    comp_names = [c["name"] for c in data["components"]]
    required_16 = [
        "Processor (CPU)",
        "Motherboard",
        "RAM",
        "Storage (SSD or HDD)",
        "Display panel",
        "Battery",
        "Keyboard and touchpad",
        "Cooling fan and heat sink",
        "Graphics processor (integrated or dedicated, as appropriate)",
        "Power adapter",
        "Chassis and casing",
        "Wi-Fi and Bluetooth module, if not integrated",
        "Speakers",
        "Webcam",
        "Ports and connectors",
        "Cables and assembly materials"
    ]
    for req in required_16:
        assert req in comp_names, f"Missing required laptop component: {req}"

    # Verify technical specifications, quantity, unit, and compatible alternatives
    cpu = next(c for c in data["components"] if c["name"] == "Processor (CPU)")
    assert cpu["quantity"] == 1.0
    assert cpu["unit"] == "pcs"
    assert len(cpu["compatible_alternatives"]) > 0
    assert any("Ryzen" in alt or "i5" in alt for alt in cpu["compatible_alternatives"])
    assert cpu["has_matching_suppliers"] is True


def test_notebook_computer_synonym():
    """Verify 'notebook computer' maps to Laptop and retrieves its full 16-component BOM."""
    response = client.get("/api/v1/component-intelligence/search?query=Notebook+computer&mode=auto_detect")
    assert response.status_code == 200
    data = response.json()
    assert data["resolved_query"] == "Laptop"
    assert len(data["components"]) == 16


def test_desktop_tower_discovery_excludes_peripherals():
    """Verify 'Desktop tower' returns 11 core components and strictly EXCLUDES monitor, keyboard, and mouse."""
    response = client.get("/api/v1/component-intelligence/search?query=Desktop+tower&mode=auto_detect")
    assert response.status_code == 200
    data = response.json()
    assert data["item_name"] == "Desktop Tower"
    assert len(data["components"]) == 11
    assert data["active_configuration"] == "Desktop Tower (Tower Only)"
    assert "Z790" in data["compatibility_summary"] or "LGA1700" in data["compatibility_summary"]

    comp_names = [c["name"] for c in data["components"]]
    # Strictly excluded from tower:
    assert "Monitor" not in comp_names
    assert "Keyboard and mouse" not in comp_names
    assert "Speakers" not in comp_names

    # Included core components:
    assert "Processor (CPU)" in comp_names
    assert "Motherboard" in comp_names
    assert "RAM" in comp_names
    assert "Storage (SSD or HDD)" in comp_names
    assert "Power supply unit (PSU)" in comp_names
    assert "Computer case" in comp_names
    assert "CPU cooler" in comp_names
    assert "Case fans" in comp_names
    assert "Graphics card (GPU)" in comp_names
    assert "Networking components" in comp_names
    assert "Internal cables and accessories" in comp_names


def test_desktop_pc_bundle_includes_peripherals():
    """Verify 'Desktop PC' and 'PC' return the complete 14-component workstation setup."""
    for q in ["Desktop PC", "Desktop computer", "PC"]:
        response = client.get(f"/api/v1/component-intelligence/search?query={q}&mode=auto_detect")
        assert response.status_code == 200
        data = response.json()
        assert data["resolved_query"] == "Desktop PC"
        assert len(data["components"]) == 14
        comp_names = [c["name"] for c in data["components"]]
        assert "Monitor" in comp_names
        assert "Keyboard and mouse" in comp_names
        assert "Speakers" in comp_names


def test_ambiguous_computer_disambiguation():
    """Verify ambiguous 'computer' query returns clarification options between Tower, Desktop PC, and Laptop."""
    response = client.get("/api/v1/component-intelligence/search?query=computer&mode=auto_detect")
    assert response.status_code == 200
    data = response.json()
    assert data["is_ambiguous"] is True
    assert len(data["disambiguation_options"]) >= 3
    queries = [opt["query"] for opt in data["disambiguation_options"]]
    assert "Desktop Tower" in queries
    assert "Desktop PC" in queries
    assert "Laptop" in queries

