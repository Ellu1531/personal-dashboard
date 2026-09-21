from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, create_engine, Session, select
from datetime import date
from dotenv import load_dotenv
import os

load_dotenv()


#Database setup

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

#Data model
class Habit(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    created_date: date = Field(default_factory=date.today)
    is_active: bool = Field(default=True)

class HabitCreate(SQLModel):
    name: str

class HabitCheckIn(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    habit_id: int = Field(foreign_key="habit.id")
    check_in_date: date = Field(default_factory=date.today)

class HabitUpdate(SQLModel):
    name: str

class Expense(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    amount: float
    description: str
    category: str
    expense_date: date = Field(default_factory=date.today)

class ExpenseCreate (SQLModel):
    amount: float
    category: str
    description: str

class ExpenseUpdate (SQLModel):
    amount: float
    category: str
    description: str

#App setup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    SQLModel.metadata.create_all(engine)


@app.get("/")
def read_root():
    return {"message": "Hello from your backend!"}

#Habit endpoints
@app.post("/habits")
def create_habit(habit_data: HabitCreate, session: Session = Depends(get_session)):
    habit = Habit(name=habit_data.name)
    session.add(habit)
    session.commit()
    session.refresh(habit)
    return habit

@app.patch("/habits/{habit_id}")
def update_habit(habit_id: int, habit_data: HabitUpdate, session: Session = Depends(get_session)):
    habit = session.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found.")

    habit.name = habit_data.name
    session.add(habit)
    session.commit()
    session.refresh(habit)
    return habit

@app.get("/habits")
def list_habits(session: Session = Depends(get_session)):
    habits = session.exec(select(Habit).where(Habit.is_active == True)).all()
    return habits

@app.patch("/habits/{habit_id}/archive")
def archive_habit(habit_id: int, session: Session = Depends(get_session)):
    habit = session.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found.")
    habit.is_active = False
    session.add(habit)
    session.commit()
    session.refresh(habit)
    return habit

#Check in endpoints

@app.post ("/habits/{habit_id}/checkin")
def check_in_habit(habit_id: int, session: Session = Depends(get_session)):
    habit = session.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found.")
    checkin = HabitCheckIn(habit_id=habit_id)
    session.add(checkin)
    session.commit()
    session.refresh(checkin)
    return checkin

@app.get ("/habits/{habit_id}/checkins")
def list_checkins(habit_id: int, session: Session = Depends(get_session)):
    habit = session.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found.")
    checkins = session.exec(
        select(HabitCheckIn).where(HabitCheckIn.habit_id == habit_id)
    ).all()
    return checkins

@app.get ("/habits/{habit_id}/checked-in-today")
def is_checked_in_today(habit_id: int, session: Session = Depends(get_session)):
    habit = session.get(Habit, habit_id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found.")

    today_checkin = session.exec(
        select(HabitCheckIn).where(
            HabitCheckIn.habit_id == habit_id,
            HabitCheckIn.check_in_date == date.today(),
        )
    ).first()

    return {"checked_in_today": today_checkin is not None}


#Expense endpoints

@app.post("/expenses")
def create_expense(expense_data: ExpenseCreate, session: Session = Depends(get_session)):
    expense = Expense(
        amount=expense_data.amount,
        category=expense_data.category,
        description=expense_data.description,
    )
    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense

@app.get("/expenses")
def list_expenses(session: Session = Depends(get_session)):
    expenses = session.exec(select(Expense)).all()
    return expenses

@app.patch("/expenses/{expense_id}")
def update_expense(expense_id: int, expense_data: ExpenseUpdate, session: Session = Depends(get_session)):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    expense.amount = expense_data.amount
    expense.category = expense_data.category
    expense.description = expense_data.description
    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, session: Session = Depends(get_session)):
    expense = session.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    session.delete(expense)
    session.commit()
    return {"message": "Expense deleted."}

