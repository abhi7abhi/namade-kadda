"""
Customer Insights & Inactive Customer Retention Analytics Service.
Computes deterministic, database-backed customer metrics, recency intervals,
historical purchasing patterns, and interactive chart datasets for industrial suppliers.
"""
import datetime
from collections import defaultdict
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.sourcing import SourcingRequest
from app.models.user import User
from app.models.supplier import Supplier, CatalogItem
from app.models.rfq import RFQ, RFQSupplier
from app.models.notification import Notification


class CustomerRetentionService:

    VALID_ORDER_STATUSES = {
        "CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "COMPLETED"
    }

    @classmethod
    def get_customers_overview(
        cls,
        db: Session,
        supplier_id: int,
        status: Optional[str] = None,
        country: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "last_purchase_desc",
        at_risk_threshold_days: int = 45,
        inactive_threshold_days: int = 90,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Aggregate real order records to classify customers as Regular, At-Risk, or Inactive.
        Strictly isolated to the authenticated supplier_id.
        """
        now = datetime.datetime.utcnow()

        # 1. Fetch all orders for this supplier
        orders = (
            db.query(Order)
            .filter(Order.supplier_id == supplier_id)
            .order_by(Order.created_at.asc())
            .all()
        )

        # 2. Build catalog item lookup for product categories
        catalog_items = db.query(CatalogItem).filter(CatalogItem.supplier_id == supplier_id).all()
        catalog_category_map = {item.name.lower(): item.category for item in catalog_items}

        # 3. Group orders by buyer company
        company_orders_map = defaultdict(lambda: {
            "user": None,
            "company_name": "",
            "country": "Global",
            "business_category": "Industrial Manufacturing",
            "valid_orders": [],
            "cancelled_orders": []
        })

        # Cache SourcingRequests and Users
        sr_ids = [o.sourcing_request_id for o in orders if o.sourcing_request_id]
        sr_map = {}
        user_map = {}
        if sr_ids:
            srs = db.query(SourcingRequest).filter(SourcingRequest.id.in_(sr_ids)).all()
            sr_map = {sr.id: sr for sr in srs}
            u_ids = [sr.user_id for sr in srs if sr.user_id]
            if u_ids:
                users = db.query(User).filter(User.id.in_(u_ids)).all()
                user_map = {u.id: u for u in users}

        for o in orders:
            sr = sr_map.get(o.sourcing_request_id)
            buyer = user_map.get(sr.user_id) if sr else None
            comp_name = (buyer.company_name if buyer and buyer.company_name else "Unknown Organization").strip()

            c_data = company_orders_map[comp_name]
            if not c_data["user"] and buyer:
                c_data["user"] = buyer
                c_data["company_name"] = comp_name
                c_data["country"] = buyer.country or (sr.destination_country if sr else "Global")
                c_data["business_category"] = buyer.business_category or (sr.category if sr else "Industrial Manufacturing")
            elif not c_data["company_name"]:
                c_data["company_name"] = comp_name

            if o.status in cls.VALID_ORDER_STATUSES:
                c_data["valid_orders"].append(o)
            elif o.status == "CANCELLED":
                c_data["cancelled_orders"].append(o)

        # 4. Also check RFQs/Sourcing Requests for prospects that have 0 completed orders
        invited_rfqs = (
            db.query(RFQSupplier)
            .filter(RFQSupplier.supplier_id == supplier_id)
            .all()
        )
        for link in invited_rfqs:
            rfq = db.query(RFQ).filter(RFQ.id == link.rfq_id).first()
            if rfq and rfq.sourcing_request_id:
                sr = db.query(SourcingRequest).filter(SourcingRequest.id == rfq.sourcing_request_id).first()
                if sr and sr.user_id:
                    buyer = db.query(User).filter(User.id == sr.user_id).first()
                    if buyer and buyer.company_name:
                        comp_name = buyer.company_name.strip()
                        if comp_name not in company_orders_map:
                            company_orders_map[comp_name] = {
                                "user": buyer,
                                "company_name": comp_name,
                                "country": buyer.country or sr.destination_country or "Global",
                                "business_category": buyer.business_category or sr.category or "Industrial Manufacturing",
                                "valid_orders": [],
                                "cancelled_orders": []
                            }

        # 5. Process each company's metrics
        customer_records = []
        all_countries = set()
        all_categories = set()

        for comp_name, data in company_orders_map.items():
            valid_orders = data["valid_orders"]
            cancelled_orders = data["cancelled_orders"]
            buyer = data["user"]
            country_val = data["country"] or "Global"
            category_val = data["business_category"] or "Industrial Manufacturing"

            all_countries.add(country_val)
            all_categories.add(category_val)

            completed_count = len(valid_orders)
            cancelled_count = len(cancelled_orders)
            total_spend = sum(float(o.total_amount) for o in valid_orders)

            # Extract purchased product items
            product_quantities = defaultdict(int)
            product_orders_count = defaultdict(int)
            product_values = defaultdict(float)

            for o in valid_orders:
                for item in (o.items or []):
                    product_quantities[item.item_name] += item.quantity
                    product_orders_count[item.item_name] += 1
                    product_values[item.item_name] += float(item.total_price)
                    # Add product category if found
                    cat_lookup = catalog_category_map.get(item.item_name.lower())
                    if cat_lookup:
                        all_categories.add(cat_lookup)

            distinct_products = list(product_quantities.keys())
            most_frequent_product = (
                max(product_orders_count.items(), key=lambda x: (x[1], product_quantities[x[0]]))[0]
                if product_orders_count else None
            )

            if completed_count > 0:
                first_order_date = min(o.created_at for o in valid_orders)
                last_order_date = max(o.created_at for o in valid_orders)
                days_since_last = max((now - last_order_date).days, 0)

                if completed_count >= 2:
                    span_days = max((last_order_date - first_order_date).days, 1)
                    avg_interval_days = round(span_days / (completed_count - 1), 1)
                    purchase_frequency_label = f"~Every {int(avg_interval_days)} days"
                else:
                    avg_interval_days = None
                    purchase_frequency_label = "Single completed purchase"

                # Status calculation rule based on configurable thresholds & buying cycle
                expected_cycle = max(avg_interval_days or at_risk_threshold_days, 15.0)

                if days_since_last > max(inactive_threshold_days, expected_cycle * 2.2):
                    cust_status = "INACTIVE"
                    cust_status_label = "Inactive Customer"
                    risk_level = "HIGH"
                elif days_since_last > max(at_risk_threshold_days, expected_cycle * 1.4):
                    cust_status = "AT_RISK"
                    cust_status_label = "At-Risk Customer"
                    risk_level = "MEDIUM"
                else:
                    cust_status = "REGULAR"
                    cust_status_label = "Regular Customer"
                    risk_level = "LOW"
            else:
                first_order_date = None
                last_order_date = None
                days_since_last = None
                avg_interval_days = None
                purchase_frequency_label = "No completed purchases (Prospect)"
                cust_status = "PROSPECT"
                cust_status_label = "Prospect / Unclassified"
                risk_level = "LOW"

            record = {
                "company_name": comp_name,
                "country": country_val,
                "business_category": category_val,
                "buyer_user_id": buyer.id if buyer else None,
                "contact_name": buyer.full_name if buyer else "Procurement Manager",
                "contact_email": buyer.email if buyer else "",
                "contact_phone": buyer.contact_phone if buyer else None,
                "status": cust_status,
                "status_label": cust_status_label,
                "risk_level": risk_level,
                "total_completed_orders": completed_count,
                "cancelled_orders_count": cancelled_count,
                "last_purchase_date": last_order_date.isoformat() if last_order_date else None,
                "first_purchase_date": first_order_date.isoformat() if first_order_date else None,
                "days_since_last_purchase": days_since_last,
                "avg_interval_days": avg_interval_days,
                "purchase_frequency_label": purchase_frequency_label,
                "total_historical_spend": round(total_spend, 2),
                "currency": "USD",
                "distinct_products_count": len(distinct_products),
                "most_frequent_product": most_frequent_product,
                "products_summary": distinct_products[:3]
            }
            customer_records.append(record)

        # 6. Global Summary KPI counts (before filter)
        total_customers = len(customer_records)
        regular_count = len([c for c in customer_records if c["status"] == "REGULAR"])
        at_risk_count = len([c for c in customer_records if c["status"] == "AT_RISK"])
        inactive_count = len([c for c in customer_records if c["status"] == "INACTIVE"])
        prospect_count = len([c for c in customer_records if c["status"] == "PROSPECT"])
        total_historical_revenue = sum(c["total_historical_spend"] for c in customer_records)
        active_base = regular_count + at_risk_count + inactive_count
        retention_rate = round((regular_count / active_base * 100), 1) if active_base > 0 else 0.0

        # 7. Apply Filters
        filtered = customer_records

        if status:
            s_up = status.upper().strip()
            if s_up == "NON_REGULAR":
                filtered = [c for c in filtered if c["status"] in ("AT_RISK", "INACTIVE")]
            elif s_up in ("REGULAR", "AT_RISK", "INACTIVE", "PROSPECT"):
                filtered = [c for c in filtered if c["status"] == s_up]

        if country and country.upper() != "ALL":
            filtered = [c for c in filtered if c["country"].lower() == country.lower()]

        if category and category.upper() != "ALL":
            filtered = [
                c for c in filtered
                if category.lower() in c["business_category"].lower()
                or any(category.lower() in p.lower() for p in c["products_summary"])
            ]

        if search and search.strip():
            q = search.lower().strip()
            filtered = [
                c for c in filtered
                if q in c["company_name"].lower()
                or q in c["country"].lower()
                or q in c["business_category"].lower()
                or (c["most_frequent_product"] and q in c["most_frequent_product"].lower())
            ]

        # 8. Apply Sorting
        if sort_by == "last_purchase_desc":
            # Most recently purchased first, None (prospects) at end
            filtered.sort(key=lambda x: (x["last_purchase_date"] is None, x["last_purchase_date"] or ""), reverse=True)
            # When reversed: is None (False) comes before True, but we want latest date first:
            filtered.sort(key=lambda x: x["last_purchase_date"] or "0000", reverse=True)
        elif sort_by == "last_purchase_asc":
            # Longest time since purchase (highest days_since_last_purchase) first
            filtered.sort(key=lambda x: (x["days_since_last_purchase"] or -1), reverse=True)
        elif sort_by == "days_inactive_desc":
            filtered.sort(key=lambda x: (x["days_since_last_purchase"] or -1), reverse=True)
        elif sort_by == "total_spend_desc":
            filtered.sort(key=lambda x: x["total_historical_spend"], reverse=True)
        elif sort_by == "orders_count_desc":
            filtered.sort(key=lambda x: x["total_completed_orders"], reverse=True)
        elif sort_by == "frequency_desc":
            # Shortest avg_interval_days first
            filtered.sort(key=lambda x: (x["avg_interval_days"] is None, x["avg_interval_days"] or 9999))

        # 9. Pagination
        total_count = len(filtered)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_customers = filtered[start_idx:end_idx]
        total_pages = max((total_count + limit - 1) // limit, 1)

        return {
            "summary": {
                "total_customers": total_customers,
                "regular_count": regular_count,
                "at_risk_count": at_risk_count,
                "inactive_count": inactive_count,
                "prospect_count": prospect_count,
                "non_regular_count": at_risk_count + inactive_count,
                "total_historical_revenue": round(total_historical_revenue, 2),
                "currency": "USD",
                "retention_rate": retention_rate
            },
            "customers": paginated_customers,
            "available_countries": sorted(list(all_countries)),
            "available_categories": sorted(list(all_categories)),
            "thresholds": {
                "at_risk_threshold_days": at_risk_threshold_days,
                "inactive_threshold_days": inactive_threshold_days
            },
            "disclaimer": (
                "Customer classifications (Regular, At-Risk, Inactive) are analytical estimates calculated "
                "from historical purchase frequency and recency. They represent statistical buying intervals, "
                "not definitive statements of buyer intent."
            ),
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": total_pages
            }
        }

    @classmethod
    def get_customer_detail_analytics(
        cls,
        db: Session,
        supplier_id: int,
        company_name: str,
        at_risk_threshold_days: int = 45,
        inactive_threshold_days: int = 90
    ) -> Dict[str, Any]:
        """
        Deep-dive customer analytics for a selected company:
        - Customer summary cards
        - Products previously purchased table with order breakdown
        - 5 interactive chart datasets (Activity, Products, Categories, Frequency, Spending)
        - AI Seller Assistant recommendations with distinct factual insights
        - Authorized follow-up action hooks
        """
        now = datetime.datetime.utcnow()
        clean_name = company_name.strip()

        # 1. Fetch matching orders for this supplier and company
        orders = (
            db.query(Order)
            .filter(Order.supplier_id == supplier_id)
            .order_by(Order.created_at.asc())
            .all()
        )

        catalog_items = db.query(CatalogItem).filter(CatalogItem.supplier_id == supplier_id).all()
        catalog_category_map = {item.name.lower(): item.category for item in catalog_items}

        matching_orders = []
        matching_buyer = None

        for o in orders:
            sr = db.query(SourcingRequest).filter(SourcingRequest.id == o.sourcing_request_id).first() if o.sourcing_request_id else None
            buyer = db.query(User).filter(User.id == sr.user_id).first() if sr and sr.user_id else None
            comp = (buyer.company_name if buyer and buyer.company_name else "Unknown Organization").strip()
            if comp.lower() == clean_name.lower():
                matching_orders.append((o, sr, buyer))
                if not matching_buyer and buyer:
                    matching_buyer = buyer

        # If no orders, check if prospect buyer exists
        if not matching_buyer:
            prospect_buyer = db.query(User).filter(User.company_name.ilike(f"%{clean_name}%")).first()
            if prospect_buyer:
                matching_buyer = prospect_buyer

        valid_orders = [o for o, sr, b in matching_orders if o.status in cls.VALID_ORDER_STATUSES]
        cancelled_orders = [o for o, sr, b in matching_orders if o.status == "CANCELLED"]

        completed_count = len(valid_orders)
        cancelled_count = len(cancelled_orders)
        total_spend = sum(float(o.total_amount) for o in valid_orders)

        # 2. Recency & Intervals
        if completed_count > 0:
            first_order_date = min(o.created_at for o in valid_orders)
            last_order_date = max(o.created_at for o in valid_orders)
            days_since_last = max((now - last_order_date).days, 0)

            if completed_count >= 2:
                span_days = max((last_order_date - first_order_date).days, 1)
                avg_interval_days = round(span_days / (completed_count - 1), 1)
                expected_cycle = max(avg_interval_days, 15.0)
            else:
                avg_interval_days = None
                expected_cycle = float(at_risk_threshold_days)

            if days_since_last > max(inactive_threshold_days, expected_cycle * 2.2):
                cust_status = "INACTIVE"
                cust_status_label = "Inactive Customer"
                status_explanation = (
                    f"Last completed purchase was {days_since_last} days ago, which exceeds "
                    f"the inactive threshold ({inactive_threshold_days} days) and "
                    f"historical interval (~{int(expected_cycle)} days)."
                )
                risk_level = "HIGH"
            elif days_since_last > max(at_risk_threshold_days, expected_cycle * 1.4):
                cust_status = "AT_RISK"
                cust_status_label = "At-Risk Customer"
                status_explanation = (
                    f"Last completed purchase was {days_since_last} days ago. "
                    f"Exceeds expected purchasing cadence of ~{int(expected_cycle)} days."
                )
                risk_level = "MEDIUM"
            else:
                cust_status = "REGULAR"
                cust_status_label = "Regular Customer"
                status_explanation = (
                    f"Active recurring buyer. Last purchase was {days_since_last} days ago, "
                    f"within the expected ~{int(expected_cycle)}-day buying cycle."
                )
                risk_level = "LOW"
        else:
            first_order_date = None
            last_order_date = None
            days_since_last = None
            avg_interval_days = None
            expected_cycle = None
            cust_status = "PROSPECT"
            cust_status_label = "Prospect / Unclassified"
            status_explanation = "No completed commercial purchase records on file with your company."
            risk_level = "LOW"

        # 3. Products previously purchased aggregation
        products_map = defaultdict(lambda: {
            "name": "",
            "category": "CNC Machining",
            "quantity": 0,
            "order_count": 0,
            "total_value": 0.0,
            "unit_prices": [],
            "last_purchased_date": None,
            "orders_breakdown": []
        })

        category_counts = defaultdict(lambda: {"order_count": 0, "quantity": 0, "total_value": 0.0})

        for o in valid_orders:
            for item in (o.items or []):
                p_entry = products_map[item.item_name]
                p_entry["name"] = item.item_name
                cat = catalog_category_map.get(item.item_name.lower(), "Precision Components")
                p_entry["category"] = cat
                p_entry["quantity"] += item.quantity
                p_entry["order_count"] += 1
                p_entry["total_value"] += float(item.total_price)
                p_entry["unit_prices"].append(float(item.unit_price))

                if not p_entry["last_purchased_date"] or o.created_at > p_entry["last_purchased_date"]:
                    p_entry["last_purchased_date"] = o.created_at

                p_entry["orders_breakdown"].append({
                    "order_code": o.order_code,
                    "date": o.created_at.strftime("%Y-%m-%d"),
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "total_price": float(item.total_price),
                    "status": o.status
                })

                c_stat = category_counts[cat]
                c_stat["order_count"] += 1
                c_stat["quantity"] += item.quantity
                c_stat["total_value"] += float(item.total_price)

        products_list = []
        for p_name, p_data in products_map.items():
            u_min = min(p_data["unit_prices"]) if p_data["unit_prices"] else 0.0
            u_max = max(p_data["unit_prices"]) if p_data["unit_prices"] else 0.0
            price_range_str = f"${u_min:.2f}" if u_min == u_max else f"${u_min:.2f} - ${u_max:.2f}"

            products_list.append({
                "product_name": p_name,
                "category": p_data["category"],
                "total_quantity": p_data["quantity"],
                "order_count": p_data["order_count"],
                "last_purchased_date": p_data["last_purchased_date"].isoformat() if p_data["last_purchased_date"] else None,
                "total_value": round(p_data["total_value"], 2),
                "currency": "USD",
                "unit_price_range": price_range_str,
                "orders_breakdown": p_data["orders_breakdown"]
            })

        products_list.sort(key=lambda x: (x["order_count"], x["total_value"]), reverse=True)

        # 4. Interactive Graph Datasets
        # Graph 1 & 4 & 5: Monthly time-series
        monthly_map = defaultdict(lambda: {"order_count": 0, "spend": 0.0})
        for o in valid_orders:
            m_key = o.created_at.strftime("%Y-%m")
            monthly_map[m_key]["order_count"] += 1
            monthly_map[m_key]["spend"] += float(o.total_amount)

        sorted_months = sorted(monthly_map.keys())
        activity_over_time = []
        cumulative_orders = 0
        cumulative_spend = 0.0
        frequency_trend = []
        spending_trend = []

        for m in sorted_months:
            m_dt = datetime.datetime.strptime(m, "%Y-%m")
            label = m_dt.strftime("%b %Y")
            cnt = monthly_map[m]["order_count"]
            sp = monthly_map[m]["spend"]
            cumulative_orders += cnt
            cumulative_spend += sp

            activity_over_time.append({
                "period": m,
                "label": label,
                "order_count": cnt,
                "spend": round(sp, 2),
                "currency": "USD"
            })

            frequency_trend.append({
                "period": m,
                "label": label,
                "purchases_count": cnt,
                "cumulative_orders": cumulative_orders
            })

            spending_trend.append({
                "period": m,
                "label": label,
                "spend": round(sp, 2),
                "cumulative_spend": round(cumulative_spend, 2),
                "currency": "USD"
            })

        # Graph 2: Products purchased
        products_bar_data = [
            {
                "product_name": p["product_name"],
                "short_name": p["product_name"][:20] + ("..." if len(p["product_name"]) > 20 else ""),
                "quantity": p["total_quantity"],
                "order_count": p["order_count"],
                "total_value": p["total_value"]
            }
            for p in products_list
        ]

        # Graph 3: Category distribution
        total_cat_value = sum(c["total_value"] for c in category_counts.values()) or 1.0
        category_pie_data = [
            {
                "category": cat_name,
                "order_count": cat_val["order_count"],
                "total_quantity": cat_val["quantity"],
                "total_value": round(cat_val["total_value"], 2),
                "percentage": round((cat_val["total_value"] / total_cat_value * 100), 1)
            }
            for cat_name, cat_val in category_counts.items()
        ]

        # Data availability flags
        has_graphs_data = completed_count > 0
        graphs_availability = {
            "activity": has_graphs_data,
            "products": len(products_bar_data) > 0,
            "categories": len(category_pie_data) > 0,
            "frequency": completed_count >= 2,
            "spending": has_graphs_data,
            "insufficient_data_reason": (
                "Insufficient historical data to render trend graphs. Company has 0 completed orders."
                if completed_count == 0
                else ("Single purchase on record. Trend charts require at least 2 distinct order intervals." if completed_count == 1 else None)
            )
        }

        # 5. AI Seller Assistant Recommendations (Distinguishing facts from AI suggestions)
        top_product = products_list[0]["product_name"] if products_list else "industrial components"
        top_product_share = round((products_list[0]["total_value"] / (total_spend or 1.0) * 100), 1) if products_list else 0

        facts = []
        suggestions = []

        if completed_count > 0:
            facts.append(
                f"Historical record: {clean_name} has completed {completed_count} verified orders "
                f"totaling ${total_spend:,.2f} USD."
            )
            if len(products_list) == 1:
                facts.append(f"All historical purchases were concentrated exclusively in 1 product: {top_product}.")
            else:
                p_names = ", ".join(f"'{p['product_name']}'" for p in products_list[:3])
                facts.append(f"Previously purchased products include {p_names}.")
                facts.append(f"'{top_product}' generated {top_product_share}% of total historical spend.")

            if avg_interval_days:
                facts.append(
                    f"Previous buying pattern: Historical purchase frequency was approximately every "
                    f"{int(avg_interval_days)} days."
                )

            if days_since_last is not None:
                if cust_status == "INACTIVE":
                    facts.append(
                        f"Current dormancy: {days_since_last} days have elapsed since the last order "
                        f"({last_order_date.strftime('%b %d, %Y')}), which is "
                        f"{round(days_since_last / (avg_interval_days or 30), 1)}x longer than its previous purchasing cycle."
                    )
                elif cust_status == "AT_RISK":
                    facts.append(
                        f"Cadence breach: {days_since_last} days since last order exceeds its normal interval "
                        f"of ~{int(avg_interval_days or 30)} days."
                    )
                else:
                    facts.append(
                        f"Cadence compliance: Last order placed {days_since_last} days ago aligns with active restocking schedule."
                    )

            # AI Recommendations
            if cust_status in ("INACTIVE", "AT_RISK"):
                suggestions.append(
                    f"Catalog Availability Check: Verify shop-floor capacity and stock readiness for '{top_product}'."
                )
                suggestions.append(
                    f"Commercial Incentive: Prepare a targeted quotation with a 3-5% volume discount or Net 45 payment terms to reactivate the account."
                )
                suggestions.append(
                    f"Proactive Re-engagement: Schedule a follow-up consultation with {matching_buyer.full_name if matching_buyer else 'the procurement contact'} regarding upcoming project BOM schedules."
                )
                suggestions.append(
                    "Specification Update: Inquire whether their design requirements or material specifications have shifted to newer alloy grades."
                )
            else:
                suggestions.append(
                    f"Account Health Maintenance: Confirm on-time production and shipping milestones for ongoing orders of '{top_product}'."
                )
                suggestions.append(
                    "Cross-Sell Opportunity: Present complementary component capabilities matching their industry profile."
                )
        else:
            facts.append(f"{clean_name} has no completed purchase order records with your organization.")
            if cancelled_count > 0:
                facts.append(f"Recorded {cancelled_count} cancelled or retracted order inquiry.")
            suggestions.append("Initiate initial engagement by introducing your certified manufacturing capabilities and MOQ flexibility.")
            suggestions.append("Invite buyer to submit their technical drawing / RFQ package for engineering review.")

        # 6. Orders history detail
        order_history_list = []
        for o, sr, b in matching_orders:
            order_history_list.append({
                "id": o.id,
                "order_code": o.order_code,
                "status": o.status,
                "total_amount": float(o.total_amount),
                "currency": o.currency,
                "created_at": o.created_at.isoformat(),
                "created_at_formatted": o.created_at.strftime("%b %d, %Y"),
                "expected_delivery_date": o.expected_delivery_date.isoformat() if o.expected_delivery_date else None,
                "tracking_number": o.tracking_number,
                "shipping_address": o.shipping_address,
                "items": [
                    {
                        "item_name": it.item_name,
                        "quantity": it.quantity,
                        "unit_price": float(it.unit_price),
                        "total_price": float(it.total_price)
                    }
                    for it in (o.items or [])
                ]
            })
        order_history_list.sort(key=lambda x: x["created_at"], reverse=True)

        return {
            "customer_summary": {
                "company_name": clean_name,
                "country": (matching_buyer.country if matching_buyer else "Global"),
                "business_category": (matching_buyer.business_category if matching_buyer else "Industrial Manufacturing"),
                "buyer_user_id": matching_buyer.id if matching_buyer else None,
                "contact_name": matching_buyer.full_name if matching_buyer else "Procurement Manager",
                "contact_email": matching_buyer.email if matching_buyer else "",
                "contact_phone": matching_buyer.contact_phone if matching_buyer else None,
                "status": cust_status,
                "status_label": cust_status_label,
                "status_explanation": status_explanation,
                "risk_level": risk_level,
                "total_completed_orders": completed_count,
                "cancelled_orders_count": cancelled_count,
                "distinct_products_count": len(products_list),
                "last_purchase_date": last_order_date.isoformat() if last_order_date else None,
                "first_purchase_date": first_order_date.isoformat() if first_order_date else None,
                "days_since_last_purchase": days_since_last,
                "avg_interval_days": avg_interval_days,
                "expected_interval_days": expected_cycle,
                "total_historical_spend": round(total_spend, 2),
                "currency": "USD",
                "has_sufficient_history": completed_count >= 2
            },
            "products_purchased": products_list,
            "graphs": {
                "activity_over_time": activity_over_time,
                "products_breakdown": products_bar_data,
                "category_distribution": category_pie_data,
                "purchase_frequency": frequency_trend,
                "historical_spending": spending_trend,
                "availability": graphs_availability
            },
            "ai_recommendations": {
                "retention_risk_level": risk_level,
                "status_label": cust_status_label,
                "facts": facts,
                "suggestions": suggestions,
                "disclaimer": "Facts are deterministic records from verified orders. Suggestions are AI operational recommendations."
            },
            "order_history": order_history_list,
            "available_follow_up_actions": [
                {
                    "action_id": "VIEW_PURCHASE_HISTORY",
                    "label": "View Purchase History",
                    "type": "INTERNAL_TAB"
                },
                {
                    "action_id": "VIEW_PRODUCTS",
                    "label": "View Products in Catalog",
                    "type": "NAVIGATE",
                    "href": "/supplier/products"
                },
                {
                    "action_id": "PREPARE_QUOTATION",
                    "label": "Prepare Quotation",
                    "type": "MODAL",
                    "target": "QUOTATION_DRAWER"
                },
                {
                    "action_id": "CREATE_REMINDER",
                    "label": "Create Follow-up Reminder",
                    "type": "API_ACTION"
                },
                {
                    "action_id": "VIEW_COMPANY_DETAILS",
                    "label": "View Company Details",
                    "type": "MODAL",
                    "target": "COMPANY_CARD"
                }
            ]
        }

    @classmethod
    def create_customer_reminder(
        cls,
        db: Session,
        supplier_id: int,
        user_id: Optional[int],
        company_name: str,
        reminder_notes: Optional[str] = None
    ) -> Notification:
        """Create an in-app follow-up reminder notification for this customer retention lead."""
        notif = Notification(
            supplier_id=supplier_id,
            user_id=user_id,
            title=f"Customer Retention Reminder: {company_name}",
            message=(
                reminder_notes.strip() if reminder_notes and reminder_notes.strip() else
                f"Proactively follow up with {company_name} regarding replenishment, component re-orders, and updated catalog pricing."
            ),
            type="CUSTOMER_RETENTION",
            link_url=f"/supplier/ai-assistant",
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
