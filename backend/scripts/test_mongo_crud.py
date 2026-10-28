import sys
sys.path.insert(0, r"C:\Users\abhin\Downloads\namade-kadda\backend")

import pymongo
from app.models.user import User

client = pymongo.MongoClient("mongodb://localhost:27017")
db = client["namade_kadda"]

def get_next_sequence(name):
    ret = db["_counters"].find_one_and_update(
        {"_id": name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=pymongo.ReturnDocument.AFTER
    )
    return ret["seq"]

# Test adding a user
new_id = get_next_sequence("users")
u = User(
    id=new_id,
    email="temp_test_user@example.com",
    hashed_password="hashed_pw_xyz",
    full_name="Temp Test User",
    role="BUYER",
    company_name="Test Enterprise Inc."
)

doc = {col.name: getattr(u, col.name, None) for col in u.__table__.columns}
db["users"].update_one({"id": u.id}, {"$set": doc}, upsert=True)
print("Inserted user with id:", u.id)

# Query user back
found = db["users"].find_one({"email": "temp_test_user@example.com"})
print("Found in MongoDB:", found["id"], found["email"], found["company_name"])

# Clean up test user
db["users"].delete_one({"id": u.id})
print("Cleaned up test user.")
