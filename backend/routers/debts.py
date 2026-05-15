from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .. import schemas, models, auth
from ..database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.DebtOut)
def create_debt(
    debt: schemas.DebtCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_debt = models.Debt(**debt.dict(), user_id=current_user.id)
    db.add(db_debt)
    db.commit()
    db.refresh(db_debt)

    # Auto-create a category for this debt in the "Debts" folder
    debt_category = models.Category(
        user_id=current_user.id,
        name=db_debt.name,
        color="#e74c3c",
        icon="fa-solid fa-credit-card",
        folder_group="Debts",
        is_debt_category=True,
        linked_debt_id=db_debt.id
    )
    db.add(debt_category)
    db.commit()
    db.refresh(debt_category)

    return db_debt

@router.get("/", response_model=List[schemas.DebtOut])
def read_debts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Debt).filter(models.Debt.user_id == current_user.id).all()

@router.get("/{debt_id}", response_model=schemas.DebtOut)
def read_debt(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_debt = db.query(models.Debt).filter(models.Debt.id == debt_id, models.Debt.user_id == current_user.id).first()
    if db_debt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debt not found")
    return db_debt

@router.put("/{debt_id}", response_model=schemas.DebtOut)
def update_debt(
    debt_id: int,
    debt: schemas.DebtCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_debt = db.query(models.Debt).filter(models.Debt.id == debt_id, models.Debt.user_id == current_user.id).first()
    if db_debt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debt not found")

    # Update the debt category name to match
    debt_category = db.query(models.Category).filter(
        models.Category.linked_debt_id == debt_id,
        models.Category.user_id == current_user.id
    ).first()
    if debt_category:
        debt_category.name = debt.name
        db.commit()

    for key, value in debt.dict().items():
        setattr(db_debt, key, value)

    db.commit()
    db.refresh(db_debt)
    return db_debt

@router.delete("/{debt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_debt(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_debt = db.query(models.Debt).filter(models.Debt.id == debt_id, models.Debt.user_id == current_user.id).first()
    if db_debt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Debt not found")

    # Delete the associated debt category
    debt_category = db.query(models.Category).filter(
        models.Category.linked_debt_id == debt_id,
        models.Category.user_id == current_user.id
    ).first()
    if debt_category:
        db.delete(debt_category)

    db.delete(db_debt)
    db.commit()
    return
