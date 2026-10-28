import os
import re
import uuid
import json
import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    revoke_token,
    is_token_revoked
)
from app.models.user import User
from app.models.supplier import Supplier, SupplierCapability
from app.models.document import CompanyDocument
from app.models.audit import AuditLog
from app.schemas.user import (
    UserLogin,
    AdminLoginRequest,
    UserRegisterBuyer,
    UserRegisterSupplier,
    TokenResponse,
    UserOut,
    ForgotPasswordRequest,
    ForgotPasswordResponse
)
from app.schemas.document import (
    CompanyDocumentOut,
    CompanyVerificationStatusOut
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer(auto_error=False)

# Private storage directory for sensitive verification documents
VERIFICATION_DOCS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "private_storage", "verification_documents")
)
os.makedirs(VERIFICATION_DOCS_DIR, exist_ok=True)

ALLOWED_DOC_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf"}
ALLOWED_DOC_MIME_TYPES = {"image/png", "image/jpeg", "application/pdf"}
MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to extract and validate the active user from the JWT token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if is_token_revoked(credentials.credentials):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been revoked or logged out. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid credentials. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deactivated. Please contact an administrator.",
        )

    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependency to extract the active user if a valid Bearer token is provided, or None."""
    if not credentials or not credentials.credentials:
        return None
    if is_token_revoked(credentials.credentials):
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        if not payload or "sub" not in payload:
            return None
        user_id = payload.get("sub")
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None


def require_role(allowed_roles: List[str]):
    """Role-based access control dependency factory."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}. Your role: {current_user.role}",
            )
        return current_user
    return role_checker


