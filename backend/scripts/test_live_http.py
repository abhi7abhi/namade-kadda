import urllib.request
import json

endpoints = [
    ("Laptop", "http://localhost:8000/api/v1/component-intelligence/search?query=Laptop"),
    ("Notebook computer", "http://localhost:8000/api/v1/component-intelligence/search?query=Notebook+computer"),
    ("Desktop Tower", "http://localhost:8000/api/v1/component-intelligence/search?query=Desktop+Tower"),
    ("Desktop PC", "http://localhost:8000/api/v1/component-intelligence/search?query=Desktop+PC"),
    ("PC", "http://localhost:8000/api/v1/component-intelligence/search?query=PC"),
    ("Smartphone", "http://localhost:8000/api/v1/component-intelligence/search?query=Smartphone"),
    ("computer", "http://localhost:8000/api/v1/component-intelligence/search?query=computer")
]

for label, url in endpoints:
    req = urllib.request.urlopen(url)
    data = json.loads(req.read().decode("utf-8"))
    comps = len(data.get("components", []))
    active_cfg = data.get("active_configuration")
    resolved = data.get("resolved_query")
    is_amb = data.get("is_ambiguous")
    opts = len(data.get("disambiguation_options", []))
    print(f"[{label}] -> resolved='{resolved}' | comps={comps} | config='{active_cfg}' | ambiguous={is_amb} (options={opts})")

print("LIVE HTTP CHECKS COMPLETE!")
