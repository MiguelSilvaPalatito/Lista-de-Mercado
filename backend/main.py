"""
Para rodar:
    pip install fastapi "uvicorn[standard]" sqlalchemy --break-system-packages
    uvicorn main.py:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.listas import router
from database import Base, engine

Base.metadata.create_all(bind=engine)  

app = FastAPI(title="Minhas Compras")

app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)






