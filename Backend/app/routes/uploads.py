import hashlib
import json
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
from app.models.investigation_result import InvestigationResult
from app.agents.nodes import parse_evidence_text
from app.agents.workflow import investigation_workflow

router = APIRouter(prefix="/api/uploads", tags=["File Upload & History"])
BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads"
ALLOWED_EXTENSIONS = {".csv", ".json", ".txt", ".log"}


def _can_review_all(user: User) -> bool:
    return user.role == "analyst"


def _run_analysis(events: list[dict]) -> dict:
    result = investigation_workflow.invoke({
        "events": events,
        "agent_outputs": [],
        "agent_status": [],
    })
    return {
        "analyzed_events": result.get("analyzed_events", []),
        "correlations": result.get("correlations", []),
        "contradictions": result.get("contradictions", []),
        "threat_findings": result.get("threat_findings", []),
        "timeline": result.get("timeline", []),
        "agent_outputs": result.get("agent_outputs", []),
        "agent_status": result.get("agent_status", []),
        "final_report": result.get("final_report", {}),
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    investigation_id: int | None = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a log file. If no investigation is supplied, create one automatically and analyze it."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    safe_name = Path(file.filename).name
    extension = Path(safe_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only CSV, JSON, TXT and LOG files are supported")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_FILE_SIZE_MB} MB")
    if not content:
        raise HTTPException(status_code=400, detail="Empty files are not allowed")
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Upload a UTF-8 text log, CSV or JSON file")
    if not decoded.strip():
        raise HTTPException(status_code=400, detail="File contains no readable text")

    events = parse_evidence_text(decoded, extension.lstrip("."), safe_name)
    if not events:
        raise HTTPException(status_code=400, detail="No readable security events could be extracted from this file")

    file_hash = hashlib.sha256(content).hexdigest()
    for event in events:
        event["source_file"] = safe_name
        event["sha256"] = file_hash

    investigation = None
    if investigation_id is not None:
        investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if investigation is None:
            raise HTTPException(status_code=404, detail="Investigation not found")
        if not _can_review_all(current_user) and investigation.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Users do not need to enter a title or description; the system labels it from the filename.
        investigation = Investigation(
            title=f"{safe_name[:185]}",
            description=None,
            status="processing",
            created_by=current_user.id,
        )
        db.add(investigation)
        db.flush()

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / stored_name
    try:
        file_path.write_bytes(content)
        uploaded = UploadedFile(
            original_filename=safe_name,
            stored_filename=stored_name,
            file_path=str(file_path),
            file_type=extension.lstrip("."),
            file_size=len(content),
            uploaded_by=current_user.id,
            investigation_id=investigation.id,
        )
        db.add(uploaded)
        db.flush()

        analysis = _run_analysis(events)
        saved = db.query(InvestigationResult).filter(
            InvestigationResult.investigation_id == investigation.id
        ).first()
        serialized = json.dumps(analysis, ensure_ascii=False, default=str)
        if saved:
            saved.result_json = serialized
        else:
            db.add(InvestigationResult(investigation_id=investigation.id, result_json=serialized))

        investigation.status = "completed"
        db.commit()
        db.refresh(uploaded)
        db.refresh(investigation)
        return {
            "file": {
                "id": uploaded.id,
                "original_filename": uploaded.original_filename,
                "file_type": uploaded.file_type,
                "file_size": uploaded.file_size,
                "uploaded_at": uploaded.uploaded_at,
                "sha256": file_hash,
            },
            "investigation": {
                "id": investigation.id,
                "title": investigation.title,
                "status": investigation.status,
                "created_at": investigation.created_at,
            },
            "analysis": analysis,
        }
    except HTTPException:
        db.rollback()
        file_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        db.rollback()
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"Upload analysis failed: {str(exc)}")


@router.get("/history")
def get_upload_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(UploadedFile)
    if not _can_review_all(current_user):
        query = query.filter(UploadedFile.uploaded_by == current_user.id)
    files = query.order_by(UploadedFile.id.desc()).all()
    history = []
    for uploaded in files:
        investigation = db.query(Investigation).filter(
            Investigation.id == uploaded.investigation_id
        ).first() if uploaded.investigation_id else None
        saved = db.query(InvestigationResult).filter(
            InvestigationResult.investigation_id == uploaded.investigation_id
        ).first() if uploaded.investigation_id else None
        try:
            analysis = json.loads(saved.result_json) if saved else None
        except (json.JSONDecodeError, TypeError):
            analysis = None
        file_path = Path(uploaded.file_path)
        try:
            file_hash = hashlib.sha256(file_path.read_bytes()).hexdigest() if file_path.is_file() else None
        except OSError:
            file_hash = None
        uploader = db.query(User).filter(User.id == uploaded.uploaded_by).first()
        history.append({
            "file": {
                "id": uploaded.id,
                "original_filename": uploaded.original_filename,
                "file_type": uploaded.file_type,
                "file_size": uploaded.file_size,
                "uploaded_at": uploaded.uploaded_at,
                "sha256": file_hash,
            },
            "uploaded_by": None if uploader is None else {
                "id": uploader.id,
                "full_name": uploader.full_name,
                "email": uploader.email,
            },
            "investigation": None if not investigation else {
                "id": investigation.id,
                "title": investigation.title,
                "status": investigation.status,
                "created_at": investigation.created_at,
            },
            "analysis": analysis,
        })
    return history


@router.get("/{file_id}/content")
def get_uploaded_file_content(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the original UTF-8 evidence text to its owner, analysts or admins."""
    uploaded = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if uploaded is None:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    if not _can_review_all(current_user) and uploaded.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    file_path = Path(uploaded.file_path)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Original uploaded file is no longer available")
    try:
        content = file_path.read_text(encoding="utf-8-sig")
    except (OSError, UnicodeDecodeError):
        raise HTTPException(status_code=500, detail="Unable to read the original evidence file")

    return {
        "file_id": uploaded.id,
        "filename": uploaded.original_filename,
        "file_type": uploaded.file_type,
        "content": content,
    }


@router.get("/", status_code=status.HTTP_200_OK)
def get_uploaded_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(UploadedFile)
    if not _can_review_all(current_user):
        query = query.filter(UploadedFile.uploaded_by == current_user.id)
    return query.order_by(UploadedFile.id.desc()).all()
