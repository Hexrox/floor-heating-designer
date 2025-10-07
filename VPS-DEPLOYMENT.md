# 🚀 Wdrożenie na VPS - Floor Heating Designer

## Wymagania

- VPS z Ubuntu 20.04+ (lub inną dystrybucją Linux)
- Dostęp SSH do serwera
- Zainstalowany Node.js 18+ (lub Nginx do serwowania statycznych plików)
- Publiczny adres IP
- (Opcjonalnie) Domena

---

## OPCJA 1: Nginx + Statyczne Pliki (REKOMENDOWANE)

Ta opcja jest najlepsza dla aplikacji frontendowej bez backend'u.

### Krok 1: Zbuduj aplikację lokalnie

```bash
# Na lokalnej maszynie, w katalogu projektu:
cd floor-heating-app
npm run build
```

To stworzy folder `dist/` z gotowymi plikami.

### Krok 2: Zainstaluj Nginx na VPS

```bash
# Zaloguj się przez SSH na VPS
ssh user@YOUR_VPS_IP

# Aktualizuj system
sudo apt update && sudo apt upgrade -y

# Zainstaluj Nginx
sudo apt install nginx -y

# Uruchom Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Sprawdź status
sudo systemctl status nginx
```

### Krok 3: Skonfiguruj firewall

```bash
# Otwórz porty HTTP i HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Krok 4: Prześlij pliki na VPS

```bash
# Na lokalnej maszynie:
# Spakuj folder dist
cd floor-heating-app
tar -czf dist.tar.gz dist/

# Prześlij na VPS
scp dist.tar.gz user@YOUR_VPS_IP:/tmp/

