from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CategoryBase(BaseModel):
    name: str
    color: Optional[str] = None
    icon: Optional[str] = None
    folder_group: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class TransactionBase(BaseModel):
    amount: float
    date: datetime
    description: str
    category_id: Optional[int] = None
    type: str  # 'income' or 'expense'
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionOut(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    category: Optional[CategoryOut] = None

    class Config:
        orm_mode = True

class RuleBase(BaseModel):
    keyword: str
    category_id: int
    priority: int

class RuleCreate(RuleBase):
    pass

class RuleOut(RuleBase):
    id: int
    user_id: int
    created_at: datetime
    category: CategoryOut

    class Config:
        orm_mode = True

class SavingsGoalBase(BaseModel):
    name: str
    target_amount: float
    current_amount: float
    target_date: Optional[datetime] = None
    is_complete: bool = False
    linked_category_id: Optional[int] = None

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalOut(SavingsGoalBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class DebtBase(BaseModel):
    name: str
    total_balance: float
    current_balance: float
    interest_rate: Optional[float] = None
    minimum_payment: Optional[float] = None

class DebtCreate(DebtBase):
    pass

class DebtOut(DebtBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class DebtPaymentBase(BaseModel):
    debt_id: int
    amount: float
    date: datetime

class DebtPaymentCreate(DebtPaymentBase):
    pass

class DebtPaymentOut(DebtPaymentBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class IncomeBase(BaseModel):
    amount: float
    date: datetime
    source: str
    notes: Optional[str] = None

class IncomeCreate(IncomeBase):
    pass

class IncomeOut(IncomeBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True