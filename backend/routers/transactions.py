from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .. import schemas, models, auth
from ..database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.TransactionOut)
def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_transaction = models.Transaction(**transaction.dict(), user_id=current_user.id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    # If transaction is linked to a debt, update the debt's current_balance
    if transaction.debt_id:
        db_debt = db.query(models.Debt).filter(
            models.Debt.id == transaction.debt_id,
            models.Debt.user_id == current_user.id
        ).first()
        if db_debt:
            # For expense transactions, subtract from current_balance (paying down debt)
            if transaction.type == "expense":
                db_debt.current_balance -= transaction.amount
            # For income transactions, add to current_balance (taking on more debt)
            else:
                db_debt.current_balance += transaction.amount
            db.commit()
            db.refresh(db_debt)

    return db_transaction

@router.get("/", response_model=List[schemas.TransactionOut])
def read_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()

@router.get("/{transaction_id}", response_model=schemas.TransactionOut)
def read_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.user_id == current_user.id).first()
    if db_transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return db_transaction

@router.put("/{transaction_id}", response_model=schemas.TransactionOut)
def update_transaction(
    transaction_id: int,
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.user_id == current_user.id).first()
    if db_transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    # Revert old debt balance if the transaction was previously linked to a debt
    if db_transaction.debt_id:
        old_debt = db.query(models.Debt).filter(
            models.Debt.id == db_transaction.debt_id,
            models.Debt.user_id == current_user.id
        ).first()
        if old_debt:
            if db_transaction.type == "expense":
                old_debt.current_balance += db_transaction.amount
            else:
                old_debt.current_balance -= db_transaction.amount

    # Update the transaction fields
    for key, value in transaction.dict().items():
        setattr(db_transaction, key, value)

    db.commit()
    db.refresh(db_transaction)

    # Apply new debt balance if the transaction is now linked to a debt
    if transaction.debt_id:
        new_debt = db.query(models.Debt).filter(
            models.Debt.id == transaction.debt_id,
            models.Debt.user_id == current_user.id
        ).first()
        if new_debt:
            if transaction.type == "expense":
                new_debt.current_balance -= transaction.amount
            else:
                new_debt.current_balance += transaction.amount
            db.commit()
            db.refresh(new_debt)

    return db_transaction

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id, models.Transaction.user_id == current_user.id).first()
    if db_transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    # Revert debt balance if the transaction was linked to a debt
    if db_transaction.debt_id:
        db_debt = db.query(models.Debt).filter(
            models.Debt.id == db_transaction.debt_id,
            models.Debt.user_id == current_user.id
        ).first()
        if db_debt:
            if db_transaction.type == "expense":
                db_debt.current_balance += db_transaction.amount
            else:
                db_debt.current_balance -= db_transaction.amount
            db.commit()

    db.delete(db_transaction)
    db.commit()
    return
