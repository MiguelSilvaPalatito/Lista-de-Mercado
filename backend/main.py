"""
    uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import auth
from routes.listas import router
from backend.database.database import Base, engine

Base.metadata.create_all(bind=engine)  

app = FastAPI(title="Minhas Compras")

app.include_router(router)
app.include_router(auth) 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)






