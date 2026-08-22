"""Direct-to-backend (localhost) checks to isolate ingress/proxy behaviour: CORS + lockout."""
import uuid

import pytest
import requests
from dotenv import dotenv_values

LOCAL = "http://localhost:8001/api"
frontend_env = dotenv_values("/app/frontend/.env")
ORIGIN = frontend_env["REACT_APP_BACKEND_URL"]


def test_backend_cors_preflight_local():
    r = requests.options(f"{LOCAL}/auth/login", headers={
        "Origin": ORIGIN, "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"})
    print(dict(r.headers))
    assert r.headers.get("access-control-allow-credentials") == "true"
    assert r.headers.get("access-control-allow-origin") == ORIGIN


def test_lockout_local():
    email = f"qa-lock-{uuid.uuid4().hex[:8]}@test.it"
    codes = [requests.post(f"{LOCAL}/auth/login",
                           json={"email": email, "password": "x"}).status_code
             for _ in range(7)]
    print(codes)
    assert 429 in codes, codes
