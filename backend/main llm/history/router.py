from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth.database import get_db
from auth.deps import get_current_user
from auth.models import User
from history.models import QueryHistory
from history.schemas import HistoryCreate, HistoryItem, HistoryListResponse

router = APIRouter(tags=["history"])


def _infer_analysis_type(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ("invest", "investment", "buy", "portfolio")):
        return "investment"
    if any(w in q for w in ("risk", "bankrupt", "flag", "distress", "debt")):
        return "risk"
    return "analysis"


@router.get("/history", response_model=HistoryListResponse)
def list_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    search: str | None = None,
    company: str | None = None,
    analysis_type: str | None = None,
):
    q = db.query(QueryHistory).filter(QueryHistory.user_id == user.id)

    if search:
        term = f"%{search.strip()}%"
        q = q.filter(
            (QueryHistory.company_name.ilike(term))
            | (QueryHistory.query.ilike(term))
            | (QueryHistory.response_summary.ilike(term))
        )
    if company:
        q = q.filter(QueryHistory.company_name.ilike(f"%{company.strip()}%"))
    if analysis_type and analysis_type != "all":
        q = q.filter(QueryHistory.analysis_type == analysis_type.lower())

    total = q.count()
    items = (
        q.order_by(QueryHistory.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return HistoryListResponse(
        items=[HistoryItem.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/history", response_model=HistoryItem, status_code=status.HTTP_201_CREATED)
def create_history(
    body: HistoryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    atype = body.analysis_type or _infer_analysis_type(body.query)
    row = QueryHistory(
        user_id=user.id,
        company_name=body.company_name.strip(),
        query=body.query.strip(),
        analysis_type=atype,
        response_summary=(body.response_summary or "")[:2000],
        document_id=body.document_id,
        created_at=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return HistoryItem.model_validate(row)


@router.delete("/history/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_history(
    history_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = (
        db.query(QueryHistory)
        .filter(QueryHistory.id == history_id, QueryHistory.user_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="History entry not found")
    db.delete(row)
    db.commit()
    return None
