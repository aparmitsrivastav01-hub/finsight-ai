from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from auth.database import get_db
from auth.deps import get_current_user
from auth.models import User
from documents.models import UserDocument
from history.models import QueryHistory

router = APIRouter(prefix="/admin", tags=["admin"])


def _apply_sort(query, model, sort_field: Optional[str], order: Optional[str]):
    """Apply sorting to a SQLAlchemy query."""
    if sort_field and hasattr(model, sort_field):
        column = getattr(model, sort_field)
        if order and order.lower() == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())
    return query


def _paginate_response(data, total):
    """Create a response with pagination headers."""
    response = JSONResponse(content=data)
    response.headers["X-Total-Count"] = str(total)
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return response


# ========== USERS ENDPOINTS ==========

@router.get("/users")
def get_users(
    _start: int = Query(0, ge=0),
    _end: int = Query(10, ge=0),
    _sort: Optional[str] = Query(None),
    _order: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(User)
    total = query.count()
    
    query = _apply_sort(query, User, _sort, _order)
    query = query.offset(_start).limit(_end - _start)
    
    users = query.all()
    result = [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "auth_provider": user.auth_provider,
            "avatar_url": user.avatar_url,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        for user in users
    ]
    return _paginate_response(result, total)


@router.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "auth_provider": user.auth_provider,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "username" in data:
        user.username = data["username"]
    if "email" in data:
        user.email = data["email"]
    
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "auth_provider": user.auth_provider,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    
    return {"id": user_id}


# ========== DOCUMENTS ENDPOINTS ==========

@router.get("/documents")
def get_documents(
    _start: int = Query(0, ge=0),
    _end: int = Query(10, ge=0),
    _sort: Optional[str] = Query(None),
    _order: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(UserDocument)
    total = query.count()
    
    query = _apply_sort(query, UserDocument, _sort, _order)
    query = query.offset(_start).limit(_end - _start)
    
    documents = query.all()
    result = [
        {
            "id": doc.id,
            "user_id": doc.user_id,
            "filename": doc.filename,
            "storage_path": doc.storage_path,
            "size": doc.size,
            "is_indexed": doc.is_indexed,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        }
        for doc in documents
    ]
    return _paginate_response(result, total)


@router.get("/documents/{doc_id}")
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(UserDocument).filter(UserDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": doc.id,
        "user_id": doc.user_id,
        "filename": doc.filename,
        "storage_path": doc.storage_path,
        "size": doc.size,
        "is_indexed": doc.is_indexed,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }


@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(UserDocument).filter(UserDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(doc)
    db.commit()
    
    return {"id": doc_id}


# ========== QUERIES ENDPOINTS ==========

@router.get("/queries")
def get_queries(
    _start: int = Query(0, ge=0),
    _end: int = Query(10, ge=0),
    _sort: Optional[str] = Query(None),
    _order: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(QueryHistory)
    total = query.count()
    
    query = _apply_sort(query, QueryHistory, _sort, _order)
    query = query.offset(_start).limit(_end - _start)
    
    queries = query.all()
    result = [
        {
            "id": q.id,
            "user_id": q.user_id,
            "company_name": q.company_name,
            "query": q.query,
            "analysis_type": q.analysis_type,
            "response_summary": q.response_summary,
            "document_id": q.document_id,
            "created_at": q.created_at.isoformat() if q.created_at else None,
        }
        for q in queries
    ]
    return _paginate_response(result, total)


@router.get("/queries/{query_id}")
def get_query(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(QueryHistory).filter(QueryHistory.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
    
    return {
        "id": q.id,
        "user_id": q.user_id,
        "company_name": q.company_name,
        "query": q.query,
        "analysis_type": q.analysis_type,
        "response_summary": q.response_summary,
        "document_id": q.document_id,
        "created_at": q.created_at.isoformat() if q.created_at else None,
    }


@router.delete("/queries/{query_id}")
def delete_query(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(QueryHistory).filter(QueryHistory.id == query_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Query not found")
    
    db.delete(q)
    db.commit()
    
    return {"id": query_id}
