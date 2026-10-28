import os
import shutil
import sqlite3
import json

db_path = r"C:\Users\abhin\Downloads\namade-kadda\backend\namade_kadda.db"
backup_path = r"C:\Users\abhin\Downloads\namade-kadda\backend\namade_kadda_backup.db"

if os.path.exists(db_path):
    shutil.copy2(db_path, backup_path)
    print(f"Backed up active database to: {backup_path}")

conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
tables = [row[0] for row in cur.fetchall()]

schema_report = {}
for table in sorted(tables):
    cur.execute(f"SELECT COUNT(*) FROM {table}")
    count = cur.fetchone()[0]
    cur.execute(f"PRAGMA table_info({table});")
    columns = [{"cid": col[0], "name": col[1], "type": col[2], "notnull": col[3], "pk": col[5]} for col in cur.fetchall()]
    schema_report[table] = {"row_count": count, "columns": columns}
    print(f"Table: {table:32} | Rows: {count:4} | Cols: {len(columns)}")

conn.close()

with open(r"C:\Users\abhin\Downloads\namade-kadda\backend\db_schema_report.json", "w", encoding="utf-8") as f:
    json.dump(schema_report, f, indent=2)

print("\nSaved full schema report to backend/db_schema_report.json")
