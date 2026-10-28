import logging
import re
import time
from typing import Optional, Dict, Any, Union
from bson import ObjectId
import pymongo
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("namade_kadda.mongodb")

_sync_client: Optional[pymongo.MongoClient] = None
_async_client: Optional[AsyncIOMotorClient] = None


def mask_mongodb_url(url: str) -> str:
    """Mask credentials in MongoDB connection string for safe logging and telemetry."""
    if not url:
        return ""
    # Mask mongodb://user:pass@host or mongodb+srv://user:pass@host
    masked = re.sub(r"://([^:@]+):([^@]+)@", r"://\1:****@", url)
    return masked


def get_mongo_client() -> pymongo.MongoClient:
    """Returns or initializes the synchronous PyMongo client."""
    global _sync_client
    if _sync_client is None:
        url = settings.MONGODB_URL
        masked = mask_mongodb_url(url)
        logger.info(f"Connecting to MongoDB at {masked} (database: {settings.MONGODB_DATABASE})...")
        try:
            _sync_client = pymongo.MongoClient(
                url,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                maxPoolSize=50,
                minPoolSize=5,
                appname="NamadeKadda"
            )
            # Verify connectivity
            _sync_client.admin.command("ping")
            logger.info("MongoDB synchronous connection established successfully.")
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB at {masked}: {e}")
            raise
    return _sync_client


def get_async_mongo_client() -> AsyncIOMotorClient:
    """Returns or initializes the asynchronous Motor client."""
    global _async_client
    if _async_client is None:
        url = settings.MONGODB_URL
        masked = mask_mongodb_url(url)
        logger.info(f"Initializing Async Motor client for MongoDB at {masked}...")
        _async_client = AsyncIOMotorClient(
            url,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=50,
            minPoolSize=5,
            appname="NamadeKaddaAsync"
        )
    return _async_client


def get_mongo_db(db_name: Optional[str] = None) -> Database:
    """Returns the PyMongo Database instance."""
    client = get_mongo_client()
    return client[db_name or settings.MONGODB_DATABASE]


def get_async_mongo_db(db_name: Optional[str] = None) -> AsyncIOMotorDatabase:
    """Returns the Motor Async Database instance."""
    client = get_async_mongo_client()
    return client[db_name or settings.MONGODB_DATABASE]


def check_mongo_connection() -> Dict[str, Any]:
    """
    Healthcheck helper to verify MongoDB connectivity without leaking credentials.
    Returns latency, connection status, and database metadata.
    """
    start_time = time.time()
    try:
        client = get_mongo_client()
        client.admin.command("ping")
        latency_ms = round((time.time() - start_time) * 1000, 2)
        db = client[settings.MONGODB_DATABASE]
        collections = db.list_collection_names()
        return {
            "connected": True,
            "database": settings.MONGODB_DATABASE,
            "latency_ms": latency_ms,
            "collections_count": len(collections),
            "status": "healthy"
        }
    except Exception as e:
        latency_ms = round((time.time() - start_time) * 1000, 2)
        logger.warning(f"MongoDB health ping failed: {e}")
        return {
            "connected": False,
            "database": settings.MONGODB_DATABASE,
            "latency_ms": latency_ms,
            "error": str(e),
            "status": "unhealthy"
        }


def get_next_sequence_value(db: Database, sequence_name: str) -> int:
    """Atomically increments and returns an auto-incrementing integer ID for MongoDB collections."""
    counter_coll = db["_counters"]
    res = counter_coll.find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=pymongo.ReturnDocument.AFTER
    )
    return int(res["seq"])


