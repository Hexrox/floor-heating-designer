#!/bin/bash

# 🚀 Automatyczna instalacja Floor Heating Designer na VPS
# VPS: 8.209.82.14
# Subfolder: /heating
# URL: http://8.209.82.14/heating

set -e  # Zatrzymaj przy błędzie

# Kolory
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

VPS_HOST="8.209.82.14"
VPS_USER="root"
VPS_PATH="/var/www/html/heating"
SUBFOLDER="heating"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Floor Heating Designer - Instalacja na VPS          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}VPS:${NC} ${VPS_HOST}"
echo -e "${YELLOW}URL:${NC} http://${VPS_HOST}/${SUBFOLDER}"
echo ""

# ============================================================================
# KROK 1: Sprawdzenie połączenia z VPS
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[1/6]${NC} Sprawdzanie połączenia z VPS..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! ssh -o BatchMode=yes -o ConnectTimeout=5 ${VPS_USER}@${VPS_HOST} exit 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Wymaga hasła SSH - będziesz poproszony o hasło kilka razy${NC}"
    echo -e "${YELLOW}💡 Tip: Skonfiguruj klucze SSH aby uniknąć wpisywania hasła${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Połączenie OK (bez hasła)${NC}"
fi

# ============================================================================
# KROK 2: Build lokalny
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[2/6]${NC} Budowanie aplikacji..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build zakończony${NC}"

# ============================================================================
# KROK 3: Pakowanie
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[3/6]${NC} Pakowanie plików..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd dist
tar -czf ../heating-dist.tar.gz *
cd ..

SIZE=$(du -h heating-dist.tar.gz | cut -f1)
echo -e "${GREEN}✅ Pakiet utworzony (${SIZE})${NC}"

# ============================================================================
# KROK 4: Upload na VPS
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[4/6]${NC} Przesyłanie na VPS..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

scp heating-dist.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/heating-dist.tar.gz

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed!${NC}"
    rm heating-dist.tar.gz
    exit 1
fi

echo -e "${GREEN}✅ Pliki przesłane${NC}"

# ============================================================================
# KROK 5: Instalacja na serwerze
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[5/6]${NC} Instalacja na serwerze..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ssh ${VPS_USER}@${VPS_HOST} bash << 'ENDSSH'
set -e

# Utwórz katalog
echo "📁 Tworzenie katalogu..."
mkdir -p /var/www/html/heating

# Wyczyść stare pliki
echo "🧹 Czyszczenie starych plików..."
cd /var/www/html/heating
rm -rf *

# Rozpakuj nowe
echo "📦 Rozpakowywanie..."
tar -xzf /tmp/heating-dist.tar.gz

# Sprawdź czy pliki są
if [ ! -f "index.html" ]; then
    echo "❌ Błąd: Brak index.html!"
    exit 1
fi

echo "✅ Pliki rozpakowane"

# Ustaw uprawnienia
echo "🔒 Ustawianie uprawnień..."
chown -R www-data:www-data /var/www/html/heating
chmod -R 755 /var/www/html/heating

# Sprawdź czy Nginx jest zainstalowany
if ! command -v nginx &> /dev/null; then
    echo "⚠️  Nginx nie jest zainstalowany!"
    echo "   Zainstaluj: apt install nginx"
    exit 1
fi

# Sprawdź czy konfiguracja istnieje
if ! grep -q "location /heating/" /etc/nginx/sites-available/default 2>/dev/null; then
    echo ""
    echo "⚠️  UWAGA: Konfiguracja Nginx nie jest ustawiona!"
    echo ""
    echo "Dodaj do /etc/nginx/sites-available/default:"
    echo ""
    echo "location /heating/ {"
    echo "    alias /var/www/html/heating/;"
    echo "    index index.html;"
    echo "    try_files \$uri \$uri/ /heating/index.html;"
    echo "}"
    echo ""
    echo "Następnie:"
    echo "  nginx -t"
    echo "  systemctl reload nginx"
    echo ""
fi

# Sprzątanie
rm /tmp/heating-dist.tar.gz

echo "✅ Instalacja zakończona!"
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Instalacja na serwerze failed!${NC}"
    rm heating-dist.tar.gz
    exit 1
fi

echo -e "${GREEN}✅ Instalacja zakończona${NC}"

# ============================================================================
# KROK 6: Weryfikacja
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}[6/6]${NC} Weryfikacja..."
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Sprawdź pliki na serwerze
FILE_COUNT=$(ssh ${VPS_USER}@${VPS_HOST} "ls -1 /var/www/html/heating/ | wc -l" 2>/dev/null)

if [ "$FILE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Pliki na serwerze: ${FILE_COUNT}${NC}"
else
    echo -e "${RED}❌ Brak plików na serwerze!${NC}"
    exit 1
fi

# Sprawdź status Nginx
NGINX_STATUS=$(ssh ${VPS_USER}@${VPS_HOST} "systemctl is-active nginx" 2>/dev/null || echo "unknown")

if [ "$NGINX_STATUS" = "active" ]; then
    echo -e "${GREEN}✅ Nginx działa${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx status: ${NGINX_STATUS}${NC}"
fi

# Test HTTP
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://${VPS_HOST}/${SUBFOLDER}/ 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Aplikacja odpowiada (HTTP 200)${NC}"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${RED}❌ HTTP 404 - Sprawdź konfigurację Nginx!${NC}"
elif [ "$HTTP_CODE" = "403" ]; then
    echo -e "${RED}❌ HTTP 403 - Sprawdź uprawnienia plików!${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP ${HTTP_CODE}${NC}"
fi

# Sprzątanie lokalne
rm heating-dist.tar.gz

# ============================================================================
# PODSUMOWANIE
# ============================================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              INSTALACJA ZAKOŃCZONA!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}🌐 URL aplikacji:${NC}"
echo -e "   ${BLUE}http://${VPS_HOST}/${SUBFOLDER}${NC}"
echo ""

if [ "$HTTP_CODE" != "200" ]; then
    echo -e "${YELLOW}⚠️  Aplikacja nie odpowiada poprawnie!${NC}"
    echo ""
    echo -e "${YELLOW}Sprawdź konfigurację Nginx:${NC}"
    echo -e "   ssh ${VPS_USER}@${VPS_HOST}"
    echo -e "   nano /etc/nginx/sites-available/default"
    echo ""
    echo -e "${YELLOW}Dodaj w bloku server { ... }:${NC}"
    echo ""
    echo "   location /heating/ {"
    echo "       alias /var/www/html/heating/;"
    echo "       index index.html;"
    echo "       try_files \$uri \$uri/ /heating/index.html;"
    echo "   }"
    echo ""
    echo -e "${YELLOW}Następnie:${NC}"
    echo "   nginx -t"
    echo "   systemctl reload nginx"
    echo ""
fi

echo -e "${YELLOW}📊 Statystyki:${NC}"
echo -e "   Plików na serwerze: ${FILE_COUNT}"
echo -e "   Status Nginx: ${NGINX_STATUS}"
echo -e "   HTTP Response: ${HTTP_CODE}"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✨ Wszystko działa! Otwórz link w przeglądarce.${NC}"
else
    echo -e "${YELLOW}⚠️  Wymagana dodatkowa konfiguracja Nginx.${NC}"
    echo -e "${YELLOW}   Zobacz: NGINX-SUBFOLDER-CONFIG.md${NC}"
fi

echo ""
