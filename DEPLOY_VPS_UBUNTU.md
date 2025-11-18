# Floor Heating Designer v3.0 - Deployment na VPS Ubuntu

## 🚀 Deployment na Ubuntu VPS z Nginx

### Wymagania
- Ubuntu Server (20.04 LTS lub nowszy)
- Nginx
- Certbot (dla SSL)
- Dostęp SSH do serwera
- Domena wskazująca na IP serwera (opcjonalnie)

---

## Krok 1: Przygotowanie Serwera

### Połącz się z VPS

```bash
ssh user@your-vps-ip
```

### Zainstaluj Nginx (jeśli nie masz)

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Sprawdź status Nginx

```bash
sudo systemctl status nginx
```

---

## Krok 2: Transfer Build na Serwer

### Opcja A: SCP (z lokalnego komputera)

```bash
# Z katalogu projektu na lokalnym komputerze
cd /home/hexan/claude/heating/floor-heating-app

# Spakuj dist
tar -czf floor-heating-build.tar.gz dist/

# Skopiuj na serwer
scp floor-heating-build.tar.gz user@your-vps-ip:/tmp/
```

### Opcja B: Git (jeśli projekt w repo)

```bash
# Na serwerze
cd /var/www
sudo git clone https://github.com/yourusername/floor-heating-app.git
cd floor-heating-app

# Zainstaluj Node.js jeśli potrzeba zbudować
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Build na serwerze
npm install
npm run build
```

### Opcja C: rsync (Zalecane dla updates)

```bash
# Z lokalnego komputera
cd /home/hexan/claude/heating/floor-heating-app
rsync -avz --delete dist/ user@your-vps-ip:/var/www/floor-heating-app/
```

---

## Krok 3: Utwórz katalog na serwerze

```bash
# Na serwerze VPS
sudo mkdir -p /var/www/floor-heating-app

# Rozpakuj build (jeśli używałeś SCP)
cd /var/www/floor-heating-app
sudo tar -xzf /tmp/floor-heating-build.tar.gz --strip-components=1

# Ustaw uprawnienia
sudo chown -R www-data:www-data /var/www/floor-heating-app
sudo chmod -R 755 /var/www/floor-heating-app
```

---

## Krok 4: Konfiguracja Nginx

### Utwórz plik konfiguracyjny

```bash
sudo nano /etc/nginx/sites-available/floor-heating-app
```

### Konfiguracja HTTP (bez SSL)

Wklej poniższą konfigurację:

```nginx
server {
    listen 80;
    listen [::]:80;

    # Zmień na swoją domenę lub IP
    server_name your-domain.com www.your-domain.com;
    # Lub dla IP:
    # server_name 123.123.123.123;

    root /var/www/floor-heating-app;
    index index.html;

    # Logs
    access_log /var/log/nginx/floor-heating-access.log;
    error_log /var/log/nginx/floor-heating-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # SPA routing - wszystko przekieruj do index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Aktywuj konfigurację

```bash
# Utwórz symlink
sudo ln -s /etc/nginx/sites-available/floor-heating-app /etc/nginx/sites-enabled/

# Usuń domyślną konfigurację (opcjonalnie)
sudo rm /etc/nginx/sites-enabled/default

# Test konfiguracji
sudo nginx -t

# Jeśli OK, przeładuj Nginx
sudo systemctl reload nginx
```

---

## Krok 5: SSL z Let's Encrypt (Zalecane)

### Zainstaluj Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Uzyskaj certyfikat SSL

```bash
# Dla domeny
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot automatycznie zmodyfikuje konfigurację Nginx
```

### Test automatycznego odnowienia

```bash
sudo certbot renew --dry-run
```

### Po SSL, Nginx config będzie wyglądał tak:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name your-domain.com www.your-domain.com;

    root /var/www/floor-heating-app;
    index index.html;

    # SSL certificates (dodane przez Certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Logs
    access_log /var/log/nginx/floor-heating-access.log;
    error_log /var/log/nginx/floor-heating-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Krok 6: Firewall (UFW)

### Skonfiguruj firewall

```bash
# Sprawdź status
sudo ufw status

# Jeśli nieaktywny, włącz podstawowe reguły
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Sprawdź
sudo ufw status
```

---

## Krok 7: Weryfikacja

### Test lokalny na serwerze

```bash
curl http://localhost
# Powinien zwrócić HTML
```

### Test z przeglądarki

```
# Bez SSL:
http://your-domain.com
# lub
http://your-vps-ip

# Z SSL:
https://your-domain.com
```

### Sprawdź logi w razie problemów

```bash
# Nginx error log
sudo tail -f /var/log/nginx/floor-heating-error.log

# Nginx access log
sudo tail -f /var/log/nginx/floor-heating-access.log
```

---

## Skrypt Automatycznego Deploymentu

### Utwórz skrypt deploy.sh na lokalnym komputerze

```bash
nano deploy.sh
```

Wklej:

```bash
#!/bin/bash

# Konfiguracja
VPS_USER="user"
VPS_IP="your-vps-ip"
VPS_PATH="/var/www/floor-heating-app"
LOCAL_BUILD_PATH="/home/hexan/claude/heating/floor-heating-app/dist"

echo "🚀 Floor Heating Designer - Deployment Script"
echo "=============================================="

# Sprawdź czy dist/ istnieje
if [ ! -d "$LOCAL_BUILD_PATH" ]; then
    echo "❌ Błąd: Katalog dist/ nie istnieje!"
    echo "Najpierw uruchom: npm run build"
    exit 1
fi

echo "📦 Build found: $LOCAL_BUILD_PATH"

# Pytaj o potwierdzenie
read -p "🔄 Czy chcesz wdrożyć aplikację na $VPS_IP? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment anulowany"
    exit 1
fi

echo "📤 Przesyłanie plików na serwer..."

# rsync z progress bar
rsync -avz --delete --progress \
    -e "ssh" \
    "$LOCAL_BUILD_PATH/" \
    "$VPS_USER@$VPS_IP:$VPS_PATH/"

if [ $? -eq 0 ]; then
    echo "✅ Pliki przesłane pomyślnie!"

    # Ustaw uprawnienia na serwerze
    echo "🔒 Ustawianie uprawnień..."
    ssh "$VPS_USER@$VPS_IP" "sudo chown -R www-data:www-data $VPS_PATH && sudo chmod -R 755 $VPS_PATH"

    # Przeładuj Nginx
    echo "🔄 Przeładowanie Nginx..."
    ssh "$VPS_USER@$VPS_IP" "sudo systemctl reload nginx"

    echo "=============================================="
    echo "✅ Deployment zakończony pomyślnie!"
    echo "🌐 Aplikacja dostępna na: http://$VPS_IP"
    echo "=============================================="
else
    echo "❌ Błąd podczas przesyłania plików!"
    exit 1
fi
```

### Nadaj uprawnienia wykonywania

```bash
chmod +x deploy.sh
```

### Użycie

```bash
# Z katalogu projektu
./deploy.sh
```

---

## Update Aplikacji (po zmianach)

### Szybki update

```bash
# 1. Lokalnie - rebuild
cd /home/hexan/claude/heating/floor-heating-app
npm run build

# 2. Deploy skryptem
./deploy.sh

# Lub ręcznie rsync
rsync -avz --delete dist/ user@your-vps-ip:/var/www/floor-heating-app/

# 3. Na serwerze - przeładuj Nginx (jeśli potrzeba)
ssh user@your-vps-ip "sudo systemctl reload nginx"
```

---

## Monitoring i Diagnostyka

### Sprawdź status usług

```bash
# Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Reload config (bez downtime)
sudo systemctl reload nginx
```

### Sprawdź logi

```bash
# Ostatnie błędy
sudo tail -n 50 /var/log/nginx/floor-heating-error.log

# Live monitoring
sudo tail -f /var/log/nginx/floor-heating-access.log

# Nginx error log (system)
sudo tail -f /var/log/nginx/error.log
```

### Test Nginx config

```bash
# Sprawdź składnię
sudo nginx -t

# Pokaż aktualną konfigurację
sudo nginx -T
```

### Sprawdź wykorzystanie zasobów

```bash
# Dysk
df -h

# RAM
free -h

# Procesy Nginx
ps aux | grep nginx
```

---

## Troubleshooting

### Problem: 403 Forbidden

```bash
# Sprawdź uprawnienia
ls -la /var/www/floor-heating-app

# Napraw uprawnienia
sudo chown -R www-data:www-data /var/www/floor-heating-app
sudo chmod -R 755 /var/www/floor-heating-app
```

### Problem: 404 Not Found (dla routes)

```bash
# Upewnij się że w Nginx jest:
location / {
    try_files $uri $uri/ /index.html;
}

# Test i reload
sudo nginx -t
sudo systemctl reload nginx
```

### Problem: Nginx nie startuje

```bash
# Sprawdź logi
sudo journalctl -u nginx -n 50

# Sprawdź config
sudo nginx -t

# Sprawdź czy port 80/443 jest zajęty
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

### Problem: Długie czasy ładowania

```bash
# Sprawdź czy gzip jest włączone
curl -H "Accept-Encoding: gzip" -I http://your-domain.com

# Sprawdź cache headers
curl -I http://your-domain.com/assets/index-xxx.js
```

---

## Backup

### Backup bieżącej wersji przed update

```bash
# Na serwerze
sudo tar -czf /var/backups/floor-heating-app-$(date +%Y%m%d-%H%M%S).tar.gz \
    /var/www/floor-heating-app

# Lista backupów
ls -lh /var/backups/floor-heating-app-*

# Restore z backupu
sudo tar -xzf /var/backups/floor-heating-app-20251009-120000.tar.gz -C /
```

### Automatyczny backup (cron)

```bash
# Edytuj crontab
sudo crontab -e

# Dodaj (backup codziennie o 3:00)
0 3 * * * tar -czf /var/backups/floor-heating-app-$(date +\%Y\%m\%d).tar.gz /var/www/floor-heating-app

# Usuń stare backupy (starsze niż 7 dni)
0 4 * * * find /var/backups/floor-heating-app-* -mtime +7 -delete
```

---

## Performance Optimization

### Włącz Brotli compression (opcjonalnie, zamiast gzip)

```bash
# Zainstaluj moduł
sudo apt install nginx-module-brotli

# W nginx.conf dodaj
load_module modules/ngx_http_brotli_filter_module.so;
load_module modules/ngx_http_brotli_static_module.so;

# W server block
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### HTTP/2 (już włączone w SSL config)

```nginx
listen 443 ssl http2;
```

### Cache w przeglądarce (już skonfigurowane)

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## Checklist Deploymentu

### Przed Deploymentem
- [ ] Lokalny build zakończony sukcesem (`npm run build`)
- [ ] Sprawdzone lokalnie (`npm run preview`)
- [ ] Backup obecnej wersji na serwerze
- [ ] Dostęp SSH do VPS działa

### Deployment
- [ ] Nginx zainstalowany i uruchomiony
- [ ] Pliki przesłane na serwer (rsync/scp)
- [ ] Uprawnienia ustawione (www-data:www-data)
- [ ] Konfiguracja Nginx utworzona
- [ ] Nginx config test OK (`sudo nginx -t`)
- [ ] Nginx przeładowany (`sudo systemctl reload nginx`)
- [ ] Firewall skonfigurowany (porty 80/443 otwarte)

### Po Deploymencie
- [ ] Aplikacja dostępna w przeglądarce
- [ ] SSL działa (jeśli skonfigurowane)
- [ ] Routing działa (test navigation w SPA)
- [ ] Static assets ładują się (check Network tab)
- [ ] Brak błędów w console
- [ ] Brak błędów w Nginx logs
- [ ] PDF export działa
- [ ] Wszystkie funkcje działają

### Opcjonalnie
- [ ] SSL certyfikat (Let's Encrypt)
- [ ] Monitoring (logi, status)
- [ ] Backup strategy
- [ ] Update script (deploy.sh)
- [ ] CDN (Cloudflare) dla performance

---

## Quick Reference

### Najczęstsze komendy

```bash
# Deploy (z lokalnego komputera)
./deploy.sh

# Restart Nginx (na serwerze)
sudo systemctl restart nginx

# Sprawdź logi (na serwerze)
sudo tail -f /var/log/nginx/floor-heating-error.log

# Backup (na serwerze)
sudo tar -czf /var/backups/floor-heating-backup.tar.gz /var/www/floor-heating-app

# Test config (na serwerze)
sudo nginx -t
```

---

## Gotowe! 🎉

Aplikacja Floor Heating Designer v3.0 jest teraz wdrożona na Twoim VPS Ubuntu!

**Dostęp:**
- HTTP: `http://your-vps-ip` lub `http://your-domain.com`
- HTTPS: `https://your-domain.com` (po skonfigurowaniu SSL)

**Lokalizacja na serwerze:** `/var/www/floor-heating-app`

**Logi:** `/var/log/nginx/floor-heating-*.log`
