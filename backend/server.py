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

try:
    import requests as _requests_sync
except ImportError:
    _requests_sync = None

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

# Tipi MIME consentiti per gli upload (verificati sui byte reali, non solo estensione/Content-Type dichiarato)
ALLOWED_UPLOAD_MIME = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "application/pdf": [b"%PDF-"],
}


def sniff_mime(data: bytes) -> str | None:
    for mime, signatures in ALLOWED_UPLOAD_MIME.items():
        for sig in signatures:
            if data.startswith(sig):
                return mime
    return None


async def verify_recaptcha(token: str | None, action: str):
    secret = os.environ.get("RECAPTCHA_SECRET_KEY")
    if not secret:
        logger.warning("RECAPTCHA_SECRET_KEY non configurata: verifica saltata (%s)", action)
        return
    if not token:
        raise HTTPException(status_code=400, detail="Verifica anti-spam mancante")
    if _requests_sync is None:
        logger.error("Libreria requests non disponibile: impossibile verificare reCAPTCHA")
        raise HTTPException(status_code=500, detail="Errore di configurazione del server")
    try:
        resp = await asyncio.to_thread(
            _requests_sync.post,
            "https://www.google.com/recaptcha/api/siteverify",
            data={"secret": secret, "response": token},
            timeout=10,
        )
        result = resp.json()
    except Exception as e:
        logger.error("Verifica reCAPTCHA fallita (errore rete): %s", e)
        raise HTTPException(status_code=400, detail="Verifica anti-spam non riuscita, riprova")
    score = result.get("score", 0)
    if not result.get("success") or score < 0.5:
        logger.warning("reCAPTCHA respinto (action=%s, score=%s, errors=%s)", action, score, result.get("error-codes"))
        raise HTTPException(status_code=400, detail="Verifica anti-spam non superata, riprova")
    if result.get("action") and result.get("action") != action:
        logger.warning("reCAPTCHA action mismatch: atteso=%s ricevuto=%s", action, result.get("action"))
        raise HTTPException(status_code=400, detail="Verifica anti-spam non valida")


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


async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accesso riservato all'amministratore")
    return user


async def get_current_partner(user=Depends(get_current_user)):
    if user.get("role") != "partner":
        raise HTTPException(status_code=403, detail="Accesso riservato ai partner")
    return user


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


async def send_email(to: str, subject: str, html: str, attachment: dict | None = None):
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key or resend is None:
        logger.warning("RESEND_API_KEY non configurata: email saltata (%s)", subject)
        return
    try:
        resend.api_key = api_key
        params = {
            "from": os.environ.get("SENDER_EMAIL", "onboarding@resend.dev"),
            "to": [to],
            "subject": subject,
            "html": html,
        }
        if attachment:
            params["attachments"] = [{"filename": attachment["filename"], "content": attachment["data"]}]
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Email inviata a %s: %s (id: %s)", to, subject, result.get("id"))
    except Exception as e:
        logger.error("Invio email fallito verso %s: %s", to, e)


async def notify_admin(subject: str, html: str, attachment: dict | None = None):
    await send_email(os.environ.get("NOTIFY_EMAIL") or os.environ.get("ADMIN_EMAIL"), subject, html, attachment)


async def notify_whatsapp(text: str, photo_url: str | None = None):
    apikey = os.environ.get("CALLMEBOT_APIKEY")
    phone = os.environ.get("CALLMEBOT_PHONE")
    if not apikey or not phone:
        logger.warning("CallMeBot non configurato: notifica WhatsApp saltata (%s)", text.splitlines()[0])
        return
    try:
        import urllib.parse

        import requests
        msg = text + (f"\nFoto: {photo_url}" if photo_url else "")
        url = "https://api.callmebot.com/whatsapp.php?" + urllib.parse.urlencode(
            {"phone": phone, "text": msg, "apikey": apikey}
        )
        resp = await asyncio.to_thread(requests.get, url, timeout=15)
        logger.info("WhatsApp CallMeBot: HTTP %s", resp.status_code)
    except Exception as e:
        logger.error("Invio WhatsApp fallito: %s", e)


