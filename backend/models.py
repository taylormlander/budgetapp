from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    categories = relationship("Category", back_populates="owner")
    transactions = relationship("Transaction", back_populates="owner")
    rules = relationship("Rule", back_populates="owner")
    savings_goals = relationship("SavingsGoal", back_populates="owner")
    debts = relationship("Debt", back_populates="owner")
    income_entries = relationship("Income", back_populates="owner")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    color = Column(String, nullable=True)
    icon = Column(String, nullable=True)
    folder_group = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    rules = relationship("Rule", back_populates="category")
    savings_goals = relationship("SavingsGoal", back_populates="linked_category")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    date = Column(DateTime)
    description = Column(String)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    type = Column(String)  # 'income' or 'expense'
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")

class Rule(Base):
    __tablename__ = "rules"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    keyword = Column(String, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    priority = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="rules")
    category = relationship("Category", back_populates="rules")

class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    target_amount = Column(Float)
    current_amount = Column(Float)
    target_date = Column(DateTime, nullable=True)
    is_complete = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="savings_goals")
    # Assuming a savings goal can be linked to a category for auto-updating
    # This needs to be carefully managed in the application logic
    linked_category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    linked_category = relationship("Category", back_populates="savings_goals")

class Debt(Base):
    __tablename__ = "debts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    total_balance = Column(Float)
    current_balance = Column(Float)
    interest_rate = Column(Float, nullable=True)
    minimum_payment = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="debts")
    payments = relationship("DebtPayment", back_populates="debt")

class DebtPayment(Base):
    __tablename__ = "debt_payments"
    id = Column(Integer, primary_key=True, index=True)
    debt_id = Column(Integer, ForeignKey("debts.id"))
    amount = Column(Float)
    date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    debt = relationship("Debt", back_populates="payments")

class Income(Base):
    __tablename__ = "income_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    date = Column(DateTime)
    source = Column(String)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)