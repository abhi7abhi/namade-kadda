import logging
import re
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union
from datetime import datetime
from bson import ObjectId
import pymongo
from pymongo.database import Database
from sqlalchemy.sql.elements import BinaryExpression, BooleanClauseList, UnaryExpression, Grouping
from sqlalchemy.sql.functions import Function

from app.core.mongodb import get_mongo_db, get_next_sequence_value, object_id_to_str

logger = logging.getLogger("namade_kadda.mongo_session")

# Mapping of Model class names to primary and secondary MongoDB collections
MODEL_COLLECTION_MAP = {
    "User": "users",
    "Supplier": "companies",
    "SupplierCapability": "supplier_capabilities",
    "CatalogItem": "products",
    "CompanyDocument": "company_documents",
    "SourcingRequest": "sourcing_requests",
    "RFQ": "rfqs",
    "RFQSupplier": "rfq_responses",
    "Quotation": "quotations",
    "QuotationItem": "quotation_items",
    "Order": "orders",
    "OrderItem": "order_items",
    "OrderStatusHistory": "order_status_history",
    "NegotiationMessage": "negotiations",
    "Complaint": "complaints",
    "ComplaintEvidence": "complaint_evidence",
    "ComplaintMessage": "complaint_messages",
    "ComplaintStatusHistory": "complaint_status_history",
    "Notification": "notifications",
    "AuditLog": "audit_logs",
    "BOMProject": "bom_projects",
    "BOMItem": "bom_items",
    "TradeAssessment": "trade_assessments",
    "AgentRun": "agent_runs",
    "AgentRunEvent": "agent_run_events",
    "ProductComponentRelationship": "product_component_relationships",
    "SavedComponentSearch": "saved_component_searches"
}

# Synonymous collections for dual writes/compatibility
COLLECTION_ALIASES = {
    "companies": ["suppliers"],
    "suppliers": ["companies"],
    "products": ["catalog_items"],
    "catalog_items": ["products"],
    "rfq_responses": ["rfq_suppliers"],
    "rfq_suppliers": ["rfq_responses"],
    "negotiations": ["negotiation_messages"],
    "negotiation_messages": ["negotiations"]
}


def _get_collection_name(entity: Any) -> str:
    """Derives MongoDB collection name from a Model class, instance, Column, or InstrumentedAttribute."""
    if hasattr(entity, "class_"):
        entity = entity.class_
    tbl = getattr(entity, "__tablename__", None)
    if tbl is None and hasattr(entity, "table"):
        tbl = getattr(entity.table, "__tablename__", None)
    if tbl:
        if tbl in ["suppliers", "companies"]:
            return "companies"
        if tbl in ["catalog_items", "products"]:
            return "products"
        if tbl in ["rfq_suppliers", "rfq_responses"]:
            return "rfq_responses"
        if tbl in ["negotiation_messages", "negotiations"]:
            return "negotiations"
        return tbl
    name = getattr(entity, "__name__", str(entity))
    return MODEL_COLLECTION_MAP.get(name, name.lower() + "s")


