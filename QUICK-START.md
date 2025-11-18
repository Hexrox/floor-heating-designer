# ⚡ Quick Start - Floor Heating Designer v2.0

**1 KOMENDA = GOTOWA APLIKACJA!** 🚀

---

## 🎯 Co nowego w v2.0?

- ✅ **Full Stack** - Backend API + Frontend + PostgreSQL
- ✅ **Użytkownicy** - Rejestracja, logowanie, JWT
- ✅ **Projekty** - Każdy użytkownik ma swoje projekty
- ✅ **Upload JPG** - Wgrywanie planów pięter
- ✅ **Zapis do bazy** - Wszystko przechowywane w PostgreSQL
- ✅ **FULLY AUTOMATED** - Jeden skrypt robi WSZYSTKO!

---

## 🚀 Instalacja na VPS - FULLY AUTOMATED ⭐

### ZALECANE: Jeden skrypt, zero konfiguracji!

```bash
cd /home/hexan/claude/heating/floor-heating-app
./install-full-stack-auto.sh
```

**Podaj hasło SSH gdy zostaniesz poproszony.**

### To wszystko! Skrypt automatycznie:

1. ✅ Zainstaluje PostgreSQL (jeśli brak)
2. ✅ Utworzy bazę danych `floor_heating`
3. ✅ Utworzy użytkownika `floor_heating_user` z hasłem
4. ✅ Załaduje schemat bazy (tabele)
5. ✅ Zbuduje frontend i backend
6. ✅ Wdroży na VPS
7. ✅ Utworzy systemd service
8. ✅ Uruchomi backend
9. ✅ Zapisze credentials do `CREDENTIALS.txt`
10. ✅ Zweryfikuje że wszystko działa

### Po instalacji:

Otwórz w przeglądarce: **http://8.209.82.14/heating**

Zarejestruj się i zacznij korzystać! 🎉

---

## 📋 Porównanie skryptów

| Feature | install-full-stack.sh | install-full-stack-auto.sh ⭐ |
|---------|----------------------|---------------------------|
| Instalacja PostgreSQL | ❌ Ręcznie | ✅ Automatycznie |
| Utworzenie bazy | ❌ Ręcznie | ✅ Automatycznie |
| Schemat bazy | ❌ Ręcznie | ✅ Automatycznie |
| Backend .env | ❌ Ręcznie | ✅ Automatycznie |
| Uruchomienie service | ❌ Ręcznie | ✅ Automatycznie |
| Credentials | ❌ Brak | ✅ Zapisane do pliku |
| **Kroki po instalacji** | **~10 komend** | **0 komend** |

**Zalecam:** `install-full-stack-auto.sh` ⭐

---

## 🎬 Co się dzieje podczas instalacji?

```
[1/10] Test połączenia z VPS...             ✅
[2/10] Instalacja PostgreSQL...             ✅
[3/10] Konfiguracja bazy danych...          ✅
[4/10] Budowanie frontendu...               ✅
[5/10] Pakowanie frontendu...               ✅
[6/10] Budowanie backendu...                ✅
[7/10] Przesyłanie na VPS...                ✅
[8/10] Instalacja na serwerze...            ✅
[9/10] Inicjalizacja schematu bazy...       ✅
[10/10] Uruchamianie backendu...            ✅

Weryfikacja...
✅ Frontend files: 3
✅ Backend service: active
✅ Database tables: 4
✅ Backend odpowiada (HTTP 200)

INSTALACJA ZAKOŃCZONA!
```

---

## 🔐 Credentials

Po instalacji znajdziesz w pliku `CREDENTIALS.txt`:

```
PostgreSQL Database:
  Host:      localhost
  Database:  floor_heating
  User:      floor_heating_user
  Password:  <wygenerowane automatycznie>

JWT Secret:  <wygenerowane automatycznie>
```

**Ważne:** Zachowaj ten plik w bezpiecznym miejscu!

---

## 💻 Development (lokalnie)

### Opcja 1: Automated (jak na VPS)

Możesz użyć tego samego skryptu lokalnie, ale lepiej manualnie:

### Opcja 2: Manual Setup

**Terminal 1 - PostgreSQL + Backend:**

```bash
# Zainstaluj PostgreSQL (jeśli nie masz)
sudo apt install postgresql

# Utwórz bazę
sudo -u postgres psql << EOF
CREATE DATABASE floor_heating;
CREATE USER floor_heating_user WITH PASSWORD 'dev123';
GRANT ALL PRIVILEGES ON DATABASE floor_heating TO floor_heating_user;
\c floor_heating
GRANT ALL ON SCHEMA public TO floor_heating_user;
EOF

# Init schema
cd server
sudo -u postgres psql -d floor_heating -f database/schema.sql

# Install deps
npm install

# Config
cp .env.example .env
nano .env  # ustaw DB_PASSWORD=dev123, wygeneruj JWT_SECRET

# Start backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
npm install
npm run dev
```

