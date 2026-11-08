from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.config import settings
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.investigation import Investigation
from app.models.uploaded_file import UploadedFile
from app.schemas.investigation import UploadedFileOut


router = APIRouter(prefix="/api/uploads", tags=["File Upload"])

BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads"
ALLOWED_EXTENSIONS = {".csv", ".json", ".txt"}


@router.post("/", response_model=UploadedFileOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    investigation_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only CSV, JSON and TXT files are allowed"
        )

    if investigation_id is not None:
        investigation = db.query(Investigation).filter(
            Investigation.id == investigation_id
        ).first()

        if investigation is None:
            raise HTTPException(status_code=404, detail="Investigation not found")

        if current_user.role != "admin" and investigation.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")

    content = await file.read(settings.MAX_FILE_SIZE_MB * 1024 * 1024 + 1)

    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size exceeds the limit")

    if not content:
        raise HTTPException(status_code=400, detail="Empty files are not allowed")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / stored_filename

    try:
        file_path.write_bytes(content)

        uploaded_file = UploadedFile(
            original_filename=Path(file.filename).name,
            stored_filename=stored_filename,
            file_path=str(file_path),
            file_type=extension.lstrip("."),
            file_size=len(content),
            uploaded_by=current_user.id,
            investigation_id=investigation_id
        )

        db.add(uploaded_file)
        db.commit()
        db.refresh(uploaded_file)

        return uploaded_file

    except Exception:
        db.rollback()
        file_path.unlink(missing_ok=True)
        raise


@router.get("/", response_model=list[UploadedFileOut])
def get_uploaded_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(UploadedFile)

    if current_user.role != "admin":
        query = query.filter(UploadedFile.uploaded_by == current_user.id)

    return query.order_by(UploadedFile.id.desc()).all()