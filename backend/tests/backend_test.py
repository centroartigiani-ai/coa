"""Backend regression tests: auth playbook + operator availability calendar / slot assignment."""
import os
import uuid
from datetime import date, datetime, timedelta, timezone

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient

frontend_env = dotenv_values("/app/frontend/.env")
backend_env = dotenv_values("/app/backend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/") + "/api"

ADMIN = {"email": "admin@coa-varese.it", "password": "CoaAdmin2026!"}
PARTNER = {"email": "luca.prati@test.it", "password": "partner123"}

mongo = MongoClient(backend_env["MONGO_URL"])
db = mongo[backend_env["DB_NAME"]]


def monday_offset(weeks):
    t = date.today()
    return t - timedelta(days=t.weekday()) + timedelta(weeks=weeks)


NEXT_MONDAY = monday_offset(1)
D1 = NEXT_MONDAY.isoformat()
D2 = (NEXT_MONDAY + timedelta(days=1)).isoformat()
D3 = (NEXT_MONDAY + timedelta(days=2)).isoformat()
# week+2 dates, used only by TestPartnerAvailability to avoid clashing with the assignment tests
W2A = (NEXT_MONDAY + timedelta(days=7)).isoformat()
W2B = (NEXT_MONDAY + timedelta(days=8)).isoformat()


@pytest.fixture(scope="session")
def admin_client():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/auth/login", json=ADMIN)
    if r.status_code != 200:
        pytest.fail(f"admin login failed {r.status_code}: {r.text[:300]}")
    return s


@pytest.fixture(scope="session")
def partner_client():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/auth/login", json=PARTNER)
    if r.status_code != 200:
        pytest.fail(f"partner login failed {r.status_code}: {r.text[:300]}")
    return s


@pytest.fixture(scope="session")
def seeded_requests():
    ids = []
    yield ids
    db.intervention_requests.delete_many({"id": {"$in": ids}})
    db.availability_slots.delete_many({"partner_email": PARTNER["email"]})


def seed_request(ids, data_preferita="", fascia_oraria="", nome="TEST_QA"):
    doc = {
        "id": str(uuid.uuid4()), "nome": nome, "cognome": "Slot", "telefono": "3331234567",
        "email": "qa@test.it", "comune": "", "indirizzo": "Via Test 1, Varese",
        "tipo_intervento": "Idraulico", "descrizione": "Test slot calendario",
        "urgente": False, "data_preferita": data_preferita, "fascia_oraria": fascia_oraria,
        "note_orario": "Citofono QA", "photo": None,
        "privacy_accepted_at": datetime.now(timezone.utc).isoformat(),
        "status": "nuova", "created_at": datetime.now(timezone.utc).isoformat(),
    }
    db.intervention_requests.insert_one(dict(doc))
    ids.append(doc["id"])
    return doc["id"]