Otwórz: **http://localhost:5173**

---

## 🧪 Testowanie

### 1. Zarejestruj użytkownika przez UI

W przeglądarce (http://localhost:5173 lub http://8.209.82.14/heating):

1. Kliknij "Zarejestruj się"
2. Wypełnij formularz
3. Kliknij "Zarejestruj się"

Powinieneś zostać automatycznie zalogowany!

### 2. Test API (curl)

```bash
# Register
curl -X POST http://8.209.82.14:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
  }'

# Login
curl -X POST http://8.209.82.14:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'

# Health check
curl http://8.209.82.14:3001/health
```

---

## 📊 Status Check

### Po instalacji:

```bash
# Backend status
ssh root@8.209.82.14 'systemctl status heating-backend'

# Backend logs
ssh root@8.209.82.14 'journalctl -u heating-backend -f'

# Database
ssh root@8.209.82.14 'sudo -u postgres psql -d floor_heating -c "SELECT COUNT(*) FROM users;"'

# Health check
curl http://8.209.82.14:3001/health
```

---

## 🛠️ Przydatne komendy

### Restart backendu:

```bash
ssh root@8.209.82.14 'systemctl restart heating-backend'
```

### Logi w czasie rzeczywistym:

```bash
ssh root@8.209.82.14 'journalctl -u heating-backend -f'
```

### Połączenie z bazą:

```bash
ssh root@8.209.82.14
sudo -u postgres psql -d floor_heating

# W psql:
\dt              # Lista tabel
SELECT * FROM users;
SELECT * FROM projects;
\q              # Wyjście
```

### Backup bazy:

```bash
ssh root@8.209.82.14 'sudo -u postgres pg_dump floor_heating > ~/backup.sql'
scp root@8.209.82.14:~/backup.sql .
```

### Aktualizacja po zmianach w kodzie:

```bash
./install-full-stack-auto.sh
```

Skrypt wykryje że PostgreSQL i baza już istnieją, i tylko zaktualizuje kod!

---

## ❓ Problemy?

### Backend nie startuje:

```bash
ssh root@8.209.82.14
journalctl -u heating-backend -n 50
```

Typowe przyczyny:
- PostgreSQL nie działa: `systemctl status postgresql`
- Błąd w .env (sprawdź hasło bazy)
- Port 3001 zajęty: `netstat -tulpn | grep 3001`

### Frontend pokazuje błąd połączenia:

Sprawdź czy backend odpowiada:

```bash
curl http://8.209.82.14:3001/health
```

Jeśli nie odpowiada, sprawdź logi backendu (powyżej).

### Nie mogę się zarejestrować:

Sprawdź network tab w przeglądarce (F12 → Network).

Typowe problemy:
- Backend nie działa (sprawdź health)
- Hasło za krótkie (min 6 znaków)
- Email już istnieje

---

## 🔄 Reinstalacja

Jeśli coś poszło nie tak, możesz zresetować wszystko:

```bash
ssh root@8.209.82.14

# Usuń bazę
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS floor_heating;
DROP USER IF EXISTS floor_heating_user;
EOF

# Usuń backend
systemctl stop heating-backend
systemctl disable heating-backend
rm -rf /var/www/heating-backend
rm /etc/systemd/system/heating-backend.service
systemctl daemon-reload

# Usuń frontend
rm -rf /var/www/html/heating/*

# Teraz uruchom ponownie:
exit
./install-full-stack-auto.sh
```

---

## 📚 Więcej informacji

- **Pełna dokumentacja:** `FULLSTACK-DEPLOYMENT.md`
- **Backend API:** `server/README.md`
- **Architektura:** `README-FULLSTACK.md`

---

## ✅ Gotowe!

Teraz masz:
- ✅ Działającą aplikację full-stack
- ✅ System użytkowników
- ✅ API backend z autentykacją
- ✅ PostgreSQL database
- ✅ Deployment w pełni zautomatyzowany
- ✅ **Wszystko w JEDNEJ KOMENDZIE!**

**Następny krok:** Dodanie Fabric.js canvas i funkcji rysowania! (v2.1)

---

## 🎉 Podsumowanie instalacji

### BYŁO (v1.0):
```bash
# 15+ komend manualnych
ssh ...
sudo apt install postgresql
sudo -u postgres psql
CREATE DATABASE ...
CREATE USER ...
\q
cd /var/www
tar ...
nano .env
...
```

### JEST (v2.0):
```bash
./install-full-stack-auto.sh
# Podaj hasło
# ☕ Poczekaj 2 minuty
# ✅ Gotowe!
```

**To jest prawdziwa automatyzacja!** 🚀

---

**Data:** 2025-10-08
**Wersja:** 2.0
