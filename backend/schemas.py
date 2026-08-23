from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ItemInput(BaseModel):
    name: str
    unit_price: float = 0
    quantity: float = 1
    note: str = ""


class ListaCriar(BaseModel):
    name: str
    kind: str
    status: str
    itens: list[ItemInput] = []


class FinalizarInput(BaseModel):
    itens: list[ItemInput]


class ListaResumo(BaseModel):
    id: int
    name: str
    status: str
    total: float
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ListaDetalhe(ListaResumo):
    kind: str
    itens: list[ItemInput]
