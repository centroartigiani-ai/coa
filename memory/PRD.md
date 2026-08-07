# PRD — Centrale Operativa Artigiani (COA)

## Problem statement originale
Landing page + piattaforma lead-capture per COA: mettere in contatto privati, condomini e aziende con artigiani qualificati (idraulici, elettricisti, clima, caldaie, manutenzioni, urgenze) nella provincia di Varese. Hero "Trova l'artigiano giusto in meno di 15 minuti", sezioni Come funziona / Perché COA / Problema / Servizi (9 card) / Per chi / Diventa Partner / Come lavoriamo / Aree coperte / FAQ / Footer. Due form: "Richiedi un intervento" (con foto opzionale) e "Diventa Partner" (con allegato opzionale).

## Scelte utente
- Database + notifica email per ogni nuova richiesta (Resend)
- Area admin protetta con login (JWT)
- Tema scuro moderno, solo italiano
- Direzione artistica award-level: kinetic hero con reveal mascherato, marquee editoriale, framer-motion + lenis, parallax hero

## Architettura
- Frontend: React 19 + Tailwind + framer-motion + lenis + react-fast-marquee + shadcn/ui + sonner
- Backend: FastAPI + MongoDB (motor). Auth JWT con cookie httpOnly (access 15min / refresh 7gg), seed admin, protezione brute-force (5 tentativi → lockout 15min)
- Upload allegati: base64 in MongoDB (max 5MB), endpoint download protetti
- Email: Resend (asyncio.to_thread), degrada a log se RESEND_API_KEY assente

## User personas
- Privato con guasto domestico (anche urgente)
- Amministratore di condominio
- Azienda con manutenzione programmata
- Artigiano che vuole nuovi clienti
- Admin COA che gestisce richieste/candidature

## Implementato (07/08/2026)
- Landing completa: hero cinetico con parallasse, 7 capitoli numerati, bento grid servizi asimmetrica, marquee aree, FAQ accordion, footer con Privacy/Cookie dialog
- Form Richiesta intervento e Candidatura partner (multipart, upload file) con toast di conferma
- Admin: login (/admin/login), dashboard con statistiche, tab Richieste/Partner, cambio stato, download allegati
- Endpoint: POST /api/requests, POST /api/partners, GET/PATCH admin, GET attachment, auth login/logout/me
- Credenziali: admin@coa-varese.it / CoaAdmin2026! (in /app/memory/test_credentials.md)

## Da completare / note
- P0: configurare RESEND_API_KEY in backend/.env per attivare le notifiche email (attualmente loggate, NON inviate)
- P1: email di conferma automatica al cliente
- P1: refresh token flow frontend (attualmente il token dura 15 min, poi serve rilogin)
- P2: pagine Privacy/Cookie complete, recensioni pubbliche, filtri/ricerca in admin, contatti reali (telefono/email sono placeholder)
