import os
import sys

TARGET_FILE = r"C:\Users\abhin\Downloads\namade-kadda\backend\app\seed\seed_component_intelligence.py"

with open(TARGET_FILE, "r", encoding="utf-8") as f:
    content = f.read()

# Check if COMPUTING_RELATIONSHIPS already in content
if "COMPUTING_RELATIONSHIPS =" not in content:
    from inject_computing_relationships import COMPUTING_RELATIONSHIPS_DEF
    content += "\n\n" + COMPUTING_RELATIONSHIPS_DEF.strip() + "\n"

# Update seed_component_intelligence function
old_check = """    # 2. Check if relationships already seeded
    existing_count = db.query(ProductComponentRelationship).count()
    if existing_count >= 30:
        print(f"Component Intelligence relationships already present ({existing_count} records).")
        return"""

new_check = """    # 2. Ensure computing catalog items exist under authentic suppliers
    ensure_computing_catalog_items(db)

    # 3. Check and seed computing relationships (Laptop, Desktop Tower, Desktop PC)
    comp_count = db.query(ProductComponentRelationship).filter(
        ProductComponentRelationship.parent_name.in_(["Laptop", "Desktop Tower", "Desktop PC"])
    ).count()
    if comp_count < 41:
        print(f"Seeding verified computing relationships (currently {comp_count}/41)...")
        db.query(ProductComponentRelationship).filter(
            ProductComponentRelationship.parent_name.in_(["Laptop", "Desktop Tower", "Desktop PC"])
        ).delete(synchronize_session=False)
        for rel in COMPUTING_RELATIONSHIPS:
            db.add(ProductComponentRelationship(**rel))
        db.commit()
        print("Successfully seeded 41 computing component relationships!")

    # 4. Check if base relationships already seeded
    existing_count = db.query(ProductComponentRelationship).count()
    if existing_count >= 70:
        print(f"Component Intelligence relationships already present ({existing_count} records).")
        return"""

if old_check in content:
    content = content.replace(old_check, new_check)
    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print("seed_component_intelligence.py updated successfully!")
else:
    print("Warning: old_check block not found in seed_component_intelligence.py")
