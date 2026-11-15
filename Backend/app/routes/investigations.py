import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.investigation import Investigation
from app.models.uploaded_file import UploadedFile
from app.models.investigation_result import InvestigationResult
from app.schemas.investigation import InvestigationCreate, InvestigationUpdate, InvestigationOut
from app.dependencies.auth import get_current_user
from app.agents.nodes import parse_evidence_text
from app.agents.workflow import investigation_workflow


router = APIRouter(prefix="/api/investigations", tags=["Investigations"])


def _get_accessible_investigation(investigation_id: int, db: Session, current_user: User):
    investigation = db.query(Investigation).filter(
        Investigation.id == investigation_id
    ).first()
    if investigation is None:
        raise HTTPException(status_code=404, detail="Investigation not found")
    if current_user.role != "admin" and investigation.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return investigation


@router.post("/", response_model=InvestigationOut, status_code=status.HTTP_201_CREATED)
def create_investigation(
    data: InvestigationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    investigation = Investigation(
        title=data.title,
        description=data.description,
        created_by=current_user.id,
    )
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    return investigation


@router.get("/", response_model=list[InvestigationOut])
def get_investigations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Investigation)
    if current_user.role != "admin":
        query = query.filter(Investigation.created_by == current_user.id)
    return query.order_by(Investigation.id.desc()).all()


@router.get("/{investigation_id}", response_model=InvestigationOut)
def get_investigation(
    investigation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_accessible_investigation(investigation_id, db, current_user)


@router.put("/{investigation_id}", response_model=InvestigationOut)
def update_investigation(
    investigation_id: int,
    data: InvestigationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    investigation = _get_accessible_investigation(investigation_id, db, current_user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(investigation, field, value)
    db.commit()
    db.refresh(investigation)
    return investigation


@router.delete("/{investigation_id}")
def delete_investigation(
    investigation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    investigation = _get_accessible_investigation(investigation_id, db, current_user)
    db.delete(investigation)
    db.commit()
    return {"message": "Investigation deleted successfully"}


@router.post("/{investigation_id}/analyze")
def analyze_investigation(
    investigation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    investigation = _get_accessible_investigation(investigation_id, db, current_user)
    uploaded_files = db.query(UploadedFile).filter(
        UploadedFile.investigation_id == investigation_id
    ).order_by(UploadedFile.id.asc()).all()

    events = []
    if uploaded_files:
        for uploaded in uploaded_files:
            file_path = Path(uploaded.file_path)
            if not file_path.is_file():
                raise HTTPException(
                    status_code=400,
                    detail=f"Uploaded file is missing: {uploaded.original_filename}",
                )
            try:
                content = file_path.read_text(encoding="utf-8-sig")
            except (OSError, UnicodeDecodeError):
                raise HTTPException(
                    status_code=400,
                    detail=f"Unable to read file: {uploaded.original_filename}",
                )
            events.extend(
                parse_evidence_text(content, uploaded.file_type, uploaded.original_filename)
            )
    elif investigation.description:
        content = investigation.description
        if content.startswith("[") and "] " in content:
            content = content.split("] ", 1)[1]
        events = parse_evidence_text(content, "txt", "manual text evidence")

    if not events:
        raise HTTPException(
            status_code=400,
            detail="No events could be extracted. Upload a non-empty CSV, JSON, TXT or LOG file, or paste log text.",
        )

    investigation.status = "processing"
    db.commit()

    try:
        result = investigation_workflow.invoke({
            "events": events,
            "agent_outputs": [],
            "agent_status": [],
        })

        persisted_payload = {
            "analyzed_events": result.get("analyzed_events", []),
            "correlations": result.get("correlations", []),
            "contradictions": result.get("contradictions", []),
            "timeline": result.get("timeline", []),
            "agent_outputs": result.get("agent_outputs", []),
            "agent_status": result.get("agent_status", []),
            "final_report": result.get("final_report", {}),
        }
        serialized = json.dumps(persisted_payload, ensure_ascii=False, default=str)

        saved = db.query(InvestigationResult).filter(
            InvestigationResult.investigation_id == investigation_id
        ).first()
        if saved:
            saved.result_json = serialized
        else:
            db.add(InvestigationResult(
                investigation_id=investigation_id,
                result_json=serialized,
            ))

        investigation.status = "completed"
        db.commit()
        return {
            "investigation_id": investigation_id,
            "status": "completed",
            **persisted_payload,
        }
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        investigation.status = "failed"
        db.commit()
        raise HTTPException(
            status_code=500,
            detail=f"Investigation analysis failed: {str(exc)}",
        )


@router.get("/{investigation_id}/result")
def get_investigation_result(
    investigation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_accessible_investigation(investigation_id, db, current_user)
    saved = db.query(InvestigationResult).filter(
        InvestigationResult.investigation_id == investigation_id
    ).first()
    if saved is None:
        raise HTTPException(status_code=404, detail="Analysis result not found")
    try:
        payload = json.loads(saved.result_json)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Stored analysis result is corrupted")
    return {
        "investigation_id": investigation_id,
        "created_at": saved.created_at,
        **payload,
    }
