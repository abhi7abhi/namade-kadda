import os
import sys
import sqlite3
import datetime
from bson import ObjectId
import pymongo

def migrate(sqlite_db_path: str, mongodb_url: str, db_name: str = "namade_kadda"):
    print(f"\n--- Migrating {sqlite_db_path} to MongoDB {mongodb_url} (db: {db_name}) ---")
    
    if not os.path.exists(sqlite_db_path):
        raise FileNotFoundError(f"SQLite file not found: {sqlite_db_path}")

    sql_conn = sqlite3.connect(sqlite_db_path)
    sql_conn.row_factory = sqlite3.Row
    sql_cur = sql_conn.cursor()

    mongo_client = pymongo.MongoClient(mongodb_url)
    db = mongo_client[db_name]

    # Map SQLite table name to primary MongoDB collection name
    TABLE_COLLECTION_MAP = {
        "users": "users",
        "suppliers": "companies",  # Also store in "suppliers"
        "supplier_capabilities": "supplier_capabilities",
        "catalog_items": "products",  # Also store in "catalog_items"
        "company_documents": "company_documents",
        "sourcing_requests": "sourcing_requests",
        "rfqs": "rfqs",
        "rfq_suppliers": "rfq_responses",  # Also store in "rfq_suppliers"
        "quotations": "quotations",
        "quotation_items": "quotation_items",
        "orders": "orders",
        "order_items": "order_items",
        "order_status_history": "order_status_history",
        "negotiation_messages": "negotiations",  # Also store in "messages"
        "complaints": "complaints",
        "complaint_evidence": "complaint_evidence",
        "complaint_messages": "complaint_messages",
        "complaint_status_history": "complaint_status_history",
        "notifications": "notifications",
        "audit_logs": "audit_logs",
        "bom_projects": "bom_projects",
        "bom_items": "bom_items",
        "trade_assessments": "trade_assessments",
        "agent_runs": "agent_runs",
        "agent_run_events": "agent_run_events",
        "product_component_relationships": "product_component_relationships",
        "saved_component_searches": "saved_component_searches",
    }

    # Fetch all table names
    sql_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [r[0] for r in sql_cur.fetchall()]

    counts = {}
    counters = {}

    for table in tables:
        sql_cur.execute(f"SELECT * FROM {table}")
        rows = sql_cur.fetchall()
        col_names = [d[0] for d in sql_cur.description]
        
        target_colls = []
        if table in TABLE_COLLECTION_MAP:
            target_colls.append(TABLE_COLLECTION_MAP[table])
        # Also maintain exact table name collection for 1:1 fidelity
        if table not in target_colls:
            target_colls.append(table)
        
        max_id = 0
        docs = []
        for row in rows:
            doc = {}
            for col in col_names:
                val = row[col]
                # Parse ISO date strings if applicable
                if isinstance(val, str) and ("_at" in col or "_date" in col):
                    try:
                        # Keep original or parse
                        val = datetime.datetime.fromisoformat(val.replace("Z", "+00:00"))
                    except Exception:
                        pass
                doc[col] = val
            
            if "id" in doc and isinstance(doc["id"], int):
                max_id = max(max_id, doc["id"])
            
            docs.append(doc)

        counters[table] = max_id

        for coll_name in target_colls:
            coll = db[coll_name]
            coll.drop()  # Clean target before import
            if docs:
                # Insert copies without mutating _id across collections
                insert_batch = [dict(d) for d in docs]
                coll.insert_many(insert_batch)
            counts[coll_name] = coll.count_documents({})
            print(f"  Exported {table} ({len(docs)} rows) -> MongoDB '{coll_name}' ({counts[coll_name]} docs)")

    # Seed ID counters for auto-incrementing integer IDs
    counter_coll = db["_counters"]
    counter_coll.drop()
    for seq_name, max_val in counters.items():
        counter_coll.insert_one({"_id": seq_name, "seq": max_val})
        # Also alias target collection names
        if seq_name in TABLE_COLLECTION_MAP:
            target = TABLE_COLLECTION_MAP[seq_name]
            if target != seq_name:
                counter_coll.insert_one({"_id": target, "seq": max_val})

    print(f"\nInitialized {counter_coll.count_documents({})} auto-increment sequence counters.")

    # Create Indexes
    create_indexes(db)

    sql_conn.close()
    print("\n--- Migration completed successfully! ---")
    return counts


