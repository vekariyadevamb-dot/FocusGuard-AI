"""
API Integration Tests for FocusGuard AI FastAPI Endpoints
"""

import pytest
import pytest_asyncio
import os
from httpx import AsyncClient, ASGITransport

from backend.api import app
from backend.database import init_db, DB_PATH


@pytest_asyncio.fixture(autouse=True)
async def setup_api():
    await init_db(DB_PATH)
    yield


@pytest.mark.asyncio
async def test_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. System status
        res = await client.get("/api/status")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "online"

        # 2. Get and update settings
        res = await client.get("/api/settings")
        assert res.status_code == 200
        settings = res.json()
        assert "alert_threshold_sec" in settings

        res = await client.post("/api/settings", json={"alert_threshold_sec": 7.5})
        assert res.status_code == 200
        assert res.json()["alert_threshold_sec"] == 7.5

        # 3. Create a session
        res = await client.post("/api/sessions", json={
            "title": "Machine Learning Paper Reading",
            "subject": "Machine Learning",
            "mode": "reading",
            "planned_duration_sec": 1200
        })
        assert res.status_code == 200
        sess = res.json()
        assert sess["title"] == "Machine Learning Paper Reading"
        sess_id = sess["id"]

        # 4. Get session detail
        res = await client.get(f"/api/sessions/{sess_id}")
        assert res.status_code == 200
        detail = res.json()
        assert detail["session"]["id"] == sess_id
        assert "events" in detail

        # 5. Get analytics
        res = await client.get("/api/analytics")
        assert res.status_code == 200
        analytics = res.json()
        assert "total_sessions" in analytics

        # 6. CSV export & sanitization test
        res = await client.get("/api/export/csv")
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        assert "Session ID" in res.text

        # 7. CSV formula injection defense verification
        res_malicious = await client.post("/api/sessions", json={
            "title": "=cmd|' /C calc'!A0",
            "subject": "+123456",
            "mode": "coding"
        })
        assert res_malicious.status_code == 200
        res_csv = await client.get("/api/export/csv")
        # Formula characters must be escaped with a single quote prefix
        assert "'=cmd|' /C calc'!A0" in res_csv.text
        assert "'+123456" in res_csv.text

        # 8. Input validation boundary tests
        res_overflow = await client.post("/api/sessions", json={
            "title": "A" * 150,  # Max allowed is 100
            "subject": "Coding",
            "mode": "coding"
        })
        assert res_overflow.status_code == 422

        # 9. HTTP Security Headers
        assert res.headers.get("x-content-type-options") == "nosniff"
        assert res.headers.get("x-frame-options") == "DENY"
        assert res.headers.get("referrer-policy") == "no-referrer"
        assert "no-store" in res.headers.get("cache-control", "")

        # 10. CSV formula injection defense with leading whitespace and percent prefix
        res_whitespace_formula = await client.post("/api/sessions", json={
            "title": "   =1+1",
            "subject": "%test_percent",
            "mode": "coding"
        })
        assert res_whitespace_formula.status_code == 200
        res_csv2 = await client.get("/api/export/csv")
        assert "'   =1+1" in res_csv2.text
        assert "'%test_percent" in res_csv2.text

        # 11. Path parameter validation (malicious path traversal / regex violation)
        res_invalid_id = await client.get("/api/sessions/../etc/passwd")
        # FastAPI router will return 404 or 422 for path traversal attempts
        assert res_invalid_id.status_code in (404, 422)

        res_invalid_chars = await client.get("/api/sessions/abc;DROP TABLE sessions;--")
        assert res_invalid_chars.status_code == 422


@pytest.mark.asyncio
async def test_trusted_host_protection():
    transport = ASGITransport(app=app)
    # Malicious host header should be rejected by TrustedHostMiddleware
    async with AsyncClient(transport=transport, base_url="http://evil-attacker-site.com") as client:
        res = await client.get("/api/status")
        assert res.status_code == 400


def test_database_posix_permissions():
    import stat
    db_dir = os.path.dirname(os.path.abspath(DB_PATH))
    if os.path.exists(db_dir):
        mode = stat.S_IMODE(os.stat(db_dir).st_mode)
        assert mode == 0o700, f"Expected 0o700 for db_dir, got {oct(mode)}"
    if os.path.exists(DB_PATH):
        mode = stat.S_IMODE(os.stat(DB_PATH).st_mode)
        assert mode == 0o600, f"Expected 0o600 for DB_PATH, got {oct(mode)}"


def test_websocket_origin_security():
    from starlette.testclient import TestClient
    with TestClient(app) as test_client:
        # 1. Connection with whitelisted origin should succeed
        with test_client.websocket_connect("/ws", headers={"origin": "http://localhost:5173"}) as ws:
            ws.send_json({"action": "trigger_test_alert"})
            msg = ws.receive_json()
            assert msg["type"] == "TEST_ALERT"

        # 2. Connection without origin header must be rejected (code 1008 policy violation)
        with pytest.raises(Exception):
            with test_client.websocket_connect("/ws") as ws:
                ws.send_json({"action": "trigger_test_alert"})

        # 3. Connection with untrusted origin must be rejected (code 1008 policy violation)
        with pytest.raises(Exception):
            with test_client.websocket_connect("/ws", headers={"origin": "http://evil-tracker.com"}) as ws:
                ws.send_json({"action": "trigger_test_alert"})
