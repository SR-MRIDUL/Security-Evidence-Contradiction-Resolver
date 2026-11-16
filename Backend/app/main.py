from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine, SessionLocal
from app import models  # noqa: F401 - registers SQLAlchemy models
from app.models.user import User
from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.routes import auth, investigations, uploads, admin


# Create missing tables without dropping or resetting existing data.
Base.metadata.create_all(bind=engine)


def migrate_legacy_registration_roles() -> None:
    """Convert legacy public-signup Analyst accounts when no normal users exist yet.

    Older SERCR versions assigned every public signup the Analyst role. In those
    databases there were no admin-assigned analysts. Only perform this compatibility
    migration when the database has no `user` role accounts; after the first normal
    user exists, future admin-assigned Analyst accounts are left untouched.
    """
    db = SessionLocal()
    try:
        has_normal_users = db.query(User.id).filter(User.role == "user").first() is not None
        if not has_normal_users:
            db.query(User).filter(User.role == "analyst").update(
                {User.role: "user"}, synchronize_session=False
            )
            db.commit()
    finally:
        db.close()


def bootstrap_initial_admin() -> None:
    """Create the first admin only from explicitly configured server-side secrets."""
    email = (settings.INITIAL_ADMIN_EMAIL or "").strip().lower()
    password = settings.INITIAL_ADMIN_PASSWORD
    if not email or not password:
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(
                full_name=settings.INITIAL_ADMIN_NAME,
                email=email,
                hashed_password=hash_password(password),
                role="admin",
                is_active=True,
            )
            db.add(user)
            db.commit()
        elif verify_password(password, user.hashed_password):
            user.role = "admin"
            user.is_active = True
            db.commit()
        else:
            print(
                "Initial admin bootstrap skipped: configured email exists, "
                "but the configured password does not match that account."
            )
    finally:
        db.close()


migrate_legacy_registration_roles()
bootstrap_initial_admin()

app = FastAPI(
    title="Security Evidence Contradiction Resolver",
    description="Role-based multi-agent security investigation and evidence analysis platform",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(investigations.router)
app.include_router(uploads.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "message": "Security Evidence Contradiction Resolver API is running",
        "version": "2.1.0",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