def create_indexes(db):
    print("Creating MongoDB Indexes...")
    try:
        # Users
        db["users"].create_index("email", unique=True, sparse=True)
        db["users"].create_index("id", unique=True)
        db["users"].create_index("role")
        db["users"].create_index("supplier_id")
        db["users"].create_index("admin_id")

        # Companies / Suppliers
        for col_name in ["companies", "suppliers"]:
            if col_name in db.list_collection_names():
                db[col_name].create_index("id", unique=True)
                db[col_name].create_index("name")
                db[col_name].create_index("country")
                db[col_name].create_index("verification_status")

        # Products / Catalog
        for col_name in ["products", "catalog_items"]:
            if col_name in db.list_collection_names():
                db[col_name].create_index("id", unique=True)
                db[col_name].create_index("supplier_id")
                db[col_name].create_index("category")
                db[col_name].create_index("status")

        # RFQs
        db["rfqs"].create_index("id", unique=True)
        db["rfqs"].create_index("rfq_code", unique=True, sparse=True)
        db["rfqs"].create_index("sourcing_request_id")
        db["rfqs"].create_index("status")

        # RFQ Responses
        for col_name in ["rfq_responses", "rfq_suppliers"]:
            if col_name in db.list_collection_names():
                db[col_name].create_index("id", unique=True)
                db[col_name].create_index([("rfq_id", 1), ("supplier_id", 1)])

        # Quotations
        db["quotations"].create_index("id", unique=True)
        db["quotations"].create_index("quote_code", unique=True, sparse=True)
        db["quotations"].create_index("rfq_id")
        db["quotations"].create_index("supplier_id")
        db["quotations"].create_index("status")

        # Orders
        db["orders"].create_index("id", unique=True)
        db["orders"].create_index("order_code", unique=True, sparse=True)
        db["orders"].create_index("supplier_id")
        db["orders"].create_index("quotation_id")
        db["orders"].create_index("status")

        # Order Status History
        db["order_status_history"].create_index("id", unique=True)
        db["order_status_history"].create_index("order_id")

        # Negotiations / Messages
        for col_name in ["negotiations", "messages"]:
            if col_name in db.list_collection_names():
                db[col_name].create_index("id", unique=True)
                db[col_name].create_index("order_id")
                db[col_name].create_index("rfq_id")
                db[col_name].create_index("quotation_id")

        # Complaints
        db["complaints"].create_index("id", unique=True)
        db["complaints"].create_index("complaint_code", unique=True, sparse=True)
        db["complaints"].create_index("complainant_user_id")
        db["complaints"].create_index("accused_company_id")
        db["complaints"].create_index("status")

        # Notifications
        db["notifications"].create_index("id", unique=True)
        db["notifications"].create_index("user_id")
        db["notifications"].create_index("is_read")

        # Audit Logs
        db["audit_logs"].create_index("id", unique=True)
        db["audit_logs"].create_index("user_id")
        db["audit_logs"].create_index("created_at")

        print("All MongoDB indexes established successfully.")
    except Exception as e:
        print(f"Notice during index creation: {e}")


if __name__ == "__main__":
    sqlite_file = r"C:\Users\abhin\Downloads\namade-kadda\backend\namade_kadda.db"
    mongo_uri = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    database_name = os.environ.get("MONGODB_DATABASE", "namade_kadda")
    migrate(sqlite_file, mongo_uri, database_name)
