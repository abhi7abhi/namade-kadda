import sys
sys.path.insert(0, r"C:\Users\abhin\Downloads\namade-kadda\backend")

import pymongo
from app.models.user import User
from app.models.order import Order
from app.models.supplier import Supplier
from sqlalchemy.sql.elements import BinaryExpression, BooleanClauseList, UnaryExpression

def parse_criterion(criterion):
    if isinstance(criterion, BinaryExpression):
        left_key = getattr(criterion.left, "key", getattr(criterion.left, "name", str(criterion.left)))
        op_name = criterion.operator.__name__
        val = getattr(criterion.right, "value", criterion.right)
        
        if op_name in ("eq", "is_"):
            return {left_key: val}
        elif op_name in ("ne", "is_not"):
            return {left_key: {"$ne": val}}
        elif op_name == "in_op":
            return {left_key: {"$in": list(val)}}
        elif op_name in ("notin_op", "not_in"):
            return {left_key: {"$nin": list(val)}}
        elif op_name in ("like_op", "ilike_op"):
            pattern = str(val).replace("%", ".*").replace("_", ".")
            return {left_key: {"$regex": f"^{pattern}$", "$options": "i"}}
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
            
    elif isinstance(criterion, BooleanClauseList):
        clauses = [parse_criterion(c) for c in criterion.clauses]
        op_name = criterion.operator.__name__
        if op_name == "or_":
            return {"$or": clauses}
        else:
            return {"$and": clauses}
            
    return {}

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["namade_kadda"]

# Test query 1
filter1 = parse_criterion(User.email == "buyer@namadekadda.demo")
print("Filter 1:", filter1)
user_doc = db.users.find_one(filter1)
print("Found user:", user_doc["email"], user_doc["role"])

# Test query 2
filter2 = parse_criterion(User.role.in_(["BUYER", "SUPPLIER"]))
print("\nFilter 2:", filter2)
count = db.users.count_documents(filter2)
print("Count matching:", count)

# Test query 3
filter3 = parse_criterion(Order.status == "IN_PRODUCTION")
print("\nFilter 3:", filter3)
orders = list(db.orders.find(filter3).sort("id", -1).limit(3))
print("Orders found:", len(orders), [o["order_code"] for o in orders])