def compute_redirect_url(user: User) -> str:
    """Determine the appropriate destination workspace or document verification page."""
    if user.role == "ADMIN":
        return "/dashboard/admin"
    elif user.role == "SUPPLIER":
        if user.verification_status in ["NOT_SUBMITTED", "PENDING_REVIEW"]:
            return "/register/supplier/documents"
        return "/dashboard/supplier"
    else:  # BUYER
        if user.verification_status in ["NOT_SUBMITTED", "PENDING_REVIEW"]:
            return "/register/buyer/documents"
        return "/dashboard/buyer"


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user via email or numeric admin ID with password.
    Enforces role matching if expected role is specified.
    """
    user: Optional[User] = None

    # 1. Admin ID login flow
    if payload.admin_id:
        clean_admin_id = payload.admin_id.strip()
        if not re.match(r"^\d+$", clean_admin_id):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Administrator ID must contain numeric digits only.",
            )
        user = db.query(User).filter(User.admin_id == clean_admin_id).first()
        if not user or user.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Administrator ID or password.",
            )
    # 2. Email login flow
    elif payload.email:
        clean_email = str(payload.email).lower().strip()
        user = db.query(User).filter(User.email == clean_email).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Either email or numeric administrator ID is required.",
        )

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your details and password.",
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your details and password.",
        )

    # 3. Enforce backend role verification: Users cannot gain a role merely by selecting it in UI
    if payload.role:
        expected_role = payload.role.strip().upper()
        if user.role != expected_role:
            role_labels = {"BUYER": "Buyer", "SUPPLIER": "Supplier / Seller", "ADMIN": "Administrator"}
            expected_label = role_labels.get(expected_role, expected_role)
            actual_label = role_labels.get(user.role, user.role)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role mismatch: This account is registered as a {actual_label}, not a {expected_label}. Please select the {actual_label} tab to log in.",
            )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact platform operations.",
        )

    # Audit log
    audit = AuditLog(
        action="USER_LOGIN",
        entity_type="User",
        entity_id=str(user.id),
        details=f"User {user.email} successfully authenticated with role {user.role}",
        user_email=user.email
    )
    db.add(audit)
    db.commit()

    token = create_access_token(data={
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "name": user.full_name
    })

    redirect_url = compute_redirect_url(user)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        redirect_url=redirect_url
    )


@router.post("/admin/login", response_model=TokenResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """
    Dedicated Administrator Login using numeric Administrator ID and password.
    Requires server-side verification of numeric ID and bcrypt password.
    """
    clean_admin_id = payload.admin_id.strip()
    if not re.match(r"^\d+$", clean_admin_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Administrator ID must contain numeric digits only.",
        )

    user = db.query(User).filter(
        User.admin_id == clean_admin_id,
        User.role == "ADMIN"
    ).first()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Administrator ID or password.",
        )

    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Administrator ID or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator account is inactive.",
        )

    audit = AuditLog(
        action="ADMIN_LOGIN",
        entity_type="User",
        entity_id=str(user.id),
        details=f"Administrator {user.email} (ID: {user.admin_id}) authenticated to admin console",
        user_email=user.email
    )
    db.add(audit)
    db.commit()

    token = create_access_token(data={
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "name": user.full_name
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        redirect_url="/dashboard/admin"
    )


@router.post("/register/buyer", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_buyer(payload: UserRegisterBuyer, db: Session = Depends(get_db)):
    """
    Register an industrial buyer account.
    Saves company info, sourcing categories, and redirects to document upload page.
    """
    # Password confirmation check
    if payload.confirm_password and payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match. Please ensure password and confirm password are identical.",
        )

    clean_email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address is already registered. Please sign in instead.",
        )

    # Format sourcing categories
    sourcing_cat_str = ""
    if isinstance(payload.sourcing_categories, list):
        sourcing_cat_str = json.dumps([c.strip() for c in payload.sourcing_categories if c.strip()])
    elif isinstance(payload.sourcing_categories, str):
        sourcing_cat_str = payload.sourcing_categories.strip()
    else:
        sourcing_cat_str = payload.business_category or "Industrial Components"

    full_name = (payload.full_name or payload.company_name).strip()
    hashed_pw = get_password_hash(payload.password)

    user = User(
        email=clean_email,
        hashed_password=hashed_pw,
        full_name=full_name,
        role="BUYER",
        company_name=payload.company_name.strip(),
        country=payload.country.strip(),
        business_category=payload.business_category or "Industrial Components",
        sourcing_categories=sourcing_cat_str,
        contact_phone=payload.contact_phone.strip() if payload.contact_phone else None,
        is_active=True,
        verification_status="PENDING_REVIEW"
    )
    db.add(user)
    db.flush()

    audit = AuditLog(
        action="BUYER_REGISTERED",
        entity_type="User",
        entity_id=str(user.id),
        details=f"New buyer registered: {user.company_name} ({user.country}) - Awaiting document verification",
        user_email=user.email
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "name": user.full_name
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        redirect_url="/register/buyer/documents"
    )


@router.post("/register/supplier", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_supplier(payload: UserRegisterSupplier, db: Session = Depends(get_db)):
    """
    Register an industrial supplier / seller account.
    Creates supplier company entity and user with PENDING_REVIEW verification status.
    """
    if payload.confirm_password and payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match. Please ensure password and confirm password are identical.",
        )

    clean_email = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address is already registered. Please sign in instead.",
        )

    # Format product categories
    prod_cat_str = ""
    if isinstance(payload.product_categories, list):
        prod_cat_str = ", ".join([c.strip() for c in payload.product_categories if c.strip()])
    elif isinstance(payload.product_categories, str):
        prod_cat_str = payload.product_categories.strip()
    else:
        prod_cat_str = "Manufacturing & Sourcing"

    slug_base = re.sub(r"[^a-z0-9]+", "-", payload.company_name.lower().strip()).strip("-")
    unique_slug = f"{slug_base}-{int(datetime.datetime.utcnow().timestamp())}"

    # 1. Create Supplier entity
    supplier = Supplier(
        name=payload.company_name.strip(),
        slug=unique_slug,
        description=f"Supplier of {payload.products_sold or prod_cat_str}",
        country=payload.country.strip(),
        city="Industrial Zone",
        contact_email=clean_email,
        phone=payload.contact_phone.strip(),
        moq=25,
        lead_time_days=21,
        price_rating="$$",
        is_verified=False,
        verification_status="PENDING_REVIEW",
        products_sold=payload.products_sold.strip() if payload.products_sold else None,
        product_categories=prod_cat_str
    )
    db.add(supplier)
    db.flush()

    # 2. Add initial capability
    cap = SupplierCapability(
        supplier_id=supplier.id,
        category="Industrial Manufacturing",
        process_type=(payload.manufacturing_capabilities or "General Fabrication").strip(),
        materials="Steel, Aluminum, Engineered Alloys",
        certifications="Pending Verification"
    )
    db.add(cap)

    # 3. Create linked User
    full_name = (payload.full_name or payload.company_name).strip()
    hashed_pw = get_password_hash(payload.password)
    user = User(
        email=clean_email,
        hashed_password=hashed_pw,
        full_name=full_name,
        role="SUPPLIER",
        company_name=payload.company_name.strip(),
        country=payload.country.strip(),
        business_category="Manufacturing & Sourcing",
        contact_phone=payload.contact_phone.strip(),
        supplier_id=supplier.id,
        is_active=True,
        verification_status="PENDING_REVIEW"
    )
    db.add(user)
    db.flush()

    audit = AuditLog(
        action="SUPPLIER_REGISTERED",
        entity_type="Supplier",
        entity_id=str(supplier.id),
        details=f"New supplier registered: {supplier.name} ({supplier.country}) - Awaiting document verification",
        user_email=user.email
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "name": user.full_name
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user),
        redirect_url="/register/supplier/documents"
    )


# =============================================================================
# Document Verification Endpoints
# =============================================================================

@router.post("/documents/upload", response_model=CompanyDocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_verification_document(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    document_title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Securely upload a company verification document (PNG, JPEG, PDF up to 10MB).
    Files are stored in private storage and never exposed via public static routes.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_DOC_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Accepted formats are PNG, JPEG, and PDF (.png, .jpg, .jpeg, .pdf)."
        )

    # Validate MIME type
    if file.content_type and file.content_type not in ALLOWED_DOC_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid MIME type '{file.content_type}'. Must be PNG, JPEG, or PDF."
        )

    content = await file.read()
    file_size = len(content)

    if file_size > MAX_DOC_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 10MB (file size: {file_size / (1024 * 1024):.2f}MB)."
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    # Generate safe unique server-side filename
    stored_filename = f"doc_{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(VERIFICATION_DOCS_DIR, stored_filename)

    with open(dest_path, "wb") as f:
        f.write(content)

    # Determine display title
    type_labels = {
        "COMPANY_REGISTRATION": "Company Registration Certificate",
        "BUSINESS_LICENSE": "Business Operating Licence",
        "TAX_CERTIFICATE": "Tax Registration Certificate (GST/VAT/EIN)",
        "REPRESENTATIVE_ID": "Authorized Representative Identification",
        "PRODUCT_CERTIFICATION": "Product Compliance Certification",
        "QUALITY_CERTIFICATION": "Quality Management System Certification",
        "OTHER": "Supporting Documentation"
    }
    title = document_title.strip() if document_title else type_labels.get(document_type, document_type.replace("_", " ").title())

    doc = CompanyDocument(
        user_id=current_user.id,
        supplier_id=current_user.supplier_id,
        document_type=document_type.strip(),
        document_title=title,
        description=description.strip() if description else None,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=dest_path,
        file_size=file_size,
        mime_type=file.content_type or ("application/pdf" if ext == ".pdf" else "image/png"),
        status="PENDING_REVIEW"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    out = CompanyDocumentOut.model_validate(doc)
    out.download_url = f"/api/v1/auth/documents/{doc.id}/download"
    return out


@router.get("/documents", response_model=List[CompanyDocumentOut])
def list_company_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all verification documents uploaded by the authenticated user's company."""
    q = db.query(CompanyDocument).filter(CompanyDocument.user_id == current_user.id)
    if current_user.supplier_id:
        q = db.query(CompanyDocument).filter(
            (CompanyDocument.user_id == current_user.id) |
            (CompanyDocument.supplier_id == current_user.supplier_id)
        )

    docs = q.order_by(CompanyDocument.created_at.desc()).all()
    result = []
    for d in docs:
        item = CompanyDocumentOut.model_validate(d)
        item.download_url = f"/api/v1/auth/documents/{d.id}/download"
        result.append(item)
    return result


