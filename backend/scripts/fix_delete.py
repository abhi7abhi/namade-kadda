path = r"C:\Users\abhin\Downloads\namade-kadda\backend\app\seed\seed_component_intelligence.py"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

target = """.delete(synchronize_session=False)"""
replacement = """.all()
        for oc in old_comp:
            db.delete(oc)"""

# Let's see lines 25 to 30
lines = text.splitlines(keepends=True)
new_lines = []
for i, line in enumerate(lines):
    if "db.query(ProductComponentRelationship).filter(" in line and i < 40:
        new_lines.append("        old_comp = db.query(ProductComponentRelationship).filter(\n")
    elif ").delete(synchronize_session=False)" in line and i < 40:
        new_lines.append("        ).all()\n        for oc in old_comp:\n            db.delete(oc)\n")
    else:
        new_lines.append(line)

with open(path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
print("Updated successfully!")
