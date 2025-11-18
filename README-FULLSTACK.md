# 🏠 Floor Heating Designer - Full Stack

Profesjonalna aplikacja webowa do projektowania układów ogrzewania podłogowego.

---

## 🎯 Funkcje

### ✅ Zaimplementowane (v2.0):

**Backend:**
- ✅ API RESTful (Express + TypeScript)
- ✅ PostgreSQL database
- ✅ Autentykacja użytkowników (JWT)
- ✅ System projektów (CRUD)
- ✅ Upload plików JPG (plany pięter)
- ✅ Zapis danych rysunków (canvas state)
- ✅ Systemd service

**Frontend:**
- ✅ React + TypeScript + Vite
- ✅ Tailwind CSS
- ✅ Login/Register UI
- ✅ API integration (Axios)
- ✅ Auth context
- ✅ Protected routes

**Deployment:**
- ✅ Automatyczny skrypt instalacji
- ✅ Nginx config
- ✅ Kompletna dokumentacja

### 🚧 Do zaimplementowania (v2.1+):

- ⏳ Fabric.js canvas integration
- ⏳ JPG background import
- ⏳ Room contour drawing tools
- ⏳ Exclusion zones marking
- ⏳ Manifold placement
- ⏳ Loop generation algorithms (spiral/meander)
- ⏳ Technical calculations
- ⏳ PDF export

