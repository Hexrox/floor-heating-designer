#!/bin/bash

# 🚀 Quick Deploy Script dla Floor Heating Designer
# Użycie: ./deploy.sh

echo "🏠 Floor Heating Designer - Deployment Script"
echo "=============================================="
echo ""

# Kolory dla outputu
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Konfiguracja - ZMIEŃ TE WARTOŚCI!
VPS_USER="your_username"
VPS_HOST="your_vps_ip"
VPS_PATH="/var/www/floor-heating"

# Sprawdź czy użytkownik zmienił konfigurację
if [ "$VPS_USER" = "your_username" ] || [ "$VPS_HOST" = "your_vps_ip" ]; then
    echo -e "${RED}❌ Błąd: Musisz skonfigurować zmienne VPS_USER i VPS_HOST w pliku deploy.sh${NC}"
    echo ""
    echo "Edytuj plik deploy.sh i zmień:"
    echo "  VPS_USER=\"your_username\"  →  VPS_USER=\"twoja_nazwa_użytkownika\""
    echo "  VPS_HOST=\"your_vps_ip\"    →  VPS_HOST=\"twój_adres_ip\""
    exit 1
fi

# Krok 1: Build
echo -e "${BLUE}🔨 Krok 1/4: Budowanie aplikacji...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build zakończony pomyślnie${NC}"
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
scp dist.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Upload failed! Sprawdź połączenie SSH${NC}"
    rm dist.tar.gz
    exit 1
fi
echo -e "${GREEN}✅ Pliki przesłane${NC}"
echo ""

# Krok 4: Deploy na serwerze
echo -e "${BLUE}📂 Krok 4/4: Rozpakowywanie na serwerze...${NC}"
ssh ${VPS_USER}@${VPS_HOST} << EOF
    # Utwórz katalog jeśli nie istnieje
    sudo mkdir -p ${VPS_PATH}

    # Rozpakuj nowe pliki
    cd ${VPS_PATH}
    sudo tar -xzf /tmp/dist.tar.gz

    # Ustaw uprawnienia
    sudo chown -R www-data:www-data ${VPS_PATH}
    sudo chmod -R 755 ${VPS_PATH}

    # Przeładuj Nginx
    sudo systemctl reload nginx

    # Sprzątanie
    rm /tmp/dist.tar.gz

    echo "Deployment zakończony na serwerze!"
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
echo "🌐 Aplikacja dostępna pod adresem: http://${VPS_HOST}"
echo ""
