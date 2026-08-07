# Auth Testing Playbook (COA)

## Step 1: MongoDB
- db.users.find({role: "admin"}) → admin@coa-varese.it, password_hash inizia con $2b$
- Indici: users.email (unique), login_attempts.identifier

## Step 2: API
```
curl -c cookies.txt -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@coa-varese.it","password":"CoaAdmin2026!"}'
curl -b cookies.txt $API/api/auth/me
```
Login restituisce l'utente e setta i cookie access_token + refresh_token. /me restituisce lo stesso utente.

## Note
- Cookie: httpOnly, secure, samesite=none. Frontend usa withCredentials.
- Brute force: 5 tentativi falliti → lockout 15 min (collection login_attempts).
