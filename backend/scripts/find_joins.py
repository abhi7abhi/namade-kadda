import os
import re

app_dir = r"C:\Users\abhin\Downloads\namade-kadda\backend\app"
for root, dirs, files in os.walk(app_dir):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                for i, line in enumerate(fp):
                    if ".join(" in line and "db.query" in line or (i > 0 and ".join(" in line):
                        if "join(" in line and ("User" in line or "Supplier" in line or "RFQ" in line or "Order" in line):
                            print(f"{os.path.relpath(path, app_dir)}:{i+1}: {line.strip()}")
