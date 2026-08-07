from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import asyncio
import base64
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.responses import Response as RawResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from starlette.middleware.cors import CORSMiddleware

try:
    import resend
except ImportError:
    resend = None

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("coa")

JWT_ALGORITHM = "HS256"
STATUSES = ["nuova", "in_lavorazione", "completata"]
MAX_UPLOAD = 5 * 1024 * 1024


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "type": "access",
               "exp": datetime.now(timezone.utc) + timedelta(minutes=15)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "type": "refresh",
               "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token non valido")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token scaduto")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="Utente non trovato")
    return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


async def check_lockout(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("locked_until"):
        locked_until = rec["locked_until"]
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Troppi tentativi. Riprova tra qualche minuto.")


async def record_failure(identifier: str):
    now = datetime.now(timezone.utc)
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec:
        count = rec.get("count", 0) + 1
        update = {"count": count, "last_attempt": now}
        if count >= 5:
            update["count"] = 0
            update["locked_until"] = now + timedelta(minutes=15)
        await db.login_attempts.update_one({"identifier": identifier}, {"$set": update})
    else:
        await db.login_attempts.insert_one({"identifier": identifier, "count": 1, "last_attempt": now})


class LoginBody(BaseModel):
    email: EmailStr
    password: str


@api_router.post("/auth/login")
async def login(body: LoginBody, request: Request, response: Response):
    email = body.email.lower()
    identifier = f"{request.client.host}:{email}"
    await check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await record_failure(identifier)
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    await db.login_attempts.delete_one({"identifier": identifier})
    response.set_cookie("access_token", create_access_token(str(user["_id"]), email),
                        httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie("refresh_token", create_refresh_token(str(user["_id"])),
                        httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"id": str(user["_id"]), "email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


def build_email_html(title: str, fields: list) -> str:
    rows = "".join(
        f'<tr><td style="padding:8px 12px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">{k}</td>'
        f'<td style="padding:8px 12px;color:#111;font-size:14px;">{v}</td></tr>'
        for k, v in fields
    )
    return (f'<table style="width:100%;max-width:560px;font-family:Arial,sans-serif;border-collapse:collapse;border:1px solid #eee;">'
            f'<tr><td colspan="2" style="background:#FF5A00;color:#fff;padding:14px 16px;font-size:16px;font-weight:bold;">{title}</td></tr>'
            f'{rows}</table>')


async def notify_admin(subject: str, html: str):
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key or resend is None:
        logger.warning("RESEND_API_KEY non configurata: notifica email saltata (%s)", subject)
        return
    try:
        resend.api_key = api_key
        params = {
            "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
            "to": [os.environ.get("NOTIFY_EMAIL") or os.environ.get("ADMIN_EMAIL")],
            "subject": subject,
            "html": html,
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Email inviata: %s (id: %s)", subject, result.get("id"))
    except Exception as e:
        logger.error("Invio email fallito: %s", e)


async def read_upload(file):
    if not file or not file.filename:
        return None
    data = await file.read()
    if len(data) > MAX_UPLOAD:
        raise HTTPException(status_code=400, detail="File troppo grande (max 5MB)")
    return {"filename": file.filename, "content_type": file.content_type or "application/octet-stream",
            "data": base64.b64encode(data).decode()}


@api_router.post("/requests")
async def create_request(
    nome: str = Form(...), cognome: str = Form(...), telefono: str = Form(...), email: str = Form(...),
    indirizzo: str = Form(...), tipo_intervento: str = Form(...),
    descrizione: str = Form(...), urgente: str = Form("no"), comune: str = Form(""), photo: UploadFile | None = File(None),
):
    doc = {
        "id": str(uuid.uuid4()),
        "nome": nome, "cognome": cognome, "telefono": telefono, "email": email,
        "comune": comune, "indirizzo": indirizzo, "tipo_intervento": tipo_intervento,
        "descrizione": descrizione,
        "urgente": urgente.lower() in ("si", "sì", "true", "yes", "1"),
        "photo": await read_upload(photo),
        "status": "nuova",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.intervention_requests.insert_one(doc)
    html = build_email_html(f"Nuova richiesta di intervento — {tipo_intervento}", [
        ("Nome", f"{nome} {cognome}"), ("Telefono", telefono), ("Email", email),
        ("Comune", comune), ("Indirizzo", indirizzo), ("Tipo", tipo_intervento),
        ("Urgente", "Sì" if doc["urgente"] else "No"), ("Descrizione", descrizione),
    ])
    await notify_admin(f"[COA] Nuova richiesta: {tipo_intervento}", html)
    return {"id": doc["id"], "message": "Richiesta ricevuta"}


@api_router.post("/partners")
async def create_partner(
    nome: str = Form(...), cognome: str = Form(...), ragione_sociale: str = Form(...),
    partita_iva: str = Form(...), telefono: str = Form(...), email: str = Form(...),
    professione: str = Form(...), zone_coperte: str = Form(...), anni_esperienza: str = Form(...),
    messaggio: str = Form(""), attachment: UploadFile | None = File(None),
):
    doc = {
        "id": str(uuid.uuid4()),
        "nome": nome, "cognome": cognome, "ragione_sociale": ragione_sociale,
        "partita_iva": partita_iva, "telefono": telefono, "email": email,
        "professione": professione, "zone_coperte": zone_coperte,
        "anni_esperienza": anni_esperienza, "messaggio": messaggio,
        "attachment": await read_upload(attachment),
        "status": "nuova",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.partner_applications.insert_one(doc)
    html = build_email_html(f"Nuova candidatura partner — {professione}", [
        ("Nome", f"{nome} {cognome}"), ("Ragione sociale", ragione_sociale),
        ("P.IVA", partita_iva), ("Telefono", telefono), ("Email", email),
        ("Professione", professione), ("Zone", zone_coperte),
        ("Esperienza", anni_esperienza), ("Messaggio", messaggio),
    ])
    await notify_admin(f"[COA] Nuova candidatura partner: {nome} {cognome}", html)
    return {"id": doc["id"], "message": "Candidatura ricevuta"}


def serialize_docs(docs, file_key):
    out = []
    for d in docs:
        d.pop("_id", None)
        attachment = d.pop(file_key, None)
        d["has_attachment"] = bool(attachment)
        if attachment:
            d["attachment_name"] = attachment.get("filename")
        out.append(d)
    return out


@api_router.get("/requests")
async def list_requests(user=Depends(get_current_user)):
    docs = await db.intervention_requests.find({}, {"photo": 0, "_id": 0}).sort("created_at", -1).to_list(500)
    with_flag = await db.intervention_requests.find({}, {"photo.filename": 1, "id": 1, "_id": 0}).to_list(500)
    names = {d["id"]: (d.get("photo") or {}).get("filename") for d in with_flag}
    for d in docs:
        d["has_attachment"] = bool(names.get(d["id"]))
        d["attachment_name"] = names.get(d["id"])
    return docs


@api_router.get("/partners")
async def list_partners(user=Depends(get_current_user)):
    docs = await db.partner_applications.find({}, {"attachment": 0, "_id": 0}).sort("created_at", -1).to_list(500)
    with_flag = await db.partner_applications.find({}, {"attachment.filename": 1, "id": 1, "_id": 0}).to_list(500)
    names = {d["id"]: (d.get("attachment") or {}).get("filename") for d in with_flag}
    for d in docs:
        d["has_attachment"] = bool(names.get(d["id"]))
        d["attachment_name"] = names.get(d["id"])
    return docs


async def get_attachment(collection, doc_id, file_key):
    doc = await db[collection].find_one({"id": doc_id})
    if not doc or not doc.get(file_key):
        raise HTTPException(status_code=404, detail="Allegato non trovato")
    att = doc[file_key]
    content = base64.b64decode(att["data"])
    return RawResponse(content=content, media_type=att["content_type"],
                       headers={"Content-Disposition": f'attachment; filename="{att["filename"]}"'})


@api_router.get("/requests/{doc_id}/attachment")
async def request_attachment(doc_id: str, user=Depends(get_current_user)):
    return await get_attachment("intervention_requests", doc_id, "photo")


@api_router.get("/partners/{doc_id}/attachment")
async def partner_attachment(doc_id: str, user=Depends(get_current_user)):
    return await get_attachment("partner_applications", doc_id, "attachment")


class StatusBody(BaseModel):
    status: str


async def update_status(collection, doc_id, status):
    if status not in STATUSES:
        raise HTTPException(status_code=400, detail="Stato non valido")
    res = await db[collection].update_one({"id": doc_id}, {"$set": {"status": status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Elemento non trovato")
    return {"ok": True}


@api_router.patch("/requests/{doc_id}")
async def patch_request(doc_id: str, body: StatusBody, user=Depends(get_current_user)):
    return await update_status("intervention_requests", doc_id, body.status)


@api_router.patch("/partners/{doc_id}")
async def patch_partner(doc_id: str, body: StatusBody, user=Depends(get_current_user)):
    return await update_status("partner_applications", doc_id, body.status)


@api_router.get("/")
async def root():
    return {"message": "COA API attiva"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email, "password_hash": hash_password(admin_password),
            "name": "Admin COA", "role": "admin",
            "created_at": datetime.now(timezone.utc),
        })
        logger.info("Admin creato: %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})


@app.on_event("startup")
async def startup():
    await seed_admin()
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.intervention_requests.create_index("created_at")
    await db.partner_applications.create_index("created_at")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