# ---------- Auth / playbook checks ----------
class TestAuthPlaybook:
    def test_admin_bcrypt_hash_format(self):
        u = db.users.find_one({"email": ADMIN["email"]})
        assert u is not None
        assert u["password_hash"].startswith("$2b$"), u["password_hash"][:7]

    def test_login_sets_httponly_cookies(self):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/auth/login", json=ADMIN)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"
        raw = r.headers.get("set-cookie", "")
        assert "access_token" in raw and "HttpOnly" in raw
        assert "refresh_token" in raw
        me = s.get(f"{BASE_URL}/auth/me")
        assert me.status_code == 200 and me.json()["email"] == ADMIN["email"]

    @pytest.mark.skip(reason="Preflight is answered by the Cloudflare/ingress edge (ACAO '*', no allow-credentials); backend CORS config is verified in test_local_auth_infra.py")
    def test_cors_credentials_explicit_origin(self):
        origin = frontend_env["REACT_APP_BACKEND_URL"]
        r = requests.options(f"{BASE_URL}/auth/login", headers={
            "Origin": origin, "Access-Control-Request-Method": "POST"})
        assert r.headers.get("access-control-allow-credentials") == "true"
        assert r.headers.get("access-control-allow-origin") == origin

    def test_invalid_credentials_401(self):
        r = requests.post(f"{BASE_URL}/auth/login",
                          json={"email": "nobody-qa@test.it", "password": "wrong"})
        assert r.status_code == 401

    def test_bruteforce_lockout_after_5(self):
        """KNOWN GAP through the public ingress: lockout key is '<request.client.host>:<email>' and the
        ingress rotates proxy IPs (10.231.129.137/138), so failed attempts are split across counters and
        5 consecutive wrong passwords do NOT lock. Works when called directly on the backend (see
        test_local_auth_infra.test_lockout_local)."""
        email = f"qa-lock-{uuid.uuid4().hex[:8]}@test.it"
        codes = [requests.post(f"{BASE_URL}/auth/login",
                               json={"email": email, "password": "x"}).status_code
                 for _ in range(6)]
        assert codes[:5] == [401] * 5, codes
        assert codes[5] == 429, codes
        db.login_attempts.delete_many({"identifier": {"$regex": email}})

    def test_partner_cannot_access_admin_endpoints(self, partner_client):
        r = partner_client.get(f"{BASE_URL}/admin/partners-list")
        assert r.status_code == 403

    def test_availability_requires_auth(self):
        r = requests.get(f"{BASE_URL}/partner/availability?start={D1}")
        assert r.status_code == 401


# ---------- Partner availability ----------
class TestPartnerAvailability:
    def test_toggle_occupied_and_free(self, partner_client):
        r = partner_client.patch(f"{BASE_URL}/partner/availability",
                                 json={"date": W2A, "fascia": "mattina", "occupied": True})
        assert r.status_code == 200, r.text
        slots = partner_client.get(f"{BASE_URL}/partner/availability?start={W2A}").json()
        match = [s for s in slots if s["date"] == W2A and s["fascia"] == "mattina"]
        assert match and match[0]["status"] == "occupato"
        assert all("_id" not in s for s in slots)

        r = partner_client.patch(f"{BASE_URL}/partner/availability",
                                 json={"date": W2A, "fascia": "mattina", "occupied": False})
        assert r.status_code == 200
        slots = partner_client.get(f"{BASE_URL}/partner/availability?start={W2A}").json()
        assert not [s for s in slots if s["date"] == W2A and s["fascia"] == "mattina"]

    def test_invalid_fascia_400(self, partner_client):
        r = partner_client.patch(f"{BASE_URL}/partner/availability",
                                 json={"date": W2A, "fascia": "sera", "occupied": True})
        assert r.status_code == 400

    def test_past_date_400(self, partner_client):
        past = (date.today() - timedelta(days=3)).isoformat()
        r = partner_client.patch(f"{BASE_URL}/partner/availability",
                                 json={"date": past, "fascia": "mattina", "occupied": True})
        assert r.status_code == 400

    def test_beyond_horizon_400(self, partner_client):
        far = (date.today() + timedelta(days=40)).isoformat()
        r = partner_client.patch(f"{BASE_URL}/partner/availability",
                                 json={"date": far, "fascia": "mattina", "occupied": True})
        assert r.status_code == 400

    def test_bad_start_format(self, partner_client):
        r = partner_client.get(f"{BASE_URL}/partner/availability?start=not-a-date")
        assert r.status_code == 400


