from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os

from .routers import users

load_dotenv()

app = FastAPI()

app.mount("/static", StaticFiles(directory="frontend"), name="static")

app.include_router(users.router, prefix="/users", tags=["users"])

@app.get("/")
def read_root():
    return FileResponse("frontend/index.html")