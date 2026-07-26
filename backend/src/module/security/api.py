from ipaddress import ip_address

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from module.database import Database
from module.models.user import User, UserUpdate

from .jwt import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

active_user = []


async def get_current_user(
    request: Request,
    token: str | None = Cookie(None),
    bearer_token: str | None = Depends(oauth2_scheme),
):
    client_host = request.client.host if request.client else ""
    try:
        client_ip = ip_address(client_host)
    except ValueError:
        client_ip = None
    if client_ip and (
        client_ip.is_private or client_ip.is_loopback or client_ip.is_link_local
    ):
        return "local"

    token = bearer_token or token
    if not token:
        raise UNAUTHORIZED
    payload = verify_token(token)
    if not payload:
        raise UNAUTHORIZED
    username = payload.get("sub")
    if not username or username not in active_user:
        raise UNAUTHORIZED
    return username


async def get_token_data(token: str = Depends(oauth2_scheme)):
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token"
        )
    return payload


def update_user_info(user_data: UserUpdate, current_user):
    try:
        with Database() as db:
            db.user.update_user(current_user, user_data)
        return True
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


def auth_user(user: User):
    with Database() as db:
        resp = db.user.auth_user(user)
        if resp.status:
            active_user.append(user.username)
        return resp


UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized"
)
