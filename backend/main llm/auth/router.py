from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from auth.database import get_db
from auth.deps import get_current_user
from auth.models import User
from auth.schemas import MessageResponse, TokenResponse, UserCreate, UserLogin, UserPublic
from auth.security import create_access_token, hash_password, verify_password

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == str(payload.email).lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=payload.username.strip(),
        email=str(payload.email).lower().strip(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    ident = payload.identifier.strip()
    ident_lower = ident.lower()
    user = db.query(User).filter(
        or_(User.email == ident_lower, User.username == ident, User.username == ident_lower)
    ).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username/email or password")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserPublic)
def read_me(current: User = Depends(get_current_user)):
    return current


@router.post("/logout", response_model=MessageResponse)
def logout(current: User = Depends(get_current_user)):
    # JWT is stateless; client discards token. Endpoint acknowledges session end.
    return MessageResponse(message=f"Goodbye, {current.username}")
