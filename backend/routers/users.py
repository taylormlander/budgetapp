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

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(response: Response, form_data: schemas.UserLogin, db: Session = Depends(get_db)):    
    user = auth.get_user(db, email=form_data.email)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    response.set_cookie(key="access_token", value=access_token, httponly=True, expires=access_token_expires.total_seconds())
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me/", response_model=schemas.UserOut)
async def read_users_me(current_user: schemas.UserOut = Depends(auth.get_current_user)):
    return current_user

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}