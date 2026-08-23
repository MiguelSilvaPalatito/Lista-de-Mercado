import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.main import calcular_total
import schemas
from database import get_db
from models import Lista

router = APIRouter()

def calcular_total(itens: list[schemas.ItemInput]) -> float:
    return sum(item.unit_price * item.quantity for item in itens)

@router.get("/listas", response_model=list[schemas.ListaResumo])
def listar_listas(db: Session = Depends(get_db)):
    return db.query(Lista).order_by(Lista.created_at.desc()).all()


@router.get("/listas/{lista_id}", response_model=schemas.ListaDetalhe)
def detalhe_lista(lista_id: int, db: Session = Depends(get_db)):
    lista = db.query(Lista).filter(Lista.id == lista_id).first()
    if lista is None:
        raise HTTPException(status_code=404, detail="Lista não encontrada")
    return lista


@router.post("/listas", response_model=schemas.ListaResumo, status_code=201)
def criar_lista(dados: schemas.ListaCriar, db: Session = Depends(get_db)):
    total = calcular_total(dados.itens) if dados.status == "done" else 0
    completed_at = datetime.datetime.utcnow() if dados.status == "done" else None

    nova_lista = Lista(
        name=dados.name,
        kind=dados.kind,
        status=dados.status,
        itens=[item.model_dump() for item in dados.itens], 
        total=total,
        completed_at=completed_at,
    )
    db.add(nova_lista)   
    db.commit()            
    db.refresh(nova_lista) 
    return nova_lista


@router.put("/listas/{lista_id}/finalizar", response_model=schemas.ListaResumo)
def finalizar_lista(lista_id: int, dados: schemas.FinalizarInput, db: Session = Depends(get_db)):
    lista = db.query(Lista).filter(Lista.id == lista_id).first()
    if lista is None:
        raise HTTPException(status_code=404, detail="Lista não encontrada")

    lista.itens = [item.model_dump() for item in dados.itens]
    lista.total = calcular_total(dados.itens)
    lista.status = "done"
    lista.completed_at = datetime.datetime.utcnow()

    db.commit()             
    db.refresh(lista)
    return lista


@router.delete("/listas/{lista_id}", status_code=204)
def cancelar_lista(lista_id: int, db: Session = Depends(get_db)):
    lista = db.query(Lista).filter(Lista.id == lista_id).first()
    if lista is None:
        raise HTTPException(status_code=404, detail="Lista não encontrada")
    db.delete(lista)   
    db.commit()