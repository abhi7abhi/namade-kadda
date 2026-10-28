import sys
sys.path.insert(0, r"C:\Users\abhin\Downloads\namade-kadda\backend")

from app.models.user import User
from app.models.order import Order
from app.models.rfq import RFQ
from app.models.quotation import Quotation
from app.models.supplier import Supplier
from sqlalchemy import or_, and_, func

# Let's see what binary expressions look like in SQLAlchemy:
expr1 = (User.role == "BUYER")
print("Expr1 type:", type(expr1), dir(expr1))
print("Expr1 left:", expr1.left, expr1.left.key if hasattr(expr1.left, "key") else expr1.left.name)
print("Expr1 operator:", expr1.operator.__name__)
print("Expr1 right:", expr1.right.value if hasattr(expr1.right, "value") else expr1.right)

expr2 = User.id.in_([1, 2, 3])
print("\nExpr2 type:", type(expr2))
print("Expr2 left:", expr2.left.key if hasattr(expr2.left, "key") else expr2.left.name)
print("Expr2 operator:", expr2.operator.__name__)
print("Expr2 right:", expr2.right.value if hasattr(expr2.right, "value") else expr2.right)

expr3 = or_(User.role == "BUYER", User.role == "SUPPLIER")
print("\nExpr3 type:", type(expr3), expr3.clauses)

expr4 = Order.created_at.desc()
print("\nExpr4 type:", type(expr4), dir(expr4))
print("Expr4 element:", expr4.element.key)
print("Expr4 modifier:", expr4.modifier.__name__)
