## 🚀 Full Stack Deployment Guide

Kompletny przewodnik wdrożenia aplikacji Floor Heating Designer (frontend + backend + baza danych) na VPS.

---

## 📋 Wymagania

### Na lokalnej maszynie:
- Node.js 20+
- npm
- sshpass (`sudo apt install sshpass`)
- Dostęp SSH do VPS

### Na VPS (8.209.82.14):
- Ubuntu/Debian
- Nginx (dla frontendu)
- PostgreSQL 12+ (dla bazy danych)
- Node.js 20+
- systemd (dla backendu jako service)

---

## 🎯 Quick Start

### Automatyczna instalacja (ZALECANE):

```bash
cd /home/hexan/claude/heating/floor-heating-app
chmod +x install-full-stack.sh
./install-full-stack.sh
```

Skrypt wykona:
1. ✅ Build frontendu i backendu
2. ✅ Pakowanie aplikacji
3. ✅ Upload na VPS
4. ✅ Instalację w odpowiednich katalogach
5. ✅ Utworzenie systemd service dla backendu
6. ✅ Konfigurację uprawnień

---

## 📁 Struktura na VPS

```
/var/www/html/heating/          # Frontend (static files)
├── index.html
├── assets/
│   ├── index-*.js
│   └── index-*.css

/var/www/heating-backend/       # Backend (Node.js API)
├── dist/                       # Compiled TypeScript
├── node_modules/
├── database/
│   └── schema.sql
├── uploads/                    # Uploaded floor plans
├── .env                        # Configuration
└── package.json
```

---

## ⚙️ Konfiguracja PostgreSQL

### 1. Zainstaluj PostgreSQL (jeśli nie ma):

```bash
ssh root@8.209.82.14

apt update
apt install postgresql postgresql-contrib -y
systemctl start postgresql
systemctl enable postgresql
```

### 2. Utwórz bazę danych:

```bash
sudo -u postgres psql
```

W PostgreSQL shell:

```sql
CREATE DATABASE floor_heating;

CREATE USER floor_heating_user WITH PASSWORD 'your_secure_password';

GRANT ALL PRIVILEGES ON DATABASE floor_heating TO floor_heating_user;

-- Dla PostgreSQL 15+:
\c floor_heating
GRANT ALL ON SCHEMA public TO floor_heating_user;

\q
```

### 3. Zainicjalizuj schemat:

```bash
cd /var/www/heating-backend
sudo -u postgres psql -d floor_heating -f database/schema.sql
```

### 4. Zaktualizuj backend .env:

```bash
nano /var/www/heating-backend/.env
```

Ustaw:
```
DB_PASSWORD=your_secure_password
JWT_SECRET=your_random_secret_here
```

Wygeneruj JWT secret:
```bash
openssl rand -base64 32
```

---

## 🔧 Backend Service

### Uruchom backend:

```bash
systemctl start heating-backend
systemctl enable heating-backend  # Auto-start on boot
```

### Sprawdź status:

```bash
systemctl status heating-backend
```

### Logi:

```bash
journalctl -u heating-backend -f
```

### Restart po zmianach:

```bash
systemctl restart heating-backend
```

### Test API:

```bash
curl http://localhost:3001/health
# Powinno zwrócić: {"status":"ok","timestamp":"..."}
```

---

## 🌐 Nginx Configuration

### Frontend (już skonfigurowany):

```nginx
location /heating/ {
    alias /var/www/html/heating/;
    index index.html;
    try_files $uri $uri/ /heating/index.html;
}
```

### Backend Proxy (opcjonalne - dla `/api`):

Dodaj do `/etc/nginx/sites-available/default`:

```nginx
location /api/ {
    proxy_pass http://localhost:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Test i reload:
```bash
nginx -t
systemctl reload nginx
```

**Jeśli używasz proxy**, zaktualizuj frontend `.env`:
```
VITE_API_URL=http://8.209.82.14/api
```

I przebuduj frontend:
```bash
./install-full-stack.sh
```

---

## 📊 URLs

| Service | URL |
|---------|-----|
| Frontend | http://8.209.82.14/heating |
| Backend (direct) | http://8.209.82.14:3001/api |
| Backend (via proxy) | http://8.209.82.14/api |
| Health check | http://8.209.82.14:3001/health |

---

## 🧪 Testing

### 1. Health check:
```bash
curl http://8.209.82.14:3001/health
```

### 2. Register user:
```bash
curl -X POST http://8.209.82.14:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
  }'
```

Powinno zwrócić token:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### 3. Login:
```bash
curl -X POST http://8.209.82.14:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### 4. Otwórz frontend w przeglądarce:
```
http://8.209.82.14/heating
```

Powinieneś zobaczyć ekran logowania.

