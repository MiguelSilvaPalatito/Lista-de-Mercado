"""
Conexão com o banco via SQLAlchemy.

Comparando com a versão SQL puro: lá, a gente abria a conexão sqlite3
"na mão" em cada rota (get_conn()). Aqui, o SQLAlchemy cuida disso —
criamos um "engine" uma vez só, e cada rota recebe uma "sessão" pronta
pra usar através da dependency get_db().
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./banco.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