# Na VPS:
ssh user@YOUR_VPS_IP
cd /var/www
sudo mkdir -p floor-heating
cd floor-heating
sudo tar -xzf /tmp/dist.tar.gz
sudo mv dist/* .
sudo rmdir dist
```

### Krok 5: Skonfiguruj Nginx

```bash
# Utwórz plik konfiguracyjny
sudo nano /etc/nginx/sites-available/floor-heating
```

Wklej następującą konfigurację:

```nginx
server {
    listen 80;
    listen [::]:80;

    # Zmień na swoją domenę lub zostaw _ dla IP
    server_name _;

    root /var/www/floor-heating;
    index index.html;

    # Obsługa SPA (Single Page Application)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache dla statycznych plików
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Kompresja gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Zapisz (Ctrl+O, Enter, Ctrl+X).

```bash
# Aktywuj konfigurację
sudo ln -s /etc/nginx/sites-available/floor-heating /etc/nginx/sites-enabled/

# Usuń domyślną konfigurację (opcjonalnie)
sudo rm /etc/nginx/sites-enabled/default

# Testuj konfigurację
sudo nginx -t

# Przeładuj Nginx
sudo systemctl reload nginx
```

### Krok 6: Gotowe!

Wejdź na `http://YOUR_VPS_IP` w przeglądarce.

---

## OPCJA 2: Deploy z GitHub Actions (Automatyczny)

### Krok 1: Utwórz repozytorium GitHub

```bash
# W katalogu projektu:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/floor-heating.git
git push -u origin main
```

### Krok 2: Dodaj GitHub Actions

Utwórz plik `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy to VPS
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USER }}
        key: ${{ secrets.VPS_SSH_KEY }}
        source: "dist/*"
        target: "/var/www/floor-heating"
```

### Krok 3: Dodaj Secrets w GitHub

Idź do: Settings → Secrets and variables → Actions → New repository secret

Dodaj:
- `VPS_HOST` - adres IP VPS
- `VPS_USER` - username SSH
- `VPS_SSH_KEY` - prywatny klucz SSH

Teraz każdy push do `main` automatycznie wdroży aplikację!

---

## OPCJA 3: Node.js + PM2 (dla dynamicznych aplikacji)

Jeśli w przyszłości dodasz backend:

### Krok 1: Zainstaluj Node.js na VPS

```bash
# Na VPS:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Sprawdź wersję
node --version
npm --version
```

### Krok 2: Zainstaluj PM2

```bash
sudo npm install -g pm2
```

### Krok 3: Clone repozytorium

```bash
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/floor-heating.git
cd floor-heating
sudo npm install
sudo npm run build
```

### Krok 4: Serwuj z PM2

```bash
# Użyj serve do serwowania plików statycznych
sudo npm install -g serve

# Uruchom przez PM2
pm2 serve dist 3000 --name floor-heating --spa

# Zapisz konfigurację PM2
pm2 save
pm2 startup
```

### Krok 5: Skonfiguruj Nginx jako reverse proxy

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 HTTPS (SSL) - Let's Encrypt (OPCJONALNIE)

### Jeśli masz domenę:

```bash
# Zainstaluj Certbot
sudo apt install certbot python3-certbot-nginx -y

# Uzyskaj certyfikat (zmień YOUR_DOMAIN.com)
sudo certbot --nginx -d YOUR_DOMAIN.com

# Certbot automatycznie skonfiguruje Nginx dla HTTPS
# Certyfikaty będą automatycznie odnawiane
```

---

## 📦 Aktualizacja aplikacji

### Ręcznie:

```bash
# Lokalnie:
npm run build
scp -r dist/* user@YOUR_VPS_IP:/var/www/floor-heating/

# Na VPS (jeśli potrzebne):
sudo systemctl reload nginx
```

### Z GitHub:

```bash
# Na VPS:
cd /var/www/floor-heating
sudo git pull
sudo npm install
sudo npm run build
sudo systemctl reload nginx
```

---

## 🐛 Troubleshooting

### Aplikacja nie ładuje się:

```bash
# Sprawdź logi Nginx
sudo tail -f /var/log/nginx/error.log

# Sprawdź czy Nginx działa
sudo systemctl status nginx

# Sprawdź uprawnienia plików
sudo chown -R www-data:www-data /var/www/floor-heating
sudo chmod -R 755 /var/www/floor-heating
```

### Port 80 zajęty:

```bash
# Zobacz co używa portu 80
sudo lsof -i :80

# Zatrzymaj Apache (jeśli jest)
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Błąd 404 przy odświeżaniu strony:

Upewnij się, że masz `try_files $uri $uri/ /index.html;` w konfiguracji Nginx (obsługa SPA).

---

## ✅ Checklist wdrożenia

- [ ] VPS zakupiony i skonfigurowany
- [ ] SSH działa
- [ ] Nginx zainstalowany
- [ ] Aplikacja zbudowana (`npm run build`)
- [ ] Pliki przesłane na VPS
- [ ] Konfiguracja Nginx utworzona
- [ ] Firewall skonfigurowany (port 80/443)
- [ ] Aplikacja dostępna pod IP/domeną
- [ ] (Opcjonalnie) SSL skonfigurowany
- [ ] (Opcjonalnie) GitHub Actions ustawiony

---

## 🚀 Quick Deploy Script

Zapisz jako `deploy.sh`:

```bash
#!/bin/bash
echo "🔨 Building..."
npm run build

echo "📦 Packaging..."
tar -czf dist.tar.gz dist/

echo "🚀 Uploading to VPS..."
scp dist.tar.gz YOUR_USER@YOUR_VPS_IP:/tmp/

echo "📂 Deploying on VPS..."
ssh YOUR_USER@YOUR_VPS_IP << 'EOF'
cd /var/www/floor-heating
sudo tar -xzf /tmp/dist.tar.gz --strip-components=1
sudo systemctl reload nginx
rm /tmp/dist.tar.gz
EOF

rm dist.tar.gz
echo "✅ Deployment complete!"
```

Użycie:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📞 Potrzebujesz pomocy?

- Sprawdź logi: `sudo tail -f /var/log/nginx/error.log`
- Sprawdź status: `sudo systemctl status nginx`
- Testuj Nginx config: `sudo nginx -t`
