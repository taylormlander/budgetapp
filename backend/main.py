from fastapi import FastAPI
from dotenv import load_dotenv
import os

from .routers import users

load_dotenv()

app = FastAPI()

app.include_router(users.router, prefix="/users", tags=["users"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Budgeting App"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
