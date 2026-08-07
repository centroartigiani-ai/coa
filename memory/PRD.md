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
- Notifiche email Resend ATTIVE: ogni nuova richiesta/candidatura invia email a centro.artigiani@gmail.com (mittente onboarding@resend.dev, modalità test — recapita solo all'email registrata sull'account Resend). Per inviare ad altri indirizzi serve verificare un dominio su resend.com/domains
- Pulsante WhatsApp nell'admin su ogni richiesta e candidatura: apre chat wa.me col cliente/candidato con messaggio precompilato (scelta utente: niente invio automatico perché richiede account Twilio/Meta)
- Pulsante WhatsApp flottante (verde, basso-destra) su tutta la landing: apre chat wa.me verso +39 352 0248313 con messaggio precompilato per i visitatori
- Revisione contenuti (07/08/2026): rimosso ogni riferimento ai "15 minuti"; servizi ridotti a 5 (Idraulico, Elettricista, Piccole manutenzioni, Servizi per condomini, Servizi per aziende); aree coperte solo "Varese e provincia"; contatti reali nel footer (+39 352 024 8313, centro.artigiani@gmail.com); form richiesta intervento riscritto come wizard a 3 step (dati → intervento con card icone → riepilogo + foto + schermata di successo), campo Comune rimosso (backend: comune e indirizzo opzionali)

## Da completare / note
- P1: verifica dominio su Resend per notifiche a qualsiasi indirizzo e mittente brandizzato (es. noreply@coa-varese.it)
- P1: email di conferma automatica al cliente
- P1: refresh token flow frontend (attualmente il token dura 15 min, poi serve rilogin)
- P2: pagine Privacy/Cookie complete, recensioni pubbliche, filtri/ricerca in admin, contatti reali (telefono/email sono placeholder)
