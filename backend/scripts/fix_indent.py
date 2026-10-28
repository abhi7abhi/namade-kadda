path = r"C:\Users\abhin\Downloads\namade-kadda\backend\app\seed\seed_component_intelligence.py"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

bad_block = """    # 3. Check and seed computing relationships (Laptop, Desktop Tower, Desktop PC)
        old_comp = db.query(ProductComponentRelationship).filter(
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
        print("Successfully seeded 41 computing component relationships!")"""

good_block = """    # 3. Check and seed computing relationships (Laptop, Desktop Tower, Desktop PC)
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
        print("Successfully seeded 41 computing component relationships!")"""

# Replace in text normalizing CRLF / LF
if bad_block.replace("\r\n", "\n") in text.replace("\r\n", "\n"):
    text = text.replace("\r\n", "\n").replace(bad_block.replace("\r\n", "\n"), good_block.replace("\r\n", "\n"))
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print("Fixed indentation cleanly!")
else:
    print("bad_block not matched directly, replacing lines 20-35")
    lines = text.split("\n")
    fixed_lines = lines[:20] + [good_block] + lines[35:]
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(fixed_lines))
    print("Replaced by lines slice!")
