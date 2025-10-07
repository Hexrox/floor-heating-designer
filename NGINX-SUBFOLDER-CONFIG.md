# 🔧 Konfiguracja Nginx dla subfolderu /heating

## Szybka konfiguracja

### 1. Sprawdź obecną konfigurację Nginx

```bash
ssh root@8.209.82.14
cat /etc/nginx/sites-available/default
```

### 2. Dodaj konfigurację dla subfolderu `/heating`

Edytuj plik konfiguracyjny:
```bash
sudo nano /etc/nginx/sites-available/default
```

Dodaj **wewnątrz** bloku `server { ... }` (tam gdzie jest główny projekt):

```nginx
# Ogrzewanie podłogowe - subfolder
location /heating/ {
    alias /var/www/html/heating/;
    index index.html;
    try_files $uri $uri/ /heating/index.html;

    # Cache dla statycznych plików
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**WAŻNE:** Zwróć uwagę na różnicę:
- `location /heating/` - kończy się na `/`
- `alias /var/www/html/heating/;` - MUSI kończyć się na `/`
- `try_files ... /heating/index.html` - ścieżka z prefiksem subfolderu

### 3. Testuj i przeładuj Nginx

```bash
# Testuj konfigurację
sudo nginx -t

# Jeśli OK, przeładuj Nginx
sudo systemctl reload nginx

# Sprawdź status
sudo systemctl status nginx
```

### 4. Deploy aplikacji

```bash
# Lokalnie:
cd floor-heating-app
./deploy-subfolder.sh
```

### 5. Sprawdź czy działa

Otwórz w przeglądarce:
```
http://8.209.82.14/heating
```

---

## 📋 Pełna przykładowa konfiguracja Nginx

Jeśli chcesz zobaczyć jak może wyglądać pełna konfiguracja:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;

    # Główny projekt (na root)
    location / {
        try_files $uri $uri/ =404;
    }

    # Subfolder: Floor Heating Designer
    location /heating/ {
        alias /var/www/html/heating/;
        index index.html;
        try_files $uri $uri/ /heating/index.html;

        # Cache dla statycznych plików
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Kompresja gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;
}
```

---

## 🐛 Troubleshooting

### Problem: 404 Not Found

**Sprawdź czy pliki są na miejscu:**
```bash
ssh root@8.209.82.14
ls -la /var/www/html/heating/
# Powinien być index.html i folder assets/
```

**Sprawdź uprawnienia:**
```bash
sudo chown -R www-data:www-data /var/www/html/heating
sudo chmod -R 755 /var/w ww/html/heating
```

### Problem: 403 Forbidden

**Sprawdź uprawnienia plików:**
```bash
ls -la /var/www/html/heating/
# index.html powinien mieć: -rw-r--r-- (644)
# foldery powinny mieć: drwxr-xr-x (755)
```

**Popraw uprawnienia:**
```bash
sudo find /var/www/html/heating -type f -exec chmod 644 {} \;
sudo find /var/www/html/heating -type d -exec chmod 755 {} \;
```

### Problem: Pliki CSS/JS nie ładują się (błąd 404)

**Sprawdź ścieżki w index.html:**
```bash
cat /var/www/html/heating/index.html | grep "src="
# Powinno być: src="/heating/assets/..."
# NIE: src="/assets/..."
```

To jest poprawiane przez `base: '/heating/'` w `vite.config.ts`.

**Jeśli ścieżki są nieprawidłowe:**
```bash
# Lokalnie przebuduj:
npm run build
./deploy-subfolder.sh
```

### Problem: Odświeżenie strony daje 404

**Sprawdź `try_files`:**
```nginx
try_files $uri $uri/ /heating/index.html;
```

To zapewnia, że Nginx zawsze serwuje `index.html` dla React Router.

### Problem: "Cannot GET /heating/"

**Dodaj trailing slash w konfiguracji:**
```nginx
location /heating {
    return 301 /heating/;
}

location /heating/ {
    alias /var/www/html/heating/;
    index index.html;
    try_files $uri $uri/ /heating/index.html;
}
```

---

## ✅ Checklist

- [ ] Nginx zainstalowany i działa
- [ ] Edytowano `/etc/nginx/sites-available/default`
- [ ] Dodano konfigurację dla `location /heating/`
- [ ] `nginx -t` przeszedł pomyślnie
- [ ] Nginx przeładowany (`systemctl reload nginx`)
- [ ] Aplikacja zbudowana z `base: '/heating/'`
- [ ] Deploy wykonany (`./deploy-subfolder.sh`)
- [ ] Pliki w `/var/www/html/heating/` istnieją
- [ ] Uprawnienia ustawione (www-data:www-data, 755/644)
- [ ] `http://8.209.82.14/heating` działa!

---

## 📝 Notatki

### Dlaczego `alias` zamiast `root`?

```nginx
# ❌ NIE TAK (root)
location /heating/ {
    root /var/www/html/heating/;  # Nginx szuka /var/www/html/heating/heating/
}

# ✅ TAK (alias)
location /heating/ {
    alias /var/www/html/heating/;  # Nginx szuka /var/www/html/heating/
}
```

`alias` zastępuje część ścieżki, `root` dodaje do niej.

### Dlaczego `try_files ... /heating/index.html`?

React to SPA (Single Page Application). Wszystkie ścieżki są obsługiwane przez JavaScript w przeglądarce. Bez tego Nginx zwróci 404 dla `/heating/about` itp.

---

## 🚀 Quick Commands

```bash
# Na VPS - Sprawdź logi jeśli coś nie działa
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Sprawdź co serwuje Nginx
curl http://8.209.82.14/heating/

# Sprawdź pliki
ls -la /var/www/html/heating/

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx (jeśli reload nie pomaga)
sudo systemctl restart nginx
```
