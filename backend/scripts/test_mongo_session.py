import sys
sys.path.insert(0, r"C:\Users\abhin\Downloads\namade-kadda\backend")

from app.core.mongo_session import MongoSession
from app.models.user import User
from app.models.order import Order
from app.models.rfq import RFQ
from app.models.quotation import Quotation
from app.models.supplier import Supplier

session = MongoSession()

# 1. Test user query
user = session.query(User).filter(User.email == "buyer@namadekadda.demo").first()
print("1. User query:", user.email, "| role:", user.role, "| company:", user.company_name)

# 2. Test count query
buyer_count = session.query(User).filter(User.role == "BUYER").count()
print("2. Buyer count in MongoDB:", buyer_count)

# 3. Test order query with relationships
order = session.query(Order).filter(Order.id == 1).first()
print("3. Order 1:", order.order_code, "| status:", order.status, "| supplier:", order.supplier.name if order.supplier else None, "| items:", len(order.items), "| history:", len(order.history))

# 4. Test RFQ query
rfqs = session.query(RFQ).order_by(RFQ.id.desc()).limit(3).all()
print("4. RFQs loaded:", len(rfqs), [r.rfq_code for r in rfqs])

# 5. Test Quotation query
quotes = session.query(Quotation).limit(3).all()
print("5. Quotations loaded:", len(quotes), [q.quote_code for q in quotes])