def _parse_filter_expression(criterion: Any) -> Dict[str, Any]:
    """Translates a SQLAlchemy binary or boolean expression into a MongoDB filter dictionary."""
    if criterion is False or str(getattr(criterion, "element", "")).lower() == "false" or type(criterion).__name__ in ("False_", "false"):
        # Match nothing
        return {"_id": {"$exists": False}}
    if criterion is True or str(getattr(criterion, "element", "")).lower() == "true" or type(criterion).__name__ in ("True_", "true"):
        # Match everything
        return {}

    if isinstance(criterion, BinaryExpression):
        is_case_insensitive = False
        if isinstance(criterion.left, Function):
            fn_name = criterion.left.name.lower()
            if fn_name == "lower":
                is_case_insensitive = True
            inner_arg = criterion.left.clauses.clauses[0] if hasattr(criterion.left.clauses, "clauses") and criterion.left.clauses.clauses else None
            left_key = getattr(inner_arg, "key", None) or getattr(inner_arg, "name", None) or str(inner_arg)
        else:
            left_key = getattr(criterion.left, "key", None) or getattr(criterion.left, "name", None) or str(criterion.left)

        if left_key and "." in left_key:
            left_key = left_key.split(".")[-1]

        op_name = criterion.operator.__name__
        val = getattr(criterion.right, "value", criterion.right)
        if type(val).__name__ in ("True_", "true") or str(type(val)) == "<class 'sqlalchemy.sql.elements.True_'>" or (hasattr(val, "__class__") and val.__class__.__name__ == "True_"):
            val = True
        elif type(val).__name__ in ("False_", "false") or str(type(val)) == "<class 'sqlalchemy.sql.elements.False_'>" or (hasattr(val, "__class__") and val.__class__.__name__ == "False_"):
            val = False
        elif type(val).__name__ in ("Null", "null") or str(type(val)) == "<class 'sqlalchemy.sql.elements.Null'>" or val is None or (hasattr(val, "__class__") and val.__class__.__name__ == "Null"):
            val = None

        if op_name in ("eq", "is_"):
            if val is None:
                return {left_key: None}
            if val is True:
                return {left_key: {"$in": [True, 1]}}
            if val is False:
                return {left_key: {"$in": [False, 0, None]}}
            if is_case_insensitive and isinstance(val, str):
                return {left_key: re.compile(f"^{re.escape(val)}$", re.IGNORECASE)}
            return {left_key: val}
        elif op_name in ("ne", "is_not"):
            if val is None:
                return {left_key: {"$ne": None}}
            if val is True:
                return {left_key: {"$nin": [True, 1]}}
            if val is False:
                return {left_key: {"$nin": [False, 0, None]}}
            return {left_key: {"$ne": val}}
        elif op_name == "in_op":
            items = list(val) if hasattr(val, "__iter__") and not isinstance(val, (str, bytes)) else [val]
            return {left_key: {"$in": items}}
        elif op_name in ("notin_op", "not_in"):
            items = list(val) if hasattr(val, "__iter__") and not isinstance(val, (str, bytes)) else [val]
            return {left_key: {"$nin": items}}
        elif op_name in ("like_op", "ilike_op"):
            val_str = str(val) if val is not None else ""
            starts_wild = val_str.startswith("%")
            ends_wild = val_str.endswith("%")
            clean_str = val_str.strip("%")
            pattern = ("" if starts_wild else "^") + re.escape(clean_str) + ("" if ends_wild else "$")
            flags = re.IGNORECASE if (op_name == "ilike_op" or is_case_insensitive) else 0
            return {left_key: re.compile(pattern, flags)}
        elif op_name == "gt":
            return {left_key: {"$gt": val}}
        elif op_name == "ge":
            return {left_key: {"$gte": val}}
        elif op_name == "lt":
            return {left_key: {"$lt": val}}
        elif op_name == "le":
            return {left_key: {"$lte": val}}
        else:
            return {left_key: val}

    elif isinstance(criterion, UnaryExpression):
        op_name = getattr(criterion.modifier, "__name__", "")
        elem = criterion.element
        if op_name in ("inv", "not_"):
            inner = _parse_filter_expression(elem)
            return {"$nor": [inner]} if inner else {}
        elif hasattr(elem, "key") or hasattr(elem, "name"):
            col_name = getattr(elem, "key", getattr(elem, "name", str(elem)))
            return {col_name: True}

    elif hasattr(criterion, "key") and hasattr(criterion, "table"):
        col_name = getattr(criterion, "key", getattr(criterion, "name", None))
        if col_name:
            return {col_name: True}

    elif isinstance(criterion, BooleanClauseList):
        sub_clauses = [_parse_filter_expression(c) for c in criterion.clauses]
        sub_clauses = [c for c in sub_clauses if c is not None and isinstance(c, dict) and len(c) > 0]
        op_name = criterion.operator.__name__
        if op_name == "or_":
            return {"$or": sub_clauses} if sub_clauses else {}
        else:
            return {"$and": sub_clauses} if sub_clauses else {}

    elif isinstance(criterion, Grouping):
        return _parse_filter_expression(criterion.element)

    elif isinstance(criterion, dict):
        return criterion

    return {}


