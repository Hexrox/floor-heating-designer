# 🏠 Floor Heating Designer v3.0

**Profesjonalna aplikacja CAD do projektowania instalacji ogrzewania podłogowego**

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Version](https://img.shields.io/badge/version-3.0-blue)
![Build](https://img.shields.io/badge/build-passing-success)

---

## 🚀 Quick Start - Instalacja na VPS

### Automatyczna instalacja (1 komenda!):

```bash
cd /home/hexan/claude/heating/floor-heating-app
./auto-install.sh
```

**🔑 Zostaniesz poproszony o hasło SSH** do `root@8.209.82.14` - **TYLKO RAZ!**

**Gotowe!** Aplikacja będzie dostępna na: **http://8.209.82.14**

Skrypt automatycznie:
- ✅ **Wyczyści CAŁY VPS** (katalogi, Nginx, usługi, bazy danych)
- ✅ Zbuduje aplikację
- ✅ Zainstaluje Nginx
- ✅ Skonfiguruje wszystko
- ✅ Wdroży na VPS: `root@8.209.82.14`

---

## ✨ Funkcje Aplikacji

### 🏗️ Projektowanie Rzutu
- ✅ Profesjonalna siatka 50cm × 50cm
- ✅ Rysowanie ścian z snap-to-grid
- ✅ Automatyczne wymiarowanie
- ✅ Drzwi i okna z auto-snap

### 🏠 Inteligentna Detekcja
- ✅ Automatyczna detekcja pomieszczeń (flood-fill)
- ✅ Obliczanie powierzchni
- ✅ Kolorowe wypełnienie

### 🔥 Generacja Pętli Grzewczych
- ✅ Algorytm **Reverse Return Spiral** 🌀
- ✅ Algorytm **Meander** (serpentine) 〰️
- ✅ Konfigurowalne parametry (rozstaw, średnica, strefa brzegowa)
- ✅ Automatyczne obliczanie długości rur
- ✅ Routing do/z rozdzielacza

### 📄 Profesjonalny Export PDF
- ✅ Wielostronicowy raport
- ✅ Wysokiej jakości wizualizacja
- ✅ Szczegóły pomieszczeń
- ✅ Zestawienie materiałów
- ✅ Parametry systemu

### ⌨️ Skróty Klawiszowe (CAD-like)
- `W` - Ściana | `D` - Drzwi | `O` - Okno
- `R` - Pokój | `M` - Rozdzielacz | `Esc` - Anuluj
- `Ctrl+G` - Generuj pętle | `Ctrl+E` - Export PDF

### 🛡️ Zabezpieczenia
- ✅ Confirmation dialogs dla operacji destruktywnych
- ✅ Inteligentne wyłączanie skrótów podczas pisania

---

## 📋 Wymagania

- Node.js 20.18+
- npm
- **Hasło SSH** do VPS (root@8.209.82.14)
- sshpass (instalowane automatycznie przez skrypt)
- rsync (zwykle jest domyślnie w Ubuntu)

---

## 🔧 Komendy

### Instalacja na VPS:
```bash
./auto-install.sh                 # Pełna instalacja (z czyszczeniem)
./auto-install.sh --clean-only    # Tylko czyszczenie starych wersji
```

### Development lokalny:
```bash
npm install          # Instalacja zależności
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview buildu lokalnie
```

### Update na VPS (po zmianach):
```bash
npm run build
./auto-install.sh
```

---

## 📊 Statystyki Projektu

| Metryka | Wartość |
|---------|---------|
| **Wersja** | 3.0 (FINAL) |
| **Status** | Production Ready ✅ |
| **Rozmiar buildu** | 971 KB |
| **Linie kodu** | ~2,000 |
| **Fazy implementacji** | 6/6 ukończone |
| **Stack** | React 19 + TypeScript + Vite |

---

## 🗂️ Struktura Projektu

```
floor-heating-app/
├── 🚀 auto-install.sh              ⭐ GŁÓWNY SKRYPT (użyj tego!)
├── 📄 README.md                     Ten plik
├── ⚡ QUICK_START.md                 Quick reference
├── 📖 DEPLOY_VPS_UBUNTU.md          Kompletny deployment guide
├── 📋 IMPLEMENTATION_PROGRESS.md    Dokumentacja techniczna (6 faz)
├── 🎯 FINAL_SUMMARY.md              Executive summary
│
├── src/
│   ├── components/
│   │   └── FloorPlanEditor.tsx     Główny komponent (~1,700 linii)
│   ├── utils/
│   │   ├── gridUtils.ts            Konwersje współrzędnych
│   │   ├── roomDetection.ts        Algorytm flood-fill
│   │   └── loopGeneration.ts       Algorytmy pętli (Spiral/Meander)
│   └── App.tsx
│
├── dist/                            Production build
├── package.json
└── vite.config.ts
```

---

## 🎓 Algorytmy

### Reverse Return Spiral
Pętla spiralna rozpoczynająca się od brzegu pomieszczenia, przechodząca do środka, a następnie powracająca równolegle ścieżką zwrotną.

### Meander (Serpentine)
Wzór serpentynowy z poziomymi liniami, gdzie kierunek zmienia się w każdym rzędzie.

### Flood-Fill Room Detection
Inteligentny algorytm wykrywający zamknięte obszary (pomieszczenia) poprzez flood-fill z detekcją granic.

### Point-in-Polygon (Ray Casting)
Sprawdza czy punkt znajduje się wewnątrz wielokąta poprzez rzutowanie promienia i liczenie przecięć.

---

## 📚 Dokumentacja

| Plik | Opis |
|------|------|
| **QUICK_START.md** | Szybki start - podstawowe komendy |
| **DEPLOY_VPS_UBUNTU.md** | Kompletny deployment manual (450+ linii) |
| **IMPLEMENTATION_PROGRESS.md** | Szczegóły wszystkich 6 faz implementacji |
| **FINAL_SUMMARY.md** | Podsumowanie projektu + statystyki |
| **README_DEPLOYMENT.md** | Step-by-step deployment guide |

---

## 🐛 Troubleshooting

### Problem: SSH connection refused
```bash
# Sprawdź połączenie
ping 8.209.82.14

# Test połączenia SSH z hasłem
ssh -o PreferredAuthentications=password root@8.209.82.14
```

### Problem: SSH pyta o klucz zamiast hasła
Skrypt używa autentykacji hasłem. Jeśli nadal pyta o klucz:
```bash
# Sprawdź czy autentykacja hasłem jest włączona na serwerze
ssh root@8.209.82.14
# W pliku /etc/ssh/sshd_config sprawdź:
# PasswordAuthentication yes
```

### Problem: Aplikacja nie działa po deploy
```bash
# Sprawdź logi Nginx
ssh root@8.209.82.14
tail -f /var/log/nginx/floor-heating-error.log

# Restart Nginx
systemctl restart nginx
```

### Problem: Stare wersje kolidują
```bash
# Uruchom samo czyszczenie
./auto-install.sh --clean-only
```

Więcej w sekcji Troubleshooting w **QUICK_START.md**

---

## 🔒 SSL (Opcjonalnie)

```bash
ssh root@8.209.82.14
apt install certbot python3-certbot-nginx -y
certbot --nginx -d twoja-domena.com
```

---

## 🎯 Roadmap v4.0 (Future)

- [ ] Undo/Redo system
- [ ] Zoom & Pan na canvas
- [ ] Zapisywanie projektów (localStorage/backend)
- [ ] Edycja ścian (przesuwanie końców)
- [ ] Copy/Paste elementów
- [ ] Export do DWG/DXF (AutoCAD)
- [ ] Kalkulacje hydrauliczne (przepływ, pompy)
- [ ] Multi-user collaboration
- [ ] Mobile support (responsive)

---

## 🏆 Status Faz

| Faza | Nazwa | Status | LOC |
|------|-------|--------|-----|
| 1 | Grid Canvas & Walls | ✅ COMPLETE | ~600 |
| 2 | Room Detection | ✅ COMPLETE | 175 |
| 3 | Doors & Windows | ✅ COMPLETE | ~300 |
| 4 | Loop Generation | ✅ COMPLETE | 267 |
| 5 | PDF Export | ✅ COMPLETE | ~200 |
| 6 | Polish Features | ✅ COMPLETE | ~150 |

**ŁĄCZNIE: 6/6 faz ukończone** 🎉

---

## 📦 Stack Technologiczny

- **React 19.1.1** - UI Framework
- **TypeScript 5.9.3** - Type safety
- **Vite 7.1.7** - Build tool
- **Tailwind CSS 4.1.14** - Styling
- **Fabric.js 6.7.1** - Canvas manipulation
- **jsPDF 3.0.3** - PDF generation
- **Zustand 5.0.8** - State management

---

## 📝 Historia Wersji

### v3.0 (2025-10-09) - Floor Plan Editor 🎉
- ✅ Grid Canvas & Walls (snap-to-grid, automatic dimensions)
- ✅ Room Detection (auto flood-fill algorithm)
- ✅ Doors & Windows (auto-snap to walls)
- ✅ Loop Generation (Spiral + Meander algorithms)
- ✅ PDF Export (professional multi-page report)
- ✅ Keyboard Shortcuts (W/D/O/R/M/Esc/Ctrl+G/Ctrl+E)
- ✅ Confirmation Dialogs
- ✅ Complete documentation (6 phases)
- ✅ **Production Ready!**

### v2.0 (2025-10-08) - Full Stack (deprecated)
- Backend API + PostgreSQL
- User authentication
- Project management

### v1.0 (2025-10-07) - Initial Mockup
- UI design prototype

---

## 🎉 Quick Links

- 🚀 **[QUICK_START.md](QUICK_START.md)** - Instalacja w 1 komendzie
- 📖 **[DEPLOY_VPS_UBUNTU.md](DEPLOY_VPS_UBUNTU.md)** - Kompletny deployment guide
- 📋 **[IMPLEMENTATION_PROGRESS.md](IMPLEMENTATION_PROGRESS.md)** - Dokumentacja techniczna
- 🎯 **[FINAL_SUMMARY.md](FINAL_SUMMARY.md)** - Executive summary

---

**Status: 🚀 PRODUCTION READY**

Gotowy do wdrożenia na VPS: `root@8.209.82.14`

```bash
./auto-install.sh
```

**Enjoy!** 🏠🔥
