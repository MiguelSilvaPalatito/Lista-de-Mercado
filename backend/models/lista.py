import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Float, Integer, JSON, String

from database.database import Base


class Lista(Base):
    __tablename__ = "listas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    kind = Column(String, nullable=False)         
    status = Column(String, nullable=False)       
    itens = Column(JSON, nullable=False, default=list)  
    total = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    user_id = Column(ForeignKey("User.id"), nullable=False)