class MongoQuery:
    """
    MongoDB-backed query translator implementing the SQLAlchemy Query interface.
    Executes all queries directly against MongoDB collections.
    """

    def __init__(self, session: "MongoSession", *entities: Any):
        self.session = session
        self.entities = entities
        self.primary_entity = entities[0] if entities else None
        self._filter: Dict[str, Any] = {}
        self._sort: List[Tuple[str, int]] = []
        self._limit: Optional[int] = None
        self._skip: Optional[int] = None
        self._distinct_field: Optional[str] = None
        self._group_by_fields: List[str] = []
        self._joined_entities: List[Any] = []

    def filter(self, *criteria: Any) -> "MongoQuery":
        for crit in criteria:
            if crit is None:
                continue
            parsed = _parse_filter_expression(crit)
            if parsed is not None and isinstance(parsed, dict) and len(parsed) > 0:
                if not self._filter:
                    self._filter = parsed
                else:
                    if "$and" in self._filter:
                        self._filter["$and"].append(parsed)
                    else:
                        self._filter = {"$and": [self._filter, parsed]}
        return self

    def filter_by(self, **kwargs: Any) -> "MongoQuery":
        for k, v in kwargs.items():
            self._filter[k] = v
        return self

    def order_by(self, *criteria: Any) -> "MongoQuery":
        for crit in criteria:
            if isinstance(crit, UnaryExpression):
                col_name = getattr(crit.element, "key", getattr(crit.element, "name", str(crit.element)))
                direction = -1 if crit.modifier.__name__ == "desc_op" else 1
                self._sort.append((col_name, direction))
            elif hasattr(crit, "key") or hasattr(crit, "name"):
                col_name = getattr(crit, "key", getattr(crit, "name", str(crit)))
                self._sort.append((col_name, 1))
            elif isinstance(crit, str):
                self._sort.append((crit, 1))
        return self

    def limit(self, limit: int) -> "MongoQuery":
        self._limit = limit
        return self

    def offset(self, offset: int) -> "MongoQuery":
        self._skip = offset
        return self

    def options(self, *ops: Any) -> "MongoQuery":
        # Relationships are eager/smart-loaded automatically in MongoQuery
        return self

    def join(self, target: Any, *conditions: Any) -> "MongoQuery":
        self._joined_entities.append(target)
        return self

    def group_by(self, *columns: Any) -> "MongoQuery":
        for col in columns:
            field_name = getattr(col, "key", getattr(col, "name", str(col)))
            self._group_by_fields.append(field_name)
        return self

    def distinct(self, *columns: Any) -> "MongoQuery":
        if columns:
            col = columns[0]
            self._distinct_field = getattr(col, "key", getattr(col, "name", str(col)))
        elif self.entities and (hasattr(self.entities[0], "key") or hasattr(self.entities[0], "name")):
            col = self.entities[0]
            self._distinct_field = getattr(col, "key", getattr(col, "name", str(col)))
        return self

    def count(self) -> int:
        coll_name = _get_collection_name(self.primary_entity)
        coll = self.session.db[coll_name]
        return coll.count_documents(self._filter)

    def scalar(self) -> Any:
        # Handle func.sum or func.count
        if self.entities and isinstance(self.entities[0], Function):
            fn = self.entities[0]
            fn_name = fn.name.lower()
            if fn_name == "coalesce":
                inner = fn.clauses.clauses[0] if hasattr(fn.clauses, "clauses") and fn.clauses.clauses else None
                if isinstance(inner, Function):
                    fn = inner
                    fn_name = fn.name.lower()
            arg = fn.clauses.clauses[0] if hasattr(fn.clauses, "clauses") and fn.clauses.clauses else None
            field_name = getattr(arg, "key", getattr(arg, "name", "total_amount")) if arg is not None else "total_amount"
            table_entity = getattr(arg, "table", None)
            coll_name = _get_collection_name(table_entity) if table_entity is not None else _get_collection_name(getattr(self, "primary_entity", Order))

            pipeline = []
            if self._filter:
                pipeline.append({"$match": self._filter})
            if fn_name in ("sum", "avg", "min", "max"):
                pipeline.append({"$group": {"_id": None, "val": {f"${fn_name}": f"${field_name}"}}})
            elif fn_name == "count":
                pipeline.append({"$group": {"_id": None, "val": {"$sum": 1}}})

            res = list(self.session.db[coll_name].aggregate(pipeline))
            return res[0]["val"] if res and res[0].get("val") is not None else 0.0

        item = self.first()
        return item[0] if isinstance(item, tuple) else item

    def first(self) -> Optional[Any]:
        results = self.limit(1).all()
        return results[0] if results else None

    def all(self) -> List[Any]:
        coll_name = _get_collection_name(self.primary_entity)
        coll = self.session.db[coll_name]

        # Group By aggregation query
        if self._group_by_fields:
            group_field = self._group_by_fields[0]
            # Check if this is a join with quotations e.g. Supplier.name + func.count(Quotation.id) + func.avg(Quotation.total_amount)
            has_quotation = any("quotation" in str(getattr(e, "__tablename__", "")).lower() or "quotation" in str(getattr(getattr(e, "table", None), "__tablename__", "")).lower() for e in self.entities)
            if has_quotation and _get_collection_name(self.primary_entity) != "quotations":
                pipeline = [
                    {"$group": {
                        "_id": "$supplier_id",
                        "count": {"$sum": 1},
                        "avg": {"$avg": "$total_amount"}
                    }},
                    {"$lookup": {
                        "from": "companies",
                        "localField": "_id",
                        "foreignField": "id",
                        "as": "supplier"
                    }},
                    {"$unwind": "$supplier"},
                    {"$project": {
                        "name": "$supplier.name",
                        "count": "$count",
                        "avg": "$avg"
                    }},
                    {"$sort": {"count": -1}}
                ]
                if self._limit:
                    pipeline.append({"$limit": self._limit})
                res = list(self.session.db["quotations"].aggregate(pipeline))
                return [(r["name"], r["count"], r.get("avg", 0.0)) for r in res]

            pipeline = []
            if self._filter:
                pipeline.append({"$match": self._filter})
            group_doc = {"_id": f"${group_field}", "count": {"$sum": 1}}
            if len(self.entities) > 2:
                e3 = self.entities[2]
                if isinstance(e3, Function):
                    arg3 = e3.clauses.clauses[0] if hasattr(e3.clauses, "clauses") and e3.clauses.clauses else None
                    f3 = getattr(arg3, "key", getattr(arg3, "name", "total_amount")) if arg3 is not None else "total_amount"
                    fn3 = e3.name.lower()
                    group_doc["val_2"] = {f"${fn3}": f"${f3}"}

            pipeline.append({"$group": group_doc})
            pipeline.append({"$sort": {"count": -1}})
            if self._limit:
                pipeline.append({"$limit": self._limit})
            res = list(coll.aggregate(pipeline))
            if len(self.entities) == 3:
                return [(r["_id"], r["count"], r.get("val_2", 0.0)) for r in res]
            return [(r["_id"], r["count"]) for r in res]

        # Aggregate functions query e.g. db.query(func.min(col), func.max(col))
        if self.entities and all(isinstance(e, Function) for e in self.entities):
            first_fn = self.entities[0]
            first_arg = first_fn.clauses.clauses[0] if hasattr(first_fn.clauses, "clauses") and first_fn.clauses.clauses else None
            fn_tbl = getattr(first_arg, "table", None)
            if fn_tbl is not None:
                coll = self.session.db[_get_collection_name(fn_tbl)]
            pipeline = []
            if self._filter:
                pipeline.append({"$match": self._filter})
            group_doc = {"_id": None}
            for idx, fn in enumerate(self.entities):
                fn_name = fn.name.lower()
                arg = fn.clauses.clauses[0] if hasattr(fn.clauses, "clauses") and fn.clauses.clauses else None
                field_name = getattr(arg, "key", getattr(arg, "name", "id")) if arg is not None else "id"
                if fn_name in ("min", "max", "sum", "avg"):
                    group_doc[f"val_{idx}"] = {f"${fn_name}": f"${field_name}"}
                elif fn_name == "count":
                    group_doc[f"val_{idx}"] = {"$sum": 1}
            pipeline.append({"$group": group_doc})
            res = list(coll.aggregate(pipeline))
            if not res:
                return [(None,) * len(self.entities)]
            return [tuple(res[0].get(f"val_{idx}") for idx in range(len(self.entities)))]

        # Distinct query
        if self._distinct_field:
            vals = coll.distinct(self._distinct_field, self._filter)
            return [(v,) for v in vals if v is not None]

        # Find query
        cursor = coll.find(self._filter)
        if self._sort:
            cursor = cursor.sort(self._sort)
        if self._skip:
            cursor = cursor.skip(self._skip)
        if self._limit:
            cursor = cursor.limit(self._limit)

        docs = list(cursor)
        instances = []

        # Check if single column query e.g. db.query(RFQ.id)
        if hasattr(self.primary_entity, "key") and hasattr(self.primary_entity, "table"):
            col_key = self.primary_entity.key
            return [(d.get(col_key),) for d in docs]

        # Multi-entity query e.g. db.query(CompanyDocument, User)
        if len(self.entities) > 1 and len(self._joined_entities) > 0:
            second_entity = self.entities[1]
            sec_coll = self.session.db[_get_collection_name(second_entity)]
            tuple_results = []
            for d in docs:
                first_inst = self._instantiate_model(self.primary_entity, d)
                second_doc = sec_coll.find_one({"id": d.get("user_id")})
                sec_inst = self._instantiate_model(second_entity, second_doc) if second_doc else None
                tuple_results.append((first_inst, sec_inst))
            return tuple_results

        for d in docs:
            inst = self._instantiate_model(self.primary_entity, d)
            instances.append(inst)

        return instances

    def _instantiate_model(self, model_cls: Any, doc: Dict[str, Any]) -> Any:
        """Instantiates and associates an entity instance with resolved MongoDB relationships."""
        if not doc:
            return None

        clean_doc = dict(doc)
        mongo_id = clean_doc.pop("_id", None)

        # Instantiate model using defined table columns
        cols = getattr(getattr(model_cls, "__table__", None), "columns", None)
        kwargs = {}
        if cols is not None:
            for col in cols:
                if col.name in clean_doc:
                    kwargs[col.name] = clean_doc[col.name]
        else:
            kwargs = clean_doc

        try:
            inst = model_cls(**kwargs)
        except Exception:
            # Fallback for dynamic types
            inst = object.__new__(model_cls)
            for k, v in kwargs.items():
                setattr(inst, k, v)

        if mongo_id:
            setattr(inst, "_mongo_id", mongo_id)

        # Smart-populate relationships from MongoDB
        self.session.resolve_relationships(inst)
        if inst not in self.session._loaded_instances:
            self.session._loaded_instances.append(inst)
        return inst


