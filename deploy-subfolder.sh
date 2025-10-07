#!/bin/bash

# 🚀 Deploy do subfolderu /heating na VPS
# Użycie: ./deploy-subfolder.sh

echo "🏠 Floor Heating Designer - Deploy do subfolderu"
echo "================================================"
echo ""

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Konfiguracja
VPS_USER="root"
VPS_HOST="8.209.82.14"
VPS_BASE_PATH="/var/www/html"
SUBFOLDER="heating"
VPS_FULL_PATH="${VPS_BASE_PATH}/${SUBFOLDER}"

echo -e "${YELLOW}📍 Konfiguracja:${NC}"
echo "   VPS: ${VPS_HOST}"
echo "   Path: ${VPS_FULL_PATH}"
echo "   URL: http://${VPS_HOST}/${SUBFOLDER}"
echo ""

# Krok 1: Build
echo -e "${BLUE}🔨 Krok 1/4: Budowanie aplikacji...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build zakończony${NC}"
echo ""

# Krok 2: Pakowanie
echo -e "${BLUE}📦 Krok 2/4: Pakowanie plików...${NC}"
cd dist
tar -czf ../dist.tar.gz *
cd ..
echo -e "${GREEN}✅ Pliki spakowane${NC}"
echo ""

# Krok 3: Upload
echo -e "${BLUE}🚀 Krok 3/4: Przesyłanie na VPS...${NC}"
scp dist.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/heating-dist.tar.gz

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed! Sprawdź połączenie SSH${NC}"
    rm dist.tar.gz
    exit 1
fi
echo -e "${GREEN}✅ Pliki przesłane${NC}"
echo ""

# Krok 4: Deploy na serwerze
echo -e "${BLUE}📂 Krok 4/4: Instalacja na serwerze...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << EOF
    # Utwórz subfolder jeśli nie istnieje
    mkdir -p ${VPS_FULL_PATH}

    # Wyczyść stary build
    rm -rf ${VPS_FULL_PATH}/*

    # Rozpakuj nowe pliki
    cd ${VPS_FULL_PATH}
    tar -xzf /tmp/heating-dist.tar.gz

    # Ustaw uprawnienia
    chown -R www-data:www-data ${VPS_FULL_PATH}
    chmod -R 755 ${VPS_FULL_PATH}

    # Sprzątanie
    rm /tmp/heating-dist.tar.gz

    echo "✅ Deployment na serwerze zakończony!"
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment na serwerze failed!${NC}"
    rm dist.tar.gz
    exit 1
fi

# Sprzątanie lokalne
rm dist.tar.gz

echo ""
echo -e "${GREEN}✅ DEPLOYMENT ZAKOŃCZONY POMYŚLNIE!${NC}"
echo ""
echo "🌐 Aplikacja dostępna pod adresem:"
echo -e "   ${YELLOW}http://${VPS_HOST}/${SUBFOLDER}${NC}"
echo ""
echo "💡 Upewnij się że Nginx ma konfigurację dla subfolderu!"
echo "   Sprawdź: sudo nano /etc/nginx/sites-available/default"
echo ""
