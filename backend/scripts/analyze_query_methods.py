import os
import re

app_dir = r"C:\Users\abhin\Downloads\namade-kadda\backend\app"
methods = set()
pattern = r"\.(filter|filter_by|order_by|limit|offset|all|first|one|one_or_none|count|scalar|join|options|group_by|distinct)\b"

for root, dirs, files in os.walk(app_dir):
    for f in files:
        if f.endswith(".py"):
            path = os.path.join(root, f)
            with open(path, "r", encoding="utf-8", errors="ignore") as fp:
                content = fp.read()
                found = re.findall(pattern, content)
                methods.update(found)

print("Methods used on queries:", sorted(methods))
