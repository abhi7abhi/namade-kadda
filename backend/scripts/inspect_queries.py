import os
import re

app_dir = r"C:\Users\abhin\Downloads\namade-kadda\backend\app"
query_chains = []

for root, dirs, files in os.walk(app_dir):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                lines = fp.readlines()
                for i, line in enumerate(lines):
                    if "db.query(" in line:
                        full_chain = line.strip()
                        # collect multi-line chain
                        j = i + 1
                        while j < len(lines) and (lines[j].strip().startswith(".") or full_chain.endswith("(")):
                            full_chain += " " + lines[j].strip()
                            j += 1
                        query_chains.append((os.path.relpath(path, app_dir), i + 1, full_chain))

print(f"Total db.query calls: {len(query_chains)}")
# Sample 25 query chains
for file, line_no, chain in query_chains[:35]:
    print(f"[{file}:{line_no}] {chain[:100]}...")