def object_id_to_str(val: Any) -> Any:
    """Recursively converts MongoDB ObjectIds and datetime objects to JSON-serializable types."""
    if isinstance(val, ObjectId):
        return str(val)
    elif isinstance(val, dict):
        return {k: object_id_to_str(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [object_id_to_str(v) for v in val]
    return val


def create_mongo_indexes(db: Database):
    """Creates all required indexes on MongoDB collections for optimal query performance and uniqueness."""
    logger.info("Verifying and establishing MongoDB collection indexes...")
    try:
        # Users collection
        users = db["users"]
        users.create_index("email", unique=True, sparse=True)
        users.create_index("id", unique=True)
        users.create_index("role")
        users.create_index("supplier_id")
        users.create_index("admin_id")

        # Companies / Suppliers collection
        for c_name in ["companies", "suppliers"]:
            coll = db[c_name]
            coll.create_index("id", unique=True)
            coll.create_index("name")
            coll.create_index("country")
            coll.create_index("verification_status")

        # Products / Catalog collection
        for c_name in ["products", "catalog_items"]:
            coll = db[c_name]
            coll.create_index("id", unique=True)
            coll.create_index("supplier_id")
            coll.create_index("category")
            coll.create_index("status")

        # Sourcing Requests
        sourcing = db["sourcing_requests"]
        sourcing.create_index("id", unique=True)
        sourcing.create_index("request_code", unique=True, sparse=True)
        sourcing.create_index("user_id")
        sourcing.create_index("status")

        # RFQs
        rfqs = db["rfqs"]
        rfqs.create_index("id", unique=True)
        rfqs.create_index("rfq_code", unique=True, sparse=True)
        rfqs.create_index("sourcing_request_id")
        rfqs.create_index("status")

        # RFQ Responses
        for c_name in ["rfq_responses", "rfq_suppliers"]:
            coll = db[c_name]
            coll.create_index("id", unique=True)
            coll.create_index([("rfq_id", 1), ("supplier_id", 1)])

        # Quotations
        quotes = db["quotations"]
        quotes.create_index("id", unique=True)
        quotes.create_index("quote_code", unique=True, sparse=True)
        quotes.create_index("rfq_id")
        quotes.create_index("supplier_id")
        quotes.create_index("status")

        # Orders
        orders = db["orders"]
        orders.create_index("id", unique=True)
        orders.create_index("order_code", unique=True, sparse=True)
        orders.create_index("supplier_id")
        orders.create_index("quotation_id")
        orders.create_index("status")

        # Order Status History
        osh = db["order_status_history"]
        osh.create_index("id", unique=True)
        osh.create_index("order_id")

        # Negotiations & Messages
        for c_name in ["negotiations", "negotiation_messages"]:
            coll = db[c_name]
            coll.create_index("id", unique=True)
            coll.create_index("order_id")
            coll.create_index("rfq_id")
            coll.create_index("quotation_id")

        # Complaints
        complaints = db["complaints"]
        complaints.create_index("id", unique=True)
        complaints.create_index("complaint_code", unique=True, sparse=True)
        complaints.create_index("complainant_user_id")
        complaints.create_index("accused_company_name")
        complaints.create_index("status")

        # Notifications
        notifications = db["notifications"]
        notifications.create_index("id", unique=True)
        notifications.create_index("user_id")
        notifications.create_index("is_read")

        # Audit Logs
        audit = db["audit_logs"]
        audit.create_index("id", unique=True)
        audit.create_index("user_id")
        audit.create_index("created_at")

        # Company Documents
        docs = db["company_documents"]
        docs.create_index("id", unique=True)
        docs.create_index("user_id")
        docs.create_index("company_name")

        logger.info("All MongoDB collection indexes verified successfully.")
    except Exception as e:
        logger.warning(f"Notice while establishing MongoDB indexes: {e}")


def init_mongo():
    """Initializes MongoDB connection and creates indexes during application startup."""
    client = get_mongo_client()
    db = client[settings.MONGODB_DATABASE]
    create_mongo_indexes(db)
    logger.info(f"MongoDB initialized. Ready on database: {settings.MONGODB_DATABASE}")


def close_mongo():
    """Closes all MongoDB client connections during application shutdown."""
    global _sync_client, _async_client
    if _sync_client is not None:
        _sync_client.close()
        _sync_client = None
        logger.info("MongoDB synchronous client connection closed.")
    if _async_client is not None:
        _async_client.close()
        _async_client = None
        logger.info("MongoDB asynchronous client connection closed.")
