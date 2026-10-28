import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db
from app.core.mongodb import close_mongo, get_mongo_db
from app.seed.seed_data import seed_database
from app.api.v1 import (
    health,
    auth,
    admin,
    products,
    suppliers,
    sourcing,
    rfqs,
    quotations,
    orders,
    bom,
    trade,
    agents,
    analytics,
    supplier_workspace,
    component_intelligence,
    buyer_workspace,
    complaints
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("namade_kadda")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Namade Kadda database on MongoDB Atlas...")
    init_db()
    # Check if MongoDB is empty; if so, populate via migration/seeding
    db = get_mongo_db()
    if db["users"].count_documents({}) == 0:
        logger.info("MongoDB is empty. Auto-populating initial dataset...")
        sqlite_file = "namade_kadda.db"
        if os.path.exists(sqlite_file):
            from scripts.migrate_to_mongodb import migrate
            migrate(sqlite_file, settings.MONGODB_URL, settings.MONGODB_DATABASE)
        else:
            seed_database()

    # Ensure component intelligence is seeded
    if db["product_component_relationships"].count_documents({}) == 0:
        logger.info("Seeding component intelligence data...")
        from app.core.database import SessionLocal
        from app.seed.seed_component_intelligence import seed_component_intelligence
        sdb = SessionLocal()
        try:
            seed_component_intelligence(sdb)
        except Exception as seed_err:
            logger.warning(f"Error seeding component intelligence: {seed_err}")
        finally:
            sdb.close()

    # Ensure matching and customer retention are seeded
    if db["sourcing_requests"].count_documents({}) == 0:
        logger.info("Seeding sourcing requests and matching data...")
        from app.core.database import SessionLocal
        from app.seed.seed_matching_data import seed_matching_data
        from app.seed.seed_customer_retention import seed_customer_retention
        sdb = SessionLocal()
        try:
            seed_matching_data(sdb)
            seed_customer_retention(sdb)
        except Exception as seed_err:
            logger.warning(f"Error seeding matching data: {seed_err}")
        finally:
            sdb.close()
    logger.info("Namade Kadda API service startup complete on MongoDB Atlas.")
    yield
    logger.info("Closing MongoDB connections on service shutdown...")
    close_mongo()
    logger.info("Namade Kadda API service shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Explainable AI-powered B2B sourcing, procurement and manufacturing marketplace API. "
        "Coordinates multi-agent procurement workflows, RFQs, quotations, BOMs, and trade compliance."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|.*\.vercel\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Safe global exception handler with CORS preservation
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {str(exc)}")
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        import re
        is_allowed = (
            origin in settings.cors_origins_list
            or "*" in settings.cors_origins_list
            or bool(re.match(r"^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|.*\.vercel\.app)(:\d+)?$", origin))
        )
        if is_allowed:
            headers["Access-Control-Allow-Origin"] = origin
            headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing your procurement request. Please verify inputs or try again.",
            "path": request.url.path
        },
        headers=headers
    )

# Ensure uploads directory exists and mount static files
os.makedirs("uploads/products", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mount API Routers
api_v1_prefix = "/api/v1"
app.include_router(health.router, prefix=api_v1_prefix)
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(admin.router, prefix=api_v1_prefix)
app.include_router(products.router, prefix=api_v1_prefix)
app.include_router(suppliers.router, prefix=api_v1_prefix)
app.include_router(sourcing.router, prefix=api_v1_prefix)
app.include_router(rfqs.router, prefix=api_v1_prefix)
app.include_router(quotations.router, prefix=api_v1_prefix)
app.include_router(orders.router, prefix=api_v1_prefix)
app.include_router(bom.router, prefix=api_v1_prefix)
app.include_router(trade.router, prefix=api_v1_prefix)
app.include_router(agents.router, prefix=api_v1_prefix)
app.include_router(analytics.router, prefix=api_v1_prefix)
app.include_router(supplier_workspace.router, prefix=api_v1_prefix)
app.include_router(component_intelligence.router, prefix=api_v1_prefix)
app.include_router(buyer_workspace.router, prefix=api_v1_prefix)
app.include_router(complaints.router, prefix=api_v1_prefix)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "documentation": "/docs",
        "api_v1": "/api/v1",
        "status": "online",
        "ai_mode": "LIVE" if not settings.is_demo_mode else "DEMO"
    }


@app.get("/health", tags=["Root"])
def root_health():
    from app.api.v1.health import health_check
    return health_check()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=settings.DEBUG)
