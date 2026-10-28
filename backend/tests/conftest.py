import os
import pytest
from fastapi.testclient import TestClient
import pymongo

# Set test environment to isolated MongoDB test database
TEST_DB_NAME = "test_namade_kadda"
os.environ["MONGODB_DATABASE"] = TEST_DB_NAME
os.environ["LLM_PROVIDER"] = "demo"
os.environ["LLM_API_KEY"] = ""

from app.main import app
from app.core.database import get_db
from app.core.mongodb import get_mongo_client, create_mongo_indexes
from app.core.mongo_session import MongoSession
from scripts.migrate_to_mongodb import migrate


def override_get_db():
    client = get_mongo_client()
    db = client[TEST_DB_NAME]
    session = MongoSession(db=db)
    try:
        yield session
    finally:
        session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    client = get_mongo_client()
    db = client[TEST_DB_NAME]
    # Clean setup for isolated test DB
    client.drop_database(TEST_DB_NAME)
    sqlite_file = os.path.join(os.path.dirname(__file__), "..", "namade_kadda.db")
    if os.path.exists(sqlite_file):
        migrate(sqlite_file, os.environ.get("MONGODB_URL", "mongodb://localhost:27017"), TEST_DB_NAME)
    else:
        create_mongo_indexes(db)
    
    # Ensure fresh component intelligence and computing relationships are seeded in test DB
    test_session = MongoSession(db=db)
    try:
        from app.seed.seed_component_intelligence import seed_component_intelligence
        seed_component_intelligence(test_session)
    finally:
        test_session.close()
    yield
    # Cleanup test database
    try:
        client.drop_database(TEST_DB_NAME)
    except Exception:
        pass


@pytest.fixture
def client():
    return TestClient(app)