class MongoSession:
    """
    MongoDB Session replacement for SQLAlchemy Session.
    Provides complete CRUD, query translation, and direct MongoDB collection access.
    """

    def __init__(self, db: Optional[Database] = None):
        self.db: Database = db if db is not None else get_mongo_db()
        self._pending_adds: List[Any] = []
        self._pending_deletes: List[Any] = []
        self._loaded_instances: List[Any] = []

    def query(self, *entities: Any) -> MongoQuery:
        return MongoQuery(self, *entities)

    def add(self, instance: Any):
        if instance not in self._pending_adds:
            self._pending_adds.append(instance)

    def add_all(self, instances: Sequence[Any]):
        for inst in instances:
            self.add(inst)

    def flush(self):
        """Persists pending adds and updates to MongoDB collections."""
        # Combine pending adds and loaded instances that may have modified fields
        all_instances = list(self._pending_adds)
        for inst in self._loaded_instances:
            if inst not in all_instances and inst not in self._pending_deletes:
                all_instances.append(inst)

        for inst in all_instances:
            coll_name = _get_collection_name(inst)
            coll = self.db[coll_name]

            # Assign auto-increment integer ID if not set
            if getattr(inst, "id", None) is None:
                new_id = get_next_sequence_value(self.db, coll_name)
                setattr(inst, "id", new_id)

            now = datetime.utcnow()
            if hasattr(inst, "created_at") and getattr(inst, "created_at", None) is None:
                setattr(inst, "created_at", now)
            if hasattr(inst, "updated_at") and getattr(inst, "updated_at", None) is None:
                setattr(inst, "updated_at", now)

            # Build document
            doc = {}
            cols = getattr(getattr(inst, "__table__", None), "columns", None)
            if cols is not None:
                for col in cols:
                    val = getattr(inst, col.name, None)
                    if val is None and col.default is not None:
                        try:
                            if callable(col.default.arg):
                                val = col.default.arg(None)
                            else:
                                val = col.default.arg
                            setattr(inst, col.name, val)
                        except Exception:
                            pass
                    doc[col.name] = val
            else:
                for k, v in inst.__dict__.items():
                    if not k.startswith("_"):
                        doc[k] = v

            # Upsert into primary collection
            coll.update_one({"id": inst.id}, {"$set": doc}, upsert=True)

            # Also maintain aliases if any
            for alias in COLLECTION_ALIASES.get(coll_name, []):
                self.db[alias].update_one({"id": inst.id}, {"$set": doc}, upsert=True)

            if inst not in self._loaded_instances:
                self._loaded_instances.append(inst)

        self._pending_adds.clear()

        for inst in list(self._pending_deletes):
            coll_name = _get_collection_name(inst)
            self.db[coll_name].delete_one({"id": inst.id})
            for alias in COLLECTION_ALIASES.get(coll_name, []):
                self.db[alias].delete_one({"id": inst.id})

        self._pending_deletes.clear()

    def commit(self):
        self.flush()

    def rollback(self):
        self._pending_adds.clear()
        self._pending_deletes.clear()

    def refresh(self, instance: Any):
        coll_name = _get_collection_name(instance)
        doc = self.db[coll_name].find_one({"id": instance.id})
        if doc:
            for k, v in doc.items():
                if k != "_id":
                    setattr(instance, k, v)
        self.resolve_relationships(instance)

    def delete(self, instance: Any):
        if instance not in self._pending_deletes:
            self._pending_deletes.append(instance)
            if instance in self._pending_adds:
                self._pending_adds.remove(instance)

    def execute(self, stmt: Any, params: Any = None) -> Any:
        """For health-checks or raw ping execution."""
        return self.db.command("ping")

    def close(self):
        self._pending_adds.clear()
        self._pending_deletes.clear()
        self._loaded_instances.clear()

    def __getitem__(self, coll_name: str):
        """Allows direct MongoDB collection access via db['users']."""
        return self.db[coll_name]

    def get_collection(self, coll_name: str):
        return self.db[coll_name]

    def resolve_relationships(self, inst: Any):
        """Populates related objects from MongoDB for seamless property and schema serialization."""
        c_name = _get_collection_name(inst)

        if c_name == "orders":
            # Items
            raw_items = list(self.db["order_items"].find({"order_id": inst.id}))
            from app.models.order import OrderItem, OrderStatusHistory
            inst.items = [OrderItem(**{k: v for k, v in item.items() if k != "_id"}) for item in raw_items]
            # History
            raw_hist = list(self.db["order_status_history"].find({"order_id": inst.id}).sort("id", 1))
            inst.history = [OrderStatusHistory(**{k: v for k, v in h.items() if k != "_id"}) for h in raw_hist]
            # Supplier
            if getattr(inst, "supplier_id", None):
                raw_sup = self.db["companies"].find_one({"id": inst.supplier_id})
                if raw_sup:
                    from app.models.supplier import Supplier
                    inst.supplier = Supplier(**{k: v for k, v in raw_sup.items() if k != "_id"})
            # Sourcing Request
            if getattr(inst, "sourcing_request_id", None):
                raw_sr = self.db["sourcing_requests"].find_one({"id": inst.sourcing_request_id})
                if raw_sr:
                    from app.models.sourcing import SourcingRequest
                    inst.sourcing_request = SourcingRequest(**{k: v for k, v in raw_sr.items() if k != "_id"})
                    if getattr(inst.sourcing_request, "user_id", None):
                        raw_u = self.db["users"].find_one({"id": inst.sourcing_request.user_id})
                        if raw_u:
                            from app.models.user import User
                            inst.sourcing_request.user = User(**{k: v for k, v in raw_u.items() if k != "_id"})
            # Quotation
            if getattr(inst, "quotation_id", None):
                raw_q = self.db["quotations"].find_one({"id": inst.quotation_id})
                if raw_q:
                    from app.models.quotation import Quotation
                    inst.quotation = Quotation(**{k: v for k, v in raw_q.items() if k != "_id"})

        elif c_name == "quotations":
            from app.models.quotation import QuotationItem
            raw_items = list(self.db["quotation_items"].find({"quotation_id": inst.id}))
            inst.items = [QuotationItem(**{k: v for k, v in item.items() if k != "_id"}) for item in raw_items]
            if getattr(inst, "supplier_id", None):
                raw_sup = self.db["companies"].find_one({"id": inst.supplier_id})
                if raw_sup:
                    from app.models.supplier import Supplier
                    inst.supplier = Supplier(**{k: v for k, v in raw_sup.items() if k != "_id"})
            if getattr(inst, "rfq_id", None):
                raw_rfq = self.db["rfqs"].find_one({"id": inst.rfq_id})
                if raw_rfq:
                    from app.models.rfq import RFQ
                    inst.rfq = RFQ(**{k: v for k, v in raw_rfq.items() if k != "_id"})

        elif c_name == "rfqs":
            if getattr(inst, "sourcing_request_id", None):
                raw_sr = self.db["sourcing_requests"].find_one({"id": inst.sourcing_request_id})
                if raw_sr:
                    from app.models.sourcing import SourcingRequest
                    inst.sourcing_request = SourcingRequest(**{k: v for k, v in raw_sr.items() if k != "_id"})
                    if getattr(inst.sourcing_request, "user_id", None):
                        raw_u = self.db["users"].find_one({"id": inst.sourcing_request.user_id})
                        if raw_u:
                            from app.models.user import User
                            inst.sourcing_request.user = User(**{k: v for k, v in raw_u.items() if k != "_id"})
            from app.models.rfq import RFQSupplier
            from app.models.quotation import Quotation
            from app.models.supplier import Supplier
            raw_links = list(self.db["rfq_responses"].find({"rfq_id": inst.id}))
            links = []
            for link in raw_links:
                inv = RFQSupplier(**{k: v for k, v in link.items() if k != "_id"})
                if getattr(inv, "supplier_id", None):
                    raw_sup = self.db["companies"].find_one({"id": inv.supplier_id})
                    if raw_sup:
                        inv.supplier = Supplier(**{k: v for k, v in raw_sup.items() if k != "_id"})
                links.append(inv)
            inst.supplier_links = links
            inst.supplier_invitations = links

            raw_quotes = list(self.db["quotations"].find({"rfq_id": inst.id}))
            quotes = []
            for q in raw_quotes:
                quote = Quotation(**{k: v for k, v in q.items() if k != "_id"})
                if getattr(quote, "supplier_id", None):
                    raw_sup = self.db["companies"].find_one({"id": quote.supplier_id})
                    if raw_sup:
                        quote.supplier = Supplier(**{k: v for k, v in raw_sup.items() if k != "_id"})
                quotes.append(quote)
            inst.quotations = quotes

        elif c_name in ["rfq_responses", "rfq_suppliers"]:
            from app.models.rfq import RFQ
            from app.models.supplier import Supplier
            from app.models.sourcing import SourcingRequest
            from app.models.quotation import Quotation
            if getattr(inst, "rfq_id", None):
                raw_rfq = self.db["rfqs"].find_one({"id": inst.rfq_id})
                if raw_rfq:
                    inst.rfq = RFQ(**{k: v for k, v in raw_rfq.items() if k != "_id"})
                    if getattr(inst.rfq, "sourcing_request_id", None):
                        raw_sr = self.db["sourcing_requests"].find_one({"id": inst.rfq.sourcing_request_id})
                        if raw_sr:
                            inst.rfq.sourcing_request = SourcingRequest(**{k: v for k, v in raw_sr.items() if k != "_id"})
                            if getattr(inst.rfq.sourcing_request, "user_id", None):
                                raw_u = self.db["users"].find_one({"id": inst.rfq.sourcing_request.user_id})
                                if raw_u:
                                    from app.models.user import User
                                    inst.rfq.sourcing_request.user = User(**{k: v for k, v in raw_u.items() if k != "_id"})
                    raw_quotes = list(self.db["quotations"].find({"rfq_id": inst.rfq.id}))
                    inst.rfq.quotations = [Quotation(**{k: v for k, v in q.items() if k != "_id"}) for q in raw_quotes]
            if getattr(inst, "supplier_id", None):
                raw_sup = self.db["companies"].find_one({"id": inst.supplier_id})
                if raw_sup:
                    inst.supplier = Supplier(**{k: v for k, v in raw_sup.items() if k != "_id"})

        elif c_name in ["products", "catalog_items"]:
            if getattr(inst, "supplier_id", None):
                raw_sup = self.db["companies"].find_one({"id": inst.supplier_id})
                if raw_sup:
                    from app.models.supplier import Supplier
                    inst.supplier = Supplier(**{k: v for k, v in raw_sup.items() if k != "_id"})

        elif c_name == "sourcing_requests":
            if getattr(inst, "user_id", None):
                raw_u = self.db["users"].find_one({"id": inst.user_id})
                if raw_u:
                    from app.models.user import User
                    inst.user = User(**{k: v for k, v in raw_u.items() if k != "_id"})

        elif c_name in ["companies", "suppliers"]:
            from app.models.supplier import SupplierCapability, CatalogItem
            raw_caps = list(self.db["supplier_capabilities"].find({"supplier_id": inst.id}))
            inst.capabilities = [SupplierCapability(**{k: v for k, v in c.items() if k != "_id"}) for c in raw_caps]
            raw_prods = list(self.db["products"].find({"supplier_id": inst.id}))
            inst.catalog_items = [CatalogItem(**{k: v for k, v in p.items() if k != "_id"}) for p in raw_prods]

        elif c_name == "users":
            if getattr(inst, "supplier_id", None):
                raw_sup = self.db["companies"].find_one({"id": inst.supplier_id})
                if raw_sup:
                    from app.models.supplier import Supplier
                    inst.supplier = Supplier(**{k: v for k, v in raw_sup.items() if k != "_id"})
            from app.models.document import CompanyDocument
            raw_docs = list(self.db["company_documents"].find({"user_id": inst.id}))
            inst.documents = [CompanyDocument(**{k: v for k, v in d.items() if k != "_id"}) for d in raw_docs]

        elif c_name == "company_documents":
            if getattr(inst, "user_id", None):
                raw_u = self.db["users"].find_one({"id": inst.user_id})
                if raw_u:
                    from app.models.user import User
                    inst.user = User(**{k: v for k, v in raw_u.items() if k != "_id"})

        elif c_name == "complaints":
            from app.models.complaint import ComplaintEvidence, ComplaintMessage, ComplaintStatusHistory
            raw_ev = list(self.db["complaint_evidence"].find({"complaint_id": inst.id}))
            inst.evidence = [ComplaintEvidence(**{k: v for k, v in e.items() if k != "_id"}) for e in raw_ev]
            raw_msg = list(self.db["complaint_messages"].find({"complaint_id": inst.id}))
            inst.messages = [ComplaintMessage(**{k: v for k, v in m.items() if k != "_id"}) for m in raw_msg]
            raw_h = list(self.db["complaint_status_history"].find({"complaint_id": inst.id}))
            inst.history = [ComplaintStatusHistory(**{k: v for k, v in h.items() if k != "_id"}) for h in raw_h]

        elif c_name == "bom_projects":
            from app.models.bom import BOMItem
            raw_items = list(self.db["bom_items"].find({"bom_project_id": inst.id}))
            inst.items = [BOMItem(**{k: v for k, v in item.items() if k != "_id"}) for item in raw_items]

        elif c_name == "agent_runs":
            from app.models.agent import AgentRunEvent
            raw_events = list(self.db["agent_run_events"].find({"agent_run_id": inst.id}))
            inst.events = [AgentRunEvent(**{k: v for k, v in e.items() if k != "_id"}) for e in raw_events]