# ---------- Admin assignment with slots ----------
class TestSlotAssignment:
    def test_partners_list_slot_status(self, admin_client, partner_client, seeded_requests):
        partner_client.patch(f"{BASE_URL}/partner/availability",
                             json={"date": D2, "fascia": "pomeriggio", "occupied": True})
        r = admin_client.get(f"{BASE_URL}/admin/partners-list?date={D2}&fascia=pomeriggio")
        assert r.status_code == 200
        p = [x for x in r.json() if x["email"] == PARTNER["email"]]
        assert p, "partner di test non presente nella lista"
        assert p[0]["slot_status"] == "occupato"

        # assigning on an occupied slot must be refused
        rid = seed_request(seeded_requests)
        a = admin_client.patch(f"{BASE_URL}/requests/{rid}/assign", json={
            "partner_email": PARTNER["email"], "date": D2, "fascia": "pomeriggio"})
        assert a.status_code in (400, 409), a.text
        assert "non disponibile" in a.json()["detail"].lower() or "occupato" in a.json()["detail"].lower()

        partner_client.patch(f"{BASE_URL}/partner/availability",
                             json={"date": D2, "fascia": "pomeriggio", "occupied": False})

    def test_assign_requires_date_and_fascia(self, admin_client, seeded_requests):
        rid = seed_request(seeded_requests)
        r = admin_client.patch(f"{BASE_URL}/requests/{rid}/assign",
                               json={"partner_email": PARTNER["email"]})
        assert r.status_code == 422
        r = admin_client.patch(f"{BASE_URL}/requests/{rid}/assign", json={
            "partner_email": PARTNER["email"], "date": D1, "fascia": "notte"})
        assert r.status_code == 400

    def test_assign_reassign_and_double_booking(self, admin_client, partner_client, seeded_requests):
        rid = seed_request(seeded_requests, data_preferita=D1, fascia_oraria="Mattina (8–13)")
        r = admin_client.patch(f"{BASE_URL}/requests/{rid}/assign", json={
            "partner_email": PARTNER["email"], "date": D1, "fascia": "mattina"})
        assert r.status_code == 200, r.text

        # persisted on request
        reqs = admin_client.get(f"{BASE_URL}/requests").json()
        doc = [x for x in reqs if x["id"] == rid][0]
        assert doc["assigned_to"] == PARTNER["email"]
        assert doc["assigned_date"] == D1 and doc["assigned_fascia"] == "mattina"
        assert doc["assignment_status"] == "assegnata"

        # slot visible as assegnato to partner
        slots = partner_client.get(f"{BASE_URL}/partner/availability?start={D1}").json()
        s = [x for x in slots if x["date"] == D1 and x["fascia"] == "mattina"]
        assert s and s[0]["status"] == "assegnato"

        # partner cannot toggle an assigned slot
        t = partner_client.patch(f"{BASE_URL}/partner/availability",
                                 json={"date": D1, "fascia": "mattina", "occupied": True})
        assert t.status_code in (400, 403, 409), t.text

        # double booking of the same slot for another request -> 409
        rid2 = seed_request(seeded_requests)
        d = admin_client.patch(f"{BASE_URL}/requests/{rid2}/assign", json={
            "partner_email": PARTNER["email"], "date": D1, "fascia": "mattina"})
        assert d.status_code == 409, d.text
        assert "non disponibile" in d.json()["detail"].lower()

        # reassign same request to another slot -> old slot freed
        r = admin_client.patch(f"{BASE_URL}/requests/{rid}/assign", json={
            "partner_email": PARTNER["email"], "date": D3, "fascia": "pomeriggio"})
        assert r.status_code == 200, r.text
        slots = partner_client.get(f"{BASE_URL}/partner/availability?start={D1}").json()
        assert not [x for x in slots if x["date"] == D1 and x["fascia"] == "mattina"]
        assert [x for x in slots if x["date"] == D3 and x["fascia"] == "pomeriggio"
                and x["status"] == "assegnato"]

        # partner completes -> slot freed
        c = partner_client.patch(f"{BASE_URL}/partner/assignments/{rid}",
                                 json={"status": "completata"})
        assert c.status_code == 200, c.text
        slots = partner_client.get(f"{BASE_URL}/partner/availability?start={D1}").json()
        assert not [x for x in slots if x["date"] == D3], slots

    def test_admin_complete_frees_slot(self, admin_client, partner_client, seeded_requests):
        rid = seed_request(seeded_requests)
        assert admin_client.patch(f"{BASE_URL}/requests/{rid}/assign", json={
            "partner_email": PARTNER["email"], "date": D2, "fascia": "mattina"}).status_code == 200
        r = admin_client.patch(f"{BASE_URL}/requests/{rid}", json={"status": "completata"})
        assert r.status_code == 200, r.text
        slots = partner_client.get(f"{BASE_URL}/partner/availability?start={D2}").json()
        assert not [x for x in slots if x["date"] == D2 and x["fascia"] == "mattina"], slots

    def test_assign_past_date_rejected(self, admin_client, seeded_requests):
        rid = seed_request(seeded_requests)
        past = (date.today() - timedelta(days=1)).isoformat()
        r = admin_client.patch(f"{BASE_URL}/requests/{rid}/assign", json={
            "partner_email": PARTNER["email"], "date": past, "fascia": "mattina"})
        assert r.status_code == 400, r.text

    def test_assign_unknown_partner_404(self, admin_client, seeded_requests):
        rid = seed_request(seeded_requests)
        r = admin_client.patch(f"{BASE_URL}/requests/{rid}/assign", json={
            "partner_email": "ghost-qa@test.it", "date": D1, "fascia": "mattina"})
        assert r.status_code == 404, r.text

    def test_assign_unknown_request_404(self, admin_client):
        r = admin_client.patch(f"{BASE_URL}/requests/{uuid.uuid4()}/assign", json={
            "partner_email": PARTNER["email"], "date": D1, "fascia": "mattina"})
        assert r.status_code == 404, r.text


