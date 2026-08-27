from pwdlib import PasswordHash
import jwt
import os
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")

password_hash = PasswordHash.recommended()

ALGORITHM = "HS256"


def hash_password(password: str):
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str):
    return password_hash.verify(
        password,
        hashed_password
    )


def create_refresh_token(user_id: int):

    expiration = datetime.now(timezone.utc) + timedelta(
        days=7
    )

    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expiration
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def create_token(user_id: int):

    expiration = datetime.now(timezone.utc) + timedelta(
        minutes=15
    )

    payload = {
        "sub": str(user_id),
        "exp": expiration
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme)
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Token inválido"
            )

        return int(user_id)

    except jwt.InvalidTokenError:

        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )