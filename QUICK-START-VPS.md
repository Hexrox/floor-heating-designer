# ⚡ Quick Start - Wdrożenie na VPS

## 📋 Szybkie kroki (TL;DR)

### 1. Skonfiguruj VPS (jednorazowo)

```bash
# SSH do VPS
ssh user@YOUR_VPS_IP

# Zainstaluj Nginx
sudo apt update && sudo apt install nginx -y

# Uruchom Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Otwórz firewall
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Utwórz folder dla aplikacji
sudo mkdir -p /var/www/floor-heating
sudo chown -R $USER:$USER /var/www/floor-heating

# Skonfiguruj Nginx
sudo nano /etc/nginx/sites-available/floor-heating
```

Wklej tę konfigurację:
```nginx
server {
    listen 80;
    server_name _;
    root /var/www/floor-heating;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

Aktywuj konfigurację:
```bash
sudo ln -s /etc/nginx/sites-available/floor-heating /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # opcjonalnie
sudo nginx -t
sudo systemctl reload nginx
```

### 2. Deploy aplikacji (za każdym razem)

#### Opcja A: Ręcznie (krok po kroku)

```bash
# Lokalnie:
npm run build
scp -r dist/* user@YOUR_VPS_IP:/var/www/floor-heating/

# Na VPS:
ssh user@YOUR_VPS_IP
sudo systemctl reload nginx
```

#### Opcja B: Skrypt automatyczny (ZALECANE)

```bash
# 1. Edytuj deploy.sh i zmień:
nano deploy.sh
# Ustaw VPS_USER i VPS_HOST

# 2. Uruchom skrypt:
./deploy.sh
```

Gotowe! Aplikacja dostępna pod `http://YOUR_VPS_IP`

---

## 🔍 Weryfikacja

```bash
# Sprawdź czy Nginx działa
sudo systemctl status nginx

# Sprawdź logi jeśli coś nie działa
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Sprawdź uprawnienia
ls -la /var/www/floor-heating
```

---

## 🐛 Troubleshooting

### Problem: "502 Bad Gateway"
```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl restart nginx
```

### Problem: "Permission denied"
```bash
sudo chown -R www-data:www-data /var/www/floor-heating
sudo chmod -R 755 /var/www/floor-heating
```

### Problem: "Cannot connect"
```bash
# Sprawdź firewall
sudo ufw status
sudo ufw allow 80
```

### Problem: Aplikacja się nie ładuje
```bash
# Sprawdź czy pliki są na serwerze
ls -la /var/www/floor-heating
# Powinien być index.html i folder assets/
```

---

## 📝 Checklist

- [ ] VPS zainstalowany i dostępny przez SSH
- [ ] Nginx zainstalowany i działa
- [ ] Firewall otwarty na port 80
- [ ] Konfiguracja Nginx utworzona i aktywna
- [ ] Folder `/var/www/floor-heating` istnieje
- [ ] Aplikacja zbudowana (`npm run build`)
- [ ] Pliki przesłane na VPS
- [ ] `http://YOUR_VPS_IP` otwiera aplikację

---

## 🚀 Następne kroki (opcjonalnie)

### SSL/HTTPS z Let's Encrypt (dla domeny)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d twoja-domena.pl
# Certbot automatycznie skonfiguruje HTTPS!
```

### Automatyczne deployments z GitHub Actions

Zobacz plik `VPS-DEPLOYMENT.md` sekcja "OPCJA 2"

---

## ℹ️ Więcej informacji

Pełna dokumentacja: [VPS-DEPLOYMENT.md](./VPS-DEPLOYMENT.md)
