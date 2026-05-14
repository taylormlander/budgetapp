from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import timedelta

from .. import schemas, models, auth
from ..database import get_db, SessionLocal, engine

import os

# Create tables
models.Base.metadata.create_all(bind=engine)

router = APIRouter()

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

@router.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = auth.get_user(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

from fastapi.security import OAuth2PasswordRequestForm # Import this for form_data type hint

@router.post("/token")
def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(), # Use OAuth2PasswordRequestForm
    db: Session = Depends(get_db)
):
    user = auth.get_user(db, email=form_data.username) # Use form_data.username
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Set access token to expire in 7 days
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)

    # Set HttpOnly cookie for secure authentication
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # Prevents client-side JavaScript from accessing the cookie
        secure=os.getenv("ENVIRONMENT") == "production",  # True in prod, False in dev
        samesite="lax",  # "lax" is a good balance for CSRF protection
        max_age=60 * 60 * 24 * 7,  # 7 days expiration
        path="/"  # Ensure the cookie is sent for all paths
    )

    return {"message": "Login successful"}

@router.get("/users/me/", response_model=schemas.UserOut)
async def read_users_me(current_user: schemas.UserOut = Depends(auth.get_current_user)):
    return current_user

@router.post("/logout")
def logout(response: Response):
    # Delete the HttpOnly cookie to log out the user
    response.delete_cookie(
        key="access_token",
        path="/",  # Must match the path used when setting the cookie
        httponly=True,  # Must match the httponly setting when the cookie was set
        secure=os.getenv("ENVIRONMENT") == "production", # Must match the secure setting
        samesite="lax" # Must match the samesite setting
    )
    return {"message": "Logged out successfully"}
