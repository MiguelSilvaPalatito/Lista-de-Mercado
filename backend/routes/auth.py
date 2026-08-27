from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from models.user import User
from schemas.schemas import UserCreate, UserLogin
from core.securety import hash_password, verify_password, create_token, create_refresh_token

auth = APIRouter(prefix="/auth")

@auth.post("/register")
def register(
    dados: UserCreate,
    db: Session = Depends(get_db)
):

    usuario_existente = db.query(User).filter(
        User.email == dados.email
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="Email já cadastrado"
        )

    novo_usuario = User(
        email=dados.email,
        password_hash=hash_password(dados.password)
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return {
        "id": novo_usuario.id,
        "email": novo_usuario.email
    }

@auth.post("/login")
def login(
    dados: UserLogin,
    db: Session = Depends(get_db)
):

    usuario = db.query(User).filter(
        User.email == dados.email
    ).first()

    if usuario is None:
        raise HTTPException(
            status_code=401,
            detail="Email ou senha incorretos"
        )

    senha_correta = verify_password(
        dados.password,
        usuario.password_hash
    )

    if not senha_correta:
        raise HTTPException(
            status_code=401,
            detail="Email ou senha incorretos"
        )

    token = create_token(usuario.id)
    new_refresh_token = create_refresh_token(usuario.id)

    return {
        "access_token": token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }