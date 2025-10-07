# 📦 Manualne wdrożenie - Krok po kroku

Użyj tego gdy automatyczny skrypt `deploy-subfolder.sh` nie działa (np. wymaga hasła SSH).

---

## Krok 1: Prześlij plik na VPS

Plik `heating-dist.tar.gz` został już utworzony i znajduje się w katalogu projektu.

```bash
# Z katalogu floor-heating-app/:
scp heating-dist.tar.gz root@8.209.82.14:/tmp/
```

Zostaniesz poproszony o hasło SSH.

---

## Krok 2: Zaloguj się na VPS

```bash
ssh root@8.209.82.14
```

---

## Krok 3: Rozpakuj pliki na serwerze

```bash
# Utwórz katalog dla subfolderu
mkdir -p /var/www/html/heating

# Przejdź do katalogu
cd /var/www/html/heating

# Wyczyść stare pliki (jeśli są)
rm -rf *

# Rozpakuj nowe pliki
tar -xzf /tmp/heating-dist.tar.gz

# Sprawdź czy pliki są na miejscu
ls -la
# Powinien być: index.html, assets/, vite.svg

# Ustaw uprawnienia
chown -R www-data:www-data /var/www/html/heating
chmod -R 755 /var/www/html/heating

# Sprzątanie
rm /tmp/heating-dist.tar.gz
```

---

## Krok 4: Skonfiguruj Nginx (JEDNORAZOWO)

**Tylko jeśli to pierwszy deploy!**

```bash
# Edytuj konfigurację Nginx
nano /etc/nginx/sites-available/default
```

Dodaj **wewnątrz** bloku `server { ... }`:

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

Zapisz (Ctrl+O, Enter, Ctrl+X).

Testuj i przeładuj Nginx:
```bash
nginx -t
systemctl reload nginx
```

---

## Krok 5: Sprawdź czy działa

Otwórz w przeglądarce:
```
http://8.209.82.14/heating
```

Powinieneś zobaczyć aplikację Floor Heating Designer!

---

## 🔄 Aktualizacja (kolejne deploymenty)

Przy kolejnych deploymentach wystarczy powtórzyć kroki 1-3 (bez konfiguracji Nginx):

```bash
# Lokalnie:
npm run build
cd dist && tar -czf ../heating-dist.tar.gz * && cd ..
scp heating-dist.tar.gz root@8.209.82.14:/tmp/

# Na VPS:
ssh root@8.209.82.14
cd /var/www/html/heating && rm -rf *
tar -xzf /tmp/heating-dist.tar.gz
chown -R www-data:www-data /var/www/html/heating
rm /tmp/heating-dist.tar.gz
```

---

## 🐛 Jeśli coś nie działa

```bash
# Sprawdź logi Nginx
tail -f /var/log/nginx/error.log

# Sprawdź czy pliki są na miejscu
ls -la /var/www/html/heating/

# Sprawdź konfigurację Nginx
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## ✅ Checklist

- [ ] `heating-dist.tar.gz` przesłany na VPS (`/tmp/`)
- [ ] Pliki rozpakowane w `/var/www/html/heating/`
- [ ] Uprawnienia ustawione (www-data:www-data)
- [ ] Nginx skonfigurowany (location /heating/)
- [ ] Nginx przeładowany
- [ ] Aplikacja działa pod http://8.209.82.14/heating