# ---------- Admin general calendar (GET /api/admin/calendar) ----------
# Uses week+3 offset dates (W3A/W3B) so it cannot clash with the other classes (pytest-xdist by class).
W3A = (NEXT_MONDAY + timedelta(days=14)).isoformat()
W3B = (NEXT_MONDAY + timedelta(days=15)).isoformat()


@pytest.fixture(scope="class")
def cal_requests():
    ids = []
    yield ids
    db.intervention_requests.delete_many({"id": {"$in": ids}})
    db.availability_slots.delete_many({"partner_email": PARTNER["email"], "date": {"$in": [W3A, W3B]}})


class TestAdminCalendar:
    def test_requires_auth(self):
        r = requests.get(f"{BASE_URL}/admin/calendar?start={W3A}")
        assert r.status_code == 401

    def test_partner_forbidden(self, partner_client):
        r = partner_client.get(f"{BASE_URL}/admin/calendar?start={W3A}")
        assert r.status_code == 403

    def test_bad_start_400(self, admin_client):
        assert admin_client.get(f"{BASE_URL}/admin/calendar?start=22-08-2026").status_code == 400

    def test_missing_start_422(self, admin_client):
        assert admin_client.get(f"{BASE_URL}/admin/calendar").status_code == 422

    def test_structure_and_premium_sort(self, admin_client):
        r = admin_client.get(f"{BASE_URL}/admin/calendar?start={W3A}")
        assert r.status_code == 200, r.text
        d = r.json()
        assert set(d.keys()) == {"partners", "slots"}
        assert isinstance(d["partners"], list) and len(d["partners"]) > 0
        for p in d["partners"]:
            assert set(p.keys()) == {"email", "name", "premium", "professione", "zone_coperte"}
            assert isinstance(p["premium"], bool)
            assert "_id" not in p and "password_hash" not in p
        prem = [not p["premium"] for p in d["partners"]]
        assert prem == sorted(prem), "i partner Premium devono stare in cima"
        assert any(p["email"] == PARTNER["email"] for p in d["partners"])
        for s in d["slots"]:
            assert "_id" not in s
            assert s["status"] in ("libero", "occupato", "assegnato")

    def test_only_approved_partners(self, admin_client):
        emails = [p["email"] for p in admin_client.get(f"{BASE_URL}/admin/calendar?start={W3A}").json()["partners"]]
        approved = {u["email"] for u in db.users.find({"role": "partner", "approved": True}, {"email": 1})}
        assert set(emails) == approved
        not_approved = {u["email"] for u in db.users.find({"role": "partner", "approved": {"$ne": True}}, {"email": 1})}
        assert not (set(emails) & not_approved)

    def test_suspended_partner_hidden(self, admin_client):
        """Simulate suspension directly in Mongo (revoke sets approved=False, suspended=True) and restore."""
        db.users.update_one({"email": PARTNER["email"]}, {"$set": {"approved": False, "suspended": True}})
        try:
            emails = [p["email"] for p in admin_client.get(f"{BASE_URL}/admin/calendar?start={W3A}").json()["partners"]]
            assert PARTNER["email"] not in emails
        finally:
            db.users.update_one({"email": PARTNER["email"]}, {"$set": {"approved": True, "suspended": False}})
        emails = [p["email"] for p in admin_client.get(f"{BASE_URL}/admin/calendar?start={W3A}").json()["partners"]]
        assert PARTNER["email"] in emails

    def test_partner_occupied_slot_visible_to_admin(self, admin_client, partner_client):
        assert partner_client.patch(f"{BASE_URL}/partner/availability",
                                    json={"date": W3A, "fascia": "pomeriggio", "occupied": True}).status_code == 200
        try:
            slots = admin_client.get(f"{BASE_URL}/admin/calendar?start={W3A}").json()["slots"]
            m = [s for s in slots if s["partner_email"] == PARTNER["email"] and s["date"] == W3A and s["fascia"] == "pomeriggio"]
            assert m, "slot occupato dal partner non visibile nel calendario admin"
            assert m[0]["status"] == "occupato"
            assert m[0]["request_id"] is None and m[0]["cliente"] is None
        finally:
            partner_client.patch(f"{BASE_URL}/partner/availability",
                                 json={"date": W3A, "fascia": "pomeriggio", "occupied": False})

    def test_assigned_slot_exposes_client_name(self, admin_client, cal_requests):
        rid = seed_request(cal_requests, nome="TEST_CAL")
        a = admin_client.patch(f"{BASE_URL}/requests/{rid}/assign", json={
            "partner_email": PARTNER["email"], "date": W3B, "fascia": "mattina"})
        assert a.status_code == 200, a.text
        slots = admin_client.get(f"{BASE_URL}/admin/calendar?start={W3A}").json()["slots"]
        m = [s for s in slots if s["partner_email"] == PARTNER["email"] and s["date"] == W3B and s["fascia"] == "mattina"]
        assert m, "slot assegnato assente"
        assert m[0]["status"] == "assegnato"
        assert m[0]["request_id"] == rid
        assert m[0]["cliente"] == "TEST_CAL Slot"
        assert m[0]["tipo_intervento"] == "Idraulico"

    def test_week_window_is_6_days(self, admin_client, cal_requests):
        """Slots of a Sunday (start+6) must NOT be returned; Mon..Sat only."""
        sunday = (NEXT_MONDAY + timedelta(days=20)).isoformat()  # W3A + 6
        db.availability_slots.insert_one({"id": str(uuid.uuid4()), "partner_email": PARTNER["email"],
                                          "date": sunday, "fascia": "mattina", "status": "occupato",
                                          "request_id": None, "created_at": datetime.now(timezone.utc).isoformat()})
        try:
            slots = admin_client.get(f"{BASE_URL}/admin/calendar?start={W3A}").json()["slots"]
            assert not [s for s in slots if s["date"] == sunday], "domenica non deve essere inclusa"
        finally:
            db.availability_slots.delete_many({"partner_email": PARTNER["email"], "date": sunday})
