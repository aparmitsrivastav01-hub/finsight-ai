from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.database import get_db
from auth.google_auth import suggest_username, verify_google_id_token
from auth.models import User
from auth.schemas import AuthSuccessResponse, GoogleAuthRequest, UserPublic
from auth.security import UNUSABLE_PASSWORD_HASH, create_access_token

router = APIRouter(tags=["auth"])


def _unique_username(db: Session, email: str, display_name: str) -> str:
    taken = {row[0] for row in db.query(User.username).all()}
    base = display_name or email.split("@")[0]
    return suggest_username(base, taken)


@router.post("/auth/google", response_model=AuthSuccessResponse)
def google_sign_in(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    claims = verify_google_id_token(payload.credential.strip())
    google_id = claims["google_id"]
    email = claims["email"]
    display_name = claims["name"]
    picture = claims["picture"]

    user = db.query(User).filter(User.google_id == google_id).first()

    if user is None:
        by_email = db.query(User).filter(User.email == email).first()
        if by_email is not None:
            if by_email.google_id and by_email.google_id != google_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email is linked to a different Google account",
                )
            by_email.google_id = google_id
            if picture:
                by_email.avatar_url = picture
            if by_email.auth_provider == "local":
                by_email.auth_provider = "google"
            user = by_email
        else:
            user = User(
                username=_unique_username(db, email, display_name),
                email=email,
                google_id=google_id,
                auth_provider="google",
                avatar_url=picture,
                hashed_password=UNUSABLE_PASSWORD_HASH,
            )
            db.add(user)

    if user.avatar_url is None and picture:
        user.avatar_url = picture

    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return AuthSuccessResponse(
        access_token=token,
        user=UserPublic.model_validate(user),
    )