---

## 🔒 Bezpieczeństwo

### 1. Firewall (ufw):

```bash
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS (jeśli używasz)
ufw allow 3001/tcp    # Backend (opcjonalnie - lepiej używać proxy)
ufw enable
```

### 2. SSL/HTTPS (zalecane):

Zainstaluj certbota:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

### 3. PostgreSQL security:

```bash
# Ogranicz dostęp do PostgreSQL tylko z localhost
nano /etc/postgresql/*/main/pg_hba.conf

# Upewnij się że jest:
local   all             postgres                                peer
host    floor_heating   floor_heating_user   127.0.0.1/32     md5
```

Restart:
```bash
systemctl restart postgresql
```

---

## 🔄 Aktualizacja aplikacji

Po każdej zmianie w kodzie:

```bash
./install-full-stack.sh
```

Skrypt automatycznie:
- Przebuduje frontend i backend
- Prześle nowe wersje
- Podmieni pliki
- Zrestartuje backend service

---

## 🐛 Troubleshooting

### Problem: Backend nie startuje

**Sprawdź logi:**
```bash
journalctl -u heating-backend -n 50
```

**Typowe przyczyny:**
1. Błąd połączenia z PostgreSQL
   - Sprawdź `.env` (hasło, nazwa bazy)
   - Sprawdź czy PostgreSQL działa: `systemctl status postgresql`

2. Port 3001 zajęty
   - Sprawdź: `netstat -tulpn | grep 3001`
   - Zmień PORT w `.env`

3. Brak uprawnień
   - `chown -R www-data:www-data /var/www/heating-backend`

### Problem: Frontend pokazuje błąd API

**Sprawdź network tab w przeglądarce:**
- Czy frontend wysyła requesty na prawidłowy URL?
- Sprawdź `.env` w frontendzie

**Test bezpośredni:**
```bash
curl http://localhost:3001/health
```

### Problem: Database connection error

**Test połączenia:**
```bash
psql -h localhost -U floor_heating_user -d floor_heating
```

**Sprawdź czy użytkownik ma uprawnienia:**
```sql
\l  -- lista baz
\du -- lista użytkowników
```

### Problem: CORS errors

Jeśli widzisz błędy CORS w konsoli przeglądarki, sprawdź czy backend używa CORS middleware (już skonfigurowane w `server/src/index.ts`).

---

## 📈 Monitoring

### Logi backendu:
```bash
journalctl -u heating-backend -f
```

### Logi Nginx:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### PostgreSQL logs:
```bash
tail -f /var/log/postgresql/postgresql-*-main.log
```

### Status wszystkich serwisów:
```bash
systemctl status nginx
systemctl status postgresql
systemctl status heating-backend
```

---

## 💾 Backup

### Backup bazy danych:

```bash
# Dump bazy
sudo -u postgres pg_dump floor_heating > backup_$(date +%Y%m%d).sql

# Restore
sudo -u postgres psql floor_heating < backup_20250101.sql
```

### Backup plików użytkowników:

```bash
tar -czf uploads_backup.tar.gz /var/www/heating-backend/uploads/
```

---

## 📝 Zmienne środowiskowe

### Frontend (`.env`):
```
VITE_API_URL=http://8.209.82.14:3001/api  # lub /api jeśli przez proxy
```

### Backend (`server/.env`):
```
PORT=3001
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_NAME=floor_heating
DB_USER=floor_heating_user
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

---

## ✅ Checklist Deployment

- [ ] PostgreSQL zainstalowany i uruchomiony
- [ ] Baza `floor_heating` utworzona
- [ ] User `floor_heating_user` utworzony z hasłem
- [ ] Schemat bazy zainicjalizowany (`schema.sql`)
- [ ] Backend `.env` skonfigurowany (hasło DB, JWT secret)
- [ ] Backend service uruchomiony (`systemctl start heating-backend`)
- [ ] Backend odpowiada na `/health`
- [ ] Frontend zainstalowany w `/var/www/html/heating/`
- [ ] Nginx skonfigurowany dla `/heating/`
- [ ] Test rejestracji użytkownika działa
- [ ] Test logowania działa
- [ ] Frontend komunikuje się z backendem

---

## 🎉 Gotowe!

Aplikacja powinna być dostępna pod:
- **http://8.209.82.14/heating** - Frontend
- **http://8.209.82.14:3001/api** - Backend API

Możesz teraz:
1. Zarejestrować się przez UI
2. Zalogować się
3. Tworzyć projekty
4. Wgrywać plany pięter (JPG)
5. Rysować pętle ogrzewania

---

**Need help?** Zobacz logi (`journalctl -u heating-backend -f`) lub sprawdź sekcję Troubleshooting powyżej.
