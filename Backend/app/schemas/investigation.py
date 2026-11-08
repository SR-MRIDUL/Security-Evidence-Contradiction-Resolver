from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class InvestigationCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str | None = None


class InvestigationUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=200)
    description: str | None = None
    status: str | None = Field(default=None, pattern="^(pending|processing|completed|failed)$")


class InvestigationOut(BaseModel):
    id: int
    title: str
    description: str | None
    status: str
    created_by: int
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UploadedFileOut(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    file_type: str
    file_size: int
    uploaded_by: int
    investigation_id: int | None
    uploaded_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)