async def read_upload(file):
    if not file or not file.filename:
        return None
    data = await file.read()
    if len(data) > MAX_UPLOAD:
        raise HTTPException(status_code=400, detail="File troppo grande (max 5MB)")
    real_mime = sniff_mime(data)
    if real_mime is None:
        raise HTTPException(status_code=400, detail="Formato file non consentito (solo JPG, PNG o PDF)")
    return {"filename": file.filename, "content_type": real_mime,
            "data": base64.b64encode(data).decode()}


async def find_partner(tipo: str, indirizzo: str):
    indirizzo_norm = (indirizzo or "").lower()
    partners = await db.users.find({"role": "partner", "approved": True}, {"_id": 0, "password_hash": 0}).to_list(500)
    apps = {a["email"].lower(): a for a in await db.partner_applications.find({}, {"_id": 0, "attachment": 0}).to_list(500)}
    matched = []
    for p in partners:
        app_doc = apps.get(p["email"])
        if not app_doc:
            continue
        prof = app_doc.get("professione", "")
        if prof != tipo and tipo not in ("Servizi per condomini", "Servizi per aziende"):
            continue
        zones = [z.strip().lower() for z in app_doc.get("zone_coperte", "").split(",") if z.strip()]
        zone_ok = any(z in ("provincia", "varese e provincia", "tutta la provincia") for z in zones) or any(z and z in indirizzo_norm for z in zones)
        if zone_ok:
            matched.append(p)
    matched.sort(key=lambda p: (not p.get("premium", False), p.get("created_at", datetime.min.replace(tzinfo=timezone.utc))))
    if matched:
        m = matched[0]
        return {"email": m["email"], "name": m.get("name", "")}
    return None


async def complete_request(rid: str):
    doc = await db.intervention_requests.find_one({"id": rid})
    if not doc:
        raise HTTPException(status_code=404, detail="Elemento non trovato")
    update = {"status": "completata"}
    if not doc.get("review_token"):
        token = str(uuid.uuid4())
        update["review_token"] = token
        link = f"{os.environ.get('PUBLIC_URL')}/recensione/{token}"
        html = build_email_html("Grazie per aver scelto COA", [
            ("Intervento", doc.get("tipo_intervento", "")),
            ("Come è andata?", "Il tuo intervento è stato completato. Lascia una recensione: aiuta altri clienti e i nostri artigiani."),
            ("Lascia la recensione", f'<a href="{link}" style="color:#F2A93B;">{link}</a>'),
        ])
        await send_email(doc["email"], "COA — Com'è andata? Lascia una recensione", html)
    await db.intervention_requests.update_one({"id": rid}, {"$set": update})


