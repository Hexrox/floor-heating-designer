# Floor Heating Designer - Backend

Backend API dla aplikacji Floor Heating Designer.

## Stack

- **Node.js** + **TypeScript**
- **Express** - Web framework
- **PostgreSQL** - Baza danych
- **JWT** - Autentykacja
- **Multer** - Upload plików
- **bcrypt** - Hashowanie haseł

## Setup

### 1. Zainstaluj PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Utwórz bazę danych

```bash
# Login jako postgres user
sudo -u postgres psql

# W PostgreSQL shell:
CREATE DATABASE floor_heating;
CREATE USER floor_heating_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE floor_heating TO floor_heating_user;
\q
```

### 3. Zainicjalizuj schemat bazy

```bash
# Z katalogu server/
sudo -u postgres psql -d floor_heating -f database/schema.sql
```

### 4. Konfiguracja

Skopiuj i edytuj `.env`:

```bash
cp .env.example .env
nano .env
```

Ustaw:
```
DB_PASSWORD=your_password
JWT_SECRET=your_random_secret_key
```

### 5. Uruchom serwer

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## API Endpoints

### Auth

- `POST /api/auth/register` - Rejestracja użytkownika
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "Jan Kowalski"
  }
  ```

- `POST /api/auth/login` - Logowanie
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `GET /api/auth/profile` - Profil użytkownika (wymaga tokenu)

### Projects (wszystkie wymagają tokenu)

- `POST /api/projects` - Utwórz projekt
- `GET /api/projects` - Lista projektów użytkownika
- `GET /api/projects/:id` - Szczegóły projektu
- `PUT /api/projects/:id` - Aktualizuj projekt
- `DELETE /api/projects/:id` - Usuń projekt

### Drawing & Floor Plan

- `POST /api/projects/:id/drawing` - Zapisz dane rysunku (canvas)
- `POST /api/projects/:id/floorplan` - Upload planu piętra (JPG/PNG)
- `DELETE /api/projects/:id/floorplan` - Usuń plan piętra

## Autentykacja

Wszystkie chronione endpointy wymagają JWT tokenu w headerze:

```
Authorization: Bearer <token>
```

Token otrzymujesz po zalogowaniu/rejestracji i jest ważny 7 dni.

## Struktura

```
server/
├── src/
│   ├── config/         # Database connection
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Auth middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   └── index.ts        # Entry point
├── database/
│   └── schema.sql      # Database schema
├── uploads/            # Uploaded floor plans
└── .env               # Configuration
```

## Testing

```bash
# Health check
curl http://localhost:3001/health

# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## VPS Deployment

Zobacz: `../BACKEND-DEPLOYMENT.md`
