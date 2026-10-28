import os
import re

app_dir = r"C:\Users\abhin\Downloads\namade-kadda\backend\app"
patterns = [
    r"db\.query\(",
    r"db\.add\(",
    r"db\.commit\(",
    r"db\.flush\(",
    r"db\.delete\(",
    r"db\.execute\(",
    r"SessionLocal",
    r"joinedload",
]

results = {p: 0 for p in patterns}
file_matches = {}

for root, dirs, files in os.walk(app_dir):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                content = fp.read()
                matches_in_file = {}
                for p in patterns:
                    count = len(re.findall(p, content))
                    if count > 0:
                        results[p] += count
                        matches_in_file[p] = count
                if matches_in_file:
                    rel = os.path.relpath(path, app_dir)
                    file_matches[rel] = matches_in_file

print("Total pattern matches across app:")
for p, count in results.items():
    print(f"  {p:20}: {count}")

print(f"\nFiles with matches ({len(file_matches)}):")
for f, m in sorted(file_matches.items()):
    print(f"  {f:40}: {m}")
