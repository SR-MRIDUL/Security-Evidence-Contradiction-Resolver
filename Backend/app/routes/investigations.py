from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.investigation import Investigation
from app.schemas.investigation import InvestigationCreate, InvestigationUpdate, InvestigationOut
from app.dependencies.auth import get_current_user


router = APIRouter(prefix="/api/investigations", tags=["Investigations"])


@router.post("/", response_model=InvestigationOut, status_code=status.HTTP_201_CREATED)
def create_investigation(
    data: InvestigationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    investigation = Investigation(
        title=data.title,
        description=data.description,
        created_by=current_user.id
    )

    db.add(investigation)
    db.commit()
    db.refresh(investigation)

    return investigation


@router.get("/", response_model=list[InvestigationOut])
def get_investigations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Investigation)

    if current_user.role != "admin":
        query = query.filter(Investigation.created_by == current_user.id)

    return query.order_by(Investigation.id.desc()).all()


@router.get("/{investigation_id}", response_model=InvestigationOut)
def get_investigation(
    investigation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    investigation = db.query(Investigation).filter(
        Investigation.id == investigation_id
    ).first()

    if investigation is None:
        raise HTTPException(status_code=404, detail="Investigation not found")

    if current_user.role != "admin" and investigation.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return investigation


@router.put("/{investigation_id}", response_model=InvestigationOut)
def update_investigation(
    investigation_id: int,
    data: InvestigationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    investigation = db.query(Investigation).filter(
        Investigation.id == investigation_id
    ).first()

    if investigation is None:
        raise HTTPException(status_code=404, detail="Investigation not found")

    if current_user.role != "admin" and investigation.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(investigation, field, value)

    db.commit()
    db.refresh(investigation)

    return investigation


@router.delete("/{investigation_id}")
def delete_investigation(
    investigation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    investigation = db.query(Investigation).filter(
        Investigation.id == investigation_id
    ).first()

    if investigation is None:
        raise HTTPException(status_code=404, detail="Investigation not found")

    if current_user.role != "admin" and investigation.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    db.delete(investigation)
    db.commit()

    return {"message": "Investigation deleted successfully"}