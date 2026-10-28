from fastapi import APIRouter, Depends
from app.core.database import get_db
from app.core.config import settings
from app.core.mongodb import check_mongo_connection
from app.agents.llm_provider import LLMProvider

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check(db = Depends(get_db)):
    mongo_health = check_mongo_connection()
    is_connected = mongo_health.get("connected", False)

    return {
        "status": "healthy" if is_connected else "degraded",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database_connected": is_connected,
        "database_engine": "MongoDB Atlas" if "mongodb+srv" in settings.MONGODB_URL else "MongoDB",
        "database_name": settings.MONGODB_DATABASE,
        "mongodb": {
            "status": mongo_health.get("status", "unknown"),
            "latency_ms": mongo_health.get("latency_ms", 0),
            "collections_count": mongo_health.get("collections_count", 0)
        },
        "ai_mode": "LIVE" if LLMProvider.is_live_configured() else "DEMO",
        "llm_provider": settings.LLM_PROVIDER,
        "is_demo_mode": settings.is_demo_mode
    }


@router.get("/health/mongodb")
def mongodb_health():
    """Detailed health check for MongoDB without leaking credentials."""
    return check_mongo_connection()