@api_router.post("/requests")
async def create_request(
    nome: str = Form(...), cognome: str = Form(...), telefono: str = Form(...), email: str = Form(...),
    indirizzo: str = Form(...), tipo_intervento: str = Form(...),
    descrizione: str = Form(...), urgente: str = Form("no"), comune: str = Form(""),
    privacy: str = Form(...), photo: UploadFile | None = File(None),
    recaptcha_token: str | None = Form(None),
):
    if privacy != "true":
        raise HTTPException(status_code=400, detail="Consenso privacy obbligatorio")
    await verify_recaptcha(recaptcha_token, "richiesta_intervento")
    doc = {
        "id": str(uuid.uuid4()),
        "nome": nome, "cognome": cognome, "telefono": telefono, "email": email,
        "comune": comune, "indirizzo": indirizzo, "tipo_intervento": tipo_intervento,
        "descrizione": descrizione,
        "urgente": urgente.lower() in ("si", "sì", "true", "yes", "1"),
        "photo": await read_upload(photo),
        "privacy_accepted_at": datetime.now(timezone.utc).isoformat(),
        "status": "nuova",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.intervention_requests.insert_one(doc)
    html = build_email_html(f"Nuova richiesta di intervento — {tipo_intervento}", [
        ("Nome", f"{nome} {cognome}"), ("Telefono", telefono), ("Email", email),
        ("Comune", comune), ("Indirizzo", indirizzo), ("Tipo", tipo_intervento),
        ("Urgente", "Sì" if doc["urgente"] else "No"), ("Descrizione", descrizione),
    ])
    await notify_admin(f"[COA] Nuova richiesta: {tipo_intervento}", html, doc["photo"])
    photo_url = f"{os.environ.get('PUBLIC_URL')}/api/public/requests/{doc['id']}/photo" if doc["photo"] else None
    wa_text = (
        f"NUOVA RICHIESTA COA\n"
        f"Tipo: {tipo_intervento}\n"
        f"Cliente: {nome} {cognome}\n"
        f"Telefono: {telefono}\n"
        f"Indirizzo: {indirizzo}\n"
        f"Urgente: {'SI' if doc['urgente'] else 'No'}\n"
        f"Problema: {descrizione}"
    )
    await notify_whatsapp(wa_text, photo_url)
    confirm_html = build_email_html("Abbiamo ricevuto la tua richiesta", [
        ("Tipo di intervento", tipo_intervento),
        ("Indirizzo", indirizzo),
        ("Cosa succede ora", "La nostra centrale operativa sta analizzando la tua richiesta: il professionista più adatto ti ricontatterà il prima possibile."),
    ])
    await send_email(email, "COA — Richiesta ricevuta", confirm_html)
    partner = await find_partner(tipo_intervento, indirizzo)
    assigned = False
    if partner:
        await db.intervention_requests.update_one({"id": doc["id"]}, {"$set": {
            "assigned_to": partner["email"], "assigned_name": partner["name"],
            "assignment_status": "assegnata", "assigned_at": datetime.now(timezone.utc).isoformat(),
        }})
        assigned = True
        assign_html = build_email_html("Nuova richiesta assegnata a te", [
            ("Tipo", tipo_intervento), ("Indirizzo", indirizzo),
            ("Urgente", "Sì" if doc["urgente"] else "No"), ("Problema", descrizione),
            ("Accedi", f'<a href="{os.environ.get("PUBLIC_URL")}/partner/login" style="color:#F2A93B;">Vai alla tua area partner</a>'),
        ])
        await send_email(partner["email"], f"[COA] Nuovo intervento assegnato: {tipo_intervento}", assign_html)
    return {"id": doc["id"], "message": "Richiesta ricevuta", "assigned": assigned}


@api_router.post("/partners")
async def create_partner(
    nome: str = Form(...), cognome: str = Form(...), ragione_sociale: str = Form(...),
    partita_iva: str = Form(...), telefono: str = Form(...), email: str = Form(...),
    professione: str = Form(...), zone_coperte: str = Form(...), anni_esperienza: str = Form(...),
    messaggio: str = Form(""), privacy: str = Form(...), password: str = Form(...), attachment: UploadFile | None = File(None),
    recaptcha_token: str | None = Form(None),
):
    if privacy != "true":
        raise HTTPException(status_code=400, detail="Consenso privacy obbligatorio")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="La password deve avere almeno 8 caratteri")
    email_norm = email.lower()
    if await db.users.find_one({"email": email_norm}):
        raise HTTPException(status_code=400, detail="Esiste già un account con questa email")
    await verify_recaptcha(recaptcha_token, "candidatura_partner")
    doc = {
        "id": str(uuid.uuid4()),
        "nome": nome, "cognome": cognome, "ragione_sociale": ragione_sociale,
        "partita_iva": partita_iva, "telefono": telefono, "email": email_norm,
        "professione": professione, "zone_coperte": zone_coperte,
        "anni_esperienza": anni_esperienza, "messaggio": messaggio,
        "attachment": await read_upload(attachment),
        "privacy_accepted_at": datetime.now(timezone.utc).isoformat(),
        "status": "nuova",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.partner_applications.insert_one(doc)
    await db.users.insert_one({
        "email": email_norm, "password_hash": hash_password(password),
        "name": f"{nome} {cognome}", "role": "partner",
        "approved": False, "premium": False,
        "created_at": datetime.now(timezone.utc),
    })
    html = build_email_html(f"Nuova candidatura partner — {professione}", [
        ("Nome", f"{nome} {cognome}"), ("Ragione sociale", ragione_sociale),
        ("P.IVA", partita_iva), ("Telefono", telefono), ("Email", email),
        ("Professione", professione), ("Zone", zone_coperte),
        ("Esperienza", anni_esperienza), ("Messaggio", messaggio),
    ])
    await notify_admin(f"[COA] Nuova candidatura partner: {nome} {cognome}", html, doc["attachment"])
    wa_text = (
        f"NUOVA CANDIDATURA PARTNER COA\n"
        f"Nome: {nome} {cognome}\n"
        f"Ragione sociale: {ragione_sociale}\n"
        f"Professione: {professione}\n"
        f"Telefono: {telefono}\n"
        f"Zone: {zone_coperte}"
    )
    await notify_whatsapp(wa_text)
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
async def list_requests(user=Depends(require_admin)):
    docs = await db.intervention_requests.find({}, {"photo": 0, "_id": 0}).sort("created_at", -1).to_list(500)
    with_flag = await db.intervention_requests.find({}, {"photo.filename": 1, "id": 1, "_id": 0}).to_list(500)
    names = {d["id"]: (d.get("photo") or {}).get("filename") for d in with_flag}
    for d in docs:
        d["has_attachment"] = bool(names.get(d["id"]))
        d["attachment_name"] = names.get(d["id"])
    return docs


@api_router.get("/partners")
async def list_partners(user=Depends(require_admin)):
    docs = await db.partner_applications.find({}, {"attachment": 0, "_id": 0}).sort("created_at", -1).to_list(500)
    with_flag = await db.partner_applications.find({}, {"attachment.filename": 1, "id": 1, "_id": 0}).to_list(500)
    names = {d["id"]: (d.get("attachment") or {}).get("filename") for d in with_flag}
    users = {u["email"]: u for u in await db.users.find({"role": "partner"}, {"_id": 0}).to_list(500)}
    for d in docs:
        d["has_attachment"] = bool(names.get(d["id"]))
        d["attachment_name"] = names.get(d["id"])
        u = users.get(d["email"].lower())
        d["approved"] = bool(u and u.get("approved"))
        d["premium"] = bool(u and u.get("premium"))
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
async def request_attachment(doc_id: str, user=Depends(require_admin)):
    return await get_attachment("intervention_requests", doc_id, "photo")


@api_router.get("/partners/{doc_id}/attachment")
async def partner_attachment(doc_id: str, user=Depends(require_admin)):
    return await get_attachment("partner_applications", doc_id, "attachment")


class StatusBody(BaseModel):
    status: str


async def update_status(collection, doc_id, status, allowed=None):
    if status not in (allowed or STATUSES):
        raise HTTPException(status_code=400, detail="Stato non valido")
    res = await db[collection].update_one({"id": doc_id}, {"$set": {"status": status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Elemento non trovato")
    return {"ok": True}


@api_router.patch("/requests/{doc_id}")
async def patch_request(doc_id: str, body: StatusBody, user=Depends(require_admin)):
    if body.status == "completata":
        await complete_request(doc_id)
        return {"ok": True}
    return await update_status("intervention_requests", doc_id, body.status)


@api_router.patch("/partners/{doc_id}")
async def patch_partner(doc_id: str, body: StatusBody, user=Depends(require_admin)):
    return await update_status("partner_applications", doc_id, body.status, allowed=STATUSES + ["approvata"])


@api_router.get("/public/requests/{doc_id}/photo")
async def public_request_photo(doc_id: str):
    doc = await db.intervention_requests.find_one({"id": doc_id})
    if not doc or not doc.get("photo"):
        raise HTTPException(status_code=404, detail="Foto non trovata")
    att = doc["photo"]
    return RawResponse(content=base64.b64decode(att["data"]), media_type=att["content_type"])


@api_router.get("/")
async def root():
    return {"message": "COA API attiva"}


@api_router.get("/partner/me")
async def partner_me(user=Depends(get_current_partner)):
    app_doc = await db.partner_applications.find_one({"email": user["email"]}, {"_id": 0, "attachment": 0})
    full = await db.users.find_one({"email": user["email"]}, {"_id": 0, "password_hash": 0})
    if full:
        full["created_at"] = full["created_at"].isoformat() if isinstance(full.get("created_at"), datetime) else full.get("created_at")
    return {"user": full, "application": app_doc}


@api_router.get("/partner/assignments")
async def partner_assignments(user=Depends(get_current_partner)):
    return await db.intervention_requests.find(
        {"assigned_to": user["email"]}, {"_id": 0, "photo": 0}
    ).sort("assigned_at", -1).to_list(200)


class AssignmentStatusBody(BaseModel):
    status: str


@api_router.patch("/partner/assignments/{rid}")
async def partner_update_assignment(rid: str, body: AssignmentStatusBody, user=Depends(get_current_partner)):
    if body.status not in ("accettata", "completata"):
        raise HTTPException(status_code=400, detail="Stato non valido")
    res = await db.intervention_requests.update_one(
        {"id": rid, "assigned_to": user["email"]}, {"$set": {"assignment_status": body.status}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Assegnazione non trovata")
    if body.status == "accettata":
        await db.intervention_requests.update_one({"id": rid}, {"$set": {"status": "in_lavorazione"}})
    elif body.status == "completata":
        await complete_request(rid)
    return {"ok": True}


@api_router.get("/admin/partners-list")
async def admin_partners_list(user=Depends(require_admin)):
    partners = await db.users.find({"role": "partner", "approved": True}, {"_id": 0, "password_hash": 0}).to_list(500)
    apps = {a["email"].lower(): a for a in await db.partner_applications.find({}, {"_id": 0, "attachment": 0}).to_list(500)}
    out = []
    for p in partners:
        a = apps.get(p["email"], {})
        out.append({"email": p["email"], "name": p.get("name", ""), "premium": bool(p.get("premium")),
                    "professione": a.get("professione", ""), "zone_coperte": a.get("zone_coperte", "")})
    return out


@api_router.patch("/partners/{doc_id}/approve")
async def approve_partner(doc_id: str, user=Depends(require_admin)):
    app_doc = await db.partner_applications.find_one({"id": doc_id})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Candidatura non trovata")
    await db.partner_applications.update_one({"id": doc_id}, {"$set": {"status": "approvata"}})
    await db.users.update_one({"email": app_doc["email"].lower()}, {"$set": {"approved": True}})
    html = build_email_html("Candidatura approvata — benvenuto nella rete COA", [
        ("Cosa succede ora", "Il tuo account partner è attivo: le richieste della tua zona e professione ti verranno assegnate automaticamente."),
        ("Accedi", f'<a href="{os.environ.get("PUBLIC_URL")}/partner/login" style="color:#F2A93B;">Vai alla tua area partner</a>'),
    ])
    await send_email(app_doc["email"], "COA — Candidatura approvata", html)
    return {"ok": True}


@api_router.patch("/partners/{doc_id}/premium")
async def toggle_premium(doc_id: str, user=Depends(require_admin)):
    app_doc = await db.partner_applications.find_one({"id": doc_id})
    if not app_doc:
        raise HTTPException(status_code=404, detail="Candidatura non trovata")
    u = await db.users.find_one({"email": app_doc["email"].lower()})
    if not u:
        raise HTTPException(status_code=404, detail="Account partner non trovato")
    new_val = not u.get("premium", False)
    await db.users.update_one({"email": app_doc["email"].lower()}, {"$set": {"premium": new_val}})
    return {"ok": True, "premium": new_val}


class AssignBody(BaseModel):
    partner_email: str


@api_router.patch("/requests/{doc_id}/assign")
async def assign_request(doc_id: str, body: AssignBody, user=Depends(require_admin)):
    partner = await db.users.find_one({"email": body.partner_email.lower(), "role": "partner", "approved": True})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner non trovato o non approvato")
    res = await db.intervention_requests.update_one({"id": doc_id}, {"$set": {
        "assigned_to": partner["email"], "assigned_name": partner.get("name", ""),
        "assignment_status": "assegnata", "assigned_at": datetime.now(timezone.utc).isoformat(),
    }})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Richiesta non trovata")
    return {"ok": True}


class ReviewBody(BaseModel):
    token: str
    rating: int
    text: str
    nome: str = ""


@api_router.get("/reviews/token/{token}")
async def review_token_info(token: str):
    doc = await db.intervention_requests.find_one({"review_token": token}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Link non valido")
    if await db.reviews.find_one({"token": token}):
        raise HTTPException(status_code=400, detail="Recensione già inviata")
    return {"nome": doc["nome"], "tipo_intervento": doc["tipo_intervento"]}


@api_router.post("/reviews")
async def create_review(body: ReviewBody):
    if not 1 <= body.rating <= 5:
        raise HTTPException(status_code=400, detail="Voto non valido")
    doc = await db.intervention_requests.find_one({"review_token": body.token})
    if not doc:
        raise HTTPException(status_code=404, detail="Link non valido")
    if await db.reviews.find_one({"token": body.token}):
        raise HTTPException(status_code=400, detail="Recensione già inviata")
    review = {
        "id": str(uuid.uuid4()), "token": body.token, "request_id": doc["id"],
        "nome": body.nome.strip() or doc["nome"], "rating": body.rating, "text": body.text.strip(),
        "tipo_intervento": doc["tipo_intervento"], "approved": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(review)
    return {"ok": True}


@api_router.get("/reviews/public")
async def public_reviews():
    return await db.reviews.find({"approved": True}, {"_id": 0, "token": 0, "request_id": 0}).sort("created_at", -1).to_list(6)


@api_router.get("/reviews")
async def list_reviews(user=Depends(require_admin)):
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


class ReviewApproveBody(BaseModel):
    approved: bool


@api_router.patch("/reviews/{rid}")
async def patch_review(rid: str, body: ReviewApproveBody, user=Depends(require_admin)):
    res = await db.reviews.update_one({"id": rid}, {"$set": {"approved": body.approved}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Recensione non trovata")
    return {"ok": True}


app.include_router(api_router)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; img-src 'self' data: https:; "
        "script-src 'self' https://www.google.com https://www.gstatic.com; "
        "frame-src https://www.google.com; connect-src 'self' https:; "
        "style-src 'self' 'unsafe-inline'; base-uri 'self'; frame-ancestors 'none'"
    )
    return response


cors_origins_raw = os.environ.get("CORS_ORIGINS", "").strip()
if not cors_origins_raw or cors_origins_raw == "*":
    # Con allow_credentials=True un wildcard è pericoloso (e i browser lo rifiutano comunque
    # per le richieste con cookie): richiediamo un elenco esplicito di origini in produzione.
    logger.warning(
        "CORS_ORIGINS non impostata correttamente (mancante o '*'): nessuna origine cross-site "
        "sarà autorizzata finché non si imposta una lista esplicita di domini nel .env"
    )
    cors_origins = []
else:
    cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
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