@router.delete("/documents/{document_id}")
def delete_company_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a previously uploaded document before official approval."""
    doc = db.query(CompanyDocument).filter(CompanyDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Authorization check
    is_owner = (doc.user_id == current_user.id) or (current_user.supplier_id and doc.supplier_id == current_user.supplier_id)
    if not is_owner and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="You do not have permission to delete this document.")

    if doc.status == "APPROVED" and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=400,
            detail="Approved verification documents cannot be removed directly. Please submit an update request."
        )

    # Delete physical file
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()
    return {"success": True, "message": "Document successfully deleted."}


@router.post("/documents/submit", response_model=CompanyVerificationStatusOut)
def submit_documents_for_review(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Formally submit uploaded documents for compliance review.
    Updates company verification status to PENDING_REVIEW.
    """
    # Count uploaded documents
    q = db.query(CompanyDocument).filter(CompanyDocument.user_id == current_user.id)
    if current_user.supplier_id:
        q = db.query(CompanyDocument).filter(
            (CompanyDocument.user_id == current_user.id) |
            (CompanyDocument.supplier_id == current_user.supplier_id)
        )
    docs = q.all()

    if not docs:
        raise HTTPException(
            status_code=400,
            detail="Please upload at least one verification document before submitting."
        )

    now = datetime.datetime.utcnow()
    current_user.verification_status = "PENDING_REVIEW"
    current_user.verification_submitted_at = now
    current_user.verification_rejection_reason = None

    if current_user.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == current_user.supplier_id).first()
        if supplier:
            supplier.verification_status = "PENDING_REVIEW"
            supplier.verification_submitted_at = now
            supplier.verification_rejection_reason = None

    audit = AuditLog(
        action="DOCUMENTS_SUBMITTED_FOR_VERIFICATION",
        entity_type="User",
        entity_id=str(current_user.id),
        details=f"Company {current_user.company_name} ({current_user.role}) submitted {len(docs)} documents for compliance review",
        user_email=current_user.email
    )
    db.add(audit)
    db.commit()

    return get_company_verification_status(current_user, db)


