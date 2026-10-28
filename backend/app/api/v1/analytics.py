from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.services.buyer_analytics_service import BuyerAnalyticsService
from app.api.v1.auth import get_optional_current_user
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsDashboardResponse,
    BuyerAnalyticsSuggestionsResponse,
    BuyerSearchAnalyticsResponse
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
def get_dashboard_analytics(db: Session = Depends(get_db)):
    return AnalyticsService.get_dashboard_metrics(db)


@router.get("/buyer/suggestions", response_model=BuyerAnalyticsSuggestionsResponse)
def get_buyer_analytics_suggestions(
    q: str = Query(..., min_length=1, description="Search query prefix"),
    category: Optional[str] = Query("auto", description="Filter category: auto, company, product, country"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Return autocomplete suggestions based on real database records for companies, products, and countries."""
    return BuyerAnalyticsService.get_suggestions(db, q=q, category=category, current_user=current_user)


@router.get("/buyer/search", response_model=BuyerSearchAnalyticsResponse)
def search_buyer_analytics(
    q: str = Query(..., min_length=1, description="Company, product, or country search term"),
    category: Optional[str] = Query("auto", description="Filter category: auto, company, product, country"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Dynamically aggregate and filter analytics for a company, product, or country based on authorized database records."""
    return BuyerAnalyticsService.search_analytics(db, q=q, category=category, current_user=current_user)

