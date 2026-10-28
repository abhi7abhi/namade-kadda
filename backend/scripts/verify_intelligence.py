import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.services.component_intelligence_service import ComponentIntelligenceService

db = SessionLocal()
try:
    # 1. Laptop
    res_laptop = ComponentIntelligenceService.search(db, "Laptop")
    print(f"Laptop: detected={res_laptop.detected_type}, items={len(res_laptop.components)}, config={res_laptop.active_configuration}")
    assert len(res_laptop.components) == 16, f"Expected 16, got {len(res_laptop.components)}"
    assert res_laptop.compatibility_summary is not None
    # Check that compatible_alternatives exist
    cpu = [c for c in res_laptop.components if "Processor" in c.name][0]
    print(f"  CPU alternatives: {cpu.compatible_alternatives}")
    assert len(cpu.compatible_alternatives) > 0

    # 2. Notebook computer synonym
    res_notebook = ComponentIntelligenceService.search(db, "Notebook computer")
    print(f"Notebook computer -> {res_notebook.resolved_query}, items={len(res_notebook.components)}")
    assert res_notebook.resolved_query == "Laptop"
    assert len(res_notebook.components) == 16

    # 3. Desktop Tower
    res_tower = ComponentIntelligenceService.search(db, "Desktop Tower")
    print(f"Desktop Tower: items={len(res_tower.components)}, config={res_tower.active_configuration}")
    assert len(res_tower.components) == 11, f"Expected 11, got {len(res_tower.components)}"
    tower_names = [c.name for c in res_tower.components]
    # Verify monitor, keyboard, mouse are NOT present in Desktop Tower
    assert "Monitor" not in tower_names, "Monitor should not be in Desktop Tower!"
    assert "Keyboard and mouse" not in tower_names, "Keyboard and mouse should not be in Desktop Tower!"
    print("  Desktop Tower correctly excludes Monitor, Keyboard & Mouse!")

    # 4. Desktop PC / Complete Desktop Setup
    res_pc = ComponentIntelligenceService.search(db, "Desktop PC")
    print(f"Desktop PC: items={len(res_pc.components)}, config={res_pc.active_configuration}")
    assert len(res_pc.components) == 14, f"Expected 14, got {len(res_pc.components)}"
    pc_names = [c.name for c in res_pc.components]
    assert "Monitor" in pc_names
    assert "Keyboard and mouse" in pc_names
    assert "Speakers" in pc_names
    print("  Desktop PC correctly includes Monitor, Keyboard & Mouse, and Speakers!")

    # 5. PC synonym -> Desktop PC
    res_pc_syn = ComponentIntelligenceService.search(db, "PC")
    print(f"PC -> {res_pc_syn.resolved_query}, items={len(res_pc_syn.components)}")
    assert res_pc_syn.resolved_query == "Desktop PC"

    # 6. Ambiguous 'computer'
    res_amb = ComponentIntelligenceService.search(db, "computer")
    print(f"computer: is_ambiguous={res_amb.is_ambiguous}, options={len(res_amb.disambiguation_options)}")
    assert res_amb.is_ambiguous is True
    assert len(res_amb.disambiguation_options) >= 3

    # 7. Smartphone (preserved!)
    res_phone = ComponentIntelligenceService.search(db, "Smartphone")
    print(f"Smartphone: items={len(res_phone.components)}, config={res_phone.active_configuration}")
    assert len(res_phone.components) >= 10, f"Expected >= 10, got {len(res_phone.components)}"

    print("ALL 7 VERIFICATIONS PASSED SUCCESSFULLY!")

finally:
    db.close()
