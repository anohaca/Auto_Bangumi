import asyncio

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from module.security.api import get_current_user


def make_request(host: str) -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": [],
            "client": (host, 12345),
            "server": ("127.0.0.1", 7892),
            "scheme": "http",
            "query_string": b"",
        }
    )


def test_private_lan_address_does_not_require_token():
    result = asyncio.run(
        get_current_user(make_request("192.168.1.20"), None, None)
    )
    assert result == "local"


def test_loopback_address_does_not_require_token():
    result = asyncio.run(get_current_user(make_request("127.0.0.1"), None, None))
    assert result == "local"


def test_public_address_still_requires_token():
    with pytest.raises(HTTPException) as error:
        asyncio.run(get_current_user(make_request("8.8.8.8"), None, None))
    assert error.value.status_code == 401
