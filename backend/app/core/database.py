import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from app.core.config import settings
from app.core.mongodb import init_mongo, get_mongo_db
from app.core.mongo_session import MongoSession

logger = logging.getLogger("namade_kadda.database")

# Declarative base preserved for model attribute schemas and validations
Base = declarative_base()

# Primary database session: All persistence is routed directly to MongoDB Atlas
SessionLocal = MongoSession


def get_db():
    """FastAPI dependency yielding a genuine MongoDB session."""
    session = MongoSession()
    try:
        yield session
    finally:
        session.close()


def init_db():
    """Initializes MongoDB Atlas connection and collection indexes."""
    from app import models  # Ensures all models and schemas are loaded
    init_mongo()
    logger.info("MongoDB Atlas database engine and collection indexes initialized.")
