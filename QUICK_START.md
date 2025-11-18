# 🚀 Floor Heating Designer v3.0 - QUICK START

## Instalacja na VPS w 1 komendzie!

### Automatyczna instalacja (ZALECANE):

```bash
cd /home/hexan/claude/heating/floor-heating-app
./auto-install.sh
```

**🔑 Zostaniesz poproszony o hasło SSH do `root@8.209.82.14` - TYLKO RAZ na początku!**

**To wszystko!** Skrypt automatycznie:
- ✅ **Wyczyści stare wersje** (jeśli istnieją)
- ✅ Zbuduje aplikację
- ✅ Zainstaluje Nginx na VPS (jeśli potrzeba)
- ✅ Przesle pliki
- ✅ Skonfiguruje wszystko
- ✅ Uruchomi aplikację

### Tylko czyszczenie (bez instalacji):

```bash
./auto-install.sh --clean-only
# lub
./auto-install.sh -c
```

**Usuwa z VPS:**
- 🗑️ **WSZYSTKIE katalogi** w `/var/www/` (oprócz html)
- 🗑️ **WSZYSTKIE konfiguracje** Nginx (oprócz default)
- 🗑️ **WSZYSTKIE usługi** systemd (heating, backend, app, itp.)
- 🗄️ **Bazy danych** PostgreSQL (heating, floor, itp.) - z potwierdzeniem
- 🔌 Zwalnia zajęte porty (np. 3001)

**Po instalacji aplikacja będzie dostępna na:**
```
http://8.209.82.14
```

---

## Co robi skrypt auto-install.sh?

### Krok 0: Czyszczenie VPS (NEW! - KOMPLETNE)
- 🔍 Skanuje **CAŁY VPS** w poszukiwaniu projektów
- 📁 Znajduje **WSZYSTKIE katalogi** w `/var/www/` (oprócz html)
- ⚙️ Znajduje **WSZYSTKIE konfiguracje** Nginx (oprócz default)
- 🔧 Znajduje **WSZYSTKIE usługi** systemd (heating, backend, app, node, itp.)
- 🗄️ Znajduje **bazy danych** PostgreSQL (heating, floor)
- ⚠️ **Pyta o potwierdzenie** przed każdym usunięciem
- 📋 Pokazuje dokładnie co zostanie usunięte
- 🗑️ Usuwa wszystko w bezpiecznej kolejności:
  1. Zatrzymuje i usuwa usługi systemd
  2. Usuwa katalogi aplikacji
  3. Wyłącza i usuwa konfiguracje Nginx
  4. Usuwa bazy danych PostgreSQL (z osobnym potwierdzeniem)
- ✅ Przeładowuje Nginx
- 🧹 Sprawdza porty i logi

### Krok 1: Build lokalnie
- `npm install`
- `npm run build`

### Krok 2: Test SSH
- Sprawdza połączenie z VPS

### Krok 3: Instalacja Nginx
- Instaluje Nginx (jeśli nie ma)
- Uruchamia i włącza autostart

### Krok 4: Przygotowanie
- Tworzy katalog `/var/www/floor-heating-app`

### Krok 5: Transfer
- Przesyła pliki przez rsync
- Ustawia uprawnienia (www-data)

### Krok 6: Konfiguracja Nginx
- Tworzy `/etc/nginx/sites-available/floor-heating-app`
- Aktywuje konfigurację
- Testuje config (`nginx -t`)

### Krok 7: Uruchomienie
- Przeładowuje Nginx
- Konfiguruje firewall
- Sprawdza status

---

## Update aplikacji (po zmianach):

```bash
cd /home/hexan/claude/heating/floor-heating-app
npm run build
./auto-install.sh
```

Skrypt zaktualizuje tylko pliki aplikacji (Nginx już skonfigurowany).

---

## Troubleshooting

### Problem: "Permission denied" przy SSH

Skrypt używa autentykacji **hasłem**. Sprawdź:

```bash
# Test połączenia z hasłem
ssh -o PreferredAuthentications=password root@8.209.82.14

# Jeśli nadal błąd - sprawdź czy autentykacja hasłem jest włączona
# Na VPS w pliku /etc/ssh/sshd_config powinno być:
# PasswordAuthentication yes
```

### Problem: Skrypt zatrzymuje się na SSH / pyta o klucz

Skrypt wymusza autentykację hasłem. Jeśli pyta o klucz:

1. Sprawdź czy VPS jest włączony: `ping 8.209.82.14`
2. Sprawdź hasło: `ssh -o PreferredAuthentications=password root@8.209.82.14`
3. Upewnij się że autentykacja hasłem jest włączona na serwerze

### Problem: Aplikacja nie działa po instalacji

```bash
# Sprawdź logi
ssh root@8.209.82.14
tail -f /var/log/nginx/floor-heating-error.log

# Sprawdź status Nginx
systemctl status nginx

# Restart Nginx
systemctl restart nginx
```

---

## Konfiguracja SSL (opcjonalnie):

```bash
ssh root@8.209.82.14

# Zainstaluj certbot
apt install certbot python3-certbot-nginx -y

# Dla domeny (zmień na swoją)
certbot --nginx -d twoja-domena.com

# Dla IP (nie działa z Let's Encrypt)
# Musisz użyć self-signed certificate lub kupić certyfikat
```

---

## Ręczna instalacja (jeśli skrypt nie działa):

Zobacz szczegóły w:
- **DEPLOY_VPS_UBUNTU.md** - Kompletny manual
- **README_DEPLOYMENT.md** - Krok po kroku

---

## Struktura plików:

```
floor-heating-app/
├── auto-install.sh              ⭐ GŁÓWNY SKRYPT (użyj tego!)
├── deploy.sh                     Alternatywny skrypt (bez auto-config)
├── nginx-config-example.conf     Gotowy config Nginx
├── QUICK_START.md               Ten plik
├── README_DEPLOYMENT.md         Quick guide
├── DEPLOY_VPS_UBUNTU.md         Kompletny manual
├── FINAL_SUMMARY.md             Podsumowanie projektu
└── IMPLEMENTATION_PROGRESS.md   Dokumentacja techniczna
```

---

## Konfiguracja w skrypcie:

Jeśli chcesz zmienić ustawienia, edytuj `auto-install.sh`:

```bash
nano auto-install.sh

# Zmień:
VPS_USER="root"                          # User SSH
VPS_IP="8.209.82.14"                     # IP VPS
VPS_PATH="/var/www/floor-heating-app"   # Ścieżka na serwerze
DOMAIN="8.209.82.14"                     # Domena (lub IP)
```

---

## Status projektu:

✅ **Floor Heating Designer v3.0**
✅ **PRODUCTION READY**
✅ **Wszystkie 6 faz ukończone**
✅ **Build: 971 KB (sukces)**

### Funkcje:
- ✅ Grid Canvas & Walls
- ✅ Room Detection (auto)
- ✅ Doors & Windows
- ✅ Loop Generation (Spiral/Meander)
- ✅ PDF Export (professional report)
- ✅ Keyboard Shortcuts (W/D/O/R/M/Esc/Ctrl+G/Ctrl+E)
- ✅ Confirmation Dialogs

---

## Gotowe! 🎉

Po uruchomieniu `./auto-install.sh` aplikacja będzie live na:

**http://8.209.82.14**

Enjoy! 🚀
