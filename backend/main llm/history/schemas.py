from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

AnalysisType = Literal["investment", "risk", "analysis"]


class HistoryCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    query: str = Field(..., min_length=1)
    analysis_type: AnalysisType = "analysis"
    response_summary: str = ""
    document_id: str | None = None


class HistoryItem(BaseModel):
    id: int
    company_name: str
    query: str
    analysis_type: str
    response_summary: str
    document_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class HistoryListResponse(BaseModel):
    items: list[HistoryItem]
    total: int
    page: int
    page_size: int