@router.get("/verification-status", response_model=CompanyVerificationStatusOut)
def get_company_verification_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve the company's full verification status, document counts, and audit details."""
    q = db.query(CompanyDocument).filter(CompanyDocument.user_id == current_user.id)
    if current_user.supplier_id:
        q = db.query(CompanyDocument).filter(
            (CompanyDocument.user_id == current_user.id) |
            (CompanyDocument.supplier_id == current_user.supplier_id)
        )
    docs = q.order_by(CompanyDocument.created_at.desc()).all()

    doc_outs = []
    approved_count = 0
    rejected_count = 0
    pending_count = 0

    for d in docs:
        item = CompanyDocumentOut.model_validate(d)
        item.download_url = f"/api/v1/auth/documents/{d.id}/download"
        doc_outs.append(item)
        if d.status == "APPROVED":
            approved_count += 1
        elif d.status == "REJECTED":
            rejected_count += 1
        else:
            pending_count += 1

    return CompanyVerificationStatusOut(
        user_id=current_user.id,
        company_name=current_user.company_name,
        role=current_user.role,
        verification_status=current_user.verification_status,
        rejection_reason=current_user.verification_rejection_reason,
        submitted_at=current_user.verification_submitted_at,
        reviewed_at=current_user.verification_reviewed_at,
        documents=doc_outs,
        documents_count=len(docs),
        approved_documents_count=approved_count,
        rejected_documents_count=rejected_count,
        pending_documents_count=pending_count
    )


@router.get("/documents/{document_id}/download")
def download_verification_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Secure endpoint to download or view a private verification document.
    Access is strictly authorized to the owning company or an Administrator.
    """
    doc = db.query(CompanyDocument).filter(CompanyDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Strict authorization check
    is_admin = current_user.role == "ADMIN"
    is_owner = (doc.user_id == current_user.id) or (current_user.supplier_id and doc.supplier_id == current_user.supplier_id)

    if not is_admin and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have permission to view documents from this company."
        )

    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Document file does not exist on storage.")

    return FileResponse(
        path=doc.file_path,
        media_type=doc.mime_type,
        filename=doc.original_filename
    )


@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve the currently authenticated user's profile and active role."""
    return UserOut.model_validate(current_user)


@router.post("/logout")
def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
):
    """
    Revoke active JWT session and record audit trail.
    Safe and resilient: always terminates session cleanly even if unauthenticated or expired.
    """
    if credentials and credentials.credentials:
        token = credentials.credentials
        revoke_token(token)
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            try:
                user = db.query(User).filter(User.id == int(payload["sub"])).first()
                if user:
                    audit = AuditLog(
                        action="USER_LOGOUT",
                        entity_type="User",
                        entity_id=str(user.id),
                        details=f"User {user.email} successfully logged out and session revoked",
                        user_email=user.email
                    )
                    db.add(audit)
                    db.commit()
            except Exception:
                pass

    return {
        "success": True,
        "message": "Session successfully terminated and token revoked."
    }


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest):
    """Simulated password reset endpoint that avoids user enumeration."""
    return ForgotPasswordResponse(
        message="If an account exists with this email address, a password reset link has been dispatched.",
        is_simulated=True,
        dev_note="Student/Demo Environment Notice: External SMTP email dispatch is simulated. Use the seeded demo accounts on /login (buyer@namadekadda.demo, supplier@namadekadda.demo, admin ID 12345667) to access the platform."
    )
