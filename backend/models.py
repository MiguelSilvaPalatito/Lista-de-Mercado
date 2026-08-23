"""
O modelo — uma classe Python que representa a tabela inteira.

Diferença principal pra versão SQL puro: lá, a tabela era criada com
um "CREATE TABLE IF NOT EXISTS ..." escrito à mão. Aqui, a tabela é
gerada automaticamente a partir dessa classe (Base.metadata.create_all,
no main.py) — você nunca escreve o CREATE TABLE, só descreve os campos.

Outra diferença: a coluna "itens" usa o tipo JSON do SQLAlchemy. Isso
faz a conversão pra você — você guarda e lê uma lista de dicionários
Python normal, sem precisar de json.dumps()/json.loads() manualmente
(que era necessário na versão com sqlite3 puro).
"""

import datetime

from sqlalchemy import Column, DateTime, Float, Integer, JSON, String

from database import Base


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
