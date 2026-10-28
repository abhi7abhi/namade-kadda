"""
Unit and integration tests for fast logout and token revocation in Namade Kadda.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import is_token_revoked, revoke_token

client = TestClient(app)

def test_buyer_logout_flow():
    # 1. Login as buyer
    login_res = client.post("/api/v1/auth/login", json={
        "email": "buyer@namadekadda.demo",
        "password": "NmkBuyer@2026"
    })
    assert login_res.status_code == 200, f"Buyer login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    assert token is not None

    # 2. Verify token is valid before logout
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "buyer@namadekadda.demo"

    # 3. Call POST /api/v1/auth/logout
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    data = logout_res.json()
    assert data["success"] is True
    assert "revoked" in data["message"].lower() or "logged out" in data["message"].lower()

    # 4. Verify token is marked as revoked
    assert is_token_revoked(token) is True

    # 5. Verify subsequent access with revoked token returns 401 Unauthorized
    unauth_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert unauth_res.status_code == 401
    assert "revoked" in unauth_res.json()["detail"].lower()

def test_supplier_logout_flow():
    # 1. Login as supplier
    login_res = client.post("/api/v1/auth/login", json={
        "email": "supplier@namadekadda.demo",
        "password": "NmkSupplier@2026"
    })
    assert login_res.status_code == 200, f"Supplier login failed: {login_res.text}"
    token = login_res.json()["access_token"]

    # 2. Verify valid before logout
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200

    # 3. Logout
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True

    # 4. Invalidate
    unauth_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert unauth_res.status_code == 401
    assert "revoked" in unauth_res.json()["detail"].lower()

def test_admin_logout_flow():
    # 1. Login as admin
    login_res = client.post("/api/v1/auth/login", json={
        "email": "admin@namadekadda.demo",
        "password": "NmkAdmin@2026"
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.text}"
    token = login_res.json()["access_token"]

    # 2. Verify valid before logout
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200

    # 3. Logout
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True

    # 4. Invalidate
    unauth_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert unauth_res.status_code == 401
    assert "revoked" in unauth_res.json()["detail"].lower()

def test_logout_without_token():
    # Logout without token should still succeed gracefully
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    assert res.json()["success"] is True