---

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────────┐
│                   Browser                           │
│                                                     │
│  React Frontend (http://VPS/heating)               │
│  - Login/Register                                  │
│  - Projects list                                   │
│  - Canvas drawing (TODO)                           │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP/JSON
                  │ JWT Auth
┌─────────────────▼───────────────────────────────────┐
│            Express Backend API                      │
│          (http://VPS:3001/api)                     │
│                                                     │
│  /api/auth/*     - Login, Register                 │
│  /api/projects/* - CRUD projects                   │
│  /api/projects/:id/drawing - Save canvas           │
│  /api/projects/:id/floorplan - Upload JPG          │
└─────────────────┬───────────────────────────────────┘
                  │ SQL Queries
┌─────────────────▼───────────────────────────────────┐
│            PostgreSQL Database                      │
│                                                     │
│  - users        - User accounts                    │
│  - projects     - User projects                    │
│  - floor_plans  - Uploaded images                  │
│  - drawings     - Canvas data (JSON)               │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Development (lokalne):

**Terminal 1 - Backend:**
```bash
cd server
npm install
cp .env.example .env
nano .env  # ustaw DB_PASSWORD, JWT_SECRET

# Setup PostgreSQL locally
sudo -u postgres psql
CREATE DATABASE floor_heating;
CREATE USER floor_heating_user WITH PASSWORD 'dev123';
GRANT ALL PRIVILEGES ON DATABASE floor_heating TO floor_heating_user;
\q

# Init schema
sudo -u postgres psql -d floor_heating -f database/schema.sql

# Start dev server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm install
cp .env.example .env
# .env już ustawiony na http://localhost:3001/api

npm run dev
```

Otwórz: http://localhost:5173

---

### Production (VPS):

```bash
./install-full-stack.sh
```

Następnie skonfiguruj PostgreSQL na VPS (patrz: `FULLSTACK-DEPLOYMENT.md`).

---

## 📁 Struktura

```
floor-heating-app/
├── src/                        # Frontend React
│   ├── components/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── MainApp.tsx         # Main UI after login
│   ├── context/
│   │   └── AuthContext.tsx     # Auth state management
│   ├── lib/
│   │   └── api.ts              # API client (axios)
│   ├── App.tsx                 # Router
│   └── main.tsx
│
├── server/                     # Backend API
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts     # PostgreSQL pool
│   │   ├── controllers/        # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── projectController.ts
│   │   │   └── uploadController.ts
│   │   ├── middleware/
│   │   │   └── auth.ts         # JWT verification
│   │   ├── models/             # Database models
│   │   │   ├── User.ts
│   │   │   ├── Project.ts
│   │   │   ├── Drawing.ts
│   │   │   └── FloorPlan.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   └── projectRoutes.ts
│   │   └── index.ts            # Express app
│   │
│   ├── database/
│   │   └── schema.sql          # PostgreSQL schema
│   ├── uploads/                # Uploaded JPG files
│   └── .env                    # Config (git-ignored)
│
├── FULLSTACK-DEPLOYMENT.md     # Complete deployment guide
├── install-full-stack.sh       # Auto-deploy script
└── README-FULLSTACK.md         # This file
```

---

## 🛠️ Tech Stack

### Frontend:
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **Axios** - HTTP client
- **Fabric.js** (TODO) - Canvas manipulation

### Backend:
- **Node.js 20** + **Express 4**
- **TypeScript**
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File uploads

### DevOps:
- **Nginx** - Frontend serving + reverse proxy
- **systemd** - Backend process management
- **sshpass** - Automated deployment

---

## 📚 Dokumentacja

| Plik | Opis |
|------|------|
| `FULLSTACK-DEPLOYMENT.md` | Kompletny przewodnik wdrożenia |
| `server/README.md` | Dokumentacja backendu |
| `INSTALL-README.md` | Instrukcja skryptu instalacji |
| `research-notes.md` | Research techniczny (normy, parametry) |
| `ui-mockups.md` | Mockupy interfejsu |

---

## 🌐 URLs (po deployment)

| Service | URL | Opis |
|---------|-----|------|
| Frontend | http://8.209.82.14/heating | React SPA |
| Backend API | http://8.209.82.14:3001/api | RESTful API |
| Health | http://8.209.82.14:3001/health | Backend status |

---

## 🔐 API Endpoints

### Public:
```
POST /api/auth/register  - Rejestracja
POST /api/auth/login     - Logowanie
```

### Protected (wymaga JWT):
```
GET  /api/auth/profile                    - Profil użytkownika
GET  /api/projects                        - Lista projektów
POST /api/projects                        - Nowy projekt
GET  /api/projects/:id                    - Szczegóły projektu
PUT  /api/projects/:id                    - Aktualizacja projektu
DELETE /api/projects/:id                  - Usuń projekt
POST /api/projects/:id/drawing            - Zapisz canvas data
POST /api/projects/:id/floorplan          - Upload JPG
DELETE /api/projects/:id/floorplan        - Usuń JPG
```

---

## 🧪 Testing

### Backend:

```bash
cd server

# Health check
curl http://localhost:3001/health

# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Projects (z tokenem)
TOKEN="<your_jwt_token>"
curl http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend:

1. Otwórz http://localhost:5173
2. Kliknij "Zarejestruj się"
3. Wypełnij formularz
4. Po zalogowaniu powinieneś zobaczyć główny interfejs

---

## 🔄 Workflow Development

### Typowy flow pracy:

1. **Zmiana w backendzie:**
   ```bash
   cd server
   # edytuj pliki w src/
   npm run dev  # hot-reload działa
   ```

2. **Zmiana we frontendzie:**
   ```bash
   # edytuj pliki w src/
   # Vite hot-reload automatyczny
   ```

3. **Deploy na VPS:**
   ```bash
   ./install-full-stack.sh
   ```

---

## 🎨 Następne kroki (v2.1)

### Priorytet 1 - Canvas Drawing:

1. Integracja Fabric.js
2. Import JPG jako tło canvas
3. Narzędzia do rysowania konturów pomieszczenia
4. Zoom, pan, undo/redo

### Priorytet 2 - Loop Generation:

1. Algorytm spirali (ślimak)
2. Algorytm meandra (wężyk)
3. Uwzględnienie stref wykluczenia
4. Obliczenia długości pętli
5. Walidacja max długości

### Priorytet 3 - Advanced Features:

1. Multi-circuit rooms
2. Edge zones (10cm spacing near windows)
3. Manifold placement
4. PDF export z rysunkiem
5. Eksport listy materiałów

---

## 💾 Database Schema

```sql
users (
  id, email, password_hash, name, created_at
)

projects (
  id, user_id, name, description, created_at, updated_at
)

floor_plans (
  id, project_id, image_path, original_name, width, height
)

drawings (
  id, project_id, canvas_data JSONB, parameters JSONB, loops_data JSONB
)
```

---

## 🐛 Known Issues

- ⚠️ Node.js version warning (20.18.1 vs 20.19+ required) - ignoruj, działa
- ⚠️ Multer deprecated - update do v2 w przyszłości

---

## 📄 License

Projekt prywatny.

---

## 👤 Author

Stworzony z pomocą Claude Code.

**Data:** 2025-10-08
**Wersja:** 2.0 (Full Stack)

---

## 📞 Support

Issues? Zobacz:
1. `FULLSTACK-DEPLOYMENT.md` - Troubleshooting section
2. Backend logs: `journalctl -u heating-backend -f`
3. Nginx logs: `tail -f /var/log/nginx/error.log`
